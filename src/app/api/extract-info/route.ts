import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const extractSchema = z.object({
    text: z.string().min(1, "テキストが提供されていません。").max(20000, "テキストが長すぎます。"),
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
        const parsed = extractSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "入力内容に誤りがあります。", details: parsed.error.format() }, { status: 400 });
        }

        const { text } = parsed.data;

        const systemPrompt = `あなたは情報抽出の専門AIです。
与えられたテキスト（店舗の紹介文やWEBサイトからのスクレイピング結果など）から、「業種」「店舗名」「店舗の住所」「電話番号」「LINEなどの連絡・予約用URL」「営業時間」「定休日」を探し、JSON形式で正確に抽出してください。
テキストの中にそれらの情報が含まれていない場合は、該当するキーの値を空文字列枠("")としてください。
架空の情報をでっち上げることは絶対にやめてください。

出力スキーマ（JSON）:
{
  "industry": "文字列から推測できる業種（例: 美容室、整体院、カフェ、パーソナルジムなど） / なければ空文字",
  "name": "抽出された店舗名（例: リラクゼーションサロン 〇〇） / なければ空文字",
  "address": "抽出された住所（例: 東京都渋谷区〇〇1-2-3） / なければ空文字",
  "phone": "抽出された電話番号（ハイフンあり・なし問わず数字の連続等） / なければ空文字",
  "lineUrl": "抽出されたLINEの友だち追加URLや予約ページURL（http~） / なければ空文字",
  "businessHours": "抽出された営業時間（例: 10:00〜21:00） / なければ空文字",
  "holidays": "抽出された定休日（例: 毎週火曜日） / なければ空文字"
}`;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: systemPrompt,
            generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        industry: { type: SchemaType.STRING },
                        name: { type: SchemaType.STRING },
                        address: { type: SchemaType.STRING },
                        phone: { type: SchemaType.STRING },
                        lineUrl: { type: SchemaType.STRING },
                        businessHours: { type: SchemaType.STRING },
                        holidays: { type: SchemaType.STRING },
                    },
                    required: ["industry", "name", "address", "phone", "lineUrl", "businessHours", "holidays"]
                }
            }
        });

        const result = await model.generateContent(`以下のテキストから情報を抽出してください。\n\n${text}`);
        const resultText = result.response.text();

        if (!resultText) {
            throw new Error("APIから有効なテキストが返却されませんでした。");
        }

        const extractedData = JSON.parse(resultText);

        return NextResponse.json(extractedData);
    } catch (error: any) {
        console.error("Extraction API Error:", error);
        return NextResponse.json(
            { error: "情報の抽出中にエラーが発生しました。", details: error.message },
            { status: 500 }
        );
    }
}
