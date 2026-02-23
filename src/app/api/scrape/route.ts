import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url || !url.startsWith("http")) {
            return NextResponse.json({ error: "有効なURLを指定してください。" }, { status: 400 });
        }

        const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) });
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const html = await res.text();
        const $ = cheerio.load(html);

        // ノイズになる不要なタグを削除
        $('script, style, noscript, nav, footer, header').remove();

        // 本文テキストを抽出し、余分な空白を削除
        let text = $('body').text().replace(/\s+/g, ' ').trim();

        // トークン数削減のため、1URLあたり最大3000文字でカット
        if (text.length > 3000) text = text.substring(0, 3000) + '...';

        return NextResponse.json({ text });
    } catch (error: any) {
        console.error("Scraping API Error:", error);
        return NextResponse.json({ error: "WEBサイトからの情報抽出に失敗しました。" }, { status: 500 });
    }
}
