import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import type { LlmoArticleData } from "@/types";

const llmoSchema = z.object({
    title: z.string().min(1, "タイトルは必須です"),
    html: z.string().min(1, "本文HTMLは必須です"),
    shopInfo: z.object({
        name: z.string().optional(),
        address: z.string().optional(),
        industry: z.string().optional(),
        features: z.string().optional(),
    }).optional(),
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

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
        const parsed = llmoSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "入力内容に誤りがあります。", details: parsed.error.format() },
                { status: 400 }
            );
        }

        const { title, html, shopInfo } = parsed.data;

        const shopName = shopInfo?.name || "店舗";
        const shopAddress = shopInfo?.address || "";
        const shopIndustry = shopInfo?.industry || "サロン";
        const shopFeatures = shopInfo?.features || "";

        const systemPrompt = `あなたは${shopAddress || "日本"}の${shopIndustry}「${shopName}」のコンテンツマーケター兼SEO担当者です。
既に完成しているブログ記事（HTML）を読み取り、LLM検索・AI要約サービス・構造化データ向けに最適化されたメタ情報を抽出・整理してください。

【重要】
- 既存の記事の事実関係・トーンは変えず、「要約・ポイント・FAQ・エンティティ・schema.org JSON-LD」を作ることに専念してください。
- 出力は指定されたJSONスキーマの形式「のみ」で返してください。余計なテキストは一切含めないこと。`;

        const userPrompt = `
【記事タイトル】
${title}

【HTML本文】
${html}

${shopFeatures ? `【店舗の独自情報・強み】
${shopFeatures}
` : ""}

【出力内容の指示】
1. summary
   - 記事全体の要点を3〜5文で、オーナー目線で分かりやすく要約してください。
2. keyPoints
   - 読者が特に知るべきポイントを3〜7個、短い箇条書きで。
3. faq
   - 記事内容や想定ターゲットから自然に生まれそうな「よくある質問」を3〜5個作り、それぞれに1〜3文で誠実に答えてください。
4. entities
   - LLMや検索向けに役立つエンティティ（症状名、メニュー名、施術名、ターゲット層、エリア名など）を抽出し、
     type に "symptom" | "menu" | "treatment" | "targetUser" | "area" などのラベル、value に具体的な名称を入れてください。
5. schemaJson
   - schema.org の Article もしくは BlogPosting をベースにした JSON-LD を1つのJSON文字列として出力してください。
   - headline, description, articleBody, articleSection, author, datePublished（おおよその日付でOK）, about（エンティティ）などを含めてください。
   - 日本語のサイトを想定し、"inLanguage": "ja" としてください。
`;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: systemPrompt,
            generationConfig: {
                temperature: 0.4,
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        summary: { type: SchemaType.STRING },
                        keyPoints: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        faq: {
                            type: SchemaType.ARRAY,
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    question: { type: SchemaType.STRING },
                                    answer: { type: SchemaType.STRING },
                                },
                                required: ["question", "answer"],
                            },
                        },
                        entities: {
                            type: SchemaType.ARRAY,
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    type: { type: SchemaType.STRING },
                                    value: { type: SchemaType.STRING },
                                },
                                required: ["type", "value"],
                            },
                        },
                        schemaJson: { type: SchemaType.STRING },
                    },
                    required: ["summary", "keyPoints", "faq", "entities", "schemaJson"],
                } as import("@google/generative-ai").Schema,
            },
        });

        const result = await model.generateContent(userPrompt);
        const resultText = result.response.text();
        if (!resultText) {
            throw new Error("APIから有効なテキストが返却されませんでした。");
        }

        const parsedResult = JSON.parse(resultText) as LlmoArticleData;

        // WordPressにそのまま貼れる「要約＋ポイント＋本文＋FAQ」のHTMLブロックを組み立てる
        const summaryHtml = `<section class="llmo-summary">
  <h2>この記事の要約</h2>
  <p>${parsedResult.summary.replace(/\n+/g, "<br />")}</p>
</section>`;

        const keypointsHtml = (parsedResult.keyPoints && parsedResult.keyPoints.length > 0)
            ? `<section class="llmo-keypoints">
  <h2>この記事のポイント</h2>
  <ul>
${parsedResult.keyPoints.map((pt) => `    <li>${pt}</li>`).join("\n")}
  </ul>
</section>`
            : "";

        const faqHtml = (parsedResult.faq && parsedResult.faq.length > 0)
            ? `<section class="llmo-faq">
  <h2>よくある質問</h2>
${parsedResult.faq.map((item) => `  <div class="llmo-faq-item">
    <p class="llmo-faq-q"><strong>Q. ${item.question}</strong></p>
    <p class="llmo-faq-a">A. ${item.answer}</p>
  </div>`).join("\n")}
</section>`
            : "";

        // 記事本文HTML（llmoSchema で受け取った html）を中央に挟み込む
        const articleHtmlWrapper = `<section class="llmo-article-body">
${html}
</section>`;

        parsedResult.html = `${summaryHtml}\n\n${keypointsHtml}\n\n${articleHtmlWrapper}\n\n${faqHtml}`.trim();

        return NextResponse.json(parsedResult);
    } catch (error: unknown) {
        console.error("llmo-enhance error:", error);
        const message = error instanceof Error ? error.message : "LLMO対応データの生成中にエラーが発生しました。";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

