import { NextResponse } from "next/server";
import { stripe, PLANS } from "@/lib/stripe";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = await createClient();

    const { data: subscription } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .maybeSingle();

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
        line_items: [
            {
                price: PLANS.standard.stripePriceId,
                quantity: 1,
            },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?canceled=true`,
        locale: "ja",
        metadata: { userId: user.id },
    });

    return NextResponse.json({ url: session.url });
}
