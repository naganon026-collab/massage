import Stripe from "stripe";

// パッケージの型が 2026-02-25.clover 固定のため、acacia を使う場合は次の行のコメントを外して apiVersion を指定
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
});

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
