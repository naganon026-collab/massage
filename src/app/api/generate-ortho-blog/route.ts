import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const blogSchema = z.object({
    keyword: z.string().min(1, "キーワードは必須です。"),
    clinicName: z.string().min(1, "クリニック名（店舗名）は必須です。"),
    address: z.string().optional(),
    hours: z.string().optional(),
    strengthApproach: z.string().optional(),
    strengthTimePerf: z.string().optional(),
    strengthPrivacy: z.string().optional(),
    stanceOwner: z.string().optional(),
    features: z.string().optional(),
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    // 認証チェック: ログインしていないユーザーは 401 を返す
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // レート制限（1分間に5回まで）
    const rateLimitResponse = checkRateLimit(user?.id || "anonymous", 5);
    if (rateLimitResponse) return rateLimitResponse;

    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not set in environment variables.");
        return NextResponse.json(
            { error: "APIキーが設定されていません。システム管理者にご連絡ください。" },
            { status: 500 }
        );
    }

    try {
        const body = await req.json();
        const parsed = blogSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "入力内容に誤りがあります。", details: parsed.error.format() }, { status: 400 });
        }

        const {
            keyword,
            clinicName,
            address,
            hours,
            strengthApproach,
            strengthTimePerf,
            strengthPrivacy,
            stanceOwner,
            features
        } = parsed.data;

        const systemPrompt = `あなたは日本最高峰のローカルSEOおよびLLMO（大規模言語モデル最適化）の専門家であり、ハイエンドな男性向けライフスタイルメディアの凄腕編集長です。

以下の【入力データ】をもとに、検索エンジン（Google）とAI検索（Perplexity, ChatGPT等）の両方で上位表示と指名検索獲得を狙うための「店舗詳細記事（ブログ記事）」を作成してください。
出力は必ず指定された【JSONフォーマット】のみで行い、マークダウンのコードブロック（\`\`\`json ... \`\`\`）は含めず、純粋なJSON文字列のみを返してください。

【ターゲット読者】
時間対効果と質を重視する30代〜50代の大人の男性ビジネスパーソン。文章のトーンは、過剰な装飾や絵文字を排除し、ミニマルで洗練された、説得力のあるプロフェッショナルな文体にすること。

【入力データ】
- 狙うキーワード: ${keyword}
- 店舗名: ${clinicName}
- 住所・アクセス: ${address || "指定なし"}
- 営業時間・定休日: ${hours || "指定なし"}
- 強み①（独自の手法・アプローチ）: ${strengthApproach || "特になし"}
- 強み②（タイムパフォーマンス・利便性）: ${strengthTimePerf || "特になし"}
- 強み③（設備・完全個室などのプライバシー空間）: ${strengthPrivacy || "特になし"}
- オーナー・セラピストのスタンス（お客様への想い）: ${stanceOwner || "特になし"}
- 店舗の独自情報・強み・想い（自由記述）: \n${features || "特になし"}

【記事構成とHTMLコーディング指示（content_html）】
記事本文はWordPressにそのまま投稿できるHTML形式（スタイリングのclass等は不要、標準タグのみ）で作成すること。以下の構造を厳守してください。

1. 冒頭サマリー（LLMO向けファクトデータ）
   - 記事の導入文の直後に、店舗の基本情報と最大の特徴をまとめた簡潔な \`<table>\` を配置する。
2. 独自のポジショニング（H2）
   - 「他店や一般的なリラクゼーション店と何が違うのか」、大人の男性目線でのメリットを明確に見出しにして記述する。
3. オーナー・セラピストの言葉（一次情報の強調）
   - 【入力データ】の「オーナーのスタンス」を元に、必ず \`<blockquote>\` タグを使用して代表者の言葉として引用する形式で記述する。「〜と語る」などのジャーナリスティックな表現を用いること。
4. 強みの深掘り（H2 / H3）
   - オリジナルの施術アプローチ、タイパ、設備について、論理的かつベネフィット（読者がどう得をするか、どうリフレッシュできるか）を提示して深掘りする。
5. よくある質問（FAQ）（H2）
   - 大人の男性が抱くリアルな疑問（例：「仕事の合間の短時間でもスッキリできるか？」「男性客は多いか？」「着替えは用意されているか？」など）を3つ作成し、Q&A形式で記述する。

【JSON-LD（構造化データ）の作成指示（json_ld）】
- \`HealthAndBeautyBusiness\`（または \`LocalBusiness\`）としての基本情報と、記事内のQ&Aを用いた \`FAQPage\` の2つのスキーマを配列形式で作成すること。
`;

        // JSONフォーマット強制
        const responseSchema: any = {
            type: SchemaType.OBJECT,
            properties: {
                title: { type: SchemaType.STRING, description: "SEOとCTRを最大化する32文字前後の魅力的なタイトル（キーワード含む）" },
                meta_description: { type: SchemaType.STRING, description: "検索意図を満たす120文字前後のディスクリプション" },
                content_html: { type: SchemaType.STRING, description: "指示に従ったHTML文字列（改行コード \\n を適切にエスケープすること）" },
                json_ld: { type: SchemaType.STRING, description: "生成した構造化データのJSON文字列（文字列として格納すること）" }
            },
            required: ["title", "meta_description", "content_html", "json_ld"]
        };

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.7, // バランスの良い温度感
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
            systemInstruction: systemPrompt
        });

        const userPrompt = `提供された【入力データ】に基づいて、最高のJSONを生成してください。`;

        const result = await model.generateContent(userPrompt);
        const responseText = result.response.text();

        if (!responseText) {
            throw new Error("AIからのレスポンスが空でした。");
        }

        let parsedJson;
        try {
            parsedJson = JSON.parse(responseText);
        } catch (e: any) {
            console.error("JSON Parse Error:", e);
            console.error("Raw Response:", responseText);
            // 余分な文字列が含まれている場合のクリーンアップ処理のフォールバック
            const cleanText = responseText.replace(/^```json\n|\n```$/g, "").trim();
            parsedJson = JSON.parse(cleanText);
        }

        return NextResponse.json(parsedJson);

    } catch (error: any) {
        console.error("Generate API Error:", error);
        return NextResponse.json(
            { error: "AIコンテンツの生成中にエラーが発生しました", details: error.message },
            { status: 500 }
        );
    }
}
