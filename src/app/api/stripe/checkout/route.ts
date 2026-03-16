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
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .maybeSingle();

    let customerId = subscription?.stripe_customer_id;
    if (!customerId) {
        const customer = await getStripe().customers.create({
            email: user.email ?? undefined,
            metadata: { userId: user.id },
        });
        customerId = customer.id;
    }

    const session = await getStripe().checkout.sessions.create({
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
