export type Pattern = "A" | "B" | "C" | "D" | "E" | "G" | "H" | "I";

export const ADMIN_EMAIL = "naganon026@gmail.com";

export interface ShopInfo {
    name: string;
    address: string;
    phone: string;
    lineUrl: string;
    businessHours: string;
    holidays: string;
    features: string;
    industry?: string;
    snsUrl?: string;
    sampleTexts?: string;
    scrapedContent?: string;
    referenceUrls: string[];
    wpCategoryId?: string;
    wpTagId?: string;
    wpAuthorId?: string;
    outputTargets?: {
        instagram: boolean;
        gbp: boolean;
        portal: boolean;
        line: boolean;
        short?: boolean;
    };
    /** ショート動画の想定尺（秒）。10 / 20 / 30 / 45 / 60 / 90 */
    shortTargetDuration?: number;
    /** 主な投稿先: reels | tiktok | shorts | 指定なし */
    shortPlatform?: string;
    /** ショート用の話し言葉サンプル（台本のトーン学習用） */
    shortSampleScript?: string;
    /** ショート用の自由メモ（フック・CTAの希望など） */
    shortMemo?: string;
    /** ショートのフックタイプ（SHORT_HOOK_OPTIONS の id） */
    shortHookType?: string;
    /** AI分析による手動補足入力 */
    manualSupplements?: {
        concept: string;
        strengths: string;
        target: string;
        staff: string;
        voice: string;
    };
    /** 投稿の締め文（CTA）の種類 */
    ctaType?: CtaType;
    /** CTAに付随するURL・電話番号・その他の文言（種類に応じて使用） */
    ctaValue?: string;
    /** @deprecated 選択式移行前の自由文。未設定時は ctaType + ctaValue を使用 */
    ctaText?: string;
    /** 文字を大きく表示（高齢者向け） */
    largeTextMode?: boolean;
    /** かんたんモード（パターンAのみ表示） */
    simpleMode?: boolean;
}

/** CTAの選択肢（電話 / 予約ページ / LINE / その他） */
export type CtaType = "phone" | "reservation" | "line" | "other";

/** CTAが設定済みかどうかを判定（生成前に必須チェック用） */
export function isCtaSet(shopInfo: ShopInfo): boolean {
    const ct = shopInfo.ctaType ?? "line";
    const cv = (shopInfo.ctaValue ?? "").trim();
    const leg = (shopInfo.ctaText ?? "").trim();
    if (leg) return true;
    if (ct === "phone") return !!(cv || shopInfo.phone?.trim());
    if (ct === "reservation") return !!cv;
    if (ct === "line") return !!(cv || shopInfo.lineUrl?.trim());
    if (ct === "other") return !!cv;
    if (cv && (/^https?:\/\//i.test(cv) || cv.includes("line.me"))) return true;
    return !!cv;
}

export const CTA_TYPE_OPTIONS: { value: CtaType; label: string; valueLabel: string; valuePlaceholder: string }[] = [
    { value: "phone", label: "電話", valueLabel: "電話番号", valuePlaceholder: "例：03-1234-5678" },
    { value: "reservation", label: "予約ページ", valueLabel: "予約ページのURL", valuePlaceholder: "https://..." },
    { value: "line", label: "LINE", valueLabel: "LINEのURL", valuePlaceholder: "https://line.me/..." },
    { value: "other", label: "その他", valueLabel: "締めの一文", valuePlaceholder: "例：ご予約はDMからお気軽にどうぞ" },
];

/** バズりやすいショート動画のフック選択肢（リサーチベース） */
export const SHORT_HOOK_OPTIONS: { id: string; label: string; promptNote: string }[] = [
    { id: "question", label: "問いかけ型", promptNote: "視聴者に質問を投げかけ、答えを探させる。例：「〇〇で悩んでいませんか？」「〇〇、気になりませんか？」。脳に答えを探させる効果で離脱を防ぐ。" },
    { id: "empathy", label: "共感・あるある型", promptNote: "ターゲットの悩みを代弁する。例：「〇〇、ありますよね…」「〇〇で困ってる方、多いんです」。視聴者が「自分ごと」と感じる。" },
    { id: "benefit", label: "ベネフィット型", promptNote: "得られる価値を数字・時間で明確に。例：「〇〇が〇分で変わる方法」「〇〇がすっと楽になる、たった一つのこと」。メリットを先に伝えて続きを見せる。" },
    { id: "result_first", label: "衝撃結果を先出し", promptNote: "完成品・変化・お客様の声を冒頭で見せる。例：「この施術の後、お客様がこう言いました」「結果から言うと…」。逆説構成で維持率が上がる。" },
    { id: "curiosity", label: "好奇心ギャップ", promptNote: "「〇〇の人が知らないこと」「〇割が間違えてる〇〇」など、知りたくなる一言で続きを約束。謎を残して視聴を継続させる。" },
    { id: "contrarian", label: "常識逆張り", promptNote: "「〇〇はやめて。代わりに〇〇を」と正反対の提案。常識を疑わせて正解を教える構成で信頼と興味を引く。" },
    { id: "before_after", label: "ビフォーアフター", promptNote: "施術前の状態を一言で示し、この後の変化を予告。例：「施術前はこうでした。そのあと…」。変化のストーリーで引き込む。" },
    { id: "confession", label: "意外な告白型", promptNote: "「言いにくいけど、〇〇なんです」「実は〇〇で…」と少し踏み込んだ告白で親近感と興味を同時に出す。" },
    { id: "number", label: "数字で惹く", promptNote: "「〇割の人が気づいていない〇〇」「〇秒で変わる」など数字で具体性と信頼感を出す。スクロールを止めやすい。" },
    { id: "direct_question", label: "直接質問", promptNote: "「〇〇したこと、ありますか？」「〇〇で困った経験は？」と自分事にさせる問い。Yes/Noで考えさせる。" },
];

/** 改善して再生成の選択肢（1つ選択） */
export const REFINE_OPTIONS: { id: string; label: string }[] = [
    { id: "shorter", label: "もっと短くする" },
    { id: "casual", label: "もっとカジュアルに" },
    { id: "formal", label: "もう少し丁寧・フォーマルに" },
    { id: "empathy", label: "共感・「あるある」を強くする" },
    { id: "line_natural", label: "LINE誘導をもっと自然に" },
    { id: "simplify", label: "専門用語を減らしてわかりやすく" },
    { id: "emoji_more", label: "絵文字を増やす" },
    { id: "emoji_less", label: "絵文字を減らす" },
    { id: "hook_stronger", label: "もっとフックを強く" },
];

/** ショート動画台本の構造（APIはJSON文字列で返す） */
export interface ShortScriptData {
    hook: string;
    scenes: { sec: number; text: string; note?: string }[];
    cta: string;
}

// 管理者が登録した店舗の型
export interface StoreRecord {
    id: string;
    name: string;
    settings: ShopInfo;
    created_at: string;
    updated_at: string;
}

// 生成履歴の1件分の型
export interface LlmoArticleData {
    /** 記事全体の要約（3〜5行程度） */
    summary: string;
    /** 箇条書きの重要ポイント */
    keyPoints: string[];
    /** よくある質問と回答のセット */
    faq: { question: string; answer: string }[];
    /** LLMや検索向けのエンティティ情報（症状・メニューなど） */
    entities: { type: string; value: string }[];
    /** Article / FAQPage などの schema.org JSON-LD 文字列 */
    schemaJson: string;
    /** WordPressにそのまま貼れる要約＋ポイント＋FAQのHTMLブロック */
    html?: string;
}

export interface HistoryEntry {
    id: string;
    pattern_id: string;
    pattern_title: string;
    inputs: {
        q1?: string; q2?: string; q3?: string;
        platform?: "sns" | "gbp";
        receivedComment?: string;
        replyNote?: string;
        newsTitle?: string;
        newsLink?: string;
        imageContent?: string;
        overview?: string;
    };
    results: {
        instagram?: string; gbp?: string;
        portal?: string; portalTitle?: string;
        line?: string; reply?: string; imageUrl?: string;
        /** ショート動画台本（JSON文字列 or ShortScriptData） */
        shortScript?: string | ShortScriptData;
        /** LLM検索・要約向けの構造化データ */
        llmo?: LlmoArticleData;
    };
    created_at: string;
}

export interface PatternData {
    id: Pattern;
    title: string;
    description: string;
    /** true のとき投稿に天気・季節感を入れる */
    useWeather?: boolean;
    isAuto?: boolean;
    isTagSelect?: boolean;
    questions: {
        q1: string;
        ex1: string;
        q2: string;
        ex2: string;
        q3: string;
        ex3: string;
    };
}

export interface NewsItem {
    title: string;
    link: string;
    snippet: string;
}

export const PATTERNS: PatternData[] = [
    {
        id: "A",
        title: "ビフォーアフター",
        description: "施術の変化を通じて「私も予約したい」を生む投稿。新規集客の最強コンテンツ",
        useWeather: false,
        isTagSelect: true,
        questions: {
            q1: "", ex1: "",
            q2: "", ex2: "",
            q3: "", ex3: "",
        }
    },
    {
        id: "B",
        title: "プロの知識・教育コンテンツ",
        description: "「保存したい」「シェアしたい」を生む有益情報。新規リーチと専門家ブランディングに直結",
        useWeather: false,
        isTagSelect: true,
        questions: {
            q1: "", ex1: "",
            q2: "", ex2: "",
            q3: "", ex3: "",
        },
    },
    {
        id: "C",
        title: "今日のお知らせ・限定情報",
        description: "タイムリーな情報発信で即時来店・予約を促す緊急性の高い投稿",
        useWeather: true,
        isTagSelect: true,
        questions: { q1: "", ex1: "", q2: "", ex2: "", q3: "", ex3: "" },
    },
    {
        id: "D",
        title: "お客様の喜びの声",
        description: "第三者の言葉で信頼と安心感を伝える。「私も行きたい」という背中を押す社会的証明",
        useWeather: false,
        isTagSelect: true,
        questions: { q1: "", ex1: "", q2: "", ex2: "", q3: "", ex3: "" },
    },
    {
        id: "E",
        title: "スタッフの人柄・指名獲得",
        description: "「この人に任せたい」という感情を育てる。リピート率と指名客獲得に直結する属人性の投稿",
        useWeather: true,
        isTagSelect: true,
        questions: { q1: "", ex1: "", q2: "", ex2: "", q3: "", ex3: "" },
    },
    {
        id: "G",
        title: "コメント・クチコミへの返信",
        description: "SNSやGoogleに届いたコメントへ、オーナーとして誠実で温かみのある返信を生成",
        useWeather: false,
        questions: {
            q1: "", ex1: "",
            q2: "", ex2: "",
            q3: "", ex3: "",
        }
    },
    {
        id: "H",
        title: "整体院の裏側・日常",
        description: "「清潔感」「丁寧さ」「人間味」を伝えて店舗への安心感と親近感を醸成。リピーター維持に効果的",
        useWeather: true,
        isTagSelect: true,
        questions: { q1: "", ex1: "", q2: "", ex2: "", q3: "", ex3: "" },
    },
    {
        id: "I",
        title: "画像から生成",
        description: "画像をアップロードし、その内容や伝えたいことを入力してSNS文章を生成",
        useWeather: false,
        questions: {
            q1: "", ex1: "",
            q2: "", ex2: "",
            q3: "", ex3: "",
        }
    }
];

/** パターン選択の1段階目：目的別カテゴリ（案1） */
export const PATTERN_CATEGORIES = [
    { id: "acquire", label: "集客・認知", description: "新規やリーチを増やしたい", patternIds: ["A", "B", "C"] as const satisfies readonly Pattern[] },
    { id: "connect", label: "つながり・ファン化", description: "リピート・指名を増やしたい", patternIds: ["E", "H", "D"] as const satisfies readonly Pattern[] },
    { id: "image", label: "画像から投稿を作る", description: "写真を活かした魅力的な投稿を作成", patternIds: ["I"] as const satisfies readonly Pattern[] },
    { id: "reply", label: "コメントを返信する", description: "届いた声に丁寧に応える", patternIds: ["G"] as const satisfies readonly Pattern[] },
] as const;

export type PatternCategoryId = (typeof PATTERN_CATEGORIES)[number]["id"];

/** 指定パターンが属するカテゴリIDを返す */
export function getPatternCategoryId(patternId: Pattern): PatternCategoryId {
    const found = PATTERN_CATEGORIES.find((c) => (c.patternIds as readonly string[]).includes(patternId));
    return found ? found.id : PATTERN_CATEGORIES[0].id;
}

export const TREATMENT_TAGS = [
    {
        id: "massage",
        label: "もみほぐし・全身マッサージ",
        emoji: "💆",
        concern: "全身の疲労感・だるさ",
        approach: "深層筋まで届く丁寧なもみほぐし",
        result: "全身が軽くスッキリとした状態に",
    },
    {
        id: "pelvis_correction",
        label: "骨盤矯正",
        emoji: "⚖️",
        concern: "腰痛・姿勢の崩れ・下半身のむくみ",
        approach: "痛みの少ない骨格アプローチで骨盤を整える",
        result: "姿勢が整い、根本的な不調が改善へ",
    },
    {
        id: "dry_head_spa",
        label: "ドライヘッドスパ",
        emoji: "🧠",
        concern: "眼精疲労・頭重感・睡眠の質が悪い",
        approach: "頭部の筋膜を優しくほぐす極上スパ",
        result: "視界がクリアになり、深い睡眠へ導く",
    },
    {
        id: "neck_shoulder",
        label: "首肩こり特化整体",
        emoji: "⚡",
        concern: "ガチガチの首肩こり・ストレートネック",
        approach: "首肩の深層筋へダイレクトにアプローチ",
        result: "首の可動域が広がり、肩の重さが嘘のように軽く",
    },
    {
        id: "fascia_release",
        label: "筋膜リリース",
        emoji: "🔄",
        concern: "慢性的なコリ・関節の動かしにくさ",
        approach: "癒着した筋膜をはがして正常な状態へ",
        result: "身体本来の柔軟性を取り戻し、しなやかに",
    },
    {
        id: "foot_care",
        label: "フットケア・リフレクソロジー",
        emoji: "👣",
        concern: "足のパンパンなむくみ・冷え性",
        approach: "足裏の反射区とふくらはぎのリンパケア",
        result: "足先からポカポカになり、スッキリ軽い足取りに",
    },
    {
        id: "oil_massage",
        label: "アロマリンパオイル",
        emoji: "💧",
        concern: "蓄積されたストレス・全身のむくみ",
        approach: "上質なオイルで全身の老廃物を流す",
        result: "極上のリラックス体験で心身ともにデトックス",
    },
    {
        id: "maternity",
        label: "マタニティ整体・産後骨盤",
        emoji: "👶",
        concern: "妊娠中・産後の腰痛や体型の崩れ",
        approach: "ママの体への負担を考慮した優しい整体",
        result: "痛みを我慢しない、健やかな育児ライフへ",
    },
    {
        id: "face_correction",
        label: "小顔矯正・美容整体",
        emoji: "✨",
        concern: "顔のむくみ・エラ張り・左右差",
        approach: "顔と頭蓋骨のバランスを整える手技",
        result: "ひと回りスッキリした引き締まったフェイスラインに",
    },
    {
        id: "posture_correction",
        label: "猫背・姿勢改善",
        emoji: "🧍",
        concern: "巻き肩・背中の丸まり・見た目の老け感",
        approach: "肩甲骨はがしと背骨のバランス調整",
        result: "胸が開いて呼吸が深くなり、若々しい印象に",
    },
    {
        id: "sports_massage",
        label: "スポーツ整体",
        emoji: "🏃",
        concern: "運動パフォーマンスの低下・関節の痛み",
        approach: "筋肉の連動性を高めるコンディショニング",
        result: "可動域が広がり、怪我をしにくい身体へ",
    },
    {
        id: "autonomic_nerve",
        label: "自律神経調整",
        emoji: "🌿",
        concern: "原因不明の不調・気分の落ち込み・めまい",
        approach: "背骨・頭蓋骨からの優しいアプローチ",
        result: "副交感神経が優位になり、心身がリラックスモードに",
    },
    {
        id: "acupuncture",
        label: "鍼灸治療",
        emoji: "🪡",
        concern: "マッサージでは届かない奥の痛み・冷え",
        approach: "ツボを刺激し自然治癒力を高める",
        result: "血流が改善し、深部の頑固な痛みが和らぐ",
    },
    {
        id: "quick_care",
        label: "15分クイック整体",
        emoji: "⏱️",
        concern: "時間がないけどどうしても辛い箇所がある",
        approach: "辛い部分のみを集中的に緩める時短ケア",
        result: "短時間でも確かなスッキリ感を実感",
    },
] as const;

/** パターンA：今日のお客様のお悩みタグ */
export const CONCERN_TAGS = [
    { id: "heavy_body", label: "全身が重だるい", emoji: "😔" },
    { id: "shoulder", label: "肩・首のガチガチ感", emoji: "⚡" },
    { id: "backpain", label: "慢性的な腰の痛み", emoji: "💥" },
    { id: "eyestrain", label: "目の疲れ・頭の重さ", emoji: "🧠" },
    { id: "posture", label: "猫背・巻き肩が気になる", emoji: "🧍" },
    { id: "swelling", label: "夕方の足のむくみ", emoji: "👣" },
    { id: "fatigue", label: "寝ても疲れがとれない", emoji: "🛌" },
    { id: "stress", label: "日々ストレスが溜まっている", emoji: "💭" },
    { id: "face_swelling", label: "顔のむくみ・たるみ", emoji: "✨" },
    { id: "pelvis", label: "産後・骨盤の歪み", emoji: "⚖️" },
    { id: "cold", label: "慢性的な冷え性", emoji: "❄️" },
    { id: "sleep", label: "夜ぐっすり眠れない", emoji: "🌙" },
    { id: "time_poor", label: "自分のケアをする時間がない", emoji: "⏰" },
    { id: "fear_pain", label: "痛いマッサージは苦手", emoji: "😨" },
] as const;

export type TreatmentTagId = string;

export const EDUCATION_CATEGORIES = [
    { id: "self_care", label: "セルフケア・ストレッチ", emoji: "🧘" },
    { id: "posture_body", label: "姿勢・骨格の知識", emoji: "🦴" },
    { id: "salon_tips", label: "整体院・店舗のトリセツ", emoji: "💡" },
] as const;

export type EducationCategoryId = typeof EDUCATION_CATEGORIES[number]["id"];

export const EDUCATION_TAGS = [
    {
        id: "ng_posture",
        category: "posture_body",
        label: "NG姿勢・座り方",
        emoji: "🚫",
        theme: "やってはいけないNG姿勢",
        items: "①脚を組む→骨盤が歪む　②浅く腰掛ける→腰への負担増大　③スマホを覗き込む→ストレートネックの原因",
        solution: "正しい座り方のレクチャーと骨盤調整で根本改善できます",
    },
    {
        id: "stretch_mistake",
        category: "self_care",
        label: "ストレッチの勘違い",
        emoji: "⚖️",
        theme: "逆効果になる間違ったストレッチ",
        items: "①痛いところまで伸ばす→筋繊維が傷つく　②反動をつける→筋肉が緊張して縮む　③呼吸を止める→血圧が上がりリラックスできない",
        solution: "痛気持ちいい範囲で呼吸を止めずに行うのが正解です",
    },
    {
        id: "season_care",
        category: "self_care",
        label: "季節の不調ケア",
        emoji: "🌸",
        theme: "季節ごとの正しい体調管理",
        items: "①春・梅雨→気圧変化で自律神経が乱れやすい　②夏→冷房による隠れ冷えとダルさ　③秋冬→寒さによる筋肉の硬直と血行不良",
        solution: "季節に合わせた自律神経ケアや温活メニューをご提案します",
    },
    {
        id: "smartphone_neck",
        category: "posture_body",
        label: "スマホ首・眼精疲労",
        emoji: "📱",
        theme: "スマホ首が全身に与える影響",
        items: "①頭痛・眼精疲労の慢性化　②背中の張り・猫背の悪化　③呼吸が浅くなり疲れやすくなる",
        solution: "首肩の専用手技とドライヘッドスパで根本からケアします",
    },
    {
        id: "compress_choice",
        category: "salon_tips",
        label: "湿布とマッサージ",
        emoji: "🏥",
        theme: "湿布・薬・マッサージの効果の違い",
        items: "①湿布→炎症を抑える、根本解決ではない　②薬→痛みを麻痺させる　③マッサージ→血流改善で自己治癒力を高める",
        solution: "痛みの原因を見極め、必要なケアをアドバイスします",
    },
    {
        id: "good_sleep",
        category: "self_care",
        label: "睡眠の質向上",
        emoji: "🌙",
        theme: "寝ても疲れがとれない理由",
        items: "①交感神経が優位なまま寝ている　②首肩のコリで脳への血流が悪い　③枕の高さが合わず首に負担がかかっている",
        solution: "自律神経を整えるスパや筋肉の緊張を解く整体で改善",
    },
    {
        id: "swelling_care",
        category: "self_care",
        label: "むくみ・冷え撃退",
        emoji: "💧",
        theme: "ふくらはぎのむくみを放置するリスク",
        items: "①血流悪化で全身が冷える　②セルライト化して落ちにくくなる　③老廃物が溜まり疲れが抜けない",
        solution: "リンパドレナージュやフットケアでポンプ機能を回復させます",
    },
    {
        id: "breathing",
        category: "self_care",
        label: "呼吸と自律神経",
        emoji: "🌬️",
        theme: "浅い呼吸が不調を招く理由",
        items: "①肋骨周りの筋肉が硬くなり胸が開かない　②血中の酸素不足で疲労が抜けにくい　③常に緊張状態で交感神経が優位に",
        solution: "肩甲骨・肋骨周りをほぐし、深い呼吸ができる体へ",
    },
    {
        id: "salon_timing",
        category: "salon_tips",
        label: "通うペース・頻度",
        emoji: "🗓️",
        theme: "整体・マッサージに通うベストな頻度",
        items: "①最初の1ヶ月→体が戻る前に詰めて（週1〜2回）　②改善期→間隔を空けて（2週に1回）　③メンテナンス期→良い状態を維持（月1回）",
        solution: "最短で良くなるためのあなた専用の通院計画をご提案します",
    },
    {
        id: "after_care",
        category: "self_care",
        label: "施術後の過ごし方",
        emoji: "🏠",
        theme: "施術効果を長持ちさせる施術直後のルール",
        items: "①激しい運動や飲酒は避ける　②常温のお水をたっぷり飲む　③その日は湯船に浸かってしっかり睡眠をとる",
        solution: "好転反応を和らげ、回復を早めるためのアドバイスを必ずお伝えします",
    },
    {
        id: "pelvis_distortion",
        category: "posture_body",
        label: "骨盤の歪みチェック",
        emoji: "⚖️",
        theme: "実はあなたも？骨盤の歪み簡単セルフチェック",
        items: "①靴の底の減り方が左右で違う　②気付くといつも同じ脚を組んでいる　③スカートがいつも同じ方向に回る",
        solution: "バキバキしない優しい骨盤矯正で全身のバランスを整えます",
    },
    {
        id: "water_intake",
        category: "self_care",
        label: "水分補給の重要性",
        emoji: "🚰",
        theme: "コリや痛みに水分補給が必須なワケ",
        items: "①水分不足だと筋肉が乾燥し硬くなる　②血液がドロドロになり老廃物が滞る　③リンパの流れが悪くむくむ",
        solution: "老廃物の排出を促すために、こまめな水分補給を心がけてください",
    },
    {
        id: "pain_hidden",
        category: "posture_body",
        label: "痛みの真の原因",
        emoji: "🎯",
        theme: "「痛い場所」と「原因の場所」が違う理由",
        items: "①腰痛の原因がお尻や太ももの硬さにある　②肩こりの原因が腕や胸の筋肉の縮みにある　③筋膜は全身繋がって引っ張り合っている",
        solution: "痛いところだけを揉むのではなく、全身の繋がりから根本原因を探ります",
    },
    {
        id: "strong_massage",
        category: "salon_tips",
        label: "強揉みの落とし穴",
        emoji: "⚠️",
        theme: "「とにかく強く揉んで！」が危険な理由",
        items: "①筋繊維が破壊されて炎症を起こす（揉み返し）　②防御反応でさらに筋肉が硬くなる　③感覚が麻痺してますます強くないと効かなくなる",
        solution: "痛気持ちいい「適圧」で、筋肉を傷つけずに深部まで緩めます",
    },
    {
        id: "sports_injury",
        category: "posture_body",
        label: "スポーツ障害予防",
        emoji: "🏃",
        theme: "運動前のウォーミングアップと運動後のケア",
        items: "①準備運動不足による肉離れリスク　②運動後の放置による疲労蓄積とパフォーマンス低下　③関節の可動域制限による代償動作",
        solution: "競技特性に合わせたスポーツ整体とテーピングでサポートします",
    },
    {
        id: "maternity_care",
        category: "posture_body",
        label: "マタニティの不調",
        emoji: "👶",
        theme: "妊娠中・産後の骨盤と身体の変化",
        items: "①ホルモンの影響で関節・靭帯が緩む　②お腹が大きくなることで重心が変わり腰痛に　③抱っこや授乳によるストレートネック・腱鞘炎",
        solution: "安全に配慮したマタニティ整体・産後骨盤ケアをご用意しています",
    },
] as const;

export type EducationTagId = string;

/** パターンB：今日このテーマを投稿する理由タグ */
export const EDUCATION_REASON_TAGS = [
    { id: "season", label: "季節の変わり目だから", emoji: "🌸" },
    { id: "question", label: "最近よく聞かれるから", emoji: "❓" },
    { id: "mistake", label: "やりがちな失敗を見たから", emoji: "😥" },
    { id: "new_info", label: "新しい知識を伝えたいから", emoji: "📚" },
    { id: "trending", label: "今トレンドだから", emoji: "🔥" },
    { id: "care", label: "お客様に知ってほしいから", emoji: "💝" },
] as const;

/** パターンE・H共通で使う「伝えたいこと」タグ */
export const STAFF_MESSAGE_TAGS = [
    { id: "commitment", label: "技術・手技へのこだわり", emoji: "🔥", message: "マッサージ・整体の手技で絶対に譲れないポイントと、その背景にある想い", hook: "当店の手技が他とは少し違うアプローチをしているのには、ある理由があります", target: "丁寧で確実な施術を求めている方" },
    { id: "episode", label: "印象的なエピソード", emoji: "✨", message: "お客様からいただいた一言や、施術を通じて痛みが取れた忘れられない出来事", hook: "先日ご来店いただいたお客様との間で、とても嬉しい変化の報告がありました", target: "初めての方・長く痛みに悩んでいる方" },
    { id: "why_therapist", label: "整体師になった理由", emoji: "💫", message: "自分自身の不調や痛みを解消してくれた経験など、この職業を選んだ原点", hook: "私がこの職業を選んだきっかけについて、少しお時間いただけますか", target: "先生の人柄を知りたい方・信頼できる人を探している方" },
    { id: "skill_growth", label: "学び・解剖学への姿勢", emoji: "📚", message: "現状に甘んじることなく、休日も解剖学や新しい技術を貪欲に吸収し続ける姿勢", hook: "体の不調を少しでも早く取るために、最近アップデートしている新しい知識・技術について", target: "技術の高さ・プロフェッショナルを求めている方" },
    { id: "customer_first", label: "お客様への想い", emoji: "💝", message: "痛みをとるだけでなく、心から休まり深くリラックスして帰っていただける場所でありたい", hook: "「ここに来るとホッとする」その言葉を引き出すためのお店づくり", target: "慢性的な疲れを癒やしたい方・居心地のよい整体院を探している方" },
    { id: "consultation", label: "カウンセリングへのこだわり", emoji: "💬", message: "施術前の問診・検査で、お客様の痛みの本当の原因を見つけ出すことへの執念", hook: "「マッサージに行ってもすぐ戻る」という方にこそ知ってほしい、当店の初回検査アプローチ", target: "根本改善したい方・原因がわからず不安な方" },
    { id: "tools_love", label: "ベッド・空間への愛", emoji: "🛏️", message: "長時間寝ても疲れないベッド、心地よいタオルや音楽など空間づくりへのプロ意識", hook: "「え、こんなに違うの？」と驚かれる、うちの施術ベッドやタオルに隠された秘密", target: "リラックス空間や清潔感を重視する方" },
    { id: "product_obsession", label: "オイル等へのこだわり", emoji: "🌿", message: "肌に直接触れるオイルやクリーム、アロマなど、安全で上質なものだけを採用する理由", hook: "絶対に妥協したくなくて厳選した、当店で使用しているオイルの話", target: "肌への負担を気にする方・安全性を重視する方" },
    { id: "past_failure", label: "共感できる過去", emoji: "🌱", message: "かつて自分もひどい腰痛・肩こりなどで悩んでいた経験があるからこそ、お客様の痛みがわかる", hook: "昔、私もひどい腰痛持ちだったからこそ伝えたい「我慢しないでほしい」という想い", target: "痛みに共感してほしい・わかってほしい方" },
    { id: "honest_request", label: "プロの切実な本音", emoji: "🗣️", message: "プロの目線からお伝えしたい、湿布に頼るリスクや姿勢についての本当に正しい選択", hook: "プロとしてこれだけは絶対に避けてほしい！と本気で思っている日常のNG行動", target: "本当のアドバイスが欲しい方・本気で直したい方" },
    { id: "private_insight", label: "日常からのヒント", emoji: "☕", message: "店舗を離れたプライベートな時間や自分の運動歴から得られる、身体への気づき", hook: "休日のトレーニングや運動体験が、実はお客様の体づくりをサポートするヒントになっている", target: "スタッフのプライベートな一面を知りたい方" },
    { id: "future_vision", label: "これからの目標・挑戦", emoji: "🚀", message: "地域のみなさまの健康を支える特別な場所になるための、中長期的なビジョン", hook: "数年後、この店舗をただ痛みを和らげる場所ではない「特別な健康の拠点」にするための計画", target: "長く通い続け共に健康になりたい方" },
] as const;

export type StaffMessageTagId = string;

/** パターンH専用の「今日の場面」タグ */
export const SALON_SCENE_TAGS = [
    { id: "preparation", label: "施術準備", emoji: "🛏️", scene: "今日の施術前のベッドやタオルの準備風景" },
    { id: "study", label: "勉強・研修", emoji: "🦴", scene: "スタッフの身体・解剖学の勉強会・手技研修の様子" },
    { id: "new_product", label: "新しい技術・オイル", emoji: "🆕", scene: "新しい手技の導入や、アロマ・オイルなどが届いた" },
    { id: "customer_voice", label: "お客様の反応", emoji: "😊", scene: "お客様から体が楽になったと嬉しい言葉をいただいた瞬間" },
    { id: "morning_open", label: "開店準備", emoji: "🌅", scene: "今日の開店前・朝の準備の様子" },
    { id: "team", label: "スタッフの日常", emoji: "👥", scene: "スタッフ同士の何気ない日常の一コマ" },
    { id: "season_deco", label: "季節の飾り付け", emoji: "🌸", scene: "院内の季節の装飾・ディスプレイの様子" },
    { id: "tool_care", label: "道具の除菌・手入れ", emoji: "✨", scene: "施術で使う備品を丁寧に除菌・お手入れしている様子" },
] as const;

export type SalonSceneTagId = string;

/** パターンH専用：場面から伝えるメッセージタグ（STAFF_MESSAGE_TAGSとは別物） */
export const SCENE_MESSAGE_TAGS = [
    { id: "care_quality", label: "丁寧さ・こだわり", emoji: "🔥", message: "細部までこだわった丁寧な施術・準備をしていることが伝わる一言", target: "丁寧な施術を求めている方・長く通える場所を探している方" },
    { id: "team_work", label: "チームワーク", emoji: "👥", message: "スタッフ同士の連携・信頼関係がお客様への安心感につながることを伝える", target: "初めての方・アットホームな雰囲気を求めている方" },
    { id: "learning", label: "技術・知識への姿勢", emoji: "📚", message: "常に学び続けているプロとしての姿勢・向上心を伝える", target: "技術の高さを重視している方・最新メニューを試したい方" },
    { id: "customer_joy", label: "お客様への想い", emoji: "💝", message: "お客様に喜んでもらうことが一番の原動力だという気持ちを伝える", target: "居心地のよい場所を探している方・初めての方" },
    { id: "attention_detail", label: "準備・環境へのこだわり", emoji: "✨", message: "道具・空間・環境を丁寧に整えていることへのこだわりを伝える", target: "清潔感・居心地を大切にしている方" },
    { id: "seasonal_update", label: "季節・旬の情報", emoji: "🌸", message: "今の季節に合わせた新しいメニューや情報をさりげなく伝える", target: "トレンドに敏感な方・季節に合わせてイメチェンしたい方" },
] as const;

export type SceneMessageTagId = string;

/** パターンH：伝え方のトーンタグ */
export const MESSAGE_TONE_TAGS = [
    { id: "story", label: "ストーリーで伝える", emoji: "📖", note: "エピソードを小さなドラマとして語る" },
    { id: "honest", label: "正直に・本音で", emoji: "💬", note: "スタッフの本音・気持ちをそのまま伝える" },
    { id: "gentle", label: "やさしく・静かに", emoji: "🌿", note: "押しつけず、ゆっくり語りかける温度感" },
    { id: "daily", label: "日常の一コマとして", emoji: "☕", note: "特別感を出さず、日記のような自然な書き方" },
] as const;

/** パターンF：今日の切り口タグ */
export const TODAYS_FOCUS_TAGS = [
    { id: "weather", label: "今日の天気・気候", emoji: "🌤️", note: "天気や気温の変化（冷えや気圧の変化など）を切り口にする" },
    { id: "customer", label: "今日のお客様の反応", emoji: "😊", note: "今日担当したお客様の嬉しい反応や体の変化を切り口にする" },
    { id: "trend", label: "体の不調トレンド", emoji: "🔥", note: "今の時期に多い体の不調（花粉症、クーラー病など）を切り口にする" },
    { id: "season", label: "この時期ならではの悩み", emoji: "🌸", note: "季節特有の体の悩み（冷え、むくみなど）を切り口にする" },
    { id: "event", label: "もうすぐ行事・イベント", emoji: "🎉", note: "イベント前後の疲れ（旅行帰り、年末年始など）を切り口にする" },
    { id: "morning", label: "朝の寝起き・不調", emoji: "⏰", note: "朝の目覚めの悪さや、寝起きの首肩の痛みを切り口にする" },
] as const;

/** パターンC：お知らせの種類 */
export const NOTICE_TYPE_TAGS = [
    { id: "vacancy", label: "空きあり", emoji: "📅", type: "本日・今週の予約空き状況のお知らせ", detail: "ご予約の空きが出ました。お早めにどうぞ" },
    { id: "campaign", label: "キャンペーン", emoji: "🎁", type: "期間限定キャンペーン・割引のお知らせ", detail: "期間限定のお得なキャンペーンを実施中です" },
    { id: "new_menu", label: "新コース・手技", emoji: "✨", type: "新しい治療コース・手技メニューの導入のお知らせ", detail: "新しいコースを始めました。ぜひお試しください" },
    { id: "new_product", label: "回数券・ケア用品等", emoji: "🆕", type: "回数券のお知らせ・ご自宅用ケア商品の入荷のお知らせ", detail: "お得な回数券・セルフケア用品をご用意しました" },
    { id: "holiday", label: "休業・営業時間変更", emoji: "📢", type: "臨時休業・営業時間変更のお知らせ", detail: "営業時間・休業日についてご案内があります" },
    { id: "event", label: "イベント・特典", emoji: "🌸", type: "季節のイベント・特典のお知らせ", detail: "季節限定のイベントや特典をご用意しました" },
    { id: "staff_schedule", label: "スタッフ出勤・お休み", emoji: "🗓️", type: "スタッフの出勤日・休業日のお知らせ", detail: "スタッフの出勤スケジュールをお知らせします" },
    { id: "staff_activities", label: "スタッフ講習会等", emoji: "🏆", type: "外部セミナー参加や技術研修などの活動報告", detail: "スタッフの活動や技術スキルアップについて報告します" },
    { id: "hiring", label: "スタッフ募集・求人", emoji: "🤝", type: "受付・整体スタッフ募集のお知らせ", detail: "一緒に働く仲間を募集しています" },
    { id: "booking_status", label: "予約状況・早め予約", emoji: "🔔", type: "予約の混雑状況や早めのご予約のお願い", detail: "ご予約が混み合ってきております。お早めにどうぞ" },
    { id: "price_revision", label: "価格改定・リニューアル", emoji: "💰", type: "メニューの価格改定や内容変更のお知らせ", detail: "一部コースの価格改定・変更に関する重要なお知らせです" },
    { id: "cancellation_policy", label: "キャンセルポリシー", emoji: "⚠️", type: "キャンセルや遅刻、無断キャンセルに関するルールのご案内", detail: "ご予約の変更・キャンセルに関するお願いです" },
    { id: "shop_info", label: "アクセス・院内設備", emoji: "🏠", type: "駐車場やお店の場所・院内の改善のお知らせ", detail: "お店へのアクセスや院内設備に関するご案内です" },
    { id: "media_appearance", label: "メディア掲載情報", emoji: "📰", type: "雑誌掲載やWebメディア等の紹介のお知らせ", detail: "当院がメディアで紹介されました" },
] as const;

export type NoticeTypeTagId = string;

/** パターンC：緊急度・期間 */
export const URGENCY_TAGS = [
    { id: "from_today", label: "本日から", emoji: "📌", urgency: "本日から", phrase: "本日からご案内しています。お早めにどうぞ" },
    { id: "today", label: "本日限定", emoji: "🔥", urgency: "本日のみ", phrase: "本日のみのご案内です。お早めにご連絡ください" },
    { id: "this_week", label: "今週末まで", emoji: "⏰", urgency: "今週末まで", phrase: "今週末までの限定です。お見逃しなく" },
    { id: "this_month", label: "今月末まで", emoji: "📆", urgency: "今月末まで", phrase: "今月末までのご案内です。お早めにどうぞ" },
    { id: "limited_seats", label: "残り僅か", emoji: "⚡", urgency: "残り枠わずか", phrase: "残り枠がわずかとなっています。お急ぎください" },
    { id: "ongoing", label: "随時受付中", emoji: "✅", urgency: "随時受付中", phrase: "随時受け付けております。お気軽にご連絡ください" },
] as const;

export type UrgencyTagId = string;

/** パターンD：お客様の声のカテゴリ（1段階目・厳選2つ） */
export const VOICE_CATEGORIES = [
    { id: "by_treatment", label: "施術で選ぶ", emoji: "✂️" },
    { id: "by_change", label: "変化・お悩みで選ぶ", emoji: "✨" },
] as const;

export type VoiceCategoryId = string;

/** パターンD：お客様の声の選択肢（2段階目・厳選10個・カテゴリ別） */
export const VOICE_OPTION_TAGS = [
    { id: "v_massage", categoryId: "by_treatment" as const, label: "もみほぐし", emoji: "💆", concern: "全身の重だるさ・抜けきらない疲労感", result: "施術後は羽が生えたように全身が軽く" },
    { id: "v_pelvis", categoryId: "by_treatment" as const, label: "骨盤矯正", emoji: "⚖️", concern: "慢性の腰痛・座りっぱなしで歪んだ姿勢", result: "根本的な歪みが取れて正しい姿勢が楽になった" },
    { id: "v_neck_shoulder", categoryId: "by_treatment" as const, label: "首肩こり整体", emoji: "⚡", concern: "頭痛薬が手放せない程のガチガチな首肩こり", result: "嘘のように張りが取れて視界まで明るく" },
    { id: "v_dry_head_spa", categoryId: "by_treatment" as const, label: "ドライヘッドスパ", emoji: "🧠", concern: "眼精疲労と毎晩の浅い睡眠・寝起きのだるさ", result: "久しぶりに朝までぐっすり眠れるようになった" },
    { id: "v_posture", categoryId: "by_treatment" as const, label: "猫背矯正", emoji: "🧍", concern: "鏡を見るたび気になる丸まった背中と巻き肩", result: "胸が自然と開いて呼吸までしやすくなった" },
    { id: "v_foot_care", categoryId: "by_treatment" as const, label: "フット・むくみ", emoji: "👣", concern: "夕方にはパンパンになる足のむくみと冷え", result: "靴が緩く感じるほどスッキリし、冷えも改善" },
    { id: "v_maternity", categoryId: "by_treatment" as const, label: "マタニティ・産後", emoji: "👶", concern: "我慢するしかなかった産前産後の腰や恥骨の痛み", result: "優しい施術で痛みが和らぎ育児がグッと楽に" },
    { id: "v_face", categoryId: "by_treatment" as const, label: "小顔・美容整体", emoji: "✨", concern: "食いしばりによるエラ張りやフェイスラインのもたつき", result: "輪郭がひと周りスッキリして表情も柔らかく" },
    
    { id: "v_pain_gone", categoryId: "by_change" as const, label: "長年の痛みが消えた", emoji: "✨", concern: "どこに行っても良くならなかった慢性痛", result: "嘘のように痛みが消え、日常生活が楽に" },
    { id: "v_sleep_well", categoryId: "by_change" as const, label: "ぐっすり眠れる", emoji: "🌙", concern: "夜中何度も目が覚めて疲れが取れない", result: "朝までぐっすり眠れて目覚めが最高になった" },
    { id: "v_posture_better", categoryId: "by_change" as const, label: "姿勢を褒められた", emoji: "🧍", concern: "猫背で老けて見られていたのがコンプレックス", result: "背筋が伸びて「若々しくなったね」と言われた" },
    { id: "v_body_light", categoryId: "by_change" as const, label: "全身が嘘のように軽い", emoji: "🕊️", concern: "常に重い鉛を背負っているようなだるさ", result: "羽が生えたように足取りまで軽くなった" },
    { id: "v_can_move", categoryId: "by_change" as const, label: "我慢していたことができるように", emoji: "🏃", concern: "痛くて趣味や運動を諦めていた", result: "痛みを気にせず思い切り動けるようになった" },
    { id: "v_trusting", categoryId: "by_change" as const, label: "安心して任せられた", emoji: "🤝", concern: "バキバキされるのが怖くて整体を避けていた", result: "痛みのない優しい施術で心からリラックスできた" },
    { id: "v_mental_health", categoryId: "by_change" as const, label: "心まで前向きに", emoji: "☀️", concern: "体の不調から気分までどんより落ち込みがちだった", result: "体が軽くなると同時に気持ちまでスッキリ明るく" },
] as const;

export type VoiceOptionTagId = string;


export interface GenericTag {
    id: string;
    label: string;
    emoji: string;
    [key: string]: any;
}

export const INDUSTRY_DATA: Record<string, {
    labelTreatment: string;
    labelConcern: string;
    labelEducation: string;
    labelEducationReason: string;
    labelScene: string;
    labelVoiceCategory1: string;
    labelVoiceCategory2: string;
    TREATMENT_TAGS: readonly GenericTag[];
    CONCERN_TAGS: readonly GenericTag[];
    EDUCATION_TAGS: readonly GenericTag[];
    EDUCATION_CATEGORIES: readonly GenericTag[];
    EDUCATION_REASON_TAGS: readonly GenericTag[];
    STAFF_MESSAGE_TAGS: readonly GenericTag[];
    SALON_SCENE_TAGS: readonly GenericTag[];
    SCENE_MESSAGE_TAGS: readonly GenericTag[];
    MESSAGE_TONE_TAGS: readonly GenericTag[];
    TODAYS_FOCUS_TAGS: readonly GenericTag[];
    NOTICE_TYPE_TAGS: readonly GenericTag[];
    URGENCY_TAGS: readonly GenericTag[];
    VOICE_CATEGORIES: readonly GenericTag[];
    VOICE_OPTION_TAGS: readonly GenericTag[];
}> = {
    salon: {
        labelTreatment: "施術タグ",
        labelConcern: "お客様のお悩み",
        labelEducation: "教育テーマ",
        labelEducationReason: "今日これを投稿する理由",
        labelScene: "今日の場面",
        labelVoiceCategory1: "施術で選ぶ",
        labelVoiceCategory2: "変化・お悩みで選ぶ",
        TREATMENT_TAGS,
        CONCERN_TAGS,
        EDUCATION_TAGS,
        EDUCATION_CATEGORIES,
        EDUCATION_REASON_TAGS,
        STAFF_MESSAGE_TAGS,
        SALON_SCENE_TAGS,
        SCENE_MESSAGE_TAGS,
        MESSAGE_TONE_TAGS,
        TODAYS_FOCUS_TAGS,
        NOTICE_TYPE_TAGS,
        URGENCY_TAGS,
        VOICE_CATEGORIES,
        VOICE_OPTION_TAGS
    },
    restaurant: {
        labelTreatment: "おすすめメニュー・料理",
        labelConcern: "利用シーン・目的",
        labelEducation: "食材・お店のこだわり",
        labelEducationReason: "おすすめする理由",
        labelScene: "お店の日常風景",
        labelVoiceCategory1: "メニューで選ぶ",
        labelVoiceCategory2: "シーンで選ぶ",
        TREATMENT_TAGS: [
            { id: "lunch", label: "ランチメニュー", emoji: "🍱", concern: "お得で美味しいランチを探している", approach: "こだわりの食材を使ったランチ", result: "午後の活力をチャージできる" },
            { id: "dinner", label: "ディナーコース", emoji: "🍽️", concern: "特別な日のディナーを楽しみたい", approach: "季節の味覚を堪能できるコース", result: "思い出に残る素敵な時間を過ごせる" },
            { id: "drink", label: "ドリンク・お酒", emoji: "🍷", concern: "美味しいお酒と料理を楽しみたい", approach: "料理に合う厳選されたお酒", result: "至福のひとときを味わえる" },
            { id: "dessert", label: "デザート", emoji: "🍰", concern: "食後のデザートを楽しみたい", approach: "手作りこだわりデザート", result: "幸せな甘さで満たされる" },
        ],
        CONCERN_TAGS: [
            { id: "date", label: "デート", emoji: "💑" },
            { id: "family", label: "家族・子連れ", emoji: "👪" },
            { id: "friends", label: "女子会・友人", emoji: "🥂" },
            { id: "solo", label: "お一人様", emoji: "👤" },
            { id: "anniversary", label: "記念日・お祝い", emoji: "🎉" },
        ],
        EDUCATION_TAGS: [
            { id: "ingredients", label: "食材のこだわり", emoji: "🥬", theme: "当店が厳選する食材", items: "地元の新鮮な野菜を使用", solution: "安心安全で美味しい料理を提供" },
            { id: "cooking", label: "調理のこだわり", emoji: "👨‍🍳", theme: "美味しくする一工夫", items: "長時間の仕込み", solution: "深い味わいを実現" },
            { id: "pairing", label: "ペアリング", emoji: "🍷", theme: "料理とお酒の相性", items: "ソムリエおすすめの組み合わせ", solution: "料理の味をさらに引き立てる" },
        ],
        EDUCATION_CATEGORIES: [
            { id: "ingredients", label: "食材について", emoji: "🥬" },
            { id: "cooking", label: "調理について", emoji: "👨‍🍳" },
        ],
        EDUCATION_REASON_TAGS: [
            { id: "season_in", label: "旬の食材が入荷したから", emoji: "🌟" },
            { id: "secret", label: "美味しさの秘密を知ってほしいから", emoji: "💡" },
            { id: "recommend", label: "おすすめの食べ方があるから", emoji: "👍" },
        ],
        STAFF_MESSAGE_TAGS: [
            { id: "passion", label: "料理への想い", emoji: "🔥", message: "一皿一皿に心を込めて作っています", hook: "料理人として大切にしていること", target: "美味しいものを探している方" },
            { id: "hospitality", label: "おもてなし", emoji: "💝", message: "心地よい時間を過ごしていただきたいです", hook: "当店が目指す空間作り", target: "ゆっくりくつろぎたい方" },
        ],
        SALON_SCENE_TAGS: [ // will rename property conceptually later, using same name for compatibility
            { id: "prep", label: "仕込み風景", emoji: "🔪", scene: "開店前の仕込みの様子" },
            { id: "cooking", label: "調理風景", emoji: "🍳", scene: "厨房での調理の様子" },
            { id: "hall", label: "店内の様子", emoji: "🪑", scene: "準備が整った店内の様子" },
            { id: "farm", label: "買い出し", emoji: "🛒", scene: "新鮮な食材の仕入れの様子" },
        ],
        SCENE_MESSAGE_TAGS: [
            { id: "care", label: "丁寧な仕事", emoji: "✨", message: "見えない部分も丁寧に仕込んでいます", target: "食にこだわる方" },
            { id: "fresh", label: "鮮度", emoji: "🌿", message: "その日一番良いものをお届けします", target: "新鮮なものを食べたい方" },
        ],
        MESSAGE_TONE_TAGS: [
            { id: "appetizing", label: "シズル感たっぷりに", emoji: "🤤", note: "思わずお腹が空くような表現で" },
            { id: "warm", label: "温かみがある", emoji: "☕", note: "アットホームで親しみやすい表現" },
            { id: "chef", label: "専門家として", emoji: "👨‍🍳", note: "プロの料理人としてのこだわりを伝える" },
        ],
        TODAYS_FOCUS_TAGS: [
            { id: "weather_cold", label: "寒い日", emoji: "❄️", note: "寒い日にぴったりの温かいメニュー" },
            { id: "weather_hot", label: "暑い日", emoji: "☀️", note: "暑い日におすすめのさっぱりメニュー" },
            { id: "weekend", label: "週末", emoji: "🎉", note: "週末のご褒美や集まりに" },
            { id: "new_menu", label: "新メニュー開始", emoji: "🆕", note: "今日から始まる新しい味" },
        ],
        NOTICE_TYPE_TAGS: [
            { id: "vacancy", label: "空席情報", emoji: "🪑", type: "本日の空席状況", detail: "現在すぐにご案内可能です" },
            { id: "soldout", label: "売り切れ", emoji: "📢", type: "人気メニュー完売のお知らせ", detail: "本日の〇〇は完売いたしました" },
            { id: "holiday", label: "休業日", emoji: "📅", type: "休業日のお知らせ", detail: "〇日はお休みをいただきます" },
            { id: "event", label: "イベント", emoji: "🎉", type: "特別イベントのお知らせ", detail: "特別なディナーイベントを開催します" },
        ],
        URGENCY_TAGS: [
            { id: "today", label: "本日", emoji: "📌", urgency: "本日限定", phrase: "本日ご来店の方に" },
            { id: "limited", label: "数量限定", emoji: "⚡", urgency: "数量限定", phrase: "なくなり次第終了となります" },
            { id: "weekend", label: "今週末", emoji: "📆", urgency: "今週末まで", phrase: "今週末までの特別メニューです" },
        ],
        VOICE_CATEGORIES: [
            { id: "by_menu", label: "メニューの感想", emoji: "🍽️" },
            { id: "by_scene", label: "利用シーンの感想", emoji: "🎉" },
        ],
        VOICE_OPTION_TAGS: [
            { id: "v_taste", categoryId: "by_menu", label: "美味しさ", emoji: "😋", concern: "初めての来店", result: "想像以上の美味しさでした" },
            { id: "v_volume", categoryId: "by_menu", label: "ボリューム", emoji: "🍱", concern: "しっかり食べたい", result: "大満足のボリュームでした" },
            { id: "v_atmosphere", categoryId: "by_scene", label: "雰囲気", emoji: "✨", concern: "ゆっくり過ごしたい", result: "居心地が良くて長居してしまいました" },
            { id: "v_family", categoryId: "by_scene", label: "子連れ", emoji: "👶", concern: "子供連れで不安", result: "スタッフさんが優しくて安心しました" },
        ],
    }
};
