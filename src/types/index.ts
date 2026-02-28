export type Pattern = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";

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
    };
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
    };
    results: {
        instagram?: string; gbp?: string;
        portal?: string; portalTitle?: string;
        line?: string; reply?: string; imageUrl?: string;
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
            ex1: "例: 〇〇に悩んでいた／〇〇がうまくいかなかった",
            q2: "あなたの商品・サービスのどんな点がそのお悩みに応えましたか？",
            ex2: "例: 〇〇という特徴が、△△というお悩みにぴったりだった",
            q3: "利用後、お客様はどのように変わりましたか？",
            ex3: "例: 〇〇が改善され「またお願いしたい」と言ってもらえた",
        }
    },
    {
        id: "B",
        title: "プロのこだわり・裏側公開",
        description: "独自のこだわりや背景を公開して信頼感を高めます",
        questions: {
            q1: "今回紹介する商品・メニュー・サービスの「独自のこだわり」は何ですか？",
            ex1: "例: 〇〇産の素材を使用／完全予約制で一人ひとりに向き合う",
            q2: "なぜその手法・素材・やり方を選んだのですか？",
            ex2: "例: お客様に△△を提供したいという想いから／〇〇のほうが効果が高いため",
            q3: "どんなお客様に一番体験してほしいですか？",
            ex3: "例: 〇〇に悩んでいる方／△△を大切にしたい方",
        }
    },
    {
        id: "C",
        title: "今日のお知らせ・限定情報",
        description: "タイムリーな情報の発信で、即時来店・購買を促します",
        questions: {
            q1: "本日や今週の「おすすめの時間帯・タイミング」はいつですか？",
            ex1: "例: 本日〇〇時〜△△時／今週末",
            q2: "今だけの限定メニュー・商品・特典は何ですか？",
            ex2: "例: 〇〇限定で△△をプレゼント／〇〇が今週のみ特別価格",
            q3: "来店・利用するとどんな良い体験が待っていますか？",
            ex3: "例: 〇〇の気分を味わえる／△△がいつもより快適になる",
        }
    },
    {
        id: "D",
        title: "お客様の喜びの声",
        description: "第三者の言葉で安心感を伝え、来店・購買を後押しします",
        questions: {
            q1: "お客様からどんな嬉しい言葉をいただきましたか？",
            ex1: "例: 「〇〇で本当に良かった」「もっと早く来ればよかった」など",
            q2: "その方はどんな状況・背景で来店されましたか？",
            ex2: "例: 〇〇に困っていた／他で満足できず探していた",
            q3: "次回に向けてどんなご提案をしましたか？",
            ex3: "例: 〇〇のご利用をおすすめした／定期的な〇〇をご提案した",
        }
    },
    {
        id: "E",
        title: "スタッフの紹介・想い",
        description: "スタッフの人柄や熱意を伝え、親近感と信頼を生み出します",
        questions: {
            q1: "このスタッフの得意なこと・強みは何ですか？",
            ex1: "例: 〇〇が得意／△△の経験が豊富",
            q2: "仕事において一番大切にしている信念・想いは何ですか？",
            ex2: "例: お客様に〇〇を感じてもらうこと／△△を妥協しないこと",
            q3: "この投稿を読んでいるお客様へ一言メッセージを。",
            ex3: "例: 〇〇でお待ちしています！／お気軽にご相談ください！",
        }
    },
    {
        id: "F",
        title: "季節・シーズンに合わせた提案",
        description: "季節の変わり目やイベントに乗せて「今行くべき理由」を作ります",
        questions: {
            q1: "今の季節やシーズンならではの、お客様のニーズ・気分は何ですか？",
            ex1: "例: 〇〇の時期だから△△したい気分になる",
            q2: "そのニーズに応える、今おすすめの商品・メニュー・サービスは何ですか？",
            ex2: "例: 季節限定の〇〇／この時期だけのキャンペーン",
            q3: "利用後、どんな気持ちや状態を味わえますか？",
            ex3: "例: 〇〇な気持ちになれる／△△がより楽しくなる",
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
    }
];
