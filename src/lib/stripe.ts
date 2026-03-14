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
        limit: 5, // 月5回まで
        description: "月5回まで投稿生成可能",
    },
    standard: {
        id: "standard",
        name: "アンリミテッドプラン",
        price: 2980,
        limit: null, // 無制限
        description: "月間生成回数無制限・全パターン利用可能",
        stripePriceId: process.env.STRIPE_PRICE_ID!,
    },
} as const;

export type PlanId = keyof typeof PLANS;
