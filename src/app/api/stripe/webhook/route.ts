import { NextRequest, NextResponse } from "next/server";
import { getStripe, getPlanFromPriceId, PLANS } from "@/lib/stripe";
import type { PlanId } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const PAID_PLANS: PlanId[] = ["light", "standard", "pro"];
const UPGRADE_SOURCE_PLANS: PlanId[] = ["free", "light"];

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
        return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }

    let event: { type: string; data: { object: Record<string, unknown> } };
    try {
        event = getStripe().webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        ) as unknown as { type: string; data: { object: Record<string, unknown> } };
    } catch {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const supabase = createAdminClient();

    switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated": {
            const sub = event.data.object as {
                customer: string;
                id: string;
                status: string;
                current_period_end: number;
                items?: { data?: Array<{ price?: string | { id: string } }> };
            };
            const customerId = sub.customer;
            const customer = (await getStripe().customers.retrieve(customerId)) as { metadata?: { userId?: string } };
            const userId = customer.metadata?.userId;

            let priceId: string | undefined;
            const firstItem = sub.items?.data?.[0];
            if (firstItem?.price) {
                priceId = typeof firstItem.price === "string" ? firstItem.price : firstItem.price.id;
            }
            if (!priceId) {
                const expanded = await getStripe().subscriptions.retrieve(sub.id, { expand: ["items.data.price"] });
                const item = expanded.items?.data?.[0];
                priceId = item?.price?.id;
            }
            const newPlan = sub.status === "active" ? getPlanFromPriceId(priceId) : "free";

            let upgradeBonusUses: number | null = null;
            let upgradeBonusPeriodEnd: string | null = null;
            if (userId && PAID_PLANS.includes(newPlan as PlanId)) {
                const { data: existing } = await supabase
                    .from("subscriptions")
                    .select("plan, upgrade_bonus_uses, upgrade_bonus_period_end")
                    .eq("user_id", userId)
                    .maybeSingle();
                const prevPlan = (existing?.plan as PlanId) || "free";
                if (UPGRADE_SOURCE_PLANS.includes(prevPlan) && prevPlan !== newPlan) {
                    const prevConfig = PLANS[prevPlan];
                    const prevLimit = prevConfig?.limit;
                    if (typeof prevLimit === "number") {
                        upgradeBonusUses = prevLimit;
                        upgradeBonusPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
                    }
                } else {
                    upgradeBonusUses = 0;
                    upgradeBonusPeriodEnd = null;
                }
            }

            if (userId) {
                const upsertData: Record<string, unknown> = {
                    user_id: userId,
                    stripe_customer_id: customerId,
                    stripe_subscription_id: sub.id,
                    plan: newPlan,
                    status: sub.status,
                    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
                    updated_at: new Date().toISOString(),
                };
                if (upgradeBonusUses !== null) upsertData.upgrade_bonus_uses = upgradeBonusUses;
                if (upgradeBonusPeriodEnd !== undefined) upsertData.upgrade_bonus_period_end = upgradeBonusPeriodEnd;
                await supabase.from("subscriptions").upsert(upsertData, { onConflict: "user_id" });
            }
            break;
        }

        case "customer.subscription.deleted": {
            const sub = event.data.object as { customer: string };
            const customerId = sub.customer;
            const customer = (await getStripe().customers.retrieve(customerId)) as { metadata?: { userId?: string } };
            const userId = customer.metadata?.userId;

            if (userId) {
                await supabase.from("subscriptions").upsert(
                    {
                        user_id: userId,
                        plan: "free",
                        status: "canceled",
                        stripe_subscription_id: null,
                        upgrade_bonus_uses: 0,
                        upgrade_bonus_period_end: null,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "user_id" }
                );
            }
            break;
        }
    }

    return NextResponse.json({ received: true });
}
