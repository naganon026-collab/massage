import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const LATE_API_BASE = "https://getlate.dev/api/v1";

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const platform = req.nextUrl.searchParams.get("platform");
    if (platform !== "instagram" && platform !== "googlebusiness") {
        return NextResponse.json({ error: "platform は instagram または googlebusiness を指定してください" }, { status: 400 });
    }

    const apiKey = process.env.LATE_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "Late連携が設定されていません。運営者にお問い合わせください。" },
            { status: 503 }
        );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUrl = `${baseUrl}/auth/late/callback`;

    try {
        let profileId: string | undefined;

        const { data: existing } = await supabase
            .from("shop_integrations")
            .select("access_token")
            .eq("user_id", user.id)
            .eq("platform", "late")
            .maybeSingle();

        if (existing?.access_token) {
            try {
                const payload = JSON.parse(existing.access_token);
                profileId = payload.profileId;
            } catch {
                profileId = "";
            }
        }

        if (!profileId) {
            const prefix = `LogicPost-${user.id.slice(0, 8)}`;
            const listRes = await fetch(`${LATE_API_BASE}/profiles`, {
                headers: { Authorization: `Bearer ${apiKey}` },
            });
            const listData = (await listRes.json().catch(() => ({}))) as { profiles?: { _id: string; name: string }[] };
            const existingProfile = listData.profiles?.find((p) => p.name === prefix || p.name.startsWith(prefix));
            if (existingProfile) {
                profileId = existingProfile._id;
            } else {
                const profileName = `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
                const createRes = await fetch(`${LATE_API_BASE}/profiles`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({ name: profileName }),
                });

                const data = await createRes.json().catch(() => ({}));
                if (!createRes.ok) {
                    const errMsg = (data as { error?: string; message?: string }).error
                        || (data as { error?: string; message?: string }).message;
                    throw new Error(errMsg || `プロファイルの作成に失敗しました (${createRes.status})`);
                }
                profileId = (data as { profile?: { _id?: string } }).profile?._id;
                if (!profileId) throw new Error("プロファイルIDを取得できませんでした");
            }

            const payload = JSON.stringify({
                profileId,
                accountIds: { instagram: null, googlebusiness: null },
            });
            const { error: upsertError } = await supabase.from("shop_integrations").upsert(
                {
                    user_id: user.id,
                    platform: "late",
                    access_token: payload,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id,platform" }
            );
            if (upsertError) throw new Error(upsertError.message);
        }

        const params = new URLSearchParams({
            profileId,
            redirect_url: redirectUrl,
        });
        const connectRes = await fetch(
            `${LATE_API_BASE}/connect/${platform}?${params}`,
            { headers: { Authorization: `Bearer ${apiKey}` } }
        );

        const connectData = await connectRes.json().catch(() => ({}));
        if (!connectRes.ok) {
            const err = connectData as { error?: string; message?: string };
            const errMsg = err.error ?? err.message ?? "";
            if (errMsg.toLowerCase().includes("profile not found")) {
                await supabase
                    .from("shop_integrations")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("platform", "late");
                throw new Error("プロファイルが見つかりません。もう一度「Instagramを接続」を押してお試しください。");
            }
            throw new Error(errMsg || "接続URLの取得に失敗しました");
        }

        const { authUrl } = connectData as { authUrl?: string };
        if (!authUrl) throw new Error("認証URLを取得できませんでした");

        return NextResponse.json({ authUrl });
    } catch (e) {
        const msg = e instanceof Error ? e.message : "接続の準備に失敗しました";
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}
