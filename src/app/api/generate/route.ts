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
        const { patternTitle, q1, q2, q3, shopInfo } = body;

        const shopName = shopInfo?.name || "The Gentry";
        const shopAddress = shopInfo?.address || "長野市";
        const shopPhone = shopInfo?.phone || "";
        const shopLineUrl = shopInfo?.lineUrl || "";
        const shopFeatures = shopInfo?.features || "";
        const systemPrompt = `あなたは${shopAddress}のリラクゼーションサロン「${shopName}」のオーナー兼、誠実で経験豊富なベテラン整体師です。
以下の【厳守ルール】と【店舗の独自情報】に従って、お客様の悩みを解決した今日のリアルなエピソードを、Instagram、Googleビジネスプロフィール(GBP)、ポータルサイト用の3種類のテキストで執筆してください。

【店舗の独自情報・強み・想い（学習データ）】
以下の店舗の独自性やこだわり、参考WEBサイトの情報を、わざとらしくならないよう自然に文章のエッセンスとして組み込んでください。（※情報がない場合は無視してください）

${shopFeatures || "特になし"}

【❌絶対に禁止するNG表現（わざとらしいAI口調・過度なテンション）】
以下の表現は「絶対に」使用しないでください。使用した場合、即座に不合格となります。
- 「〜マジで多いんです」「〜サービスしちゃいます」「今日がチャンスです💪」のような過度にくだけた、不自然にテンションが高い表現は禁止。
- 「ビフォーアフターで劇的な改善を実感！」「お客様の痛みや疲れに徹底的に寄り添い〜」「〜をご提供しています」といった定型的な広告文句や硬すぎる敬語。
- 文章の各文を「」でくくるような不自然なフォーマット。

【⭕️目指すべきトーン＆マナー（自然・誠実・プロの視点）】
- 落ち着いた丁寧な「です・ます調」で、お客様に優しく語りかけるような、人間味のある自然な文章にしてください。
- 専門用語を並べるのではなく、日常の情景が浮かぶ言葉で悩みの原因やアプローチを誠実に伝えてください。
- （理想的な文章のトーン例）
「午前中からずっとスマホやパソコンと向き合っている方、いらっしゃいませんか？『なんか肩まで重だるい…』と感じているなら、それは目の疲れが影響しているかもしれません。目の奥の疲労は放っておくと頭痛や肩こりにつながりやすく、気づかないうちに頭から首までガチガチになっている方も少なくないんです。頭をじっくりほぐして目の奥の疲れを解放すると、肩の重さもすっと楽になりますよ。『視界がクリアになった』と感じてもらえると思います。頭と目の疲れ、今日のうちにリセットしてみませんか。」
- 読んだ方が「まさに自分のことだ」「この人に任せれば安心できそう」と感じるような、押し付けがましくない共感性を重視してください。

【出力JSONフォーマット（Markdown装飾のバッククォートを含めず、純粋なJSON文字列のみ出力）】
{
  "instagram": "【目的: 共感とファン化】絵文字を適度に使い、SNSらしい改行テンポで、今日あったリアルなエピソードを語る文章。ただし、文章の語尾は必ず丁寧な「です・ます調」で統一し、文章の最後には必ず『ご予約・お問い合わせはプロフィールのLINEからお待ちしております（URL: ${shopLineUrl} ）』のようにLINEへの誘導文を入れること。（ハッシュタグ #リラクゼーション #${shopName} #メンズ専用 等を含む）",
  "gbp": "【目的: 近隣検索からの来店誘致】検索して見つけた悩める男性に、「ここなら治るかも」と思わせる力強い文章。文章の最後は必ず予約・問合せ情報（詳細やご予約はLINEから: ${shopLineUrl} ）への自然な導線で結ぶこと。",
  "portal": "<div class=\\"seo-content\\"><h3>フックとなる見出し</h3><p>本文（共感・原因の解説）</p><h4>${shopName}の独自のアプローチ</h4><p>本文（手技の解説と結果）</p><ul><li>お客様のリアルな反応</li></ul><div class=\\"shop-info\\"><p>📍${shopAddress}</p><p>📞${shopPhone}</p><p>📱<a href=\\"${shopLineUrl}\\">LINEでのご予約・ご相談はこちら</a></p></div></div> のような、HTMLタグで構造化・装飾された長文のコラム風テキスト。必ず末尾にLINEへの誘導リンクを含めること。"
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
                    properties: {
                        instagram: { type: SchemaType.STRING },
                        gbp: { type: SchemaType.STRING },
                        portal: { type: SchemaType.STRING },
                    },
                    required: ["instagram", "gbp", "portal"]
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
