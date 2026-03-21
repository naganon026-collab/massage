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
        title: "サロンの裏側・日常",
        description: "「清潔感」「丁寧さ」「人間味」を伝えてサロンへの安心感と親近感を醸成。リピーター維持に効果的",
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
        id: "hair_quality",
        label: "髪質改善",
        emoji: "✨",
        concern: "髪のパサつき・広がり・まとまらない",
        approach: "髪質改善トリートメントで芯から補修",
        result: "サラサラでまとまりやすい髪に",
    },
    {
        id: "trend_color",
        label: "トレンドカラー",
        emoji: "🎨",
        concern: "髪色がパッとしない・自分に似合う色がわからない",
        approach: "骨格・肌色に合わせたカラー提案",
        result: "顔まわりが明るくなり垢抜けた印象に",
    },
    {
        id: "straight",
        label: "縮毛矯正",
        emoji: "💫",
        concern: "くせ毛・うねりで毎朝のスタイリングが大変",
        approach: "ダメージを抑えた縮毛矯正",
        result: "朝のスタイリング時間が大幅に短縮",
    },
    {
        id: "cut",
        label: "ヘアカット",
        emoji: "✂️",
        concern: "なんとなく重い・スタイルがきまらない",
        approach: "顔型・ライフスタイルに合わせたカット",
        result: "軽やかでまとまりやすいスタイルに",
    },
    {
        id: "gray",
        label: "白髪染め",
        emoji: "🌿",
        concern: "白髪が気になって自信が持てない",
        approach: "頭皮に優しい白髪染め・グレイカラー",
        result: "自然な仕上がりで若々しい印象に",
    },
    {
        id: "perm",
        label: "パーマ",
        emoji: "🌊",
        concern: "髪にボリュームが出ない・スタイルが長持ちしない",
        approach: "髪質に合わせたパーマ設計",
        result: "朝のスタイリングが楽になりふんわり感が続く",
    },
    {
        id: "treatment",
        label: "トリートメント",
        emoji: "💎",
        concern: "ダメージが気になる・手触りが悪い",
        approach: "集中補修トリートメント",
        result: "指通りなめらかでツヤツヤの髪に",
    },
    {
        id: "bleach",
        label: "ブリーチ",
        emoji: "⚡",
        concern: "理想の色にならない・透明感が出ない",
        approach: "ダメージ最小限のケアブリーチ",
        result: "透き通るような透明感カラーが実現",
    },
    {
        id: "gray_transition",
        label: "脱白髪染め",
        emoji: "🌿",
        concern: "頻繁な白髪染めに疲弊している",
        approach: "ハイライトを駆使したグレイヘア移行プログラム",
        result: "白髪を活かした美しいデザインカラーに",
    },
    {
        id: "no_styling_cut",
        label: "ノースタイリング保証",
        emoji: "✂️",
        concern: "朝のセット・アイロンの時間が惜しい",
        approach: "手で乾かすだけで完璧なフォルムになる骨格補正カット",
        result: "アイロン不要で毎朝の時短が確実に",
    },
    {
        id: "silent_retreat",
        label: "無言接客（サイレント）",
        emoji: "🤫",
        concern: "美容院での会話に気を使って疲れてしまう",
        approach: "一切の会話を排除し、静寂を約束するサードプレイス空間",
        result: "心から休まり、精神的なデトックスができた状態に",
    },
    {
        id: "brain_recovery_spa",
        label: "脳疲労回復スパ",
        emoji: "🧠",
        concern: "慢性的なストレスや自律神経の乱れ、不眠",
        approach: "デバイス測定と五感パーソナライズによる深層ヘッドスパ",
        result: "自律神経が整い、深いリラックスと睡眠の質が向上",
    },
    {
        id: "express_15min",
        label: "15分お直しエクスプレス",
        emoji: "⚡",
        concern: "大切なイベント直前に、サッとプロのクオリティーにしたい",
        approach: "濡らさず15分で完了するスタイリング・前髪カット特化",
        result: "一瞬で完璧な第一印象のセットが完成",
    },
    {
        id: "subscription",
        label: "定期通い放題（サブスク）",
        emoji: "🔁",
        concern: "常に前髪や根元のプリン状態を完璧に保ちたい",
        approach: "前髪・カラーリタッチ等の無制限メンテナンス",
        result: "常にプロの仕上げで、人生からプリン状態が消滅",
    },
    {
        id: "commit_treatment",
        label: "結果コミット型髪質改善",
        emoji: "🤝",
        concern: "いろいろ試しても髪質が根本的に良くならない",
        approach: "目標の髪質に到達するまでの完全オーダーメイド伴走",
        result: "長年の悩みが解消され、確実に理想のツヤ髪に",
    },
    {
        id: "inner_beauty",
        label: "インナービューティー",
        emoji: "🥗",
        concern: "髪だけでなく、肌荒れや全身の不調も気になる",
        approach: "専門家と連携した食事・細胞レベルからの内側ケア",
        result: "体質から改善され、全身の美しさと健康が手に入る",
    },
    {
        id: "ai_simulation",
        label: "AI・3D似合わせ",
        emoji: "🤖",
        concern: "似合わないかもと怖くて、新しい髪型に挑戦できない",
        approach: "AI診断と3Dモデルでの完全予測シミュレーション",
        result: "失敗の恐怖が排除され、確実に似合うスタイルに",
    },
] as const;

/** パターンA：今日のお客様のお悩みタグ */
export const CONCERN_TAGS = [
    { id: "heavy", label: "なんとなく重い", emoji: "😔" },
    { id: "frizz", label: "広がり・うねりが気になる", emoji: "🌀" },
    { id: "styling", label: "朝のスタイリングが大変", emoji: "⏰" },
    { id: "damage", label: "パサつき・ダメージ", emoji: "💔" },
    { id: "flat", label: "ボリュームが出ない", emoji: "😞" },
    { id: "gray", label: "白髪が気になる", emoji: "🌿" },
    { id: "face", label: "顔まわりをすっきりしたい", emoji: "✨" },
    { id: "image", label: "イメチェンしたい", emoji: "🌟" },
    { id: "color", label: "色がパッとしない", emoji: "🎨" },
    { id: "scalp", label: "頭皮が気になる", emoji: "🧴" },
    { id: "fatigue", label: "接客や会話に疲れる", emoji: "🤫" },
    { id: "time_poor", label: "美容に割く時間がない", emoji: "⏰" },
    { id: "gray_stress", label: "白髪染めループが辛い", emoji: "🔄" },
    { id: "inner_health", label: "体質・根本から変えたい", emoji: "🥗" },
    { id: "fear_change", label: "失敗が怖くて変えられない", emoji: "😨" },
] as const;

export type TreatmentTagId = string;

export const EDUCATION_CATEGORIES = [
    { id: "hair_care", label: "ヘア・頭皮ケア", emoji: "🧴" },
    { id: "styling_design", label: "スタイリング・似合わせ", emoji: "✂️" },
    { id: "salon_tips", label: "美容院のトリセツ", emoji: "💡" },
    { id: "inner_health", label: "インナービューティー", emoji: "🥗" },
] as const;

export type EducationCategoryId = typeof EDUCATION_CATEGORIES[number]["id"];

export const EDUCATION_TAGS = [
    {
        id: "ng_care",
        category: "hair_care",
        label: "NGヘアケア",
        emoji: "🚫",
        theme: "やってはいけないNGヘアケア",
        items: "①濡れたまま寝る→キューティクルが傷む　②アイロン180度以上→タンパク変性が起きる　③市販シャンプーの洗浄力が強すぎる→頭皮が乾燥する",
        solution: "正しいケア方法とサロントリートメントで改善できます",
    },
    {
        id: "market_vs_salon",
        category: "hair_care",
        label: "市販 vs サロン",
        emoji: "⚖️",
        theme: "市販品とサロン品の本当の違い",
        items: "①成分の違い→サロン品は髪内部から補修　②洗浄力の違い→市販品は皮脂を取りすぎる　③持続性の違い→サロン品は効果が長続きする",
        solution: "サロン専売品をプロが髪質に合わせてご提案します",
    },
    {
        id: "season_care",
        category: "hair_care",
        label: "季節のヘアケア",
        emoji: "🌸",
        theme: "季節ごとの正しいヘアケア法",
        items: "①春→花粉・湿気で頭皮が敏感になりやすい　②夏→紫外線ダメージが蓄積する　③秋冬→乾燥で静電気・切れ毛が増える",
        solution: "季節に合わせたケアプランをカウンセリングでご提案します",
    },
    {
        id: "color_damage",
        category: "hair_care",
        label: "カラーダメージ",
        emoji: "🎨",
        theme: "カラーダメージを最小限にする方法",
        items: "①カラー前の補修→ダメージを抑える前処理が重要　②放置時間の管理→長すぎると過剰にダメージ　③カラー後のケア→48時間が最も重要",
        solution: "ダメージレスカラーとプレックス処理でダメージを最小限に",
    },
    {
        id: "hair_loss",
        category: "hair_care",
        label: "抜け毛・薄毛",
        emoji: "🌿",
        theme: "抜け毛・薄毛が気になる方へのヘアケア",
        items: "①シャンプーの仕方→爪を立てると頭皮が傷む　②ドライヤーの熱→頭皮に近づけすぎない　③血行不良→頭皮マッサージ不足が原因のことも",
        solution: "頭皮環境を整える薄毛カウンセリングをご提供しています",
    },
    {
        id: "gray_hair",
        category: "hair_care",
        label: "白髪ケア",
        emoji: "✨",
        theme: "白髪と上手に付き合う方法",
        items: "①無理に抜く→毛根が傷み増える原因に　②市販の白髪染め→頭皮への刺激が強い　③グレイヘアの活かし方→隠すだけが正解ではない",
        solution: "ゼロタッチカラーやグレイヘアデザインで自然に美しく",
    },
    {
        id: "curl_frizz",
        category: "styling_design",
        label: "くせ毛・広がり",
        emoji: "💫",
        theme: "くせ毛・広がりをコントロールする方法",
        items: "①乾かし方→半乾きのまま放置が広がりの原因　②シャンプー選び→保湿成分が少ないと広がる　③アウトバストリートメント→種類を間違えると重くなる",
        solution: "髪質改善トリートメントや縮毛矯正で根本から解決できます",
    },
    {
        id: "styling",
        category: "styling_design",
        label: "スタイリング術",
        emoji: "💇",
        theme: "プロが教えるスタイリングの正しい方法",
        items: "①ドライヤーの方向→上から下に当てるとツヤが出る　②アイロンの温度→髪質によって適温が違う　③スタイリング剤の量→つけすぎはべたつきの原因",
        solution: "サロンで正しいスタイリング方法をレクチャーします",
    },
    {
        id: "scalp_care",
        category: "hair_care",
        label: "頭皮ケア",
        emoji: "🧴",
        theme: "頭皮ケアが髪質を変える理由",
        items: "①頭皮の皮脂バランス→洗いすぎも洗わなさすぎもNG　②頭皮の血行→首・肩のこりが髪に影響する　③シャンプーの泡立て方→泡で洗うのが正解",
        solution: "頭皮診断と専用トリートメントでスカルプケアをご提供します",
    },
    {
        id: "home_care",
        category: "hair_care",
        label: "おうちケア",
        emoji: "🏠",
        theme: "サロンケアを長持ちさせるおうちでのケア方法",
        items: "①シャンプーの頻度→毎日洗いすぎると頭皮が乾燥　②タオルドライ→ゴシゴシ拭くとキューティクルが傷む　③ドライヤーの距離→近すぎると熱ダメージが蓄積",
        solution: "サロン専売品とセットでホームケアをトータル提案します",
    },
    {
        id: "aging_mental",
        category: "inner_health",
        label: "白髪染めと老け見え",
        emoji: "🌿",
        theme: "「隠す」白髪染めが、逆に老け見えを加速させる理由",
        items: "①黒染めとのコントラストによる顔のくすみ　②毎月のケミカル塗布による頭皮の老化　③根元が伸びてきた時の強烈なストレス",
        solution: "白髪を「活かす」脱白髪染めプログラムで精神的自由をご提案します",
    },
    {
        id: "time_performance",
        category: "styling_design",
        label: "アイロン・習慣の断捨離",
        emoji: "✂️",
        theme: "毎朝アイロンを強制されるカットの「構造的な欠陥」",
        items: "①アイロンに費やす年間約120時間の損失　②熱によるタンパク変性（髪の硬化）　③雨の日に崩れるという構造的弱点",
        solution: "手で乾かすだけでフォルムが決まるノースタイリング保証カット",
    },
    {
        id: "beyond_coating",
        category: "inner_health",
        label: "コーティングケアの罠",
        emoji: "💎",
        theme: "高級トリートメントをしても、髪が根本から綺麗にならない理由",
        items: "①髪は死滅細胞であり外から塗っても治癒しない　②過剰コーティングの後遺症　③ツヤの9割は食事・睡眠・血流で作られる",
        solution: "専門家と連携した細胞レベルからのインナービューティーケア",
    },
    {
        id: "salon_stress",
        category: "salon_tips",
        label: "美容院ストレスの正体",
        emoji: "🤫",
        theme: "美容院から帰ると「なぜかどっと疲れている」本当の理由",
        items: "①沈黙を恐れた無意識の気遣いによる脳疲労　②視覚・聴覚情報の過多　③「美容院＝話さなきゃいけない」という謎の常識",
        solution: "一切の会話を排除し五感を休ませる「サイレント・リトリート空間」",
    },
    {
        id: "scientific_match",
        category: "styling_design",
        label: "「似合う」の科学",
        emoji: "🤖",
        theme: "美容師の「感覚」や「センス」に任せると失敗する理由",
        items: "①美容師個人の好みへの無意識な依存　②骨格・顔パーツとの論理的なミスマッチ　③サロン特有の照明による錯覚",
        solution: "失敗の恐怖をなくす、AIと3Dモデリングを用いた完全予測似合わせ",
    },
    {
        id: "autonomic_nerve",
        category: "inner_health",
        label: "自律神経と毛髪",
        emoji: "🧠",
        theme: "パサつく髪・抜ける髪は、あなたの「自律神経からのSOS」",
        items: "①交感神経優位による頭皮血流の悪化　②睡眠の質低下が招く成長ホルモン不足　③無意識の食いしばりによる頭皮の硬化",
        solution: "自律神経を測定し副交感神経を優位にする「脳疲労回復スパ」",
    },
    {
        id: "order_tips",
        category: "salon_tips",
        label: "失敗しないオーダー術",
        emoji: "🗣️",
        theme: "美容院で失敗しないための上手なオーダー方法",
        items: "①写真を見せても伝わらない理由　②美容師に絶対伝えるべき3つのこと　③お任せオーダーの正解",
        solution: "カウンセリングに十分な時間をかけ、お客様の悩みを引き出します",
    },
    {
        id: "before_salon",
        category: "salon_tips",
        label: "行く前のNG行動",
        emoji: "🛑",
        theme: "美容院に行く前にやってはいけないNGマナー",
        items: "①行く直前のシャンプーは必要？　②ガチガチにセットして行くのはアリ？　③タートルネックやパーカーは避けるべき理由",
        solution: "お客様がリラックスして過ごせる空間づくりを徹底しています",
    },
    {
        id: "bangs_styling",
        category: "styling_design",
        label: "前髪の扱い方",
        emoji: "✂️",
        theme: "前髪のセルフカット・セルフスタイリング術",
        items: "①セルフカットでパッツンになる理由　②夕方に割れる前髪の直し方　③絶対に失敗しない前髪の乾かし方",
        solution: "前髪カットだけでも大歓迎です、プロにお任せください",
    },
    {
        id: "iron_choice",
        category: "styling_design",
        label: "アイロンの選び方",
        emoji: "🔥",
        theme: "ヘアアイロン（コテ）の選び方と適正温度",
        items: "①26mmと32mmどっちを買うべき？　②痛みにくい高級アイロンの仕組み　③髪質別のアイロン適正温度の真実",
        solution: "お客様の髪質に合った道具や温度をアドバイスします",
    },
    {
        id: "personal_color",
        category: "styling_design",
        label: "パーソナルカラー",
        emoji: "🎨",
        theme: "イエベ・ブルベにとらわれすぎる失敗",
        items: "①パーソナルカラーだけでは似合わない理由　②骨格と顔のパーツから導く似合わせデザイン　③「好きな色」を似合わせるプロの技術",
        solution: "トータルバランスで本当に一番似合うカラーをご提案します",
    },
    {
        id: "generation_care",
        category: "hair_care",
        label: "年代別エイジングケア",
        emoji: "⏳",
        theme: "年代別の髪の変化とエイジングケアの真実",
        items: "①30代・40代で突然髪質が変わる理由　②年齢に合わせたシャンプー選びの重要性　③エイジング毛特有のうねりの正体",
        solution: "エイジング毛に特化した専用の髪質改善メニューをご用意しています",
    },
    {
        id: "diet_hair",
        category: "inner_health",
        label: "食事と髪の関係",
        emoji: "🥗",
        theme: "ダイエットと食事の偏りが髪に与える影響",
        items: "①極端なダイエットで髪が真っ先にボロボロになる理由　②最高の天然トリートメントになる食べ物　③栄養不足が引き起こす抜け毛",
        solution: "健康的な美髪を作るためのインナーケアのアドバイスも行います",
    },
    {
        id: "mens_care",
        category: "hair_care",
        label: "メンズヘア・頭皮ケア",
        emoji: "👨",
        theme: "男性こそ知っておくべき正しい頭皮ケアとスタイリング",
        items: "①男性の薄毛予防は20代から必要な理由　②ワックスの付けすぎによる頭皮ダメージ　③モテるメンズの清潔感の作り方",
        solution: "男性特有の悩みに合わせたメンズ専用メニューをご用意しています",
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
    { id: "commitment", label: "こだわり", emoji: "🔥", message: "サロンワークの中で私が絶対に譲れないポイントと、その背景にある想い", hook: "当店が他とは違うアプローチをしているのには、ある理由があります", target: "丁寧な施術を求めている方・じっくり相談したい方" },
    { id: "episode", label: "印象的なエピソード", emoji: "✨", message: "お客様からいただいた一言や、施術を通じた忘れられない出来事", hook: "先日ご来店いただいたお客様との間で、とても嬉しい出来事がありました", target: "初めての方・過去に失敗経験がある方" },
    { id: "why_beauty", label: "美容師になった理由", emoji: "💫", message: "自分のコンプレックスを解消してくれた美容の力を、今度は自分が届けたいという原点", hook: "私がこの職業を選んだきっかけについて、少しお時間いただけますか", target: "サロン選びで迷っている方・スタッフの人柄を知りたい方" },
    { id: "skill_growth", label: "技術へのこだわり", emoji: "📚", message: "現状に甘んじることなく、休日も新しい技術や知識を貪欲に吸収し続ける姿勢", hook: "現状の技術に満足せず、常にアップデートし続けるための最近の取り組み", target: "技術の高さを求めている方・最新のトリートメントを試したい方" },
    { id: "customer_first", label: "お客様への想い", emoji: "💝", message: "髪を綺麗にするだけでなく、身も心もリラックスして帰っていただける居場所でありたい", hook: "「ここに来ると元気になる」その言葉を引き出すためのお店づくり", target: "居心地のよいサロンを探している方・長く通えるサロンを探している方" },
    { id: "consultation", label: "カウンセリングへのこだわり", emoji: "💬", message: "施術に入る前のヒアリングで、お客様の潜在的な悩みや理想を徹底的に引き出すこと", hook: "「うまく伝えられない」と不安な方にこそ知ってほしい、当店の初回アプローチ", target: "希望をうまく伝えられるか不安な方・イメチェンしたいけど迷っている方" },
    { id: "scissors_love", label: "道具・ハサミへの愛", emoji: "✂️", message: "決して安くないプロ専用の道具を厳選し、ミリ単位の仕上がりに責任を持つプロ意識", hook: "「え、そんなに違うの？」よく驚かれる、使うハサミでダメージが変わるという事実", target: "プロの技術やこだわりを知りたい方" },
    { id: "product_obsession", label: "商材選びの裏話", emoji: "🧪", message: "どんなに原価が高くても、自分の髪と肌で納得いくまでテストした本物の薬だけを採用する", hook: "絶対に妥協したくなくて「自腹で人体実験」を繰り返した末の答え", target: "髪へのダメージを極力抑えたい方・安全性を重視する方" },
    { id: "interior_secret", label: "空間・内装の秘密", emoji: "🛋️", message: "視覚や聴覚からもリフレッシュしていただくために店内の随所に仕掛けられた配慮", hook: "リラックス空間を作るため、実はサロン内の照明や音楽に「3つの秘密」を隠しています", target: "美容院で本当にリラックスしたい方" },
    { id: "past_failure", label: "失敗から学んだ過去", emoji: "🌱", message: "かつて不器用で失敗ばかりだった経験があるからこそ、お客様の痛みがわかるという強み", hook: "アシスタント時代、一番怒られていた私が今思う「遠回りしたからこそ見えた景色」", target: "美容師の人柄やストーリーを知りたい・共感したい方" },
    { id: "honest_request", label: "美容師の切実な本音", emoji: "🗣️", message: "プロの目線からお客様を想うがゆえにお伝えしたい、本当に正しい選択やNG行為", hook: "プロとしてこれだけは絶対に避けてほしい！と本気で思っているヘアケアNG行動", target: "信頼してすべて任せたい・本音のアドバイスが欲しい方" },
    { id: "private_insight", label: "日常からのヒント", emoji: "☕", message: "サロンを離れたプライベートな時間や趣味から得られる、デザインへの思いがけない発見", hook: "休日の何気ないカフェ巡りやアート鑑賞が、実はヘアカラーの配合のヒントになっている", target: "スタッフのプライベートな一面やセンスを知りたい方" },
    { id: "future_vision", label: "これからの目標・挑戦", emoji: "🚀", message: "今来てくれているお客様にさらに新鮮な驚きを提供するための、中長期的なビジョン", hook: "5年後、このサロンをただの美容院ではない「特別な場所」にするための計画", target: "長く通い続けサロンの成長を一緒に楽しんでくれる方" },
] as const;

export type StaffMessageTagId = string;

/** パターンH専用の「今日の場面」タグ */
export const SALON_SCENE_TAGS = [
    { id: "preparation", label: "施術準備", emoji: "🔧", scene: "今日の施術前の準備風景" },
    { id: "study", label: "勉強・研修", emoji: "📚", scene: "スタッフの勉強会・技術研修の様子" },
    { id: "new_product", label: "新商品・新技術", emoji: "🆕", scene: "新しいトリートメント剤・薬剤・道具が届いた" },
    { id: "customer_voice", label: "お客様の反応", emoji: "😊", scene: "お客様から嬉しい言葉をいただいた瞬間" },
    { id: "morning_open", label: "開店準備", emoji: "🌅", scene: "今日の開店前・朝の準備の様子" },
    { id: "team", label: "スタッフの日常", emoji: "👥", scene: "スタッフ同士の何気ない日常の一コマ" },
    { id: "season_deco", label: "季節の飾り付け", emoji: "🌸", scene: "サロンの季節の装飾・ディスプレイの様子" },
    { id: "tool_care", label: "道具のお手入れ", emoji: "✂️", scene: "ハサミや道具を丁寧にお手入れしている様子" },
] as const;

export type SalonSceneTagId = string;

/** パターンH専用：場面から伝えるメッセージタグ（STAFF_MESSAGE_TAGSとは別物） */
export const SCENE_MESSAGE_TAGS = [
    { id: "care_quality", label: "丁寧さ・こだわり", emoji: "🔥", message: "細部までこだわった丁寧な施術・準備をしていることが伝わる一言", target: "丁寧な施術を求めている方・長く通えるサロンを探している方" },
    { id: "team_work", label: "チームワーク", emoji: "👥", message: "スタッフ同士の連携・信頼関係がお客様への安心感につながることを伝える", target: "初めての方・アットホームな雰囲気を求めている方" },
    { id: "learning", label: "技術・知識への姿勢", emoji: "📚", message: "常に学び続けているプロとしての姿勢・向上心を伝える", target: "技術の高さを重視している方・最新メニューを試したい方" },
    { id: "customer_joy", label: "お客様への想い", emoji: "💝", message: "お客様に喜んでもらうことが一番の原動力だという気持ちを伝える", target: "居心地のよいサロンを探している方・初めての方" },
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
    { id: "weather", label: "今日の天気・気候", emoji: "🌤️", note: "天気や気温の変化を切り口にする" },
    { id: "customer", label: "今日のお客様の反応", emoji: "😊", note: "今日担当したお客様の嬉しい反応を切り口にする" },
    { id: "trend", label: "今気になるトレンド", emoji: "🔥", note: "今の美容トレンドを切り口にする" },
    { id: "season", label: "この時期ならではの悩み", emoji: "🌸", note: "季節特有の髪の悩みを切り口にする" },
    { id: "event", label: "もうすぐ行事・イベント", emoji: "🎉", note: "卒業・入学・GWなど近づいているイベントを切り口にする" },
    { id: "morning", label: "朝のスタイリング", emoji: "⏰", note: "朝の支度・スタイリングの悩みを切り口にする" },
] as const;

/** パターンC：お知らせの種類 */
export const NOTICE_TYPE_TAGS = [
    { id: "vacancy", label: "空きあり", emoji: "📅", type: "本日・今週の予約空き状況のお知らせ", detail: "ご予約の空きが出ました。お早めにどうぞ" },
    { id: "campaign", label: "キャンペーン", emoji: "🎁", type: "期間限定キャンペーン・割引のお知らせ", detail: "期間限定のお得なキャンペーンを実施中です" },
    { id: "new_menu", label: "新メニュー", emoji: "✨", type: "新しいメニュー・技術の導入のお知らせ", detail: "新しいメニューを始めました。ぜひお試しください" },
    { id: "new_product", label: "新商品入荷", emoji: "🆕", type: "新しいトリートメント・商品の入荷のお知らせ", detail: "新しいサロン専売品が入荷しました" },
    { id: "holiday", label: "休業・営業時間変更", emoji: "📢", type: "臨時休業・営業時間変更のお知らせ", detail: "営業時間・休業日についてご案内があります" },
    { id: "event", label: "イベント・特典", emoji: "🌸", type: "季節のイベント・特典のお知らせ", detail: "季節限定のイベントや特典をご用意しました" },
    { id: "staff_schedule", label: "スタッフ出勤・お休み", emoji: "🗓️", type: "スタッフの出勤日・休業日のお知らせ", detail: "スタッフの出勤スケジュールをお知らせします" },
    { id: "staff_activities", label: "スタッフ活動報告", emoji: "🏆", type: "講習会参加やコンテストなどの活動報告", detail: "スタッフの活動や技術習得について報告します" },
    { id: "hiring", label: "スタッフ募集・求人", emoji: "🤝", type: "アシスタント・スタイリスト募集のお知らせ", detail: "一緒に働く仲間を募集しています" },
    { id: "booking_status", label: "予約状況・早め予約", emoji: "🔔", type: "予約の混雑状況や早めのご予約のお願い", detail: "ご予約が混み合ってきております。お早めにどうぞ" },
    { id: "price_revision", label: "価格改定・リニューアル", emoji: "💰", type: "メニューの価格改定や内容変更のお知らせ", detail: "一部メニューの価格改定・変更に関する重要なお知らせです" },
    { id: "cancellation_policy", label: "キャンセルポリシー", emoji: "⚠️", type: "キャンセルや遅刻に関するルールのご案内", detail: "ご予約の変更・キャンセルに関するお願いです" },
    { id: "shop_info", label: "アクセス・店内設備", emoji: "🏠", type: "駐車場やお店の場所・店内改善のお知らせ", detail: "お店へのアクセスや店内設備に関するご案内です" },
    { id: "media_appearance", label: "メディア掲載情報", emoji: "📰", type: "雑誌掲載やWebメディア紹介のお知らせ", detail: "当サロンがメディアで紹介されました" },
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
    { id: "v_hair_quality", categoryId: "by_treatment" as const, label: "髪質改善", emoji: "✨", concern: "髪のパサつき・広がり・まとまらない", result: "サラサラでまとまりやすい髪に" },
    { id: "v_color", categoryId: "by_treatment" as const, label: "カラー", emoji: "🎨", concern: "髪色がパッとしない・自分に似合う色がわからない", result: "顔まわりが明るく垢抜けた印象に" },
    { id: "v_straight", categoryId: "by_treatment" as const, label: "縮毛矯正", emoji: "💫", concern: "くせ毛・うねりで毎朝のスタイリングが大変", result: "朝のスタイリング時間が大幅に短縮" },
    { id: "v_cut", categoryId: "by_treatment" as const, label: "カット", emoji: "✂️", concern: "なんとなく重い・スタイルがきまらない", result: "軽やかでまとまりやすいスタイルに" },
    { id: "v_gray_treatment", categoryId: "by_treatment" as const, label: "白髪・トリートメント", emoji: "💎", concern: "白髪が気になる・ダメージで手触りが悪い", result: "自然な仕上がり・ツヤツヤの髪に" },
    { id: "v_perm", categoryId: "by_treatment" as const, label: "パーマ", emoji: "🌊", concern: "過去にパーマで失敗したトラウマがある", result: "ダメージレスで理想通りのゆるふわに" },
    { id: "v_head_spa", categoryId: "by_treatment" as const, label: "ヘッドスパ", emoji: "💆", concern: "頭皮の疲れ・顔のむくみやくすみ", result: "日々の疲れが吹き飛び顔色も明るく" },
    { id: "v_face_framing", categoryId: "by_treatment" as const, label: "前髪・顔周り", emoji: "✂️", concern: "前髪が割れる・顔周りのデザインがしっくりこない", result: "整形級に顔の印象が変わり小顔効果も" },
    
    { id: "v_smooth", categoryId: "by_change" as const, label: "サラサラになった", emoji: "✨", concern: "パサつき・広がり・まとまらなさ", result: "サラサラでツヤが出た" },
    { id: "v_styling_easy", categoryId: "by_change" as const, label: "スタイリングが楽", emoji: "💇", concern: "毎朝のスタイリングに時間がかかっていた", result: "朝の支度が楽になった" },
    { id: "v_color_satisfied", categoryId: "by_change" as const, label: "色に満足", emoji: "🎨", concern: "自分に似合う色がわからない・失敗した", result: "イメージ通りの色・似合うと言われた" },
    { id: "v_curl_gone", categoryId: "by_change" as const, label: "くせが気にならなくなった", emoji: "💫", concern: "くせ毛・うねりが悩み", result: "くせが気にならなくなった・まとまるようになった" },
    { id: "v_damage_heal", categoryId: "by_change" as const, label: "傷みが改善", emoji: "💎", concern: "枝毛・パサつき・ダメージ", result: "指通りが良くなった・傷みが気にならなくなった" },
    { id: "v_silent_relax", categoryId: "by_change" as const, label: "会話少なめでよかった", emoji: "🤫", concern: "美容室での会話が苦手だった", result: "ちょうど良い距離感でとてもリラックスできました" },
    { id: "v_no_styling", categoryId: "by_change" as const, label: "朝が劇的に楽に", emoji: "⏰", concern: "毎朝のセットが面倒だった", result: "乾かすだけで本当に美容室帰りの形になった" },
    { id: "v_gray_free", categoryId: "by_change" as const, label: "白髪の悩みから解放", emoji: "🌿", concern: "度重なる白髪染めが苦痛だった", result: "白髪を活かしたカラーで周囲からも褒められた" },
    { id: "v_complimented", categoryId: "by_change" as const, label: "周りから褒められた", emoji: "🥰", concern: "自分に自信が持てない・垢抜けたい", result: "家族や同僚に「若返ったね！」と大絶賛された" },
    { id: "v_counseling", categoryId: "by_change" as const, label: "わかってくれた", emoji: "🤝", concern: "どこの美容室でも細かいニュアンスが伝わらなかった", result: "初めて自分の理想を完全に理解して形にしてくれた" },
    { id: "v_anti_aging", categoryId: "by_change" as const, label: "エイジング悩み解消", emoji: "🌟", concern: "トップのボリュームが出ず老けて見えていた", result: "ふんわり若々しくなり鏡を見るのが楽しくなった" },
    { id: "v_find_salon", categoryId: "by_change" as const, label: "美容室難民の脱却", emoji: "🏡", concern: "長年しっくりくるサロンがなく転々としていた", result: "やっと「ずっと通いたい」と思える運命の美容室に出会えた" },
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
