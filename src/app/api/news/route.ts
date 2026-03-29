import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const newsSchema = z.object({
  industry: z.string().max(100).optional(),
  address: z.string().max(100).optional(),
});

interface NewsItem {
  title: string;
  link: string;
  snippet: string;
}

function parseGoogleNewsRSS(xml: string): NewsItem[] {
  const items = xml.split("<item>").slice(1);
  const results: NewsItem[] = [];

  for (const chunk of items.slice(0, 5)) {
    const titleMatch =
      chunk.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
      chunk.match(/<title>(.*?)<\/title>/);
    const linkMatch = chunk.match(/<link>(.*?)<\/link>/);
    const descMatch =
      chunk.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
      chunk.match(/<description>(.*?)<\/description>/);

    const title = (titleMatch && titleMatch[1]?.trim()) || "";
    const link = (linkMatch && linkMatch[1]?.trim()) || "";
    let snippet = (descMatch && descMatch[1]) || "";

    if (!title || !link) continue;

    // HTMLタグを除去して日本語テキストだけにする
    snippet = snippet.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (snippet.length > 200) {
      snippet = snippet.slice(0, 200) + "…";
    }

    results.push({ title, link, snippet });
  }

  return results;
}

export async function POST(req: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const rateLimitResponse = checkRateLimit(user?.id || "anonymous", 20); // ニュースは外部RSSなので少し緩め
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const parsed = newsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "入力内容に誤りがあります。", details: parsed.error.format() }, { status: 400 });
    }

    const { industry, address } = parsed.data;

    const baseQuery = `${(industry || "整体・マッサージ").trim() || "整体・マッサージ"} ニュース`;
    const locationHint = address ? ` ${address}` : "";
    const query = encodeURIComponent(baseQuery + locationHint);

    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=ja&gl=JP&ceid=JP:ja`;

    const res = await fetch(rssUrl);
    if (!res.ok) {
      throw new Error("GoogleニュースRSSの取得に失敗しました。");
    }
    const xml = await res.text();
    const articles = parseGoogleNewsRSS(xml);

    return NextResponse.json({ articles });
  } catch (error: any) {
    console.error("News API Error:", error);
    return NextResponse.json(
      { error: "ニュースの取得中にエラーが発生しました。", details: error.message },
      { status: 500 }
    );
  }
}

