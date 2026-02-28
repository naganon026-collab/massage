import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const wpPostSchema = z.object({
    title: z.string().min(1, "タイトルは必須です。").max(200, "タイトルが長すぎます。"),
    content: z.string().min(1, "本文は必須です。"),
    status: z.enum(['draft', 'publish']).optional().default('draft'),
    wpCategoryId: z.string().optional(),
    wpTagId: z.string().optional(),
    wpAuthorId: z.string().optional(),
    imageUrl: z.string().url("有効な画像URLを指定してください。").optional().or(z.literal('')),
});

export async function POST(req: Request) {
    // 認証チェック: ログインしていないユーザーは 401 を返す
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // レート制限（1分あたり10回まで）
    const rateLimitResponse = checkRateLimit(user?.id || "anonymous", 10);
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const body = await req.json();
        const parsed = wpPostSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "入力内容に誤りがあります。", details: parsed.error.format() }, { status: 400 });
        }

        const { title, content, status, wpCategoryId, wpTagId, wpAuthorId, imageUrl } = parsed.data;

        const wpUrl = process.env.WP_API_URL;
        const wpUser = process.env.WP_USERNAME;
        const wpPassword = process.env.WP_APP_PASSWORD;

        if (!wpUrl || !wpUser || !wpPassword) {
            return NextResponse.json({ error: "WordPress連携用の環境変数が設定されていません。" }, { status: 500 });
        }

        const auth = Buffer.from(`${wpUser}:${wpPassword}`).toString('base64');

        // ペイロードの組み立て
        const payload: any = {
            title: title,
            content: content,
            status: status // 'draft' または 'publish'
        };

        // カンマ区切りの文字列を数値の配列に変換するヘルパー関数
        const parseIds = (idString: string | undefined): number[] => {
            if (!idString) return [];
            return idString.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
        };

        if (wpCategoryId) {
            const categories = parseIds(wpCategoryId);
            if (categories.length > 0) payload.categories = categories;
        }

        if (wpTagId) {
            const tags = parseIds(wpTagId);
            if (tags.length > 0) payload.tags = tags;
        }

        if (wpAuthorId) {
            const authorId = parseInt(wpAuthorId.trim(), 10);
            if (!isNaN(authorId)) payload.author = authorId;
        }

        // 画像URLが渡された場合、WordPressのメディアにアップロードしてアイキャッチに設定する
        if (imageUrl) {
            try {
                // 1. 画像データを取得
                const imgRes = await fetch(imageUrl);
                const imgBuffer = await imgRes.arrayBuffer();

                // 2. WPのメディアAPIへPOST
                const mediaUrl = wpUrl.replace('/posts', '/media');
                const wpMediaRes = await fetch(mediaUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Disposition': 'attachment; filename="ai-generated-image.jpg"',
                        'Content-Type': 'image/jpeg'
                    },
                    body: imgBuffer
                });

                if (wpMediaRes.ok) {
                    const mediaData = await wpMediaRes.json();
                    const mediaId = mediaData.id;
                    const mediaSourceUrl = mediaData.source_url;

                    // アイキャッチとして設定
                    payload.featured_media = mediaId;

                    // 本文の先頭にも画像を挿入
                    payload.content = `<figure class="wp-block-image size-large"><img src="${mediaSourceUrl}" alt="AI生成画像" /></figure>\n\n` + payload.content;
                } else {
                    console.error("WP Media Upload Failed:", await wpMediaRes.text());
                }
            } catch (err) {
                console.error("Image upload processing error:", err);
                // 画像アップロードに失敗しても、テキスト記事自体の投稿は続行する
            }
        }

        const wpResponse = await fetch(wpUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: JSON.stringify(payload)
        });

        const data = await wpResponse.json();

        if (!wpResponse.ok) {
            console.error("WP API Response Error:", data);
            throw new Error(data.message || "WordPressへの投稿に失敗しました。");
        }

        return NextResponse.json({ success: true, postId: data.id, link: data.link });

    } catch (error: any) {
        console.error("WP Post API Error:", error);
        return NextResponse.json(
            { error: "WordPress連携中にエラーが発生しました。", details: error.message },
            { status: 500 }
        );
    }
}
