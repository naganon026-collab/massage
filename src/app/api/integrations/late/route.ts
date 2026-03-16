import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const LATE_API_BASE = "https://getlate.dev/api/v1";

// GET: 連携状態の確認（OAuth方式：接続済みプラットフォームとアカウント名を返す）
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data } = await supabase
        .from("shop_integrations")
        .select("id, access_token, created_at")
        .eq("user_id", user.id)
        .eq("platform", "late")
        .maybeSingle();

    if (!data?.access_token) {
        return NextResponse.json({ connected: false, instagram: false, googlebusiness: false });
    }

    try {
        const payload = JSON.parse(data.access_token);
        const accountIds = payload.accountIds ?? {};
        const profileId = payload.profileId;
        const base = {
            connected: true,
            instagram: !!accountIds.instagram,
            googlebusiness: !!accountIds.googlebusiness,
            integration: { id: data.id, created_at: data.created_at },
        };

        // Late API からアカウント名を取得（接続中のアカウントがどれか分かるように）
        const apiKey = process.env.LATE_API_KEY;
        if (apiKey && profileId) {
            try {
                const res = await fetch(`${LATE_API_BASE}/accounts?profileId=${profileId}`, {
                    headers: { Authorization: `Bearer ${apiKey}` },
                });
                if (res.ok) {
                    const json = (await res.json()) as { accounts?: { platform: string; username?: string; displayName?: string }[] };
                    const accounts = json.accounts ?? [];
                    const ig = accounts.find((a) => a.platform === "instagram");
                    const gbp = accounts.find((a) => a.platform === "googlebusiness");
                    return NextResponse.json({
                        ...base,
                        instagramUsername: ig?.username ?? ig?.displayName ?? null,
                        instagramDisplayName: ig?.displayName ?? null,
                        googlebusinessName: gbp?.displayName ?? gbp?.username ?? null,
                    });
                }
            } catch {
                // アカウント名取得失敗時は boolean のみ返す
            }
        }
        return NextResponse.json(base);
    } catch {
        return NextResponse.json({ connected: false, instagram: false, googlebusiness: false });
    }
}

// DELETE: 連携解除
export async function DELETE() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
        .from("shop_integrations")
        .delete()
        .eq("user_id", user.id)
        .eq("platform", "late");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
