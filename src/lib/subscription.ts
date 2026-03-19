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

/** 1日あたりの生成上限（全プラン共通・APIコスト抑止） */
export const DAILY_GENERATION_LIMIT = 5;

/** 今月の生成回数を取得（練習モード分は除外） */
export async function getMonthlyGenerationCount(userId: string): Promise<number> {
    const supabase = await createClient();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
        .from("generation_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", startOfMonth.toISOString())
        .or("is_practice.is.null,is_practice.eq.false");

    return count ?? 0;
}

/** 総生成回数を取得（練習含む・練習モード判定用） */
export async function getTotalGenerationCount(userId: string): Promise<number> {
    const supabase = await createClient();
    const { count } = await supabase
        .from("generation_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
    return count ?? 0;
}

/** 本日の生成回数を取得（JST 0時基準・練習モード分は除外） */
export async function getDailyGenerationCount(userId: string): Promise<number> {
    const supabase = await createClient();
    const now = new Date();
    const jstOffset = 9 * 60;
    const jst = new Date(now.getTime() + jstOffset * 60 * 1000);
    const y = jst.getUTCFullYear();
    const m = jst.getUTCMonth() + 1;
    const d = jst.getUTCDate();
    const startOfDayJst = new Date(Date.UTC(y, m - 1, d) - jstOffset * 60 * 1000);

    const { count } = await supabase
        .from("generation_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", startOfDayJst.toISOString())
        .or("is_practice.is.null,is_practice.eq.false");

    return count ?? 0;
}

/** 開発時は1日の上限を実質無制限にする（テスト・開発用） */
const effectiveDailyLimit = process.env.NODE_ENV === "development" ? 999 : DAILY_GENERATION_LIMIT;

/** 投稿可能か（standard / pro のみ） */
export async function canPost(userId: string): Promise<boolean> {
    const subscription = await getUserSubscription(userId);
    const plan = (subscription?.plan as keyof typeof PLANS) || "free";
    const planConfig = PLANS[plan] ?? PLANS.free;
    return planConfig.canPost === true;
}

/** ブログ生成可能か（pro のみ） */
export async function canGenerateBlog(userId: string): Promise<boolean> {
    const subscription = await getUserSubscription(userId);
    const plan = (subscription?.plan as keyof typeof PLANS) || "free";
    const planConfig = PLANS[plan] ?? PLANS.free;
    return "canGenerateBlog" in planConfig && planConfig.canGenerateBlog === true;
}

/** 生成可能かチェック（月次＋1日の上限を適用） */
export async function canGenerate(userId: string): Promise<{
    allowed: boolean;
    plan: string;
    used: number;
    limit: number | null;
    remaining: number | null;
    dailyUsed: number;
    dailyLimit: number;
    dailyRemaining: number;
}> {
    const subscription = await getUserSubscription(userId);
    const plan = (subscription?.plan as keyof typeof PLANS) || "free";
    const planConfig = PLANS[plan] ?? PLANS.free;
    const used = await getMonthlyGenerationCount(userId);
    const dailyUsed = await getDailyGenerationCount(userId);
    const dailyLimit = process.env.NODE_ENV === "development"
        ? effectiveDailyLimit
        : ("dailyLimit" in planConfig && typeof planConfig.dailyLimit === "number"
            ? planConfig.dailyLimit
            : DAILY_GENERATION_LIMIT);
    const dailyRemaining = Math.max(0, dailyLimit - dailyUsed);

    const baseLimit = planConfig.limit;
    const bonusUses = (subscription as { upgrade_bonus_uses?: number })?.upgrade_bonus_uses ?? 0;
    const bonusPeriodEnd = (subscription as { upgrade_bonus_period_end?: string | null })?.upgrade_bonus_period_end;
    const now = new Date();
    const bonusActive = bonusUses > 0 && bonusPeriodEnd && new Date(bonusPeriodEnd) > now;
    const effectiveLimit = baseLimit === null ? null : baseLimit + (bonusActive ? bonusUses : 0);

    const monthlyOk = effectiveLimit === null || used < effectiveLimit;
    const dailyOk = dailyUsed < dailyLimit;
    const allowed = monthlyOk && dailyOk;

    const remaining = effectiveLimit === null ? null : Math.max(0, effectiveLimit - used);

    return {
        allowed,
        plan: planConfig.id,
        used,
        limit: effectiveLimit,
        remaining,
        dailyUsed,
        dailyLimit,
        dailyRemaining,
    };
}
