import { NextResponse } from "next/server";
import { getStripe, PLANS, type PlanId } from "@/lib/stripe";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const PAID_PLANS: PlanId[] = ["light", "standard", "pro"];

export async function POST(req: Request) {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let plan: PlanId = "standard";
    try {
        const body = await req.json().catch(() => ({}));
        if (body && typeof body === "object" && body.plan && PAID_PLANS.includes(body.plan as PlanId)) {
            plan = body.plan as PlanId;
        }
    } catch {
        // デフォルト standard
    }

    const planConfig = PLANS[plan];
    const priceId = "stripePriceId" in planConfig ? planConfig.stripePriceId : null;
    if (!priceId) {
        return NextResponse.json(
            { error: `プラン「${planConfig.name}」のPrice IDが設定されていません。STRIPE_PRICE_ID_${plan.toUpperCase()} を .env に追加してください。` },
            { status: 500 }
        );
    }

    const supabase = await createClient();
    const { data: subscription } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id, stripe_subscription_id, plan")
        .eq("user_id", user.id)
        .maybeSingle();

    const stripe = getStripe();

    // 既存サブスクがある場合：プラス購入（按分なし・全額）で subscription を更新
    if (subscription?.stripe_subscription_id && subscription?.plan && subscription.plan !== plan) {
        try {
            const sub = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
            const itemId = sub.items.data[0]?.id;
            if (!itemId) {
                return NextResponse.json({ error: "サブスクリプションの更新に失敗しました。" }, { status: 500 });
            }
            const updated = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
                items: [{ id: itemId, price: priceId }],
                proration_behavior: "none",
                billing_cycle_anchor: Math.floor(Date.now() / 1000),
                metadata: { userId: user.id, plan },
            });
            const prevPlan = subscription.plan as PlanId;
            const prevConfig = PLANS[prevPlan];
            const upgradeSource = ["free", "light"].includes(prevPlan);
            const prevLimit = upgradeSource && typeof prevConfig?.limit === "number" ? prevConfig.limit : 0;
            const periodEnd = new Date((updated.current_period_end ?? 0) * 1000).toISOString();
            await supabase.from("subscriptions").upsert(
                {
                    user_id: user.id,
                    stripe_customer_id: subscription.stripe_customer_id,
                    stripe_subscription_id: subscription.stripe_subscription_id,
                    plan,
                    status: updated.status,
                    current_period_end: periodEnd,
                    upgrade_bonus_uses: prevLimit,
                    upgrade_bonus_period_end: periodEnd,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id" }
            );
            return NextResponse.json({ url: `${process.env.NEXT_PUBLIC_APP_URL}/?upgraded=true` });
        } catch (err) {
            console.error("Subscription update error:", err);
            return NextResponse.json(
                { error: "プランの変更に失敗しました。お手数ですが再度お試しください。" },
                { status: 500 }
            );
        }
    }

    // 新規：Checkout で購入
    let customerId = subscription?.stripe_customer_id;
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email ?? undefined,
            metadata: { userId: user.id },
        });
        customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?canceled=true`,
        locale: "ja",
        metadata: { userId: user.id, plan },
    });

    return NextResponse.json({ url: session.url });
}
