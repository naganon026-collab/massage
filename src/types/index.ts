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
        title: "ビフォーアフター・お悩み解決",
        description: "お客様の変化を通じて、商品・サービスの価値をアピールします",
        questions: {
            q1: "来店前、お客様はどんなお悩みや不満を抱えていましたか？",
            ex1: "例: 髪のパサつきに悩んでいた／カラーの退色が早かった",
            q2: "あなたの商品・サービスのどんな点がそのお悩みに応えましたか？",
            ex2: "例: 独自配合の髪質改善トリートメントがぴったりだった",
            q3: "利用後、お客様はどのように変わりましたか？",
            ex3: "例: 指通りの良いツヤ髪になり「朝のスタイリングが楽になった」と喜ばれた",
        }
    },
    {
        id: "B",
        title: "プロのこだわり・裏側公開",
        description: "独自のこだわりや背景を公開して信頼感を高めます",
        questions: {
            q1: "今回紹介する商品・メニュー・サービスの「独自のこだわり」は何ですか？",
            ex1: "例: 髪に優しいオーガニックカラー剤を使用／完全マンツーマンでの丁寧なカウンセリング",
            q2: "なぜその手法・素材・やり方を選んだのですか？",
            ex2: "例: 10年後も綺麗な髪を保っていただきたいという想いから",
            q3: "どんなお客様に一番体験してほしいですか？",
            ex3: "例: 頭皮のダメージが気になる方／自分に似合うスタイルを見つけたい方",
        }
    },
    {
        id: "C",
        title: "今日のお知らせ・限定情報",
        description: "タイムリーな情報の発信で、即時来店・購買を促します",
        questions: {
            q1: "本日や今週の「おすすめの時間帯・タイミング」はいつですか？",
            ex1: "例: 本日14時〜16時／今週末の午前中",
            q2: "今だけの限定メニュー・商品・特典は何ですか？",
            ex2: "例: ご新規様限定で炭酸ヘッドスパ無料／今月だけ限定カラー20%OFF",
            q3: "来店・利用するとどんな良い体験が待っていますか？",
            ex3: "例: 頭皮の汚れがスッキリしてリフレッシュできる／いち早くトレンドの秋色を楽しめる",
        }
    },
    {
        id: "D",
        title: "お客様の喜びの声",
        description: "第三者の言葉で安心感を伝え、来店・購買を後押しします",
        questions: {
            q1: "お客様からどんな嬉しい言葉をいただきましたか？",
            ex1: "例: 「周りから髪色が綺麗だと褒められました！」「ショートヘアのセットが楽です」など",
            q2: "その方はどんな状況・背景で来店されましたか？",
            ex2: "例: 似合う髪型が分からずずっと同じスタイルだった／他店でのカラーがすぐに色落ちしてしまっていた",
            q3: "次回に向けてどんなご提案をしましたか？",
            ex3: "例: 1ヶ月後のカラーメンテナンスをご提案した／お家でのヘアオイルの正しい使い方をお伝えした",
        }
    },
    {
        id: "E",
        title: "スタッフの紹介・想い",
        description: "スタッフの人柄や熱意を伝え、親近感と信頼を生み出します",
        questions: {
            q1: "このスタッフの得意なこと・強みは何ですか？",
            ex1: "例: トレンドを取り入れた透明感カラーが得意／10代〜20代のボブスタイル経験が豊富",
            q2: "仕事において一番大切にしている信念・想いは何ですか？",
            ex2: "例: 丁寧なヒアリングでお客様の理想を汲み取ること／再現性の高いカットを妥協しないこと",
            q3: "この投稿を読んでいるお客様へ一言メッセージを。",
            ex3: "例: あなたに一番似合うスタイルを一緒に見つけましょう！お待ちしております！",
        }
    },
    {
        id: "F",
        title: "季節・シーズンに合わせた提案",
        description: "季節の変わり目やイベントに乗せて「今行くべき理由」を作ります",
        questions: {
            q1: "今の季節やシーズンならではの、お客様のニーズ・気分は何ですか？",
            ex1: "例: 梅雨の時期で髪の広がりやうねりが気になる／紫外線で髪がダメージを受けている",
            q2: "そのニーズに応える、今おすすめの商品・メニュー・サービスは何ですか？",
            ex2: "例: 湿気に負けない縮毛矯正メニュー／夏限定のミントヘッドスパ",
            q3: "利用後、どんな気持ちや状態を味わえますか？",
            ex3: "例: 雨の日でもまとまる髪でストレスフリーになれる／暑い日でも頭皮がスーッと爽快になる",
        }
    },
    {
        id: "G",
        title: "コメント・クチコミへの返信",
        description: "SNSやGBPに届いたコメント・クチコミに、オーナーとして誠実かつ温かみのある返信を生成します",
        questions: {
            q1: "",
            ex1: "",
            q2: "",
            ex2: "",
            q3: "",
            ex3: "",
        }
    },
    {
        id: "H",
        title: "ニュース連動ポスト（業種別）",
        description: "Googleニュースの最新トピックを元に、あなたのお店目線のコメント付き投稿を自動生成します。",
        questions: {
            q1: "",
            ex1: "",
            q2: "",
            ex2: "",
            q3: "",
            ex3: "",
        }
    },
    {
        id: "I",
        title: "画像から生成",
        description: "画像をアップロードし、その内容や伝えたいことを入力してSNS文章を生成します。",
        questions: {
            q1: "",
            ex1: "",
            q2: "",
            ex2: "",
            q3: "",
            ex3: "",
        }
    }
];
