import { createClient } from "@/lib/supabase/server";
import { canPost } from "@/lib/subscription";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!(await canPost(user.id))) {
        return NextResponse.json(
            { error: "投稿機能はスタンダードプラン以上でご利用いただけます。アップグレードしてください。" },
            { status: 403 }
        );
    }

    const { message } = await req.json();
    if (!message) {
        return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    // LINE上限2000文字チェック
    if (message.length > 2000) {
        return NextResponse.json(
            { error: `メッセージが長すぎます（${message.length}文字）。2000文字以内にしてください。` },
            { status: 400 }
        );
    }

    // トークン取得
    const { data: integration, error: fetchError } = await supabase
        .from("shop_integrations")
        .select("access_token")
        .eq("user_id", user.id)
        .eq("platform", "line")
        .maybeSingle();

    if (fetchError || !integration) {
        return NextResponse.json(
            { error: "LINEが連携されていません。アプリ接続からトークンを登録してください。" },
            { status: 404 }
        );
    }

    // LINE Messaging API broadcast
    const lineRes = await fetch("https://api.line.me/v2/bot/message/broadcast", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${integration.access_token}`,
        },
        body: JSON.stringify({
            messages: [{ type: "text", text: message }],
        }),
    });

    if (!lineRes.ok) {
        const err = await lineRes.json().catch(() => ({}));
        return NextResponse.json(
            { error: (err as { message?: string }).message ?? "LINE送信に失敗しました" },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true });
}
