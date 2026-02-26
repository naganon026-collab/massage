import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * APIルート用の認証チェックヘルパー。
 * ログイン済みなら user オブジェクトを返す。
 * 未認証なら 401 レスポンスを返す。
 *
 * 使い方:
 *   const authResult = await requireAuth();
 *   if (authResult instanceof NextResponse) return authResult;
 *   const { user } = authResult;
 */
export async function requireAuth(): Promise<{ user: Awaited<ReturnType<typeof getUser>> } | NextResponse> {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json(
            { error: "認証が必要です。ログインしてから再試行してください。" },
            { status: 401 }
        );
    }

    return { user };
}

/**
 * getUser の戻り値型を取得するための内部ヘルパー型
 */
async function getUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}
