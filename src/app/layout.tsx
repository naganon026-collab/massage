import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#09090b", // zinc-950
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://seo-generator.vercel.app"),
  title: "The Gentry - Post Support",
  description: "マッサージ・ヘッドスパ・整体などの店舗向け、SNS・ブログ用SEOテキスト生成アシスタントツールです。",
  openGraph: {
    title: "The Gentry - Post Support",
    description: "プロフェッショナルな店舗向けSEOコンテンツ生成AIツール",
    url: "https://seo-generator.vercel.app", // デプロイ先URLに応じて変更推奨
    siteName: "The Gentry",
    images: [
      {
        url: "/og-image.png", // public配下に後で設定可能
        width: 1200,
        height: 630,
        alt: "The Gentry - Post Support",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Gentry - Post Support",
    description: "店舗向けのSEO特化型テキスト生成アシスタント",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-slate-50`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
