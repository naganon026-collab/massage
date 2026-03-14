import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  console.log("=== stripe success called ===");
  console.log("URL:", req.url);
  const sessionId = req.nextUrl.searchParams.get("session_id");
  console.log("sessionId:", sessionId);

  if (!sessionId) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(
      sessionId,
      { expand: ["subscription"] }
    );

    console.log("Session retrieved:", {
      userId: session.metadata?.userId,
      customer: session.customer,
      subscriptionType: typeof session.subscription,
      subscription: session.subscription,
    });

    const userId = session.metadata?.userId;

    if (!userId) {
      console.error("userId not found in session metadata");
    }

    if (!session.subscription) {
      console.error("subscription not found in session");
    }

    if (userId && session.subscription) {
      const supabase = createAdminClient();

      let sub: { id: string; current_period_end?: number; start_date?: number; billing_cycle_anchor?: number } =
        typeof session.subscription === "string"
          ? await getStripe().subscriptions.retrieve(session.subscription)
          : (session.subscription as { id: string; current_period_end?: number; start_date?: number; billing_cycle_anchor?: number });

      // expand で返るオブジェクトに current_period_end が含まれない場合があるため取得し直す
      if (sub.current_period_end == null) {
        const full = await getStripe().subscriptions.retrieve(sub.id);
        sub = full as typeof sub;
      }

      const periodEndUnix =
        sub.current_period_end ??
        sub.billing_cycle_anchor ??
        sub.start_date ??
        Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      const current_period_end_iso = new Date(periodEndUnix * 1000).toISOString();

      console.log("Subscription data:", {
        id: sub.id,
        current_period_end: sub.current_period_end,
        periodEndUnix,
      });

      const { data, error } = await supabase
        .from("subscriptions")
        .upsert(
          {
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: sub.id,
            plan: "standard",
            status: "active",
            current_period_end: current_period_end_iso,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      console.log("Upsert result:", { data, error });

      if (error) {
        console.error("Supabase upsert error:", error);
      }
    }
  } catch (error) {
    console.error("Stripe success error:", error);
  }

  return NextResponse.redirect(new URL("/?upgraded=true", req.url));
}
