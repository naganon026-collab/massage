import { createClient } from "@/lib/supabase/server";
import { PLANS } from "./stripe";

/** ユーザーのサブスクリプション情報を取得 */
export async function getUserSubscription(userId: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
    return data;
}

/** 今月の生成回数を取得 */
export async function getMonthlyGenerationCount(userId: string): Promise<number> {
    const supabase = await createClient();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
        .from("generation_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", startOfMonth.toISOString());

    return count ?? 0;
}

/** 生成可能かチェック */
export async function canGenerate(userId: string): Promise<{
    allowed: boolean;
    plan: string;
    used: number;
    limit: number | null;
    remaining: number | null;
}> {
    const subscription = await getUserSubscription(userId);
    const plan = (subscription?.plan as keyof typeof PLANS) || "free";
    const planConfig = PLANS[plan] ?? PLANS.free;
    const used = await getMonthlyGenerationCount(userId);

    if (planConfig.limit === null) {
        return { allowed: true, plan: planConfig.id, used, limit: null, remaining: null };
    }

    const remaining = planConfig.limit - used;
    return {
        allowed: remaining > 0,
        plan: planConfig.id,
        used,
        limit: planConfig.limit,
        remaining: Math.max(0, remaining),
    };
}
