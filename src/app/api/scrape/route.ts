import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const scrapeSchema = z.object({
    url: z.string().url("無効なURLです。").max(2000, "URLが長すぎます。"),
});

/**
 * SSRF対策: 危険なURLかどうかをチェックする。
 * プライベートIP・ループバック・非HTTPスキームをブロックする。
 */
function validateUrl(rawUrl: string): { valid: boolean; reason?: string } {
    let parsed: URL;
    try {
        parsed = new URL(rawUrl);
    } catch {
        return { valid: false, reason: "URLの形式が正しくありません。" };
    }

    // http / https のみ許可
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { valid: false, reason: "httpまたはhttpsのURLのみ対応しています。" };
    }

    const host = parsed.hostname.toLowerCase();

    // ループバック・ローカルホストをブロック
    if (
        host === "localhost" ||
        host === "127.0.0.1" ||
        host === "0.0.0.0" ||
        host === "::1" ||
        host.endsWith(".localhost")
    ) {
        return { valid: false, reason: "ローカルホストへのアクセスは禁止されています。" };
    }

    // IPv4 プライベートアドレスをブロック（10.x.x.x / 172.16-31.x.x / 192.168.x.x）
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipv4Match = host.match(ipv4Pattern);
    if (ipv4Match) {
        const [, a, b] = ipv4Match.map(Number);
        if (
            a === 10 ||
            a === 127 ||
            (a === 172 && b >= 16 && b <= 31) ||
            (a === 192 && b === 168) ||
            a === 169 // リンクローカル (169.254.x.x)
        ) {
            return { valid: false, reason: "プライベートIPアドレスへのアクセスは禁止されています。" };
        }
    }

    // IPv6 プライベートアドレスをブロック
    if (
        host.startsWith("fe80:") ||  // リンクローカル
        host.startsWith("fc") ||      // ユニークローカル
        host.startsWith("fd") ||      // ユニークローカル
        host === "[::1]"              // ループバック
    ) {
        return { valid: false, reason: "プライベートIPv6アドレスへのアクセスは禁止されています。" };
    }

    return { valid: true };
}

/**
 * HTMLからプレーンテキストを抽出する。
 * script/style/noscriptなどの不要タグを除去し、ブロック要素を改行に変換した後、
 * 全HTMLタグを削除してHTMLエンティティをデコードする。
 */
function extractTextFromHtml(html: string): string {
    // script / style / noscript タグとその中身を削除
    let text = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "");

    // ブロック要素・改行タグを改行に変換
    text = text.replace(/<\/(p|div|li|h[1-6]|tr|blockquote|section|article|header|footer|main|nav|aside)>/gi, "\n");
    text = text.replace(/<br\s*\/?>/gi, "\n");

    // 残った全HTMLタグを除去
    text = text.replace(/<[^>]+>/g, "");

    // HTMLエンティティをデコード
    text = text
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));

    // 連続する空行を除去して整形
    text = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join("\n");

    // 15,000文字を超えたら切り捨て（AIの入力上限対策）
    if (text.length > 15000) {
        text = text.substring(0, 15000) + "...";
    }

    return text;
}

export async function POST(req: Request) {
    // 認証チェック: ログインしていないユーザーは 401 を返す
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const rateLimitResponse = checkRateLimit(user?.id || "anonymous", 20); // スクレイピングは1分間に20回まで
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const body = await req.json();
        const parsed = scrapeSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "入力内容に誤りがあります。", details: parsed.error.format() }, { status: 400 });
        }

        const { url } = parsed.data;

        // SSRF対策: URLバリデーション
        const { valid, reason } = validateUrl(url);
        if (!valid) {
            return NextResponse.json({ error: reason || "無効なURLです。" }, { status: 400 });
        }

        // ① ブラウザ偽装してHTMLを取得（ボットブロック回避）
        const res = await fetch(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept":
                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
            },
            signal: AbortSignal.timeout(10000), // 10秒タイムアウト
        });

        if (!res.ok) {
            throw new Error(`サイトの取得に失敗しました: HTTP ${res.status}`);
        }

        // リダイレクト後の最終URLについても再度バリデーション（SSRF対策の二重チェック）
        const finalUrl = res.url || url;
        const finalCheck = validateUrl(finalUrl);
        if (!finalCheck.valid) {
            throw new Error(finalCheck.reason || "安全でないURLにリダイレクトされたため中止しました。");
        }

        // Content-Type が text/html 系以外（画像・バイナリ等）の場合は拒否
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
            throw new Error("HTMLコンテンツ以外は解析できません。別のURLを指定してください。");
        }

        // コンテンツ長が極端に大きい場合はダウンロード前に拒否（帯域・メモリ防御）
        const contentLength = res.headers.get("content-length");
        if (contentLength && Number(contentLength) > 2 * 1024 * 1024) { // 2MB超
            throw new Error("コンテンツサイズが大きすぎるため解析を中止しました。");
        }

        const html = await res.text();

        // ② HTMLからテキストを抽出
        const text = extractTextFromHtml(html);

        if (!text) {
            throw new Error("テキストを抽出できませんでした。");
        }

        return NextResponse.json({ text });
    } catch (error: unknown) {
        console.error("Scraping API Error:", error);
        return NextResponse.json({ error: "WEBサイトからの情報抽出に失敗しました。時間をおいて再試行してください。" }, { status: 500 });
    }
}
