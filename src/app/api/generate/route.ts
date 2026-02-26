import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json(
            { error: "Gemini APIキーが設定されていません。" },
            { status: 500 }
        );
    }

    try {
        const body = await req.json();
        const { patternTitle, q1, q2, q3, shopInfo, outputTargets = { instagram: true, gbp: true, portal: true, line: false }, generateImage = false } = body;

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

        const targetNames = [];
        if (outputTargets.instagram) targetNames.push("Instagram");
        if (outputTargets.gbp) targetNames.push("Googleビジネスプロフィール(GBP)");
        if (outputTargets.portal) targetNames.push("ポータルサイト");
        if (outputTargets.line) targetNames.push("LINE");

        if (targetNames.length === 0) {
            return NextResponse.json(
                { error: "出力先が一つも選択されていません。" },
                { status: 400 }
            );
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

【出力JSONフォーマット（Markdown装飾のバッククォートを含めず、純粋なJSON文字列のみ出力）】
{${jsonFormatGuide}
}`;

        const userPrompt = `以下の情報を元に、人間味あふれる最高のテキストを作成してください。

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

        // 画像生成オプションが有効な場合、DALL-E 3 を呼び出す
        if (generateImage && process.env.OPENAI_API_KEY) {
            try {
                // 生成されたテキストの雰囲気を反映させるため、テキストの一部をプロンプトのヒントに使う
                const contentHint = generatedResults.portalTitle || generatedResults.instagram?.substring(0, 50) || patternTitle;

                // 店舗名などの文字が入ると文字化けしやすいため、情景描写を中心に生成プロンプトを作成
                const imagePrompt = `【重要】必ず1枚の繋がった写真（シングルフレーム）にしてください。画面が上下や左右に分割されたり、複数の写真がコラージュされた画像は絶対に避けてください。文字やテキスト、ロゴも一切含めないでください。
プロの写真家が撮影したような、高品質で美しい横長（ランドスケープ）の写真。
テーマ・文脈: 「${contentHint}」
上記の文脈に関連する、悩みや問題が解決し癒やされている様子、または高品質なリラクゼーション・サービスのイメージ表現。温かみのあるライティングと落ち着いた雰囲気で、店舗の公式ウェブサイトのトップ画像としてふさわしい、清潔感があり来店意欲を高める一枚の写真にしてください。`;

                const imageRes = await fetch("https://api.openai.com/v1/images/generations", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "dall-e-3",
                        prompt: imagePrompt,
                        n: 1,
                        size: "1792x1024", // DALL-E 3 supports 1024x1024, 1024x1792, or 1792x1024
                        style: "natural" // よりリアルな写真に近づけるため自然なスタイルを指定
                    })
                });

                if (imageRes.ok) {
                    const imageData = await imageRes.json();
                    if (imageData.data && imageData.data[0] && imageData.data[0].url) {
                        generatedResults.imageUrl = imageData.data[0].url;
                    }
                } else {
                    console.error("DALL-E 3 API Error:", await imageRes.text());
                }
            } catch (imgErr) {
                console.error("Failed to generate image:", imgErr);
                // 画像生成が失敗してもテキスト自体は返す
            }
        }

        return NextResponse.json(generatedResults);
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json(
            { error: "テキストの生成中にエラーが発生しました。", details: error.message },
            { status: 500 }
        );
    }
}
