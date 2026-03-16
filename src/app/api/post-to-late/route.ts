import { createClient } from "@/lib/supabase/server";
import { canPost } from "@/lib/subscription";
import { NextRequest, NextResponse } from "next/server";

const LATE_API_BASE = "https://getlate.dev/api/v1";

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

    const body = await req.json();
    const { platform, content, title, imageData } = body as {
        platform: "instagram" | "gbp" | "both";
        content: string;
        title?: string;
        imageData?: { mimeType: string; data: string };
    };

    if (!platform || !content) {
        return NextResponse.json(
            { error: "platform と content が必要です" },
            { status: 400 }
        );
    }

    const apiKey = process.env.LATE_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "Late連携が設定されていません。運営者にお問い合わせください。" },
            { status: 503 }
        );
    }

    const { data: integration, error: fetchError } = await supabase
        .from("shop_integrations")
        .select("access_token")
        .eq("user_id", user.id)
        .eq("platform", "late")
        .maybeSingle();

    if (fetchError || !integration) {
        return NextResponse.json(
            { error: "Lateが連携されていません。アプリ接続からInstagram・GBPを接続してください。" },
            { status: 404 }
        );
    }

    let payload: { profileId?: string; accountIds?: { instagram?: string; googlebusiness?: string } };
    try {
        payload = JSON.parse(integration.access_token);
    } catch {
        return NextResponse.json(
            { error: "連携データの形式が不正です。アプリ接続から再連携してください。" },
            { status: 500 }
        );
    }

    const accountIds = payload.accountIds ?? {};

    const platforms: { platform: string; accountId: string }[] = [];
    if ((platform === "instagram" || platform === "both") && accountIds?.instagram) {
        platforms.push({ platform: "instagram", accountId: accountIds.instagram });
    }
    if ((platform === "gbp" || platform === "both") && accountIds?.googlebusiness) {
        platforms.push({ platform: "googlebusiness", accountId: accountIds.googlebusiness });
    }

    if (platforms.length === 0) {
        const missing = platform === "both"
            ? "Instagram と Googleビジネスプロフィール"
            : platform === "instagram"
                ? "Instagram"
                : "Googleビジネスプロフィール";
        return NextResponse.json(
            { error: `${missing}のアカウントが接続されていません。アプリ接続から接続してください。` },
            { status: 404 }
        );
    }

    const postBody: Record<string, unknown> = {
        content,
        publishNow: true,
        timezone: "Asia/Tokyo",
        platforms,
    };

    // 画像アップロード：Instagram は必須、GBP は任意（あると表示が良くなる）
    const hasInstagram = platforms.some((p) => p.platform === "instagram");
    const hasGbp = platforms.some((p) => p.platform === "googlebusiness");
    const hasImage = !!(imageData?.mimeType && imageData?.data);

    if (hasInstagram && !hasImage) {
        return NextResponse.json(
            { error: "Instagram には画像が必須です。画像をアップロードしてから生成してください。" },
            { status: 400 }
        );
    }

    if (hasImage && (hasInstagram || hasGbp)) {
        const ext = imageData!.mimeType === "image/png" ? "png" : imageData!.mimeType === "image/webp" ? "webp" : "jpg";
        const presignRes = await fetch(`${LATE_API_BASE}/media/presign`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                filename: `post-${Date.now()}.${ext}`,
                contentType: imageData!.mimeType,
            }),
        });
        if (!presignRes.ok) {
            const err = (await presignRes.json().catch(() => ({}))) as { error?: string };
            return NextResponse.json({ error: err.error ?? "画像のアップロード準備に失敗しました" }, { status: 500 });
        }
        const { uploadUrl, publicUrl } = (await presignRes.json()) as { uploadUrl: string; publicUrl: string };
        const buffer = Buffer.from(imageData!.data, "base64");
        const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": imageData!.mimeType },
            body: buffer,
        });
        if (!uploadRes.ok) {
            return NextResponse.json({ error: "画像のアップロードに失敗しました" }, { status: 500 });
        }
        postBody.mediaItems = [{ type: "image", url: publicUrl }];
    }

    // GBP用：Late API の googleBusiness オプション（title が推奨）
    if ((platform === "gbp" || platform === "both") && accountIds?.googlebusiness && platforms.some((p) => p.platform === "googlebusiness")) {
        const gbpTitle = title ?? content.slice(0, 58).replace(/\n/g, " ");
        postBody.googleBusiness = {
            title: gbpTitle,
            description: content,
            category: "LOCAL_POST",
            postType: "UPDATE",
        };
    }

    const lateRes = await fetch(`${LATE_API_BASE}/posts`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(postBody),
    });

    if (!lateRes.ok) {
        const err = (await lateRes.json().catch(() => ({}))) as { error?: string; message?: string };
        const msg = err.error ?? err.message ?? "Lateへの投稿に失敗しました";
        return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
