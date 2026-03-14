import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const bodySchema = z.object({
    scrapedContent: z.string().min(1, "scrapedContent is required").max(100000),
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const itemSchema = {
    type: SchemaType.OBJECT,
    properties: {
        status: { type: SchemaType.STRING },
        reason: { type: SchemaType.STRING },
    },
    required: ["status", "reason"],
} as const;

export async function POST(req: NextRequest) {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const rateLimitResponse = checkRateLimit(user?.id ?? "anonymous", 10);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "scrapedContent is required" },
            { status: 400 }
        );
    }
    const { scrapedContent } = parsed.data;

    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json(
            { error: "GEMINI_API_KEY is not configured" },
            { status: 500 }
        );
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `あなたは美容院のSNSマーケティング専門家です。
美容院のウェブサイトテキストを分析し、SNS投稿生成に必要な情報が揃っているかを判定してください。

以下の5項目について「sufficient」か「insufficient」を判定する。
判定基準：
- sufficient  : SNS投稿に活用できる具体的な情報が存在する
- insufficient: 情報がない・抽象的すぎて投稿に使えない
各項目の reason は判定理由を10字以内で記載すること。`,
            generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        concept: itemSchema,
                        strengths: itemSchema,
                        target: itemSchema,
                        staff: itemSchema,
                        voice: itemSchema,
                    },
                    required: ["concept", "strengths", "target", "staff", "voice"],
                },
            },
        });

        const result = await model.generateContent(
            `以下のウェブサイトテキストを分析し、5項目それぞれについて status（sufficient または insufficient）と reason（10字以内）をJSONで返してください。\n\n${scrapedContent}`
        );
        const text = result.response.text();

        if (!text) {
            throw new Error("APIから有効なテキストが返却されませんでした。");
        }

        const parsedResult = JSON.parse(text) as Record<string, { status?: string; reason?: string }>;
        const keys = ["concept", "strengths", "target", "staff", "voice"] as const;
        const isValid = keys.every(
            (k) =>
                parsedResult[k] &&
                typeof parsedResult[k].status === "string" &&
                typeof parsedResult[k].reason === "string"
        );
        if (!isValid) {
            console.error("analyze-shop: invalid shape", parsedResult);
            return NextResponse.json(
                { error: "AI分析の解析に失敗しました" },
                { status: 500 }
            );
        }

        return NextResponse.json(parsedResult);
    } catch (e) {
        console.error("analyze-shop error:", e);
        return NextResponse.json(
            { error: "AI分析の解析に失敗しました" },
            { status: 500 }
        );
    }
}
