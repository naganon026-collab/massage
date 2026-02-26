import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url || !url.startsWith("http")) {
            return NextResponse.json({ error: "有効なURLを指定してください。" }, { status: 400 });
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
