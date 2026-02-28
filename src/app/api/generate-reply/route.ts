import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const replySchema = z.object({
    platform: z.enum(["gbp", "sns", ""]).optional(),
    receivedComment: z.string().min(1, "コメントは必須です。"),
    replyNote: z.string().optional(),
    shopInfo: z.object({
        name: z.string().optional(),
        address: z.string().optional(),
        industry: z.string().optional(),
        businessHours: z.string().optional(),
        holidays: z.string().optional(),
        features: z.string().optional(),
        sampleTexts: z.string().optional(),
    }).optional()
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    // 認証チェック: ログインしていないユーザーは 401 を返す
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const rateLimitResponse = checkRateLimit(user?.id || "anonymous", 10);
    if (rateLimitResponse) return rateLimitResponse;

    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json(
            { error: "Gemini APIキーが設定されていません。" },
            { status: 500 }
        );
    }

    try {
        const body = await req.json();
        const parsed = replySchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "入力内容に誤りがあります。", details: parsed.error.format() }, { status: 400 });
        }

        const { platform, receivedComment, replyNote, shopInfo } = parsed.data;

        // 店舗情報の取得
        const shopName = shopInfo?.name || "当店";
        const shopAddress = shopInfo?.address || "";
        const shopIndustry = shopInfo?.industry || "サロン";
        const shopBusinessHours = shopInfo?.businessHours || "";
        const shopHolidays = shopInfo?.holidays || "";
        const shopFeatures = shopInfo?.features || "";
        const shopSampleTexts = shopInfo?.sampleTexts || "";

        // プラットフォームに応じたガイドライン
        const platformGuide = platform === "gbp"
            ? `
【Googleクチコミ返信のガイドライン】
- 公式オーナーとしての丁寧・誠実な文体を使う（です・ます調）
- まずお礼の言葉から始め、コメント内容に具体的に触れる
- 再来店・新規来店への自然な誘導で締める
- 文字数：100〜200字程度（長すぎず短すぎず）
- ハッシュタグ不要
- 絵文字は控えめに（0〜1個程度）
`
            : `
【SNSコメント返信のガイドライン】
- 親しみやすく温かみのある文体（です・ます調ベース）
- コメントしてくれた相手に感謝と共感を示す
- 次のアクション（再来店・予約・メッセージなど）への柔らかい誘導
- 文字数：50〜120字程度（SNSらしいテンポの良さ）
- 絵文字を適度に使い、人間らしい温かさを演出
- ハッシュタグは使わない（返信欄なので）
`;

        // 文体サンプルの指示
        const toneInstruction = shopSampleTexts
            ? `あなたが過去に書いた文章サンプルの「文のテンポ、絵文字の有無・頻度、語尾のニュアンス」を徹底的に参考にして返信を書いてください。\n\n【文章サンプル】\n${shopSampleTexts}`
            : `落ち着いた丁寧な「です・ます調」で、お客様に優しく語りかけるような、人間味のある自然な文体を使ってください。`;

        const systemPrompt = `あなたは${shopAddress ? shopAddress + "の" : ""}${shopIndustry}「${shopName}」のオーナーです。
店舗情報：【営業時間: ${shopBusinessHours || "記載なし"}】【定休日: ${shopHolidays || "記載なし"}】
${shopFeatures ? `【店舗の独自性・強み】\n${shopFeatures}` : ""}

以下のコメント・クチコミに対して、誠実かつ温かみのあるオーナー返信を生成してください。

${platformGuide}

【文体・トーン】
${toneInstruction}

【絶対に避けるNGパターン】
- 「〜でございます」のような過度に堅苦しい表現
- 「素晴らしいレビューありがとうございます」などの機械的な定型文
- 「今後ともよろしくお願い申し上げます」の連発
- お客様が触れていない内容を勝手に付け加える

純粋なJSON文字列のみを出力してください（Markdownバッククォート不要）。`;

        const userPrompt = `【受信したコメント・クチコミ】
${receivedComment}

${replyNote ? `【返信に含めてほしい特記事項・補足情報】\n${replyNote}` : ""}

上記のコメントへの返信文を生成してください。`;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: systemPrompt,
            generationConfig: {
                temperature: 0.75,
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        reply: { type: SchemaType.STRING }
                    },
                    required: ["reply"]
                }
            }
        });

        const result = await model.generateContent(userPrompt);
        const resultText = result.response.text();

        if (!resultText) {
            throw new Error("APIから有効なテキストが返却されませんでした。");
        }

        const generatedResult = JSON.parse(resultText);
        return NextResponse.json(generatedResult);

    } catch (error: any) {
        console.error("generate-reply API Error:", error);
        return NextResponse.json(
            { error: "返信テキストの生成中にエラーが発生しました。", details: error.message },
            { status: 500 }
        );
    }
}
