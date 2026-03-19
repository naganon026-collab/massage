import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { REFINE_OPTIONS } from "@/types";

const refineSchema = z.object({
    currentText: z.string().min(1, "テキストは必須です"),
    instruction: z.string().min(1, "改善指示は必須です"),
    target: z.enum(["instagram", "gbp", "portal", "line", "short"]),
    shopInfo: z.object({
        name: z.string().optional(),
        industry: z.string().optional(),
        lineUrl: z.string().optional(),
        sampleTexts: z.string().optional(),
        ctaType: z.enum(["phone", "reservation", "line", "other"]).optional(),
        ctaValue: z.string().optional(),
        ctaText: z.string().optional(),
        phone: z.string().optional(),
    }).optional(),
    patternTitle: z.string().optional(),
    portalTitle: z.string().optional(),
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
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
        const parsed = refineSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "入力内容に誤りがあります。", details: parsed.error.format() },
                { status: 400 }
            );
        }

        const { currentText, instruction: instructionId, target, shopInfo, patternTitle, portalTitle } = parsed.data;
        const instructionLabel = REFINE_OPTIONS.find((o) => o.id === instructionId)?.label || instructionId;
        const shopName = shopInfo?.name || "当店";
        const shopIndustry = shopInfo?.industry || "サロン";

        const isShort = target === "short";
        const isPortal = target === "portal";

        const targetGuide =
            target === "instagram"
                ? "Instagram用の投稿文。絵文字・改行・ハッシュタグを維持しつつ改善すること。"
                : target === "gbp"
                    ? "Googleビジネスプロフィール用の投稿文。検索で見つけた人向けの力強い文章。"
                    : target === "portal"
                        ? "ポータルサイト用のHTMLコラム。見出し・段落・店舗情報の構造を維持しつつ改善すること。"
                        : target === "line"
                            ? "LINE公式アカウント用の配信文。親しみやすい文体を維持。"
                            : "ショート動画の台本（JSON形式）。hook / scenes（2秒間隔） / cta の構造を維持しつつ、各 text を改善すること。";

        const systemPrompt = `あなたは${shopIndustry}「${shopName}」のオーナーです。
以下の【現在のテキスト】を、【改善指示】に従って書き直してください。
- 改善指示以外は変えず、店舗のトーン・事実・構成は維持すること。
- 出力は指定された形式のみ返すこと。余計な説明は不要。`;

        const userPrompt = `
【改善指示】
${instructionLabel}

【現在のテキスト】
${currentText}

【出力ルール】
${targetGuide}
${isPortal && portalTitle ? `\n現在のタイトル: ${portalTitle}\nタイトルも改善する場合は portalTitle に含めること。` : ""}
${isShort ? "\n必ず有効なJSON文字列1つで返すこと。hook, scenes, cta の形を崩さないこと。" : ""}
`;

        const properties: Record<string, { type: SchemaType }> = {};
        const required: string[] = [];

        if (isShort) {
            properties.shortScript = { type: SchemaType.STRING };
            required.push("shortScript");
        } else if (isPortal) {
            properties.portal = { type: SchemaType.STRING };
            properties.portalTitle = { type: SchemaType.STRING };
            required.push("portal", "portalTitle");
        } else {
            properties[target] = { type: SchemaType.STRING };
            required.push(target);
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: systemPrompt,
            generationConfig: {
                temperature: 0.5,
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties,
                    required,
                } as import("@google/generative-ai").Schema,
            },
        });

        const result = await model.generateContent(userPrompt);
        const resultText = result.response.text();
        if (!resultText) {
            throw new Error("APIから有効なテキストが返却されませんでした。");
        }

        const generated = JSON.parse(resultText);

        // 締め文（CTA）を文末に付与（instagram / gbp / line のみ）
        const si = parsed.data.shopInfo;
        const lineUrl = si?.lineUrl ?? "";
        const ct = si?.ctaType;
        const cv = (si?.ctaValue ?? "").trim();
        const leg = (si?.ctaText ?? "").trim();
        let ctaToAppend = (si?.ctaText ?? "").trim();
        if (!ctaToAppend) {
            if (ct === "phone") {
                const p = cv || si?.phone;
                if (p) ctaToAppend = `お気軽にお電話ください：${p}（今週末の空きもご確認いただけます）`;
            } else if (ct === "reservation" && cv) {
                ctaToAppend = `1分で予約できます！こちらから：${cv}`;
            } else if (ct === "line") {
                const url = cv || lineUrl;
                if (url) ctaToAppend = `下のリンクから1分で予約できます↓ ${url}`;
            } else if (ct === "other" && cv) {
                ctaToAppend = cv;
            } else if (cv && (/^https?:\/\//i.test(cv) || cv.includes("line.me"))) {
                ctaToAppend = `下のリンクから1分で予約できます↓ ${cv}`;
            } else if (cv) {
                ctaToAppend = cv;
            } else if (lineUrl) {
                ctaToAppend = `下のリンクから1分で予約できます↓ ${lineUrl}`;
            }
        }
        if (ctaToAppend && (target === "instagram" || target === "gbp" || target === "line")) {
            const cta = ctaToAppend.trim();
            const ensureCta = (text: string | undefined): string => {
                if (text == null || typeof text !== "string") return text ?? "";
                const t = text.trim();
                if (!t || t.endsWith(cta)) return text;
                return t + "\n\n" + cta;
            };
            const key = target;
            if (generated[key] != null) generated[key] = ensureCta(generated[key]);
        }

        return NextResponse.json(generated);
    } catch (error: unknown) {
        console.error("generate-refine error:", error);
        const message = error instanceof Error ? error.message : "テキストの改善中にエラーが発生しました。";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
