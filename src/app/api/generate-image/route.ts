import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { canGenerateBlog } from "@/lib/subscription";
import { z } from "zod";
import { SHORT_HOOK_OPTIONS } from "@/types";

const generateImageSchema = z.object({
    overview: z.string().min(1, "伝えたいことの概要・画像への補足は必須です。"),
    base64Image: z.string().min(1, "画像データは必須です。"),
    mimeType: z.string().min(1, "画像のMIMEタイプは必須です。"),
    shopInfo: z.object({
        name: z.string().optional(),
        address: z.string().optional(),
        industry: z.string().optional(),
        phone: z.string().optional(),
        lineUrl: z.string().optional(),
        businessHours: z.string().optional(),
        holidays: z.string().optional(),
        features: z.string().optional(),
        snsUrl: z.string().optional(),
        sampleTexts: z.string().optional(),
        shortTargetDuration: z.number().optional(),
        shortPlatform: z.string().optional(),
        shortSampleScript: z.string().optional(),
        shortMemo: z.string().optional(),
        shortHookType: z.string().optional(),
    }).optional(),
    outputTargets: z.object({
        instagram: z.boolean().optional(),
        gbp: z.boolean().optional(),
        portal: z.boolean().optional(),
        line: z.boolean().optional(),
        short: z.boolean().optional(),
    }).optional().default({ instagram: true, gbp: true, portal: true, line: true, short: false })
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    // 認証チェック
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // レート制限（1分間に5回まで）
    const rateLimitResponse = checkRateLimit(user?.id || "anonymous", 5);
    if (rateLimitResponse) return rateLimitResponse;

    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json(
            { error: "Gemini APIキーが設定されていません。" },
            { status: 500 }
        );
    }

    try {
        const body = await req.json();
        const parsed = generateImageSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "入力内容に誤りがあります。", details: parsed.error.format() }, { status: 400 });
        }

        const { overview, base64Image, mimeType, shopInfo, outputTargets } = parsed.data;

        // ブログ生成は pro プランのみ
        if (outputTargets?.portal) {
            const blogAllowed = await canGenerateBlog(user!.id);
            if (!blogAllowed) {
                return NextResponse.json(
                    {
                        error: "BLOG_NOT_ALLOWED",
                        message: "ブログ生成はプロプラン限定です。アップグレードしてください。",
                    },
                    { status: 403 }
                );
            }
        }

        // 店舗情報のデフォルト値設定
        const shopName = shopInfo?.name || "LogicPost";
        const shopAddress = shopInfo?.address || "長野市";
        const shopIndustry = shopInfo?.industry || "サロン";
        const shopPhone = shopInfo?.phone || "";
        const shopLineUrl = shopInfo?.lineUrl || "";
        const shopBusinessHours = shopInfo?.businessHours || "記載なし";
        const shopHolidays = shopInfo?.holidays || "記載なし";
        const shopFeatures = shopInfo?.features || "";
        const shopSampleTexts = shopInfo?.sampleTexts || "";
        const shortTargetDuration = shopInfo?.shortTargetDuration ?? 60;
        const shortPlatform = shopInfo?.shortPlatform || "";
        const shortSampleScript = shopInfo?.shortSampleScript || "";
        const shortMemo = shopInfo?.shortMemo || "";
        const shortHookType = shopInfo?.shortHookType || "";

        // 出力ターゲットの決定
        const effectiveTargets = {
            instagram: outputTargets.instagram ?? true,
            gbp: outputTargets.gbp ?? true,
            portal: outputTargets.portal ?? true,
            line: outputTargets.line ?? true,
            short: outputTargets.short ?? false,
        };

        const targetNames = [];
        if (effectiveTargets.instagram) targetNames.push("Instagram");
        if (effectiveTargets.gbp) targetNames.push("Googleビジネスプロフィール(GBP)");
        if (effectiveTargets.portal) targetNames.push("ブログ");
        if (effectiveTargets.line) targetNames.push("LINE");
        if (effectiveTargets.short) targetNames.push("ショート動画の台本");

        if (targetNames.length === 0) {
            effectiveTargets.instagram = true;
            effectiveTargets.gbp = true;
            effectiveTargets.portal = true;
            effectiveTargets.line = true;
            targetNames.push("Instagram", "Googleビジネスプロフィール(GBP)", "ブログ", "LINE");
        }

        const targetCount = targetNames.length;
        const targetString = targetNames.join("、");

        // JSONスキーマとプロンプトの構成
        let jsonFormatGuide = "";
        const properties: any = {};
        const required: string[] = [];

        if (effectiveTargets.instagram) {
            jsonFormatGuide += `\n  "instagram": "【構成: 悩みの共感→解決策→なぜ今→CTA】①冒頭：読者の悩みに共感するフック②本文：画像の内容と当店のアプローチ・解決策③「この時期だからこそ」などなぜ今来店すべきか1文④CTA。**導線は「下のリンクから1分で予約」「プロフィールのリンクを1タップで」に統一。**絵文字を適度に使い、SNSらしい改行テンポで。語尾は丁寧な「です・ます調」で統一。最後には必ず『${shopLineUrl ? `下のリンクから1分で予約できます↓ ${shopLineUrl}` : "プロフィールのリンクを1タップでご予約ください"}』のようにLINEへの誘導文を含めること。**ハッシュタグは地域名＋悩み＋店舗名の3層構造で10〜15個。**"`;
            properties.instagram = { type: SchemaType.STRING };
            required.push("instagram");
        }
        if (effectiveTargets.gbp) {
            if (jsonFormatGuide) jsonFormatGuide += ",";
            jsonFormatGuide += `\n  "gbp": "【構成: 悩みの共感→解決策→なぜ今→締め】①冒頭：悩みへの共感②本文：画像から得られる情報（雰囲気や成果など）を明確に伝え、「ここなら悩みが解決できそう」と思わせる③「この時期だからこそ」などなぜ今来店すべきか1文④予約・問合せ情報（${shopLineUrl ? `下のリンクから1分で予約できます：${shopLineUrl}` : "プロフィールのリンクを1タップでご予約ください"}）で締めること。"`;
            properties.gbp = { type: SchemaType.STRING };
            required.push("gbp");
        }
        if (effectiveTargets.portal) {
            if (jsonFormatGuide) jsonFormatGuide += ",";
            const purePhoneNumber = shopPhone.replace(/[^0-9]/g, '');
            const lineButtonStyle = "display:inline-block; background-color:#06C755; color:#ffffff; padding:12px 24px; text-decoration:none; border-radius:8px; font-weight:bold; text-align:center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-top:10px;";
            const phoneHtml = purePhoneNumber ? `📞<a href="tel:${purePhoneNumber}" style="color:#333; font-weight:bold; text-decoration:none;">${shopPhone}</a>` : `📞${shopPhone}`;

            jsonFormatGuide += `\n  "portalTitle": "【目的: ブログ用のタイトル】文字数は30〜40文字程度で、先頭に【〇〇市】などを入れず、自然かつ魅力的な文言。",`;
            jsonFormatGuide += `\n  "portal": "<div class=\\"seo-content\\"><h3>導入・画像に関する見出し</h3><p>【悩みの共感】画像の内容から読者の悩みに共感する導入</p><h4>${shopName}の強みとアピールポイント</h4><p>【解決策】画像の解説と当店のアプローチ。お客様の声がある場合は「誰のどんな悩み→どの施術で→どう変わった」を明確に。</p><p>【なぜ今】この時期だからこそ、〇〇対策がおすすめです、など1文。</p><div class=\\"shop-info\\"><p>📍${shopAddress}</p><p>${phoneHtml}</p><p>🕒${shopBusinessHours}</p><p>🎌${shopHolidays}</p><div style=\\"text-align:center;\\"><a href=\\"${shopLineUrl}\\" style=\\"${lineButtonStyle}\\">下のボタンから1分で予約・ご相談</a></div></div></div> のような、HTMLタグで構造化・装飾された長文のコラム風テキスト。悩みの共感→解決策→お客様の声（誰のどんな悩み→どう変わった）→なぜ今→CTAの流れで、末尾にLINEへの誘導リンクを含めること。"`;
            properties.portalTitle = { type: SchemaType.STRING };
            properties.portal = { type: SchemaType.STRING };
            required.push("portalTitle", "portal");
        }
        if (effectiveTargets.line) {
            if (jsonFormatGuide) jsonFormatGuide += ",";
            jsonFormatGuide += `\n  "line": "【構成: 悩みの共感→解決策→なぜ今→CTA】①冒頭：悩みへの共感または挨拶②本文：画像について言及しながら解決策・伝えたいことを温かみのある文体で③「この時期だからこそ」などなぜ今来店すべきか1文④CTA。**導線は「下のリンクから1分で予約」に統一。**LINEらしい改行と絵文字を使う。文章の最後は必ず『${shopLineUrl ? `下のリンクから1分で予約できます↓\n${shopLineUrl}` : "プロフィールのリンクを1タップでご予約ください"}』のようにLINE URLへの導線で締めること。（ハッシュタグ不要、文字数200〜350字程度）"`;
            properties.line = { type: SchemaType.STRING };
            required.push("line");
        }
        if (effectiveTargets.short) {
            if (jsonFormatGuide) jsonFormatGuide += ",";
            const shortSceneCount = Math.floor(shortTargetDuration / 2);
            jsonFormatGuide += `\n  "shortScript": "【ショート動画の台本】有効なJSON文字列1つ。{\\"hook\\": \\"冒頭で言う一言（15字前後）\\", \\"scenes\\": [{\\"sec\\": 0, \\"text\\": \\"その2秒間に表示する画像やテキストの指示\\", \\"note\\": \\"画面メモ（任意）\\"}, {\\"sec\\": 2, \\"text\\": \\"次の2秒間の指示\\"}, ...], \\"cta\\": \\"最後の誘導（20字前後）\\"}。scenesは必ず2秒間隔で、secは0,2,4,6,...と${shortTargetDuration}秒まで、合計${shortSceneCount}個以上。各textはその2秒間で表示するテロップ・ナレーション（1ブロック10〜16字目安）。提供された【画像】を活かした構成にすること。"`;
            properties.shortScript = { type: SchemaType.STRING };
            required.push("shortScript");
        }

        const selectedHookOption = shortHookType ? SHORT_HOOK_OPTIONS.find(o => o.id === shortHookType) : null;
        const shortInstruction = effectiveTargets.short
            ? `

【ショート動画の台本（shortScript）について】
- 想定尺は${shortTargetDuration}秒です。本編は「2秒ごとに別のテキストや場面が表示される」形式にしてください。
- 冒頭の hook は3〜5秒で言い切れる一言（10〜15字程度）にし、必ず以下の【選ばれたフックタイプ】に沿って生成してください。
${selectedHookOption ? `【選ばれたフックタイプ】${selectedHookOption.label}\n${selectedHookOption.promptNote}\n→ 上記の型に沿って、提供された画像の内容やテーマに合う具体的な hook 文言を1つ生成すること。` : "- 提供された画像のインパクトを活かして、問いかけ・共感・驚きのいずれかで視聴者を止める hook にすること。"}
- scenes は必ず2秒間隔で生成すること。sec は 0, 2, 4, 6, 8, … と2秒ごとに${shortTargetDuration}秒まで（例：60秒なら約30個）。各 scene の text は「その2秒間に表示するテロップ・ナレーション」で、提供された画像から読み取れる情報を映像の流れにどう組み込むか（例えば冒頭で画像を見せるなど）を工夫すること。1ブロックあたり10〜16字程度の文にし、2秒ごとにシーンかテキストが切り替わる台本にしてください。note には画面の切り替えや見せ方のメモを任意で。
- 最後の cta は「なぜ今」の一言＋「下のリンクから1分で予約」「プロフィールのリンクを1タップで」などクリックしやすい導線を20字前後で。
${shortPlatform ? `- 主な投稿先は「${shortPlatform}」を想定し、そのプラットフォームに合ったテンポとフックにしてください。` : ""}
${shortSampleScript ? `- 以下の【ショート用サンプル台本】の話し方・テンポ・言い回しを参考にし、同じトーンで書いてください。\n\n【ショート用サンプル台本】\n${shortSampleScript}` : ""}
${shortMemo ? `- 店舗からの希望・メモ：${shortMemo}` : ""}
`
            : "";

        const toneInstruction = shopSampleTexts
            ? `- 以下の【あなたが過去に書いた文章サンプル】の「文のテンポ、絵文字の有無・頻度、改行のクセ、語尾のニュアンス、親しみやすさ」などを徹底的に分析して真似してください。\n\n【あなたが過去に書いた文章サンプル】\n${shopSampleTexts}`
            : `- 落ち着いた丁寧な「です・ます調」で、お客様に優しく語りかけるような、人間味のある自然な文章にしてください。
- 専門用語を並べるのではなく、日常の情景が浮かぶ言葉で悩みの原因やアプローチを誠実に伝えてください。
- 読んだ方が「まさに自分のことだ」「この人に任せれば安心できそう」と感じるような、押し付けがましくない共感性を重視してください。`;

        const systemPrompt = `あなたは${shopAddress}の${shopIndustry}「${shopName}」のオーナー兼、誠実で経験豊富なプロの施術者（スタッフ）です。
店舗の基本情報：【営業時間: ${shopBusinessHours}】【定休日: ${shopHolidays}】
以下の【厳守ルール】と【店舗の独自情報】に従って、アップロードされた画像情報を元に、${targetString}用の${targetCount}種類のテキストを作成してください。

【店舗の独自情報・強み・想い（学習データ）】
以下の店舗の独自性やこだわりを、わざとらしくならないよう自然に文章のエッセンスとして組み込んでください。（※情報がない場合は無視してください）
${shopFeatures || "特になし"}

【❌絶対に禁止するNG表現】
- 「〜マジで多いんです」「〜サービスしちゃいます」「今日がチャンスです💪」のような過度にくだけた表現は禁止。
- 「ビフォーアフターで劇的な改善を実感！」といった定型的な広告文句。

【⭕️目指すべきトーン＆マナー】
${toneInstruction}
${shortInstruction}

【出力JSONフォーマット】
{${jsonFormatGuide}
}`;

        const userPrompt = `提供された【画像】と以下の情報を元に、人間味あふれる最高のテキストを作成してください。

【伝えたいことの概要・画像への補足】
${overview}
`;

        // 画像データをGemini用に変換
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType
            }
        };

        // Gemini 2.5 Flash モデルの取得
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: systemPrompt,
            generationConfig: {
                temperature: 0.7,
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties,
                    required
                }
            }
        });

        // マルチモーダル対応として画像Partとテキストを渡す
        const result = await model.generateContent([userPrompt, imagePart]);
        const resultText = result.response.text();

        if (!resultText) {
            throw new Error("APIから有効なテキストが返却されませんでした。");
        }

        const generatedResults = JSON.parse(resultText);

        return NextResponse.json(generatedResults);

    } catch (error: any) {
        console.error("Generate Image API Error:", error);
        return NextResponse.json(
            { error: "テキストの生成中にエラーが発生しました。", details: error.message },
            { status: 500 }
        );
    }
}
