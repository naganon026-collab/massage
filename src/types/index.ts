export type Pattern = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I";

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
}

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
        id: "F",
        title: "今日の旬な投稿",
        description: "日付・季節・時期をもとに今日投稿すべき最適な内容をAIが自動で決めて生成",
        useWeather: true,
        isAuto: true,
        questions: {
            q1: "", ex1: "",
            q2: "", ex2: "",
            q3: "", ex3: "",
        }
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
    { id: "acquire", label: "集客・認知", description: "新規やリーチを増やしたい", patternIds: ["A", "B", "D"] as const satisfies readonly Pattern[] },
    { id: "connect", label: "つながり・ファン化", description: "リピート・指名を増やしたい", patternIds: ["E", "H"] as const satisfies readonly Pattern[] },
    { id: "action", label: "今すぐ動いてほしい", description: "予約や反応をすぐ取りたい", patternIds: ["C", "G"] as const satisfies readonly Pattern[] },
    { id: "easy", label: "手軽・ネタに困ったとき", description: "ネタや入力を減らしたい", patternIds: ["F", "I"] as const satisfies readonly Pattern[] },
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
] as const;

export type TreatmentTagId = (typeof TREATMENT_TAGS)[number]["id"];

export const EDUCATION_TAGS = [
    {
        id: "ng_care",
        label: "NGヘアケア",
        emoji: "🚫",
        theme: "やってはいけないNGヘアケア",
        items: "①濡れたまま寝る→キューティクルが傷む　②アイロン180度以上→タンパク変性が起きる　③市販シャンプーの洗浄力が強すぎる→頭皮が乾燥する",
        solution: "正しいケア方法とサロントリートメントで改善できます",
    },
    {
        id: "market_vs_salon",
        label: "市販 vs サロン",
        emoji: "⚖️",
        theme: "市販品とサロン品の本当の違い",
        items: "①成分の違い→サロン品は髪内部から補修　②洗浄力の違い→市販品は皮脂を取りすぎる　③持続性の違い→サロン品は効果が長続きする",
        solution: "サロン専売品をプロが髪質に合わせてご提案します",
    },
    {
        id: "season_care",
        label: "季節のヘアケア",
        emoji: "🌸",
        theme: "季節ごとの正しいヘアケア法",
        items: "①春→花粉・湿気で頭皮が敏感になりやすい　②夏→紫外線ダメージが蓄積する　③秋冬→乾燥で静電気・切れ毛が増える",
        solution: "季節に合わせたケアプランをカウンセリングでご提案します",
    },
    {
        id: "color_damage",
        label: "カラーダメージ",
        emoji: "🎨",
        theme: "カラーダメージを最小限にする方法",
        items: "①カラー前の補修→ダメージを抑える前処理が重要　②放置時間の管理→長すぎると過剰にダメージ　③カラー後のケア→48時間が最も重要",
        solution: "ダメージレスカラーとプレックス処理でダメージを最小限に",
    },
    {
        id: "hair_loss",
        label: "抜け毛・薄毛",
        emoji: "🌿",
        theme: "抜け毛・薄毛が気になる方へのヘアケア",
        items: "①シャンプーの仕方→爪を立てると頭皮が傷む　②ドライヤーの熱→頭皮に近づけすぎない　③血行不良→頭皮マッサージ不足が原因のことも",
        solution: "頭皮環境を整える薄毛カウンセリングをご提供しています",
    },
    {
        id: "gray_hair",
        label: "白髪ケア",
        emoji: "✨",
        theme: "白髪と上手に付き合う方法",
        items: "①無理に抜く→毛根が傷み増える原因に　②市販の白髪染め→頭皮への刺激が強い　③グレイヘアの活かし方→隠すだけが正解ではない",
        solution: "ゼロタッチカラーやグレイヘアデザインで自然に美しく",
    },
    {
        id: "curl_frizz",
        label: "くせ毛・広がり",
        emoji: "💫",
        theme: "くせ毛・広がりをコントロールする方法",
        items: "①乾かし方→半乾きのまま放置が広がりの原因　②シャンプー選び→保湿成分が少ないと広がる　③アウトバストリートメント→種類を間違えると重くなる",
        solution: "髪質改善トリートメントや縮毛矯正で根本から解決できます",
    },
    {
        id: "styling",
        label: "スタイリング術",
        emoji: "💇",
        theme: "プロが教えるスタイリングの正しい方法",
        items: "①ドライヤーの方向→上から下に当てるとツヤが出る　②アイロンの温度→髪質によって適温が違う　③スタイリング剤の量→つけすぎはべたつきの原因",
        solution: "サロンで正しいスタイリング方法をレクチャーします",
    },
    {
        id: "scalp_care",
        label: "頭皮ケア",
        emoji: "🧴",
        theme: "頭皮ケアが髪質を変える理由",
        items: "①頭皮の皮脂バランス→洗いすぎも洗わなさすぎもNG　②頭皮の血行→首・肩のこりが髪に影響する　③シャンプーの泡立て方→泡で洗うのが正解",
        solution: "頭皮診断と専用トリートメントでスカルプケアをご提供します",
    },
    {
        id: "home_care",
        label: "おうちケア",
        emoji: "🏠",
        theme: "サロンケアを長持ちさせるおうちでのケア方法",
        items: "①シャンプーの頻度→毎日洗いすぎると頭皮が乾燥　②タオルドライ→ゴシゴシ拭くとキューティクルが傷む　③ドライヤーの距離→近すぎると熱ダメージが蓄積",
        solution: "サロン専売品とセットでホームケアをトータル提案します",
    },
] as const;

export type EducationTagId = (typeof EDUCATION_TAGS)[number]["id"];

/** パターンE・H共通で使う「伝えたいこと」タグ */
export const STAFF_MESSAGE_TAGS = [
    { id: "commitment", label: "こだわり", emoji: "🔥", message: "お客様一人ひとりの髪質・ライフスタイルに合わせた施術にこだわっています", hook: "美容師として一番大切にしていること、少し話させてください", target: "丁寧な施術を求めている方・じっくり相談したい方" },
    { id: "episode", label: "印象的なエピソード", emoji: "✨", message: "お客様が仕上がりを見て喜んでくださった瞬間が、この仕事を続ける原動力です", hook: "先日、忘れられない出来事がありました", target: "初めての方・過去に失敗経験がある方" },
    { id: "why_beauty", label: "美容師になった理由", emoji: "💫", message: "人を綺麗にすることで自信を持ってもらいたい、という想いでこの仕事を選びました", hook: "なぜ美容師になったのか、今日は少し話させてください", target: "サロン選びで迷っている方・スタッフの人柄を知りたい方" },
    { id: "skill_growth", label: "技術へのこだわり", emoji: "📚", message: "技術は一生勉強だと思っています。お客様のためにどんなことも学び続けます", hook: "先日、新しい技術を習得してきました", target: "技術の高さを求めている方・最新のトリートメントを試したい方" },
    { id: "customer_first", label: "お客様への想い", emoji: "💝", message: "来店してよかったと思っていただけることが、私が一番大切にしていることです", hook: "お客様から言われて、一番嬉しかった言葉があります", target: "居心地のよいサロンを探している方・長く通えるサロンを探している方" },
    { id: "consultation", label: "カウンセリングへのこだわり", emoji: "💬", message: "施術前のカウンセリングに一番時間をかけています。なりたいイメージを一緒に言語化します", hook: "「うまく伝えられるか不安」という方へ", target: "希望をうまく伝えられるか不安な方・イメチェンしたいけど迷っている方" },
] as const;

export type StaffMessageTagId = (typeof STAFF_MESSAGE_TAGS)[number]["id"];

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

export type SalonSceneTagId = (typeof SALON_SCENE_TAGS)[number]["id"];

/** パターンC：お知らせの種類 */
export const NOTICE_TYPE_TAGS = [
    { id: "vacancy", label: "空きあり", emoji: "📅", type: "本日・今週の予約空き状況のお知らせ", detail: "ご予約の空きが出ました。お早めにどうぞ" },
    { id: "campaign", label: "キャンペーン", emoji: "🎁", type: "期間限定キャンペーン・割引のお知らせ", detail: "期間限定のお得なキャンペーンを実施中です" },
    { id: "new_menu", label: "新メニュー", emoji: "✨", type: "新しいメニュー・技術の導入のお知らせ", detail: "新しいメニューを始めました。ぜひお試しください" },
    { id: "new_product", label: "新商品入荷", emoji: "🆕", type: "新しいトリートメント・商品の入荷のお知らせ", detail: "新しいサロン専売品が入荷しました" },
    { id: "holiday", label: "休業・営業時間変更", emoji: "📢", type: "臨時休業・営業時間変更のお知らせ", detail: "営業時間・休業日についてご案内があります" },
    { id: "event", label: "イベント・特典", emoji: "🌸", type: "季節のイベント・特典のお知らせ", detail: "季節限定のイベントや特典をご用意しました" },
] as const;

export type NoticeTypeTagId = (typeof NOTICE_TYPE_TAGS)[number]["id"];

/** パターンC：緊急度・期間 */
export const URGENCY_TAGS = [
    { id: "from_today", label: "本日から", emoji: "📌", urgency: "本日から", phrase: "本日からご案内しています。お早めにどうぞ" },
    { id: "today", label: "本日限定", emoji: "🔥", urgency: "本日のみ", phrase: "本日のみのご案内です。お早めにご連絡ください" },
    { id: "this_week", label: "今週末まで", emoji: "⏰", urgency: "今週末まで", phrase: "今週末までの限定です。お見逃しなく" },
    { id: "this_month", label: "今月末まで", emoji: "📆", urgency: "今月末まで", phrase: "今月末までのご案内です。お早めにどうぞ" },
    { id: "limited_seats", label: "残り僅か", emoji: "⚡", urgency: "残り枠わずか", phrase: "残り枠がわずかとなっています。お急ぎください" },
    { id: "ongoing", label: "随時受付中", emoji: "✅", urgency: "随時受付中", phrase: "随時受け付けております。お気軽にご連絡ください" },
] as const;

export type UrgencyTagId = (typeof URGENCY_TAGS)[number]["id"];

/** パターンD：お客様の声のカテゴリ（1段階目・厳選2つ） */
export const VOICE_CATEGORIES = [
    { id: "by_treatment", label: "施術で選ぶ", emoji: "✂️" },
    { id: "by_change", label: "変化・お悩みで選ぶ", emoji: "✨" },
] as const;

export type VoiceCategoryId = (typeof VOICE_CATEGORIES)[number]["id"];

/** パターンD：お客様の声の選択肢（2段階目・厳選10個・カテゴリ別） */
export const VOICE_OPTION_TAGS = [
    { id: "v_hair_quality", categoryId: "by_treatment" as const, label: "髪質改善", emoji: "✨", concern: "髪のパサつき・広がり・まとまらない", result: "サラサラでまとまりやすい髪に" },
    { id: "v_color", categoryId: "by_treatment" as const, label: "カラー", emoji: "🎨", concern: "髪色がパッとしない・自分に似合う色がわからない", result: "顔まわりが明るく垢抜けた印象に" },
    { id: "v_straight", categoryId: "by_treatment" as const, label: "縮毛矯正", emoji: "💫", concern: "くせ毛・うねりで毎朝のスタイリングが大変", result: "朝のスタイリング時間が大幅に短縮" },
    { id: "v_cut", categoryId: "by_treatment" as const, label: "カット", emoji: "✂️", concern: "なんとなく重い・スタイルがきまらない", result: "軽やかでまとまりやすいスタイルに" },
    { id: "v_gray_treatment", categoryId: "by_treatment" as const, label: "白髪・トリートメント", emoji: "💎", concern: "白髪が気になる・ダメージで手触りが悪い", result: "自然な仕上がり・ツヤツヤの髪に" },
    { id: "v_smooth", categoryId: "by_change" as const, label: "サラサラになった", emoji: "✨", concern: "パサつき・広がり・まとまらなさ", result: "サラサラでツヤが出た" },
    { id: "v_styling_easy", categoryId: "by_change" as const, label: "スタイリングが楽", emoji: "💇", concern: "毎朝のスタイリングに時間がかかっていた", result: "朝の支度が楽になった" },
    { id: "v_color_satisfied", categoryId: "by_change" as const, label: "色に満足", emoji: "🎨", concern: "自分に似合う色がわからない・失敗した", result: "イメージ通りの色・似合うと言われた" },
    { id: "v_curl_gone", categoryId: "by_change" as const, label: "くせが気にならなくなった", emoji: "💫", concern: "くせ毛・うねりが悩み", result: "くせが気にならなくなった・まとまるようになった" },
    { id: "v_damage_heal", categoryId: "by_change" as const, label: "傷みが改善", emoji: "💎", concern: "枝毛・パサつき・ダメージ", result: "指通りが良くなった・傷みが気にならなくなった" },
] as const;

export type VoiceOptionTagId = (typeof VOICE_OPTION_TAGS)[number]["id"];
