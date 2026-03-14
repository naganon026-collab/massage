import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

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
        case "customer.subscription.updated": {
            const sub = event.data.object as {
                customer: string;
                id: string;
                status: string;
                current_period_end: number;
            };
            const customerId = sub.customer;
            const customer = (await getStripe().customers.retrieve(customerId)) as { metadata?: { userId?: string } };
            const userId = customer.metadata?.userId;

            if (userId) {
                await supabase.from("subscriptions").upsert(
                    {
                        user_id: userId,
                        stripe_customer_id: customerId,
                        stripe_subscription_id: sub.id,
                        plan: sub.status === "active" ? "standard" : "free",
                        status: sub.status,
                        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "user_id" }
                );
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
