import Stripe from "stripe";

// ビルド時に env が未設定だと Stripe がエラーになるため、実行時のみ初期化する
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
    if (!_stripe) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
        _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
    }
    return _stripe;
}

export const PLANS = {
    free: {
        id: "free",
        name: "無料プラン",
        price: 0,
        limit: 5,
        dailyLimit: 5,
        canPost: false, // 投稿は standard / pro のみ
        canGenerateBlog: false, // ブログ生成は pro のみ
        description: "月5回まで投稿生成可能",
    },
    light: {
        id: "light",
        name: "ライトプラン",
        price: 980,
        limit: 30,
        dailyLimit: 5,
        canPost: false,
        canGenerateBlog: false,
        description: "月30回まで生成、投稿不可",
        stripePriceId: process.env.STRIPE_PRICE_ID_LIGHT!,
    },
    standard: {
        id: "standard",
        name: "スタンダードプラン",
        price: 2480,
        limit: 100,
        dailyLimit: 5,
        canPost: true,
        canGenerateBlog: false,
        description: "1日5回・月100回まで生成、投稿可",
        stripePriceId: process.env.STRIPE_PRICE_ID_STANDARD || process.env.STRIPE_PRICE_ID!,
    },
    pro: {
        id: "pro",
        name: "プロプラン",
        price: 3980,
        limit: null,
        dailyLimit: 5, // 1日5回はAPIコスト抑止のため全プラン共通
        canPost: true,
        canGenerateBlog: true,
        description: "生成無制限、投稿可、ブログ生成可",
        stripePriceId: process.env.STRIPE_PRICE_ID_PRO!,
    },
} as const;

export type PlanId = keyof typeof PLANS;

/** Price ID からプランを判定（Webhook用） */
export function getPlanFromPriceId(priceId: string | undefined): PlanId {
    if (!priceId) return "standard";
    if (priceId === process.env.STRIPE_PRICE_ID_LIGHT) return "light";
    if (priceId === process.env.STRIPE_PRICE_ID_PRO) return "pro";
    if (priceId === process.env.STRIPE_PRICE_ID_STANDARD || priceId === process.env.STRIPE_PRICE_ID) return "standard";
    return "standard";
}
