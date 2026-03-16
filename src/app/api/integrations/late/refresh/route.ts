import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const LATE_API_BASE = "https://getlate.dev/api/v1";

export async function POST() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const apiKey = process.env.LATE_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "Late連携が設定されていません。" },
            { status: 503 }
        );
    }

    try {
        let profileId: string;
        const prefix = `LogicPost-${user.id.slice(0, 8)}`;

        const { data: existing } = await supabase
            .from("shop_integrations")
            .select("access_token")
            .eq("user_id", user.id)
            .eq("platform", "late")
            .maybeSingle();

        if (existing?.access_token) {
            try {
                const payload = JSON.parse(existing.access_token);
                if (payload.profileId) {
                    profileId = payload.profileId;
                } else {
                    profileId = "";
                }
            } catch {
                profileId = "";
            }
        } else {
            profileId = "";
        }

        if (!profileId) {
            const listRes = await fetch(`${LATE_API_BASE}/profiles`, {
                headers: { Authorization: `Bearer ${apiKey}` },
            });
            const listData = (await listRes.json().catch(() => ({}))) as { profiles?: { _id: string; name: string }[] };
            const found = listData.profiles?.find((p) => p.name === prefix || p.name.startsWith(prefix));
            if (!found) {
                return NextResponse.json(
                    { error: "Lateに該当するプロファイルが見つかりません。先に「Instagramを接続」からOAuth認証を完了してください。" },
                    { status: 404 }
                );
            }
            profileId = found._id;
        }

        const accountsRes = await fetch(`${LATE_API_BASE}/accounts?profileId=${profileId}`, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!accountsRes.ok) {
            return NextResponse.json({ error: "Lateからアカウント一覧を取得できませんでした。" }, { status: 500 });
        }

        const accountsData = (await accountsRes.json()) as { accounts?: { platform: string; _id: string }[] };
        const accounts = accountsData.accounts ?? [];
        const instagram = accounts.find((a) => a.platform === "instagram");
        const googlebusiness = accounts.find((a) => a.platform === "googlebusiness");

        const payload = JSON.stringify({
            profileId,
            accountIds: {
                instagram: instagram?._id ?? null,
                googlebusiness: googlebusiness?._id ?? null,
            },
        });

        const { error } = await supabase.from("shop_integrations").upsert(
            {
                user_id: user.id,
                platform: "late",
                access_token: payload,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,platform" }
        );

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({
            success: true,
            instagram: !!instagram,
            googlebusiness: !!googlebusiness,
        });
    } catch (e) {
        const msg = e instanceof Error ? e.message : "同期に失敗しました";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
