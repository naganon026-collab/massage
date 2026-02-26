import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

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

export async function POST(req: Request) {
    // 認証チェック: ログインしていないユーザーは 401 を返す
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    try {
        const { url } = await req.json();

        if (!url || typeof url !== "string") {
            return NextResponse.json({ error: "URLを指定してください。" }, { status: 400 });
        }

        // SSRF対策: URLバリデーション
        const { valid, reason } = validateUrl(url);
        if (!valid) {
            return NextResponse.json({ error: reason || "無効なURLです。" }, { status: 400 });
        }

        // Jina Reader を使ってJSレンダリング済みのテキストを取得
        const jinaUrl = `https://r.jina.ai/${url}`;
        const res = await fetch(jinaUrl, {
            headers: {
                "Accept": "text/plain",
                "X-Return-Format": "text",
            },
            signal: AbortSignal.timeout(20000),
        });

        if (!res.ok) {
            throw new Error(`Jina Reader エラー: ${res.status}`);
        }

        let text = await res.text();

        // トークン数削減のため、1URLあたり最大4000文字でカット
        if (text.length > 4000) text = text.substring(0, 4000) + "...";

        return NextResponse.json({ text });
    } catch (error: unknown) {
        console.error("Scraping API Error:", error);
        return NextResponse.json({ error: "WEBサイトからの情報抽出に失敗しました。時間をおいて再試行してください。" }, { status: 500 });
    }
}
