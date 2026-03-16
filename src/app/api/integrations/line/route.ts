import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// LINEトークンの有効性を検証
async function verifyLineToken(token: string): Promise<boolean> {
    try {
        const res = await fetch("https://api.line.me/v2/bot/info", {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.ok;
    } catch {
        return false;
    }
}

// GET: 連携状態の確認（トークン本体は返さない）
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data } = await supabase
        .from("shop_integrations")
        .select("id, platform, created_at")
        .eq("user_id", user.id)
        .eq("platform", "line")
        .maybeSingle();

    return NextResponse.json({ connected: !!data, integration: data });
}

// POST: トークン保存
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { accessToken } = await req.json();
    if (!accessToken) {
        return NextResponse.json({ error: "accessToken is required" }, { status: 400 });
    }

    // トークンの有効性を検証
    const isValid = await verifyLineToken(accessToken);
    if (!isValid) {
        return NextResponse.json(
            { error: "LINEチャネルアクセストークンが無効です。LINE Developersで確認してください。" },
            { status: 400 }
        );
    }

    const { error } = await supabase
        .from("shop_integrations")
        .upsert(
            {
                user_id: user.id,
                platform: "line",
                access_token: accessToken,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,platform" }
        );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
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
        .eq("platform", "line");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
}
