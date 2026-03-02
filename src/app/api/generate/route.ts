import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { SHORT_HOOK_OPTIONS } from "@/types";

const generateSchema = z.object({
    patternTitle: z.string().optional(),
    q1: z.string().optional(),
    q2: z.string().optional(),
    q3: z.string().optional(),
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
        scrapedContent: z.string().optional(),
        shortTargetDuration: z.number().optional(),
        shortPlatform: z.string().optional(),
        shortSampleScript: z.string().optional(),
        shortMemo: z.string().optional(),
        shortHookType: z.string().optional(),
    }).optional(),
    news: z.object({
        title: z.string().optional(),
        snippet: z.string().optional(),
        link: z.string().optional(),
    }).optional().nullable(),
    outputTargets: z.object({
        instagram: z.boolean().optional(),
        gbp: z.boolean().optional(),
        portal: z.boolean().optional(),
        line: z.boolean().optional(),
        short: z.boolean().optional(),
    }).optional().default({ instagram: true, gbp: true, portal: true, line: false, short: false })
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    // 認証チェック: ログインしていないユーザーは 401 を返す
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // レート制限（1分間に5回まで: AI生成は重いため）
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
        const parsed = generateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "入力内容に誤りがあります。", details: parsed.error.format() }, { status: 400 });
        }

        const { patternTitle, q1, q2, q3, shopInfo, news, outputTargets } = parsed.data;

        const shopName = shopInfo?.name || "The Gentry";
        const shopAddress = shopInfo?.address || "長野市";
        const shopIndustry = shopInfo?.industry || "サロン";
        const shopPhone = shopInfo?.phone || "";
        const shopLineUrl = shopInfo?.lineUrl || "";
        const shopBusinessHours = shopInfo?.businessHours || "記載なし";
        const shopHolidays = shopInfo?.holidays || "記載なし";
        const shopFeatures = shopInfo?.features || "";
        const shopSnsUrl = shopInfo?.snsUrl || "";
        const shopSampleTexts = shopInfo?.sampleTexts || "";
        const shopScrapedContent = shopInfo?.scrapedContent || "";
        const shortTargetDuration = shopInfo?.shortTargetDuration ?? 60;
        const shortPlatform = shopInfo?.shortPlatform || "";
        const shortSampleScript = shopInfo?.shortSampleScript || "";
        const shortMemo = shopInfo?.shortMemo || "";
        const shortHookType = shopInfo?.shortHookType || "";

        // 全てのターゲットがfalseの場合はデフォルト（全媒体）で生成する
        const effectiveTargets = {
            instagram: outputTargets.instagram ?? true,
            gbp: outputTargets.gbp ?? true,
            portal: outputTargets.portal ?? true,
            line: outputTargets.line ?? false,
            short: outputTargets.short ?? false,
        };

        const targetNames = [];
        if (effectiveTargets.instagram) targetNames.push("Instagram");
        if (effectiveTargets.gbp) targetNames.push("Googleビジネスプロフィール(GBP)");
        if (effectiveTargets.portal) targetNames.push("ポータルサイト");
        if (effectiveTargets.line) targetNames.push("LINE");
        if (effectiveTargets.short) targetNames.push("ショート動画の台本");

        if (targetNames.length === 0) {
            // 全てfalseの場合はinstagram/gbp/portalを有効にしてフォールバック
            effectiveTargets.instagram = true;
            effectiveTargets.gbp = true;
            effectiveTargets.portal = true;
            targetNames.push("Instagram", "Googleビジネスプロフィール(GBP)", "ポータルサイト");
        }

        const targetCount = targetNames.length;
        const targetString = targetNames.join("、");

        let jsonFormatGuide = "";
        const properties: any = {};
        const required: string[] = [];

        if (outputTargets.instagram) {
            jsonFormatGuide += `\n  "instagram": "【目的: 共感とファン化】絵文字を適度に使い、SNSらしい改行テンポで、今日あったリアルなエピソードを語る文章。ただし、文章の語尾は必ず丁寧な「です・ます調」で統一し、文章の最後には必ず『ご予約・お問い合わせはプロフィールのLINEからお待ちしております（URL: ${shopLineUrl} ）』のようにLINEへの誘導文を入れること。（ハッシュタグ #リラクゼーション #${shopName} #メンズ専用 等を含む）"`;
            properties.instagram = { type: SchemaType.STRING };
            required.push("instagram");
        }
        if (outputTargets.gbp) {
            if (jsonFormatGuide) jsonFormatGuide += ",";
            jsonFormatGuide += `\n  "gbp": "【目的: 近隣検索からの来店誘致】検索して見つけた悩める男性に、「ここなら治るかも」と思わせる力強い文章。文章の最後は必ず予約・問合せ情報（詳細やご予約はLINEから: ${shopLineUrl} ）への自然な導線で結ぶこと。"`;
            properties.gbp = { type: SchemaType.STRING };
            required.push("gbp");
        }
        if (outputTargets.portal) {
            if (jsonFormatGuide) jsonFormatGuide += ",";
            // 電話番号のハイフン等を削除し、数字のみの文字列を抽出
            const purePhoneNumber = shopPhone.replace(/[^0-9]/g, '');
            // LINEボタン用のインラインCSS
            const lineButtonStyle = "display:inline-block; background-color:#06C755; color:#ffffff; padding:12px 24px; text-decoration:none; border-radius:8px; font-weight:bold; text-align:center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-top:10px;";
            // 電話番号リンクの切り替え処理（番号がある場合のみリンク化）
            const phoneHtml = purePhoneNumber ? `📞<a href="tel:${purePhoneNumber}" style="color:#333; font-weight:bold; text-decoration:none;">${shopPhone}</a>` : `📞${shopPhone}`;

            jsonFormatGuide += `\n  "portalTitle": "【目的: 検索でクリックされやすい＆ブログ用のタイトル】文字数は30〜40文字程度で、先頭に【〇〇市】などを入れず、自然かつ魅力的な文言。例：『繰り返すひどい眼精疲労…首の深層筋をほぐして視界クリアに！』 / なければ空文字",`;
            jsonFormatGuide += `\n  "portal": "<div class=\\"seo-content\\"><h3>フックとなる見出し</h3><p>本文（共感・原因の解説）</p><h4>${shopName}の独自のアプローチ</h4><p>本文（手技の解説と結果）</p><ul><li>お客様のリアルな反応</li></ul><div class=\\"shop-info\\"><p>📍${shopAddress}</p><p>${phoneHtml}</p><p>🕒${shopBusinessHours}</p><p>🎌${shopHolidays}</p><div style=\\"text-align:center;\\"><a href=\\"${shopLineUrl}\\" style=\\"${lineButtonStyle}\\">LINEでのご予約・ご相談はこちら</a></div></div></div> のような、HTMLタグで構造化・装飾された長文のコラム風テキスト。必ず末尾にLINEへの誘導リンクを含めること。"`;
            properties.portalTitle = { type: SchemaType.STRING };
            properties.portal = { type: SchemaType.STRING };
            required.push("portalTitle", "portal");
        }
        if (outputTargets.line) {
            if (jsonFormatGuide) jsonFormatGuide += ",";
            jsonFormatGuide += `\n  "line": "【目的: LINE公式アカウントからの配信メッセージ】LINEらしい改行と絵文字を使い、友だち登録しているお客様に向けて親しみやすく語りかける文章。冒頭に季節の挨拶や今日のひとことを入れ、今日の施術エピソードや限定情報を温かみのある文体で伝える。文章の最後は必ず『ご予約・お問い合わせはこちら↓\n${shopLineUrl}』のようにLINE URLへの導線で締めること。（ハッシュタグ不要、文字数200〜350字程度）"`;
            properties.line = { type: SchemaType.STRING };
            required.push("line");
        }
        if (outputTargets.short) {
            if (jsonFormatGuide) jsonFormatGuide += ",";
            const shortSceneCount = Math.floor(shortTargetDuration / 2);
            jsonFormatGuide += `\n  "shortScript": "【ショート動画の台本】有効なJSON文字列1つ。{\\"hook\\": \\"冒頭で言う一言（15字前後）\\", \\"scenes\\": [{\\"sec\\": 0, \\"text\\": \\"その2秒間に表示するテキスト\\", \\"note\\": \\"画面メモ（任意）\\"}, {\\"sec\\": 2, \\"text\\": \\"次の2秒間のテキスト\\"}, ...], \\"cta\\": \\"最後の誘導（20字前後）\\"}。scenesは必ず2秒間隔で、secは0,2,4,6,...と${shortTargetDuration}秒まで、合計${shortSceneCount}個以上。各textはその2秒間で表示するテロップ・ナレーション（1ブロック10〜16字目安）。"`;
            properties.shortScript = { type: SchemaType.STRING };
            required.push("shortScript");
        }

        const selectedHookOption = shortHookType ? SHORT_HOOK_OPTIONS.find(o => o.id === shortHookType) : null;
        const shortInstruction = effectiveTargets.short
            ? `

【ショート動画の台本（shortScript）について】
- 想定尺は${shortTargetDuration}秒です。本編は「2秒ごとに別のテキストが表示される」形式にしてください。
- 冒頭の hook は3〜5秒で言い切れる一言（10〜15字程度）にし、必ず以下の【選ばれたフックタイプ】に沿って生成してください。
${selectedHookOption ? `【選ばれたフックタイプ】${selectedHookOption.label}\n${selectedHookOption.promptNote}\n→ 上記の型に沿って、今回のテーマ・お客様の悩みに合う具体的な hook 文言を1つ生成すること。` : "- 問いかけ・共感・驚きのいずれかで視聴者を止める hook にすること。"}
- scenes は必ず2秒間隔で生成すること。sec は 0, 2, 4, 6, 8, … と2秒ごとに${shortTargetDuration}秒まで（例：60秒なら約30個）。各 scene の text は「その2秒間に表示するテロップ・ナレーション」で、1ブロックあたり10〜16字程度の文にすること。2秒ごとに違うテキストが切り替わる台本にしてください。note には画面の切り替えや見せ方のメモを任意で。
- 最後の cta は「LINEで予約」「プロフィールのリンクから」など、${shopLineUrl ? `LINE（${shopLineUrl}）` : "予約・問い合わせ"}への誘導を20字前後で。
${shortPlatform ? `- 主な投稿先は「${shortPlatform}」を想定し、そのプラットフォームに合ったテンポとフックにしてください。` : ""}
${shortSampleScript ? `- 以下の【ショート用サンプル台本】の話し方・テンポ・言い回しを参考にし、同じトーンで書いてください。\n\n【ショート用サンプル台本】\n${shortSampleScript}` : ""}
${shortMemo ? `- 店舗からの希望・メモ：${shortMemo}` : ""}
`
            : "";

        const toneInstruction = shopSampleTexts
            ? `- 以下の【あなたが過去に書いた文章サンプル】の「文のテンポ、絵文字の有無・頻度、改行のクセ、語尾のニュアンス、親しみやすさ」などを徹底的に分析して真似してください。\n\n【あなたが過去に書いた文章サンプル】\n${shopSampleTexts}`
            : `- 落ち着いた丁寧な「です・ます調」で、お客様に優しく語りかけるような、人間味のある自然な文章にしてください。
- 専門用語を並べるのではなく、日常の情景が浮かぶ言葉で悩みの原因やアプローチを誠実に伝えてください。
- （理想的な文章のトーン例）
「午前中からずっとスマホやパソコンと向き合っている方、いらっしゃいませんか？『なんか肩まで重だるい…』と感じているなら、それは目の疲れが影響しているかもしれません。目の奥の疲労は放っておくと頭痛や肩こりにつながりやすく、気づかないうちに頭から首までガチガチになっている方も少なくないんです。頭をじっくりほぐして目の奥の疲れを解放すると、肩の重さもすっと楽になりますよ。『視界がクリアになった』と感じてもらえると思います。頭と目の疲れ、今日のうちにリセットしてみませんか。」
- 読んだ方が「まさに自分のことだ」「この人に任せれば安心できそう」と感じるような、押し付けがましくない共感性を重視してください。`;

        const systemPrompt = `あなたは${shopAddress}の${shopIndustry}「${shopName}」のオーナー兼、誠実で経験豊富なプロの施術者（スタッフ）です。
店舗の基本情報：【営業時間: ${shopBusinessHours}】【定休日: ${shopHolidays}】
以下の【厳守ルール】と【店舗の独自情報】に従って、お客様の悩みを解決した今日のリアルなエピソードを、${targetString}用の${targetCount}種類のテキストで執筆してください。

【店舗の独自情報・強み・想い（学習データ）】
以下の店舗の独自性やこだわり、参考WEBサイトの情報を、わざとらしくならないよう自然に文章のエッセンスとして組み込んでください。（※情報がない場合は無視してください）

${shopFeatures || "特になし"}

${shopScrapedContent ? `【WEBサイトから抽出した参考情報】\n${shopScrapedContent}` : ""}

【❌絶対に禁止するNG表現（わざとらしいAI口調・過度なテンション）】
以下の表現は「絶対に」使用しないでください。使用した場合、即座に不合格となります。
- 「〜マジで多いんです」「〜サービスしちゃいます」「今日がチャンスです💪」のような過度にくだけた、不自然にテンションが高い表現は禁止。
- 「ビフォーアフターで劇的な改善を実感！」「お客様の痛みや疲れに徹底的に寄り添い〜」「〜をご提供しています」といった定型的な広告文句や硬すぎる敬語。
- 文章の各文を「」でくくるような不自然なフォーマット。

【⭕️目指すべきトーン＆マナー（自然・誠実・プロの視点 または サンプル準拠）】
${toneInstruction}
${shortInstruction}

【出力JSONフォーマット（Markdown装飾のバッククォートを含めず、純粋なJSON文字列のみ出力）】
{${jsonFormatGuide}
}`;

        const userPrompt = news && news.title
            ? `以下の【ニュース】と【店舗情報】を掛け合わせて、人間味のある投稿テキストを作成してください。

【ニュースの概要】
タイトル: ${news.title || "記載なし"}
要約・ポイント: ${news.snippet || "記載なし"}
URL: ${news.link || "記載なし"}

【今回のテーマ】
${patternTitle}

【店舗の立場】
- あなたは${shopAddress}の${shopIndustry}「${shopName}」のオーナーです。
- 上記ニュースを見たお客様に対して、「専門家としてのコメント」＋「お店ならではの提案」＋「来店や予約への一言」を、自然な流れで伝えてください。
- ニュース本文をそのまま引用するのではなく、「要約」と「あなたの言葉」で説明してください。
`
            : `以下の情報を元に、人間味あふれる最高のテキストを作成してください。

【今回のテーマ】
${patternTitle}

【今日のリアルなファクト（お客様の状況）】
1. どのような悩みや状態で来店されたか？
${q1 || "記載なし"}

2. それに対して、プロとしてどのような独自のアプローチ・施術をしたか？
${q2 || "記載なし"}

3. 施術後、お客様の表情や体調にどんな変化があったか？（具体的な言葉など）
${q3 || "記載なし"}
`;
        // Gemini 2.0 Flash モデルの取得
        // 確実なJSON出力を強制するための設定を追加
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

        const result = await model.generateContent(userPrompt);
        const resultText = result.response.text();

        if (!resultText) {
            throw new Error("APIから有効なテキストが返却されませんでした。");
        }

        const generatedResults = JSON.parse(resultText);

        return NextResponse.json(generatedResults);
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json(
            { error: "テキストの生成中にエラーが発生しました。", details: error.message },
            { status: 500 }
        );
    }
}
