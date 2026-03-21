import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { canGenerate, canGenerateBlog } from "@/lib/subscription";
import { getSeasonalContext } from "@/lib/seasonalContext";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { SHORT_HOOK_OPTIONS } from "@/types";

const GENERATE_MODEL = "gemini-2.5-flash";

const WEEKDAY_JA = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"] as const;

const NAGANO_LAT = 36.6486;
const NAGANO_LON = 138.1928;

function formatDateForPrompt(isoDate: string): string {
    const d = new Date(isoDate);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const weekday = WEEKDAY_JA[d.getDay()];
    const hour = d.getHours();
    const ampm = hour < 12 ? "午前" : "午後";
    const h = hour % 12 || 12;
    return `${y}年${m}月${day}日（${weekday}）、${ampm}${h}時頃`;
}

function weatherCodeToJa(code: number): string {
    if (code === 0) return "晴れ";
    if (code >= 1 && code <= 3) return "曇りがち";
    if (code === 45 || code === 48) return "霧";
    if (code >= 51 && code <= 67) return "雨";
    if (code >= 71 && code <= 77) return "雪";
    if (code >= 80 && code <= 82) return "にわか雨";
    if (code >= 85 && code <= 86) return "にわか雪";
    if (code >= 95 && code <= 99) return "雷";
    return "曇り";
}

async function getWeatherForNagano(dateStr: string): Promise<string | null> {
    const today = new Date().toISOString().slice(0, 10);
    const isPast = dateStr < today;
    const base = isPast
        ? "https://archive-api.open-meteo.com/v1/archive"
        : "https://api.open-meteo.com/v1/forecast";
    const url = `${base}?latitude=${NAGANO_LAT}&longitude=${NAGANO_LON}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia/Tokyo&start_date=${dateStr}&end_date=${dateStr}`;
    try {
        const res = await fetch(url, { next: { revalidate: 3600 } } as RequestInit);
        if (!res.ok) return null;
        const data = await res.json();
        const code = data.daily?.weather_code?.[0];
        const max = data.daily?.temperature_2m_max?.[0];
        const min = data.daily?.temperature_2m_min?.[0];
        if (code == null) return null;
        const weather = weatherCodeToJa(Number(code));
        const temp = max != null && min != null ? `、最高${Math.round(max)}℃、最低${Math.round(min)}℃` : "";
        return `${weather}${temp}`;
    } catch {
        return null;
    }
}

const generateSchema = z.object({
    patternTitle: z.string().optional(),
    patternId: z.string().optional(),
    useWeather: z.boolean().optional(),
    additionalContext: z.string().optional(),
    q1: z.string().optional(),
    q2: z.string().optional(),
    q3: z.string().optional(),
    generatedAt: z.string().optional(),
    imageData: z.object({
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
        data: z.string(), // base64
    }).optional(),
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
        ctaText: z.string().optional(),
        ctaType: z.enum(["phone", "reservation", "line", "other"]).optional(),
        ctaValue: z.string().optional(),
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
    }).optional().default({ instagram: true, gbp: true, portal: true, line: false, short: false }),
    todaysFocus: z.string().optional(),
    /** LINE用：季節の挨拶（例：3月も半ば、いかがお過ごしですか？）を含めるか */
    lineIncludeSeasonalGreeting: z.boolean().optional().default(true),
    /** 練習モード時は5回枠チェックをスキップ */
    isPracticeMode: z.boolean().optional().default(false),
    userOriginalEpisode: z.string().optional(),
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const HOOK_TYPES = [
    { id: "kyoukan", label: "共感型", example: "「なんとなく髪が重い…」そんな感覚、ありませんか？" },
    { id: "odoroki", label: "驚き型", example: "実は、毎日のシャンプーが髪を傷めていたかもしれません。" },
    { id: "toikake", label: "問いかけ型", example: "あなたのその髪のお悩み、カットで解決できるかもしれません。" },
    { id: "number", label: "数字・リスト型", example: "美容師が絶対やらないNGケア3選" },
    { id: "ng", label: "NG・やりがち型", example: "やりがちだけど逆効果…髪を傷める朝のルーティン" },
    { id: "shiranai", label: "知らなかった型", example: "99%の人が知らない、カラーが長持ちする洗い方" },
    { id: "pro", label: "プロだけが知る型", example: "プロだけが知る、梅雨前にやっておくべきケア" },
];

const STORY_SUBJECTS = [
    { id: "customer", label: "お客様目線", note: "お客様が主人公のストーリーで語る。「〇〇でお悩みだったお客様が…」という視点。" },
    { id: "stylist", label: "スタイリスト目線", note: "美容師自身が語りかける一人称スタイル。「今日担当させていただいたお客様が…」という温かみ。" },
    { id: "morning", label: "施術後の朝の話", note: "施術翌日の朝のシーンから始める。「施術の翌朝、鏡を見て思わず笑顔になった」という情景描写。" },
    { id: "before", label: "来店前の悩みから", note: "来店前の不安や迷いから始める。「ずっと悩んでいたけど、思い切って来てよかった」という変化の物語。" },
];

const EPISODE_TYPES = [
    { id: "repeat", label: "長年のリピーター", note: "長くお付き合いのあるお客様の変化や信頼感を伝える。" },
    { id: "first", label: "初来店のお客様", note: "初めて来店された方の「思い切って来てよかった」という安心感を伝える。" },
    { id: "longsuffer", label: "長年悩んでいた方", note: "「ずっと諦めていた悩みが解決した」という驚きと感動を伝える。" },
    { id: "season", label: "季節の変わり目に来た方", note: "「この時期だから気になって来た」という季節感のある入り口から始める。" },
];

const TONES = [
    { id: "warm", label: "温かみ重視", note: "ゆったりとした語り口で、読んでいてほっとするような温度感。絵文字は控えめに。" },
    { id: "tempo", label: "テンポ重視", note: "改行を多めに、リズムよく読めるテンポ感。短い文を積み重ねる。" },
    { id: "logic", label: "納得感・論理重視", note: "「なぜそうなるのか」の理由をしっかり伝え、読んだ人が「なるほど」と感じる構成。" },
    { id: "story", label: "ストーリー重視", note: "起承転結のある小さなドラマとして語る。読み終わった後に余韻が残る文体。" },
];

const SEASONAL_ANGLES = [
    { id: "climate", label: "気候から入る", note: "天気・気温・湿度など体感できる季節の変化から自然に髪の話につなげる。" },
    { id: "event", label: "行事・イベントから入る", note: "卒業・入学・GW・年末など、生活の節目となる行事を入り口にする。" },
    { id: "lifestyle", label: "ライフスタイルから入る", note: "「最近〇〇することが増えた」など、季節ごとの生活習慣の変化から入る。" },
    { id: "worry", label: "季節特有の悩みから入る", note: "梅雨のうねり・冬の乾燥・春の花粉など、その時期ならではの髪の悩みから直球で入る。" },
];

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function selectVariation(patternId?: string) {
    const hookType = patternId === "B"
        ? pickRandom([HOOK_TYPES[3], HOOK_TYPES[4], HOOK_TYPES[5]])
        : pickRandom(HOOK_TYPES);
    return {
        hookType,
        storySubject: pickRandom(STORY_SUBJECTS),
        episodeType: pickRandom(EPISODE_TYPES),
        tone: pickRandom(TONES),
        seasonalAngle: pickRandom(SEASONAL_ANGLES),
    };
}

function buildVariationInstruction(v: ReturnType<typeof selectVariation>): string {
    return `
---
# 今回の「切り口・バリエーション指定」
今回の投稿は、以下の切り口・視点・トーンで書いてください。
同じメニューや目的でも、この指定が変わることで毎回違う文章が生まれます。

【フックの型】${v.hookType.label}
→ 参考例：${v.hookType.example}
　 上記を参考に、今回のテーマ・お客様の悩みに合った具体的なフック文を1つ作ること。

【ストーリーの主語・視点】${v.storySubject.label}
→ ${v.storySubject.note}

【エピソードの種類】${v.episodeType.label}
→ ${v.episodeType.note}

【文章のトーン】${v.tone.label}
→ ${v.tone.note}

【季節・時期の切り口】${v.seasonalAngle.label}
→ ${v.seasonalAngle.note}

※ フック→ボディ→CTAの基本構造と絶対ルールは引き続き守ること。
---
`;
}

export async function POST(req: Request) {
    // 認証チェック: ログインしていないユーザーは 401 を返す
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    let parsed: ReturnType<typeof generateSchema.safeParse> = null as any;
    try {
        const body = await req.json();
        parsed = generateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "入力内容に誤りがあります。", details: parsed.error.format() }, { status: 400 });
        }
    } catch {
        return NextResponse.json({ error: "リクエストの解析に失敗しました。" }, { status: 400 });
    }

    const isPracticeMode = parsed.data?.isPracticeMode === true;
    const patternId = parsed.data?.patternId ?? "A";

    // 練習モード時はパターンAのみ許可
    if (isPracticeMode && patternId !== "A") {
        return NextResponse.json(
            { error: "練習モードではパターンA（ビフォーアフター）のみ利用できます。" },
            { status: 400 }
        );
    }

    // プラン別生成回数制限（月次＋1日5回）※練習モード時はスキップ
    if (!isPracticeMode) {
        const generateCheck = await canGenerate(user!.id);
        if (!generateCheck.allowed) {
            const isDailyLimit = generateCheck.dailyRemaining <= 0;
            const message = isDailyLimit
                ? "本日の生成上限（5回）に達しました。明日またお試しください。"
                : "今月の生成回数上限に達しました。プロプランにアップグレードすると月間無制限（1日5回まで）で利用できます。";
            return NextResponse.json(
                {
                    error: "LIMIT_EXCEEDED",
                    message,
                    used: generateCheck.used,
                    limit: generateCheck.limit,
                    dailyUsed: generateCheck.dailyUsed,
                    dailyLimit: generateCheck.dailyLimit,
                },
                { status: 403 }
            );
        }
    }

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
        const { patternTitle, patternId, useWeather: useWeatherParam, additionalContext, q1, q2, q3, shopInfo, news, outputTargets, imageData, generatedAt, todaysFocus, lineIncludeSeasonalGreeting, userOriginalEpisode } = parsed.data;

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
        const useWeather = useWeatherParam ?? false;

        const nowIso = generatedAt || new Date().toISOString();
        const dateContextJa = formatDateForPrompt(nowIso);
        const dateStr = nowIso.slice(0, 10);
        const weatherText = await getWeatherForNagano(dateStr);
        const [y, m, d] = dateStr.split("-").map(Number);
        const dateJaShort = `${y}年${m}月${d}日`;
        const weatherInstruction = useWeather
            ? `
【天気・季節感の使い方】
今日の天気・気候を投稿の冒頭か2行目にさりげなく1行だけ入れること。
${weatherText ? `【長野市の天気】${dateJaShort}は${weatherText}。この情報を参考にすること。` : ""}
- 天気は「今日の雰囲気」を出すための添え物
- 投稿の主役は施術・スタッフ・サロンの情報
- 長くなりすぎない（1〜2文以内）
- 天気から髪・頭皮・来店への自然な流れを作る
  例：「今日は少し肌寒い一日ですね❄️
      こんな日は頭皮の乾燥が気になる季節です」
`
            : `
【天気について】
このパターンでは天気・気候の話題は入れないこと。
投稿の本題（施術・情報・お客様の声）を冒頭から直接始めること。
`;

        const shopName = shopInfo?.name || "お店";
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
        // CTA文言を組み立て（ctaType+ctaValue を優先、行動促進表現で集客を促す）
        const ctaType = shopInfo?.ctaType;
        const ctaValue = (shopInfo?.ctaValue ?? "").trim();
        const legacyCtaText = (shopInfo?.ctaText ?? "").trim();
        let shopCtaText = "";
        if (ctaType === "phone") {
            const phone = ctaValue || shopPhone;
            shopCtaText = phone ? `お気軽にお電話ください：${phone}（今週末の空きもご確認いただけます）` : "";
        } else if (ctaType === "reservation" && ctaValue) {
            shopCtaText = `1分で予約できます！こちらから：${ctaValue}`;
        } else if (ctaType === "line") {
            const url = ctaValue || shopLineUrl;
            shopCtaText = url ? `下のリンクから1分で予約できます↓ ${url}` : "";
        } else if (ctaType === "other" && ctaValue) {
            shopCtaText = ctaValue;
        } else if (ctaValue && (/^https?:\/\//i.test(ctaValue) || ctaValue.includes("line.me"))) {
            shopCtaText = `下のリンクから1分で予約できます↓ ${ctaValue}`;
        } else if (ctaValue) {
            shopCtaText = ctaValue;
        }
        if (!shopCtaText && legacyCtaText) shopCtaText = legacyCtaText;
        if (!shopCtaText && shopLineUrl) {
            shopCtaText = `下のリンクから1分で予約できます↓ ${shopLineUrl}`;
        }

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

        // 住所から市区町村を抽出（ハッシュタグ・地域表記用）
        const shopCity = shopAddress
            .replace(/^(東京都|北海道|(?:京都|大阪)府|.{2,3}県)/, "")
            .trim()
            .replace(/^(.+?[市区町村]).*$/, "$1")
            .trim() || "";

        let jsonFormatGuide = "";
        const properties: any = {};
        const required: string[] = [];

        const lineGuideFallback = shopLineUrl ? `下のリンクから1分で予約できます↓ ${shopLineUrl}` : "プロフィールのリンクを1タップでご予約できます";

        if (outputTargets.instagram) {
            const instagramCta = shopCtaText || `LINEでお気軽にご予約・ご相談ください。${lineGuideFallback}`;
            const hashtagNote = shopCity
                ? `**【必須】ハッシュタグは地域名＋悩み＋店舗名の3層構造で10〜15個。①地域層：#${shopCity.replace(/\s/g, "")} #${shopCity.replace(/\s/g, "")}美容院 等 ②悩み層：今回のテーマに合わせて（#くせ毛 #白髪 #頭皮ケア #肩こり #眼精疲労 等）③店舗層：#${shopName.replace(/\s/g, "")}。汎用タグ（#髪質改善 #美容院 等）も可。**`
                : `**【必須】ハッシュタグは悩み＋店舗名の2層以上で10〜15個。悩み層（#くせ毛 #白髪 #頭皮ケア 等、テーマに合わせて）＋店舗層（#${shopName.replace(/\s/g, "")}）＋汎用（#髪質改善 #美容院 等）。**`;
            jsonFormatGuide += `\n  "instagram": "【目的: 共感とファン化】【構成: 悩みの共感→解決策→なぜ今→CTA】①冒頭：読者の悩みに共感するフック②本文：当店のアプローチ・解決策を具体的に③「この時期だからこそ」などなぜ今来店すべきか1文④最後にCTA。**導線は「下のリンクから1分で予約」「プロフィールのリンクを1タップで」などクリックしやすい表現に統一。**絵文字を適度に使い、SNSらしい改行テンポで。**短く簡潔に（150〜220字程度）**。**【必須】CTAの直前に「なぜ今」の1文を入れ、最後に次のCTAを：『${instagramCta}』**${hashtagNote}"`;
            properties.instagram = { type: SchemaType.STRING };
            required.push("instagram");
        }
        if (outputTargets.gbp) {
            if (jsonFormatGuide) jsonFormatGuide += ",";
            const gbpCta = shopCtaText || (shopLineUrl ? `下のリンクから1分で予約できます：${shopLineUrl}` : "プロフィールのリンクを1タップでご予約ください");
            jsonFormatGuide += `\n  "gbp": "【目的: Googleマップから来店を促す】【構成: 悩みの共感→解決策→なぜ今→締め】①冒頭：お客様のお悩みへの共感1〜2文②本文：${shopName}だからこそできる解決策・強みを具体的に1〜2段落③**【必須】なぜ今来店すべきか**：締めの直前に「この時期の〇〇対策、今がおすすめです」など1文④**【必須】締め**：最後に必ず「${shopCity}近隣で〜をお考えの方は、ぜひ${shopName}へお気軽にご相談ください。${gbpCta}」と、この締め文をそのまま含めて終わること。【禁止事項】・教育コンテンツ・NGケア紹介・リスト形式（〇選、〇つのポイントなど）は使わない・締め文以外に地域名・住所は入れない・タイトルや見出しは入れない・冒頭に「○○で美容室をお探しの方へ」のような呼びかけ文を入れない。冒頭は必ずお客様のお悩みへの共感から始めること。・価格・割引・限定キャンペーン・特典などの情報は、入力された情報にない場合は絶対に作らない。・**文章は200〜280字程度に短く収める**。どのパターン・テーマが選ばれていても、必ずこの来店訴求の構成で書くこと。"`;
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
            const portalCtaLabel = shopCtaText || "下のボタンから1分で予約・ご相談";
            const portalCtaHref = (ctaType === "reservation" && ctaValue) ? ctaValue : (shopLineUrl || ctaValue || "#");

            jsonFormatGuide += `\n  "portalTitle": "【目的: 検索でクリックされやすい＆ブログ用のタイトル】文字数は30〜40文字程度で、先頭に【〇〇市】などを入れず、自然かつ魅力的な文言。例：『繰り返すひどい眼精疲労…首の深層筋をほぐして視界クリアに！』 / なければ空文字",`;
            jsonFormatGuide += `\n  "portal": "<div class=\\"seo-content\\"><h3>フックとなる見出し</h3><p>【導入＝悩みの共感】季節・天気の一言からはじめ、必ず『その時期ならではのお客様の悩み』に自然につなげる導入段落にすること。天気の話だけで終わらせず、1つの段落の中で「気候」→「髪や体の状態」→「よくある悩み」へとなめらかにつなぐ。</p><h4>${shopName}の独自のアプローチ</h4><p>【本文＝解決策】上記の悩みに対して、${shopName}だからこそできる具体的なアプローチ・メニュー・施術の流れと、その結果どんな変化が得られたかを1つのストーリーとして説明する。</p><h4>お客様の声</h4><ul><li>【お客様の声①】「誰の・どんな悩みだったか」を明確にし、その上で「どの施術・メニューを受けて」「どう変わった・どう感じたか」を1文で伝える。例：「白髪染めで頭皮がヒリヒリしていた〇〇さんが、ゼロタッチカラーを受けて『初めて染めたあとが楽でした』とおっしゃっていました」</li><li>【お客様の声②】同様に、誰のどんな悩み→どの施術→どう変わった、の流れで短く補足してから引用する。</li></ul><p>【なぜ今来店すべきか】この時期だからこそ、〇〇対策がおすすめです、など1文。</p><div class=\\"shop-info\\"><p>📍${shopAddress}</p><p>${phoneHtml}</p><p>🕒${shopBusinessHours}</p><p>🎌${shopHolidays}</p><div style=\\"text-align:center;\\"><a href=\\"${portalCtaHref}\\" style=\\"${lineButtonStyle}\\">${portalCtaLabel}</a></div></div></div> のような、HTMLタグで構造化・装飾された長文のコラム風テキスト。必ず「悩みの共感→解決策→お客様の声（誰のどんな悩み→どう変わった）→なぜ今→CTA」の流れで、末尾には必ず誘導（CTA）を含めること。"`;
            properties.portalTitle = { type: SchemaType.STRING };
            properties.portal = { type: SchemaType.STRING };
            required.push("portalTitle", "portal");
        }
        if (outputTargets.line) {
            if (jsonFormatGuide) jsonFormatGuide += ",";
            const lineCta = shopCtaText || (shopLineUrl ? `下のリンクから1分で予約できます↓\n${shopLineUrl}` : "プロフィールのリンクを1タップでご予約ください");
            const lineGreetingNote = lineIncludeSeasonalGreeting
                ? "冒頭に季節の挨拶や今日のひとこと（例：3月も半ば、いかがお過ごしですか？）を入れ、"
                : "**【重要】冒頭に季節の挨拶（例：3月も半ば、いかがお過ごしですか？）は入れない。本題から直接はじめる。**";
            jsonFormatGuide += `\n  "line": "【目的: LINE公式アカウントからの配信メッセージ】【構成: 悩みの共感→解決策→なぜ今→CTA】①冒頭：悩みへの共感または挨拶②本文：今日の施術エピソード・解決策を簡潔に③「この時期だからこそ」「今がおすすめ」など、なぜ今来店すべきか1文④CTAで締める。**【必須】1文ごとに改行。1行に1文だけ。**${lineGreetingNote}**【必須】CTAの直前に「なぜ今」の1文を入れ、最後に次のCTAを行動促進表現で：『${lineCta}』**（ハッシュタグ不要、**文字数80〜120字程度で短く簡潔に**）"`;

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
- 最後の cta は、${shopCtaText ? `「なぜ今」の一言＋設定されたCTA「${shopCtaText}」の趣旨を20字前後で簡潔に。` : `「なぜ今」の一言＋「下のリンクから1分で予約」「プロフィールのリンクを1タップで」などクリックしやすい導線を20字前後で。`}
${shortPlatform ? `- 主な投稿先は「${shortPlatform}」を想定し、そのプラットフォームに合ったテンポとフックにしてください。` : ""}
${shortSampleScript ? `- 以下の【ショート用サンプル台本】の話し方・テンポ・言い回しを参考にし、同じトーンで書いてください。\n\n【ショート用サンプル台本】\n${shortSampleScript}` : ""}
${shortMemo ? `- 店舗からの希望・メモ：${shortMemo}` : ""}
`
            : "";

        const variation = selectVariation(patternId);
        const variationInstruction = buildVariationInstruction(variation);

        const toneInstruction = shopSampleTexts
            ? `- 以下の【あなたが過去に書いた文章サンプル】の「文のテンポ、絵文字の有無・頻度、改行のクセ、語尾のニュアンス、親しみやすさ」などを徹底的に分析して真似してください。\n\n【あなたが過去に書いた文章サンプル】\n${shopSampleTexts}`
            : `- 落ち着いた丁寧な「です・ます調」で、お客様に優しく語りかけるような、人間味のある自然な文章にしてください。
- 専門用語を並べるのではなく、日常の情景が浮かぶ言葉で悩みの原因やアプローチを誠実に伝えてください。
- （理想的な文章のトーン例）
「午前中からずっとスマホやパソコンと向き合っている方、いらっしゃいませんか？『なんか肩まで重だるい…』と感じているなら、それは目の疲れが影響しているかもしれません。目の奥の疲労は放っておくと頭痛や肩こりにつながりやすく、気づかないうちに頭から首までガチガチになっている方も少なくないんです。頭をじっくりほぐして目の奥の疲れを解放すると、肩の重さもすっと楽になりますよ。『視界がクリアになった』と感じてもらえると思います。頭と目の疲れ、今日のうちにリセットしてみませんか。」
- 読んだ方が「まさに自分のことだ」「この人に任せれば安心できそう」と感じるような、押し付けがましくない共感性を重視してください。`;

        const userEpisodeInstruction = userOriginalEpisode?.trim() ? `
---
【最優先事項：ユーザーのオリジナルエピソード・想い】
「${userOriginalEpisode}」

※AIへの絶対命令※
上記のテキストは、ユーザーが直接書き込んだ「独自の想い・エピソード」です。
選択肢のプロの知識やテンプレ情報の論理よりも、このテキストのニュアンス・感情・内容を
今回の投稿の【最大のメインテーマ】として絶対的に優先して執筆してください。
他のどのサロンにも書けない、このユーザーだけの血の通ったオリジナル文章（一次情報）に仕上げること。
---` : "";

        const systemPrompt = `# あなたの役割
あなたは美容業界専門のSNSマーケティングコンサルタントです。
${shopAddress}の${shopIndustry}「${shopName}」を担当し、特に20〜30代女性をターゲットにした「集客につながる美容院投稿」を作成します。

店舗の基本情報：【営業時間: ${shopBusinessHours}】【定休日: ${shopHolidays}】

【制作日時・コンテキスト】
今回の投稿は「${dateContextJa}」を想定して執筆してください。
「今日」「今週」「この時期」などの表現は、この日付・曜日・季節に合わせて自然に使ってください。${weatherInstruction}

【店舗の独自情報・強み・想い（学習データ）】
以下の店舗の独自性やこだわり、参考WEBサイトの情報を、わざとらしくならないよう自然に文章のエッセンスとして組み込んでください。（※情報がない場合は無視してよい）

${shopFeatures || "特になし"}

${shopScrapedContent ? `【WEBサイトから抽出した参考情報】\n${shopScrapedContent}` : ""}

同時に、どの投稿でも「髪質改善」「トレンドカラー」「丁寧なカウンセリング」を、このサロンの強みとして不自然にならない範囲で自然に織り込んでください。

${toneInstruction}
${variationInstruction}
${shortInstruction}
${userEpisodeInstruction}

---
【重要】締め文（CTA）の絶対ルール
各媒体のテキストの**文末**に、必ず以下の締め文（CTA）を**そのまま**含めてください。言い換え・省略・要約は禁止です。投稿の最後の1〜2文で、この文言を必ず記載すること。

CTA文：「${shopCtaText || (shopLineUrl ? "下のリンクから1分で予約できます" : "プロフィールのリンクを1タップでご予約ください")}」

---
# 必須の出力構造（全媒体共通）【悩み→解決→行動】の3段構成を厳守
すべての媒体で、以下の3部構成を**必ず**守ってください。この順序を崩さないこと。
**全体として簡潔に。冗長な表現・繰り返しを避け、要点を絞って書くこと。**

1. フック（悩みの共感）
   - 冒頭1〜2文で、読者の「あるある」やお悩みに共感する一文から始める。
   - 「〇〇で悩んでいませんか？」「〇〇、ありますよね」など、読者が「自分のことだ」と感じる表現でスクロールを止める。
   - 教育・NG紹介・リスト形式も可だが、まずは悩みの共感で引き込むこと。
2. ボディ（解決策）
   - 「この悩みに対して、当店では〇〇というアプローチで」という流れを守る。
   - 解決策のパートでは、必ずサロンの強み（髪質改善 / トレンドカラー / 丁寧なカウンセリング）に自然につなげる。
   - 読者が「ここに相談したい」と感じるような、具体的なシーン・施術の流れ・変化を入れる。
3. なぜ今来店すべきか（1文）※CTAの直前に必須
   - 締めの直前、CTAの直前に「この時期だからこそ」「〇〇の季節、今がおすすめ」など、**季節・時期に基づく「今来店すべき理由」を1文**入れる。
   - 例：「春の乾燥対策、今がおすすめです」「この時期のケア、早めがお得です」など。※予約の空き状況は入力にない限り作らないこと。
4. CTA（次のアクション・文末に必須）
   - 上記【重要】のCTA文を、各媒体の出力の**文末にそのまま**含めること。省略しないこと。
   - それに加え「保存」「フォロー」なども自然に促してよい。

保存したくなる「リスト形式」や「数字（3選・5つのポイントなど）」を積極的に活用してください。

---
# 媒体別の出力指示
以下の媒体別ルールを守りつつ、上記の「フック / ボディ / CTA」の構造を必ず維持してください。

■ Instagram（generate結果のうち Instagram 用）
- **短く簡潔に（150〜220字程度）**。冗長な表現を避ける。
- 改行多めで読みやすく。
- 絵文字を適度に使用し、20〜30代女性が親しみを持てるトーンにする。
- **構成**：悩みの共感（フック）→ 解決策（ボディ）→ なぜ今来店すべきか1文 → CTA。
- **導線表現**：「下のリンクから1分で予約」「プロフィールのリンクを1タップで」など、クリックしやすい表現に統一。「プロフィールのリンクから」だけの曖昧な表現は避ける。
- **ハッシュタグ**：地域名（#〇〇市 #〇〇市美容院）＋悩み（#肩こり #眼精疲労 #くせ毛 等、テーマに合わせて）＋店舗名（#${shopName}）の3層構造で10〜15個。

■ GoogleMap投稿（Googleビジネスプロフィール / GBP 用）
- **200〜280字程度に短く収める**。
- 信頼感・専門性を重視した文体にする。
- **構成**：悩みの共感 → 解決策 → なぜ今来店すべきか1文 → 締め（地域名＋CTA）。
- 専門用語は、難しすぎない範囲で適度に使う（例：髪質改善トリートメント、ゼロタッチカラーなど）。
- 地域名（市区町村レベル）を必ず含め、「どのエリアのどんなお店か」が一文で伝わるようにする。

■ LINE（LINE公式アカウントの配信メッセージ用）
- **1文ごとに改行を入れること。1行に1文だけ。**改行を多めにして、スマホで読みやすいよう余白を意識する。
- 友達に話すような、あたたかいトーン。
- **構成**：悩みの共感または挨拶 → 解決策・エピソード → なぜ今来店すべきか1文 → CTA。
- **80〜120字程度で短く簡潔に**。1通あたり長すぎないボリュームにまとめる。

■ ショート動画（shortScript 用）
- 0秒・2秒・4秒・6秒・8秒・10秒…というように、2秒ごとの字幕テキストとして読める構成にする。
- 冒頭の数秒で、フックとして「悩みの共感」や「気になる一言」を出し、視聴者の注意を引く。
- ボディ部分では「あるあるな悩み → 原因 → 解決策（サロンの強み）」を2秒ごとのテロップで展開する。
- 最後の数秒で、「なぜ今」の一言 → 「保存・フォロー・予約」を自然な言い方で促す。

---
# 絶対に守るルール
- 「髪質改善」「トレンドカラー」「丁寧なカウンセリング」を、この美容院の強みとして不自然にならない形で必ずどこかに入れる。
- 押しつけがましい売り込みにはしない。読者が「責められている」「急かされている」と感じないようにする。
- 「まさに自分のことだ」と感じてもらえるよう、主語を「あなた」「こんな方へ」など読者に寄せる表現を使う。
- 保存したくなる「〜3選」「〜5つ」「やりがちなNG〇つ」のような数字・リスト形式を積極的に活用する。

【⭕️ お客様の声・施術例を入れる場合のルール】
ビフォーアフター、お客様の声、施術例を書くときは、必ず「誰の・どんな悩みだったか」→「どの施術・メニューを受けたか」→「どう変わった・どう感じたか」の流れを明確にすること。抽象的な「良かったです」だけで終わらせず、前後の状況が分かるように短く補足してから引用する。

【❌ 事実の捏造・ハルシネーション禁止】
以下の情報は、入力・設定として明示的に提供されていない限り、絶対に作らないこと。

- 価格・料金（例：「カット5,500円」「トリートメント3,300円〜」）
- 割引・キャンペーン・特典（例：「初回20%OFF」「今月限定」「特別価格」）
- 期間限定・数量限定の表現（例：「今週末まで」「残り3席」「先着10名」）
- 営業時間・定休日（例：「毎週火曜定休」「10時〜20時営業」）
  ※ただし shopBusinessHours・shopHolidays として設定済みの情報はそのまま使ってよい
- スタッフの名前・人数・役職（例：「田中スタイリストが担当」「3名体制」）
- 受賞歴・資格・認定（例：「○○コンテスト受賞」「認定サロン」）
- 予約の空き状況（例：「今週末まだ空きあります」「満席に近い」）
- お客様の具体的な発言・声（例：「『一生通います』と言ってくれた」）
  ※ただし入力フォームで明示的に入力されたお客様の声はそのまま使ってよい
- **イベント・行事・時期限定の表現**（例：「イベント直前！」「卒業式・入学式シーズン」「もうすぐGW」「〇〇の季節がやってきました」）
  ※ユーザーが「今日の旬な投稿」で「もうすぐ行事・イベント」を選んだ場合、または入力フォームで明示的にイベント・行事を指定した場合のみ使用すること。指定がない限り、これらの表現は絶対に使わないこと。

上記に該当する情報を使いたい場合は、入力された情報の範囲内で表現すること。
情報がない場合は、その要素を省いて文章を構成すること。

【❌さらに禁止するNG表現（わざとらしいAI口調・過度なテンション）】
- 「〜マジで多いんです」「〜サービスしちゃいます」「今日がチャンスです💪」のような過度にくだけた、不自然にテンションが高い表現は禁止。
- 「ビフォーアフターで劇的な改善を実感！」「お客様の痛みや疲れに徹底的に寄り添い〜」「〜をご提供しています」といった定型的な広告文句や硬すぎる敬語。
- 文章の各文を「」でくくるような不自然なフォーマット。

---
# 出力形式
これから${targetString}用の${targetCount}種類のテキストを生成します。
出力は、Markdownの装飾やバッククォートを一切含まない「純粋なJSON文字列のみ」とし、次のスキーマに厳密に従ってください。

{${jsonFormatGuide}
}`;

        let userPrompt: string;
        if (imageData) {
            userPrompt = `以下の【アップロードされた画像】をプロの視点で深く分析し、${shopAddress}の${shopIndustry}「${shopName}」のオーナーとして、お客様の心を動かす最高のSNS投稿文を作成してください。

${q1 ? `\n【最優先事項：ユーザーからの指定内容】\n「${q1}」\n※この内容は今回の投稿の「メインテーマ」です。画像から読み取れる情報よりも、このテキストの内容を最優先して執筆してください。\n` : ""}

【画像分析と執筆のステップ（思考プロセス）】
1. **視覚情報の抽出**: 写っているもの（施術の仕上がり、メニューの盛り付け、店内の光の入り方、スタッフの表情など）を詳細に言語化してください。
2. **価値の言語化**: 単なる説明ではなく、「このツヤは当店のプレミアム髪質改善の結果である」「この盛り付けは旬の食材を一番美味しく見せるためのこだわりである」といった、プロならではの価値に変換してください。
3. **ターゲットへの共感**: その価値を必要としている20〜30代女性が、普段どんな悩み（パサつき、疲れ、退屈など）を抱えているかを想像してください。

【投稿の構成ルール（厳守）】
1. **フック（悩みの共感）**: 
   - 冒頭は必ず「ターゲットの悩みや理想への寄り添い」から始めてください。
   - 例：「鏡を見るたび、髪の広がりが気になっていませんか？」「毎日頑張る自分に、ちょっとしたご褒美を。」
2. **ボディ（画像×解決策）**: 
   - 画像で見えている「証拠」を使いながら、当店がどのようにその悩みを解決したか、あるいは理想を叶えたかを伝えてください。
   - サロンの強み（髪質改善・トレンドカラー・丁寧なカウンセリング等）を、画像の内容と絡めて自然に語ってください。
3. **今来店すべき理由**: 
   - 季節感や時期（${dateJaShort}頃の気候）を織り交ぜ、「なぜ今、この画像のような体験が必要なのか」を1文で提示してください。
4. **CTA**: 
   - 指定の文末CTA（${shopCtaText || "プロフィールのリンクを1タップでご予約ください"}）で締めくくってください。

【トーン＆マナー】
- AIっぽさを排除し、オーナーが一枚一枚の写真を大切に紹介しているような、温度感のある言葉選びをしてください。
- 専門用語は、お客様が「凄そう！」「受けてみたい！」と思える程度に適度に使用してください。
`;
        } else if (patternId === "A" && additionalContext) {
            const ctx = JSON.parse(additionalContext) as {
                treatment: string;
                concern: string;
                approach: string;
                result: string;
                reaction?: string;
                beforeAfter?: string;
            };
            userPrompt = `
以下の情報を元に、読んだ人が「私も予約したい」と
感じるビフォーアフター投稿を作成してください。

【施術情報】
- 施術名：${ctx.treatment}
- お客様のお悩み：${ctx.concern}
- 技術・アプローチ：${ctx.approach}
- 施術後の変化：${ctx.result}

${ctx.reaction
                ? `【お客様の反応・喜びの声】\n${ctx.reaction}\n`
                : ""}
${ctx.beforeAfter
                ? `【ビフォーアフターの具体的な変化】\n${ctx.beforeAfter}\n`
                : ""}

【投稿の必須ルール】
1. フックはお客様のお悩みへの共感から始める
   NG例：「髪質改善のご紹介です」
   OK例：「毎朝広がる髪に悩んでいたお客様のご紹介です✨」

2. お客様の反応が入力されている場合は
   必ずセリフ形式（「 」）で投稿に入れる

3. CTAには施術名を具体的に入れて予約へ誘導する
   例：「髪質改善トリートメントのご予約は
       プロフィールのリンクを1タップでどうぞ✨」

4. Instagramハッシュタグは地域名＋悩み＋店舗名の3層構造で15個生成する
   - 地域層：市区町村名（#長野市 #〇〇市美容院 等）
   - 悩み層：施術・お悩みに紐づくタグ（#くせ毛 #白髪 #髪質改善 等）
   - 店舗層：#${shopName}＋季節タグ
`;
        } else if (patternId === "B") {
            const ctxB = additionalContext ? (() => { try { return JSON.parse(additionalContext) as { memo?: string; reason?: string }; } catch { return {}; } })() : {};
            userPrompt = `
以下の情報を元に、美容師のプロ知識を活かした
「保存したくなる・シェアしたくなる」教育系投稿を
作成してください。

【テーマ・切り口】
${q1 || "記載なし"}

【今日このテーマを投稿する理由】
${ctxB.reason || "記載なし"}
（この理由をフックの入り口に自然に反映させること）

【リスト内容】
${q2 || "記載なし"}

【サロンの解決策・締め】
${q3 || "記載なし"}

【投稿の必須ルール】

1. フックは以下のいずれかのパターンで書く
   ・「○選」型：「現役美容師が絶対やらないNGケア3選」
   ・「疑問」型：「なぜあなたの髪はすぐパサつくのか」
   ・「知らなかった」型：「99%の人が知らないシャンプーの真実」
   → 読んだ人がスクロールを止めて読みたくなる一文にする

2. ボディは各リスト項目を以下の3点セットで構成する
   ・NG行動またはお悩み
   ・なぜダメなのか（理由を一言で）
   ・正しいケア・サロンでの解決策

3. 各項目の説明は2〜3行以内に収める
   （長すぎると読まれなくなるため）

4. 締めは以下の流れで自然にサロンへ誘導する
   「同じお悩みがある方は、まずプロに相談してみてください」
   →「プロフィールのリンクを1タップでカウンセリングのご予約をどうぞ」

5. 最後に必ず以下を入れる
   「💾 保存して後で見返してください」

6. Instagramハッシュタグは地域名＋悩み＋店舗名の3層構造で15個生成する
   地域層：市区町村名（#長野市 #〇〇市美容院 等）
   悩み層：テーマに紐づくタグ（#ヘアケア方法 #くせ毛ケア #髪のお悩み 等）
   店舗層：#${shopName}＋季節タグ
${
                ctxB.memo?.trim()
                    ? `\n【スタッフからの補足メモ】\n${ctxB.memo}\n（このメモを投稿に自然に活かすこと）`
                    : ""
            }
`;
        } else if (patternId === "C" && additionalContext) {
            try {
                const ctx = JSON.parse(additionalContext) as { noticeType?: string; noticeDetail?: string; urgency?: string; urgencyPhrase?: string; period?: string; memo?: string };
                userPrompt = `
以下の情報を元に「今すぐ予約したい」と
感じる緊急性の高いお知らせ投稿を作成してください。

【お知らせの種類】
${ctx.noticeType ?? "記載なし"}

【緊急度・期限】
${ctx.urgency ?? "記載なし"}

【緊急性を伝えるフレーズ】
${ctx.urgencyPhrase ?? "記載なし"}

${ctx.period?.trim() ? `【いつから・いつまで】\n${ctx.period}\n` : ""}

【詳細メモ】
${ctx.memo?.trim() || "（特になし）"}

【投稿の必須ルール】
1. フックに緊急性を示す言葉を入れる
   例：「【本日限定】」「【残り僅か】」「【今週末まで】」

2. お知らせ内容を箇条書き3行以内でまとめる
   ✅ 対象：〇〇の方
   ✅ 内容：〇〇
   ✅ 期限：〇〇まで

3. 「なぜ今すぐ行動すべきか」を1行添える

4. CTAは予約方法を具体的に書く（「下のリンクから1分で予約」「プロフィールのリンクを1タップで」などクリックしやすい表現）
   例：「LINEで『〇〇希望』と送るだけでOKです✉️」

5. ハッシュタグは地域名＋悩み＋店舗名の3層構造で15個生成する
`;
            } catch {
                userPrompt = `以下の情報を元に、緊急性の高いお知らせ投稿を作成してください。\n【お知らせ】\n${q1 || "記載なし"}\n\n【期限・対象】\n${q2 || "記載なし"}\n\n【詳細】\n${q3 || "記載なし"}\nフックに限定性を入れ、箇条書きでまとめ、CTAを具体的に書くこと。`;
            }
        } else if (patternId === "D" && additionalContext) {
            try {
                const ctx = JSON.parse(additionalContext) as { treatment?: string; concern?: string; result?: string; voice?: string };
                userPrompt = `
以下の情報を元に「私も行きたい」と感じる
お客様の声の投稿を作成してください。

【施術名】
${ctx.treatment ?? "記載なし"}

【施術前のお悩み】
${ctx.concern ?? "記載なし"}

【施術後の変化】
${ctx.result ?? "記載なし"}

【お客様の実際の声】
${ctx.voice?.trim() || "（具体的な声の記載なし→想定されるリアクションを自然に描写すること）"}

【投稿の必須ルール】
1. フックはお客様のお悩みへの共感から始める
   NG：「お客様の声をご紹介します」
   OK：「〇〇でお悩みだったお客様のご紹介です」

2. お客様の声がある場合は
   必ずセリフ形式（「 」）で入れる

3. ビフォー（悩み）→施術→アフター（変化）の
   3ステップで構成する

4. 同じ悩みを持つ人への呼びかけを自然に入れる

5. CTAはカウンセリングへのハードルを下げる表現
   例：「まずはLINEでお気軽にご相談ください😊」

6. ハッシュタグは3層構造で15個生成する
`;
            } catch {
                userPrompt = `以下の情報を元に、お客様の声の投稿を作成してください。\n【施術・お悩み】\n${q1 || "記載なし"}\n\n【施術内容】\n${q2 || "記載なし"}\n\n【変化】\n${q3 || "記載なし"}\n共感フック、セリフ形式、ビフォー→施術→アフターの3ステップで書くこと。`;
            }
        } else if (patternId === "C") {
            userPrompt = `
以下の情報を元に、読んだ人が「今すぐ予約したい」と感じる緊急性の高いお知らせ投稿を作成してください。
【お知らせ・キャンペーン内容】${q1 || "記載なし"}
【対象のお客様・条件】${q2 || "特になし"}
【予約・問い合わせ方法】${q3 || "記載なし"}
フックに限定性を入れ、箇条書きでまとめ、CTAを具体的に書くこと。ハッシュタグは3層で15個。
`;
        } else if (patternId === "D") {
            userPrompt = `
以下の情報を元に、読んだ人が「私も行きたい」と
感じるお客様の声の投稿を作成してください。

【お客様からいただいた言葉・反応】
${q1 || "記載なし"}

【お客様のお悩み・施術内容】
${q2 || "記載なし"}

【同じ悩みを持つ人へのメッセージ】
${q3 || "同じお悩みの方もお気軽にご相談ください"}

【投稿の必須ルール】

1. フックはお客様のお悩みへの共感から始める
   NG：「お客様の声をご紹介します」
   OK：「毎朝スタイリングに30分かかっていた
       というお客様がいらっしゃいました」

2. お客様の言葉は必ずセリフ形式（「 」）で
   そのままの温度感で入れる
   加工・要約しすぎない

3. ビフォー（悩み）→ 施術 → アフター（変化）の
   3ステップで構成する

4. 「同じ悩みを持つ人への呼びかけ」を
   自然に入れる
   例：「同じようなお悩みをお持ちの方、
       ぜひ一度ご相談ください」

5. CTAはカウンセリング・相談への
   ハードルを下げる表現にする
   例：「まずはLINEでお気軽にご相談ください😊」
       「カウンセリングだけでもOKです」

6. Instagramハッシュタグは3層構造で15個生成する
   ビッグワード  3個（#美容院 #髪質改善 #ヘアケア等）
   ミドルワード  7個（施術名・お悩みに紐づくタグ）
   スモールワード 5個（地域名＋サロン名＋季節タグ）
`;
        } else if (patternId === "E" && additionalContext) {
            try {
                const ctx = JSON.parse(additionalContext) as { hook?: string; message?: string; target?: string; memo?: string };
                userPrompt = `
以下の情報を元に、スタッフの人柄が自然に伝わり
「この人に指名したい」と感じる投稿を作成してください。

【今日伝えたいこと・書き出しのフック】
${ctx.hook ?? "記載なし"}

【スタッフの想い・こだわり・メッセージ】
${ctx.message ?? "記載なし"}

【この投稿を届けたいお客様】
${ctx.target ?? "記載なし"}

${ctx.memo?.trim() ? `【補足メモ】\n${ctx.memo}\n` : ""}

【投稿の必須ルール】
1. 書き出しはフックの文章をベースに
   スタッフ本人が話しかけるような一人称で始める
2. 想い・こだわりを具体的なエピソードや
   行動で表現する（抽象的にしない）
3. 「こんな方にぜひ来てほしい」という
   呼びかけを自然に入れる
4. 締めは指名予約への具体的な導線を入れる
5. ハッシュタグに#指名したい美容師を含める
`;
            } catch {
                userPrompt = `以下の情報を元に、スタッフの人柄が伝わる投稿を作成してください。\n【スタッフ情報】\n${q1 || "記載なし"}\n\n【想い・メッセージ】\n${q2 || "記載なし"}\n\n【届けたいお客様】\n${q3 || "記載なし"}`;
            }
        } else if (patternId === "H" && additionalContext) {
            try {
                const ctx = JSON.parse(additionalContext) as { scene?: string; message?: string; target?: string; memo?: string; messageTone?: string };
                userPrompt = `
以下の情報を元に、サロンの日常・裏側が伝わり
「ここなら安心して行けそう」と感じてもらえる
投稿を作成してください。

${ctx.messageTone ? `【文章のトーン・伝え方】\n${ctx.messageTone}\nこのトーンで全体を書くこと。\n\n` : ""}【今日の場面】
${ctx.scene ?? "記載なし"}

【この場面から伝えたいメッセージ】
${ctx.message ?? "記載なし"}

【届けたいお客様】
${ctx.target ?? "記載なし"}

${ctx.memo?.trim() ? `【補足メモ】\n${ctx.memo}\n` : ""}

【投稿の必須ルール】
1. 書き出しは「今日の場面」を
   映像が浮かぶように具体的に描写する
2. プロとしての丁寧さ・こだわりが
   さりげなく伝わる一文を必ず入れる
3. 堅くなりすぎず日記のような
   親しみやすいトーンで書く
4. 補足メモに来店誘導の意図があれば
   最後に自然に添える
5. ハッシュタグに#サロンの裏側を含める
`;
            } catch {
                userPrompt = `以下の情報を元に、サロンの裏側・日常が伝わる投稿を作成してください。\n【今日の場面】\n${q1 || "記載なし"}\n\n【伝えたいメッセージ】\n${q2 || "記載なし"}\n\n【届けたいお客様】\n${q3 || "記載なし"}`;
            }
        } else if (patternId === "E") {
            userPrompt = `
以下の情報を元に、スタッフの人柄が自然に伝わり「この人に指名したい」と感じる投稿を作成してください。
【スタッフ情報・こだわり】${q1 || "記載なし"}
【印象に残っているエピソード・想い】${q2 || "記載なし"}
【指名してほしいお客様の特徴】${q3 || "記載なし"}
一人称で、指名予約への導線と#指名したい美容師を含めること。
`;
        } else if (patternId === "H") {
            userPrompt = `
以下の情報を元に、サロンの裏側・日常が伝わる投稿を作成してください。
【今日の場面】${q1 || "記載なし"}
【伝えたいメッセージ】${q2 || "記載なし"}
【届けたいお客様】${q3 || "記載なし"}
具体的な描写と#サロンの裏側を含めること。
`;
        } else {
            userPrompt = `以下の情報を元に、人間味あふれる最高のテキストを作成してください。

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
        }
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

        const result = imageData
            ? await model.generateContent([
                { inlineData: { mimeType: imageData.mimeType, data: imageData.data } },
                { text: userPrompt },
            ])
            : await model.generateContent(userPrompt);
        const resultText = result.response.text();

        if (!resultText) {
            throw new Error("APIから有効なテキストが返却されませんでした。");
        }

        const generatedResults = JSON.parse(resultText);

        // 締め文（CTA）を文末に必ず付与する（ctaType+ctaValue を優先、旧 ctaText は ctaType 未設定時のみ使用）
        const si = parsed.data.shopInfo;
        const lineUrl = si?.lineUrl ?? "";
        const ct = si?.ctaType;
        const cv = (si?.ctaValue ?? "").trim();
        const leg = (si?.ctaText ?? "").trim();
        let ctaToAppend = "";
        if (ct === "phone") {
            const p = cv || si?.phone;
            if (p) ctaToAppend = `お気軽にお電話ください：${p}（今週末の空きもご確認いただけます）`;
        } else if (ct === "reservation" && cv) {
            ctaToAppend = `1分で予約できます！こちらから：${cv}`;
        } else if (ct === "line") {
            const url = cv || lineUrl;
            if (url) ctaToAppend = `LINEでお気軽にご予約・ご相談ください↓ ${url}`;
        } else if (ct === "other" && cv) {
            ctaToAppend = cv;
        } else if (cv && (/^https?:\/\//i.test(cv) || cv.includes("line.me"))) {
            ctaToAppend = `LINEでお気軽にご予約・ご相談ください↓ ${cv}`;
        } else if (cv) {
            ctaToAppend = cv;
        }
        if (!ctaToAppend && leg) ctaToAppend = leg;
        if (!ctaToAppend && lineUrl) ctaToAppend = `下のリンクから1分で予約できます↓ ${lineUrl}`;
        if (!ctaToAppend) ctaToAppend = "プロフィールのリンクを1タップでご予約ください";

        const cta = ctaToAppend.trim();
        // モデルが別表現でCTA（URL・電話）を既に入れているか判定用：CTA内のURLまたは電話番号
        const ctaUrlMatch = cta.match(/https?:\/\/[^\s）\)]+/);
        const ctaContactPart = ctaUrlMatch ? ctaUrlMatch[0] : (cta.match(/0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}/) ? cta.replace(/\D/g, "").slice(-11) : null);
        const ensureCta = (text: string | undefined): string => {
            if (text == null || typeof text !== "string") return text ?? "";
            const t = text.trim();
            if (!t) return text;
            if (t.includes(cta) || t.endsWith(cta)) return text;
            // 本文に既に同じURL・電話番号があればCTAは入っているとみなして追加しない（言い回し違いの二重を防ぐ）
            if (ctaUrlMatch && t.includes(ctaUrlMatch[0])) return text;
            if (ctaContactPart && t.replace(/\D/g, "").includes(ctaContactPart)) return text;
            return t + "\n\n" + cta;
        };

        const out: Record<string, unknown> = { ...generatedResults };
        if (out.instagram != null) out.instagram = ensureCta(out.instagram as string);
        if (out.gbp != null) out.gbp = ensureCta(out.gbp as string);
        if (out.line != null) out.line = ensureCta(out.line as string);

        const usage = (result.response as { usageMetadata?: { totalTokenCount?: number; promptTokenCount?: number; candidatesTokenCount?: number } })?.usageMetadata;
        const tokens = usage?.totalTokenCount ?? (typeof usage?.promptTokenCount === "number" && typeof usage?.candidatesTokenCount === "number"
            ? usage.promptTokenCount + usage.candidatesTokenCount
            : 0);

        return NextResponse.json({
            ...out,
            _meta: { model: GENERATE_MODEL, tokens },
        });
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        if (user) {
            try {
                const supabase = await createClient();
                await supabase.from("generation_history").insert({
                    user_id: user.id,
                    pattern_id: (parsed as { data?: { patternId?: string } })?.data?.patternId ?? "unknown",
                    pattern_title: (parsed as { data?: { patternTitle?: string } })?.data?.patternTitle ?? "エラー",
                    inputs: {},
                    results: {},
                    model: GENERATE_MODEL,
                    tokens: 0,
                    error: error?.message ?? "不明なエラー",
                    is_practice: isPracticeMode,
                });
            } catch (insertErr) {
                console.error("generation_history error insert failed:", insertErr);
            }
        }
        return NextResponse.json(
            { error: "テキストの生成中にエラーが発生しました。", details: error?.message },
            { status: 500 }
        );
    }
}
