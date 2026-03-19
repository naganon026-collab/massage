"use client";

import Link from "next/link";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  Copy, Loader2, Sparkles, Check, ChevronRight, Settings, Send,
  LogOut, History, Clock, Pencil, Trash2, Store, X, RefreshCw,
  FileText, Image, MessageCircle, Plug, Crown, BarChart3, Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToastContainer, useToast } from "@/components/ui/toast";

import { getSeasonalContext } from "@/lib/seasonalContext";
import { ADMIN_EMAIL, PATTERNS, PATTERN_CATEGORIES, getPatternCategoryId, REFINE_OPTIONS, INDUSTRY_DATA, ShopInfo, ShortScriptData, LlmoArticleData } from "@/types";
import type { Pattern, TreatmentTagId, EducationTagId, StaffMessageTagId, SalonSceneTagId, SceneMessageTagId, NoticeTypeTagId, UrgencyTagId, VoiceCategoryId, VoiceOptionTagId, PatternCategoryId } from "@/types";
import { useStoreManager } from "@/hooks/useStoreManager";
import { useShopConfig } from "@/hooks/useShopConfig";
import { useContentGenerator } from "@/hooks/useContentGenerator";
import { SettingsOverlay } from "@/components/features/settings/SettingsOverlay";
import { AppConnectionsOverlay } from "@/components/features/settings/AppConnectionsOverlay";
import { StoreManagerOverlay } from "@/components/features/store-manager/StoreManagerOverlay";
import { UpgradeOverlay } from "@/components/UpgradeOverlay";
import { LimitExceededModal } from "@/components/LimitExceededModal";
import { InitialSetup } from "@/components/features/settings/InitialSetup";
import { PostToLineButton } from "@/components/PostToLineButton";
import { PostToLateButton } from "@/components/PostToLateButton";

/** テキスト内の電話番号を tel: リンク、URL をクリック可能なリンクに変換する */
function linkifyText(text: string): React.ReactNode {
  if (!text || typeof text !== "string") return text;
  const parts: React.ReactNode[] = [];
  const re = /(https?:\/\/[^\s)]+)|(0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4})/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<React.Fragment key={key++}>{text.slice(lastIndex, match.index)}</React.Fragment>);
    }
    if (match[1]) {
      parts.push(<a key={key++} href={match[1]} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline break-all">{match[1]}</a>);
    } else if (match[2]) {
      const digits = match[2].replace(/\D/g, "");
      parts.push(<a key={key++} href={`tel:${digits}`} className="text-emerald-400 hover:underline">{match[2]}</a>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(<React.Fragment key={key++}>{text.slice(lastIndex)}</React.Fragment>);
  }
  return parts.length ? <>{parts}</> : text;
}

/** 練習モード用サンプル店舗（5回枠にカウントしない初回生成用） */
const SAMPLE_PRACTICE_SHOP: ShopInfo = {
  name: "Hair Studio Lumière",
  address: "長野市",
  industry: "サロン",
  phone: "",
  lineUrl: "",
  businessHours: "10:00〜19:00",
  holidays: "不定休",
  features: "ゼロタッチカラー、頭皮ケア",
  snsUrl: "",
  sampleTexts: "",
  scrapedContent: "",
  referenceUrls: [],
  outputTargets: { instagram: true, gbp: true, portal: false, line: true, short: false },
};

// デモ用テキスト（ランディング用）
const LP_DEMOS: Record<string, Record<string, string>> = {
  beforeafter: {
    instagram: `❄️ 冬の空気が、髪に静かに影響している。

暖かい室内でふと触れた髪が、
以前と少し違う気がする——
そんな小さな変化、見逃したくないと思います。

先日ご来店のお客様は、
白髪染めのたびにしみる感覚が気になって
ずっと悩まれていました。

頭皮の状態を丁寧に見ながら、
ゼロタッチカラー×内部集中トリートメントで施術すると、
仕上がりを手で触れた瞬間、

「…これ、本当に自分の髪ですか？」

冬だから、と諦めないでください。
頭皮に寄り添いながら、
ツヤとやわらかさを、もう一度。

📍 Hair Studio Lumière
ご予約はプロフィールリンクから。

#ヘアケア #冬の髪 #白髪染め #ゼロタッチカラー
#頭皮ケア #艶髪 #サロンケア #HairStudioLumiere`,
    google: `【冬の「白髪染め疲れ」、感じていませんか？】

冬の乾燥した空気は、髪だけでなく頭皮にも負担がかかりやすく、
「白髪染めのたびにピリピリする」「染めたあとのパサつきが気になる」というご相談を多くいただきます。

Hair Studio Lumière では、頭皮に直接薬剤をつけないゼロタッチカラーや、
髪へのダメージを抑えながら白髪を自然にぼかすノンブリーチシニアカラーなど、
「これからも安心して続けられる白髪染め」を重視したメニューをご提案しています。

仕上げには、ケア専用トリートメントで内部からうるおいを補給。
「白髪は気になるけれど、これ以上傷ませたくない」という方に好評です。

まずはお気軽にご相談ください。`,
    line: `こんにちは、Hair Studio Lumière です☕️

「最近、白髪染めのあとに頭皮がヒリヒリする」「髪がパサつきやすくなってきた」
そんなお声をここ数ヶ月でますます多くいただいています。

当店では、頭皮に直接薬剤をつけないゼロタッチカラーや、
白髪を生かしながらやわらかく見せるノンブリーチシニアカラーなど、
「これから先も安心して続けられるカラー」を一緒に考えていきます。

冬の乾燥で敏感になっている頭皮に、少しだけやさしい選択をしてみませんか？

ご相談だけでも大歓迎です。

▶ ご予約・お問い合わせは公式サイトまたはLINEからどうぞ。`,
  },
  kodawari: {
    instagram: `✦ スタイリスト藤澤の「こだわり」を、少しだけご紹介させてください。

カラーリング一つとっても、私たちは薬剤の選び方・塗布の方法・放置時間まで、お客様一人ひとりの髪質や頭皮の状態に合わせて変えています。

「なんとなく色が入ればいい」ではなく、3ヶ月後も綺麗な色が続くかを常に考えながら施術しています💡

オーナースタイリストはヘアカラー協会認定資格・ヘアケアマイスターとして、
白髪世代の方の髪と頭皮に寄り添うカラーを研究し続けてきました。
ゼロタッチカラーやノンブリーチカラーなど、年齢やライフスタイルに合わせた提案が得意です。

「ずっとここに来てよかった」と言っていただけることが、私たちの一番の励みです✨`,
    google: `【スタイリストのこだわりについて】

Hair Studio Lumière では、施術の品質にとことんこだわっています。

カラーリングでは、薬剤選び・塗布方法・放置時間をお客様の髪質に合わせて細かく調整。
JHCA日本ヘアカラー協会認定のスタイリストが、色もちの良い仕上がりを追求しています。

お客様の「こうなりたい」というイメージと、髪や頭皮の状態を丁寧にヒアリングし、
無理のない範囲で長く続けられるデザインをご提案いたします。

詳しいメニューや料金は公式サイトをご覧ください。`,
    line: `こんにちは！fujisawaです🌿

「カラーしたては良いけれど、すぐに色が抜けてしまう」「ダメージが気になって挑戦しづらい」
そんなお悩みをよく伺います。

実は、薬剤の選び方や塗り方を少し工夫するだけで、「色もち」と「髪のやわらかさ」はかなり変わります。

ご来店の際は、普段のお手入れ方法や、これまで気になっていたことを遠慮なくお話しください😊
あなたの髪に合ったベストな方法を一緒に考えましょう。`,
  },
  season: {
    instagram: `🌸 3月、春のヘアチェンジを考える方が少しずつ増えてきました。

まだ肌寒い日も多いですが、マフラーを外す季節に向けて、
「首まわりがすっきり見えるスタイルにしたい」「髪色で気分を変えたい」というご相談をよくいただきます。

冬の乾燥でダメージを受けた髪や頭皮をそのままにしておくと、
せっかくの春カラーもパサついて見えてしまうことも…。

この時期は、
✦ 根元の伸びを自然にぼかす春カラー
✦ 頭皮と髪を整えるクレンジングスパ
✦ マフラーを外しても決まる首元すっきりカット
の組み合わせがおすすめです💐

「何から変えたらいいか分からない」という方も、まずはお気軽にご相談ください。`,
    google: `【春に向けたヘアスタイルの準備、できていますか？】

3月は卒業・入学・異動など、写真に残る機会が増える季節です。

Hair Studio Lumière では、
・春らしい透明感カラー
・冬の乾燥ダメージをケアするトリートメント
・ライフスタイルに合わせた再現性の高いカット
を組み合わせた「春支度プラン」のご相談を承っています。

「派手すぎないけれど、少し印象を変えたい」というご要望にもお応えします。`,
    line: `こんにちは！fujisawaです🌸

少しずつ日が長くなってきましたね。
「春に向けて、そろそろ髪を整えておきたいな」という方も増えてきました。

春カラーのご相談はもちろん、
「まずはダメージをリセットしたい」「スタイリングをラクにしたい」といったご相談も大歓迎です😊

あなたのライフスタイルに合った春ヘア、一緒に考えましょう✨`,
  },
};

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

// ========== ランディングページ（ログイン前） ==========
function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [demoPattern, setDemoPattern] = useState<"beforeafter" | "kodawari" | "season">("beforeafter");
  const [demoPlatform, setDemoPlatform] = useState<"instagram" | "google" | "line">("instagram");
  const [showUpgradeHint, setShowUpgradeHint] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px 80px 0px" }
    );
    const timer = setTimeout(() => {
      document.querySelectorAll(".lp-reveal").forEach((el) => observer.observe(el));
    }, 100);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const demoText = LP_DEMOS[demoPattern]?.[demoPlatform] ?? "";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 py-4 sm:px-10 bg-zinc-950/90 backdrop-blur-xl border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5 font-bold text-base text-zinc-100">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg gradient-accent flex items-center justify-center text-zinc-950 text-sm">✦</div>
          Logic Post
        </div>
        <button
          type="button"
          onClick={onLogin}
          className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-300 text-zinc-950 font-bold px-5 py-2.5 rounded-lg text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 shadow-[0_0_25px_rgba(45,212,191,0.45)]"
        >
          <GoogleIcon className="w-4 h-4" />
          Googleで無料ではじめる
        </button>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center pt-[120px] pb-0 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(34,211,238,0.08),transparent_70%)] bg-[radial-gradient(ellipse_40%_30%_at_80%_80%,rgba(52,211,153,0.04),transparent_60%)]" />
        <div className="absolute inset-0 z-0 opacity-[0.04] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent_80%)]" style={{ backgroundImage: "linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative z-10 max-w-[760px]">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 py-1.5 px-4 rounded-full text-[13px] font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <span className="text-[10px]">✦</span> 美容室・サロン・カフェ・整体院に対応
          </div>
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
            美容室・サロン専用
            <br />
            SNS投稿を<em className="not-italic gradient-accent-text">1分で</em>
          </h1>
          <p className="text-[15px] sm:text-lg text-zinc-400 max-w-[520px] mx-auto mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            毎日の「何を書けばいいか…」から解放されよう。<br />お店の情報と文体を学習し、読まれる投稿文を自動生成。
          </p>
          <p className="text-[13px] text-emerald-400 mb-9 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
            ✦ 生成まで無料 <span className="opacity-60 text-zinc-400">｜ コピーして使うプランは近日公開</span>
          </p>
          <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <button
              type="button"
              onClick={onLogin}
              className="inline-flex items-center gap-2.5 bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-300 text-zinc-950 font-extrabold py-4 px-9 rounded-xl text-base shadow-[0_0_45px_rgba(45,212,191,0.6)] hover:brightness-110 hover:shadow-[0_0_70px_rgba(190,242,100,0.75)] hover:-translate-y-0.5 active:scale-[0.98] transition-all"
            >
              <GoogleIcon className="w-5 h-5" />
              Googleで無料ではじめる
            </button>
            <span className="text-xs text-zinc-500">クレジットカード不要・60秒で登録完了</span>
          </div>
        </div>
      </section>

      {/* INTRO VIDEO */}
      <section className="px-6 pt-16 pb-8 bg-zinc-950">
        <div className="max-w-3xl mx-auto lp-reveal opacity-0 translate-y-6 transition-all duration-500 ease-out">
          <p className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold mb-3">デモ動画</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-50 mb-5">
            Logic Post の流れを<span className="gradient-accent-text">動画で確認</span>
          </h2>
          <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-black">
            <div className="relative w-full pb-[56.25%]">
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/hi7oEl6L3Yk?si=HLLevEV3ZGjh6CZT"
                title="Logic Post demo video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      {/* PAIN */}
      <section className="pt-24 pb-24 px-6 bg-zinc-900/30 border-t border-zinc-800/80">
        <div className="max-w-[980px] mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center mt-14 lp-reveal opacity-0 translate-y-6 transition-all duration-500 ease-out">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold mb-4">こんなお悩みありませんか？</p>
              <h2 className="font-display text-3xl sm:text-4xl font-black leading-tight tracking-tight mb-4">SNS担当者が<br /><em className="not-italic gradient-accent-text">いない</em>お店の現実</h2>
              <p className="text-base text-zinc-400 max-w-[500px]">施術・接客・経営で手一杯。投稿に時間も文章力もかけられない。</p>
              <div className="mt-8 space-y-4">
                {[
                  { icon: "✏️", title: "「何を書けばいいか」で時間が溶ける", desc: "毎回ゼロから考えて、気づいたら30分が過ぎている" },
                  { icon: "📱", title: "媒体ごとに書き直すのが大変", desc: "Instagram・Google・ブログ・LINEで文体が違いすぎる" },
                  { icon: "📉", title: "「集客につながる文章」が書けない", desc: "なんとなく投稿しても反応がなく、モチベーションが続かない" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3.5 bg-zinc-800/80 border border-zinc-700 rounded-xl p-4">
                    <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                    <div className="text-sm text-zinc-400 leading-snug">
                      <strong className="text-zinc-100 block text-[15px] mb-1">{item.title}</strong>
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-zinc-800/50 p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
              <p className="text-[13px] text-emerald-400 font-bold uppercase tracking-wider mb-4">Logic Post なら</p>
              <div className="text-[15px] text-zinc-400 leading-relaxed space-y-3">
                <p>フォームに<strong className="text-zinc-100">3つの質問に答えるだけ</strong>で、AIがお店の情報・文体・今日の天気まで反映した投稿文を<strong className="text-zinc-100">Instagram・Google・ブログ・LINE・ショート動画の5媒体分</strong>まとめて生成。</p>
                <p>すでに「AIで試したけど、いまいちだった」という方こそ最適。過去の投稿文を学習させると、<strong className="text-zinc-100">お店らしい自然な文体</strong>で書き続けます。</p>
                <p>今日の日付・天気も自動取得。<strong className="text-zinc-100">季節感・気候に合った文章</strong>に仕上げます。</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section className="py-24 px-6 border-t border-zinc-800/80">
        <div className="max-w-[980px] mx-auto">
          <div className="lp-reveal opacity-0 translate-y-6 transition-all duration-500 ease-out mb-14">
            <p className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold mb-4">生成サンプル</p>
            <h2 className="font-display text-3xl sm:text-4xl font-black leading-tight mb-4">こんな投稿文が、<em className="not-italic gradient-accent-text">1分で</em>できます</h2>
            <p className="text-base text-zinc-400 max-w-[500px]">美容室fujisawaの実際の生成例。パターンと媒体を選んでご確認ください。</p>
          </div>
          <div className="lp-reveal opacity-0 translate-y-6 transition-all duration-500 ease-out flex gap-2 mb-8 flex-wrap">
            {(["beforeafter", "kodawari", "season"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setDemoPattern(key)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  demoPattern === key
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-100"
                }`}
              >
                {key === "beforeafter" && "ビフォーアフター"}
                {key === "kodawari" && "プロのこだわり"}
                {key === "season" && "季節・シーズン"}
              </button>
            ))}
          </div>
          <div className="lp-reveal opacity-0 translate-y-6 transition-all duration-500 ease-out border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/50">
            <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-[13px] text-zinc-400">生成完了 — 美容室fujisawa（長野県）</span>
              <span className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-bold tracking-wide">AI生成</span>
            </div>
            <div className="p-7">
              <div className="flex gap-2 mb-6 flex-wrap">
                {(["instagram", "google", "line"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDemoPlatform(key)}
                    className={`px-3.5 py-1.5 rounded-md border text-xs transition-all ${
                      demoPlatform === key
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    {key === "instagram" && "📸 Instagram"}
                    {key === "google" && "🗺️ GoogleMap投稿"}
                    {key === "line" && "💬 LINE"}
                  </button>
                ))}
              </div>
              <pre className="text-sm leading-loose text-zinc-100 whitespace-pre-wrap min-h-[200px] font-sans">{demoText}</pre>
              <div className="flex justify-end mt-5">
                <button
                  type="button"
                  onClick={() => setShowUpgradeHint(true)}
                  className="inline-flex items-center gap-2 py-2.5 px-5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[13px] font-bold hover:bg-emerald-500/20 transition-colors"
                >
                  <span className="opacity-70">🔒</span> コピーして使う（有料プラン）
                </button>
              </div>
              {showUpgradeHint && (
                <p className="text-xs text-zinc-500 text-center mt-3">
                  ✦ 生成まで無料で体験できます。コピー機能は有料プラン（近日公開）でご利用いただけます。
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-6 bg-zinc-900/30 border-t border-zinc-800/80">
        <div className="max-w-[980px] mx-auto">
          <div className="lp-reveal opacity-0 translate-y-6 transition-all duration-500 ease-out mb-14">
            <p className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold mb-4">機能</p>
            <h2 className="font-display text-3xl sm:text-4xl font-black leading-tight">投稿づくりに必要なことが<em className="not-italic gradient-accent-text">すべてここに</em></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-14 lp-reveal opacity-0 translate-y-6 transition-all duration-500 ease-out">
            {[
              { icon: "📄", title: "5媒体を一括生成", desc: "Instagram・Google・ブログ・LINE・ショート動画台本を一度の入力でまとめて作成" },
              { icon: "🖼", title: "画像からも生成", desc: "施術写真・メニュー画像をアップロードするだけで、画像に合った投稿文を自動作成" },
              { icon: "💬", title: "あなたの文体で", desc: "過去の投稿を登録するとトーンや言い回しを学習。お店らしい自然な文章が続く" },
              { icon: "📰", title: "ニュース連動も", desc: "業種に合った最新ニュースを選ぶと、専門家目線のコメント付き投稿を自動生成" },
            ].map((f) => (
              <div key={f.title} className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-7 hover:border-emerald-500/20 hover:-translate-y-1 transition-all">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl mb-4">{f.icon}</div>
                <h3 className="text-[15px] font-bold mb-2">{f.title}</h3>
                <p className="text-[13px] text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="py-24 px-6 border-t border-zinc-800/80">
        <div className="max-w-[980px] mx-auto">
          <div className="lp-reveal opacity-0 translate-y-6 transition-all duration-500 ease-out mb-12">
            <p className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold mb-4">対応業種</p>
            <h2 className="font-display text-3xl sm:text-4xl font-black leading-tight mb-4">あなたのお店に<em className="not-italic gradient-accent-text">合わせて</em>生成</h2>
            <p className="text-base text-zinc-400 max-w-[500px]">業種に応じた専門的な表現と、媒体別の最適な文体で仕上げます。</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12 lp-reveal opacity-0 translate-y-6 transition-all duration-500 ease-out">
            {[
              { emoji: "💇", name: "美容室・ヘアサロン", note: "スタイリスト紹介・施術事例・季節ケアなど", highlight: true },
              { emoji: "☕", name: "カフェ・飲食店", note: "新メニュー・日替わり・季節限定など", highlight: false },
              { emoji: "🤲", name: "整体・マッサージ", note: "お悩み解消・施術の特徴・お客様の声など", highlight: false },
              { emoji: "🦷", name: "歯科医院", note: "予防歯科・治療案内・院内の雰囲気など", highlight: false },
            ].map((i) => (
              <div
                key={i.name}
                className={`rounded-xl border p-6 text-center transition-all ${
                  i.highlight ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-700 bg-zinc-900/50 hover:border-emerald-500/20"
                }`}
              >
                <div className="text-3xl mb-3">{i.emoji}</div>
                <div className="text-[15px] font-bold mb-1.5">{i.name}</div>
                <div className="text-xs text-zinc-400">{i.note}</div>
                {i.highlight && <span className="inline-block mt-2.5 text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">先行導入中</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FLOW */}
      <section className="py-24 px-6 bg-zinc-900/30 border-t border-zinc-800/80">
        <div className="max-w-[980px] mx-auto">
          <div className="text-center lp-reveal opacity-0 translate-y-6 transition-all duration-500 ease-out mb-14">
            <p className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold mb-4">使い方</p>
            <h2 className="font-display text-3xl sm:text-4xl font-black leading-tight mb-4">まず<em className="not-italic gradient-accent-text">1本</em>、生成してみる</h2>
            <p className="text-base text-zinc-400 max-w-xl mx-auto">Googleアカウントで即ログイン。3ステップで最初の投稿文ができます。</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-14 lp-reveal opacity-0 translate-y-6 transition-all duration-500 ease-out">
            {[
              { num: "1", title: "お店の情報を登録", desc: "URLを入れるだけで業種・店名・住所・営業時間を自動取得。過去の投稿文を貼れば文体も学習。" },
              { num: "2", title: "パターンを選んで入力", desc: "9種類のパターンから選び、3つの質問に答えるだけ。難しい文章は書かなくてOK。" },
              { num: "3", title: "生成完了・確認する", desc: "Instagram・Google・ブログ・LINE・ショート動画の5媒体分が一括で完成。" },
            ].map((s) => (
              <div key={s.num} className="text-center py-0 px-6 relative z-10">
                <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-emerald-500/30 flex items-center justify-center text-2xl font-black text-emerald-400 font-display mx-auto mb-5">{s.num}</div>
                <div className="text-base font-bold mb-2.5">{s.title}</div>
                <div className="text-[13px] text-zinc-400 leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative py-32 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_50%,rgba(52,211,153,0.06),transparent_70%)]" />
        <div className="relative z-10 lp-reveal opacity-0 translate-y-6 transition-all duration-500 ease-out">
          <h2 className="font-display text-3xl sm:text-5xl font-black leading-tight tracking-tight mb-5">
            まずは、<em className="not-italic gradient-accent-text">無料で</em><br />生成してみてください。
          </h2>
          <p className="text-base text-zinc-400 mb-10">Googleアカウントで今すぐ始められます。クレジットカード不要。</p>
          <button
            type="button"
            onClick={onLogin}
            className="inline-flex items-center gap-2.5 bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-300 text-zinc-950 font-extrabold py-4 px-9 rounded-xl text-base shadow-[0_0_45px_rgba(45,212,191,0.6)] hover:brightness-110 hover:shadow-[0_0_70px_rgba(190,242,100,0.75)] hover:-translate-y-0.5 active:scale-[0.98] transition-all"
          >
            <GoogleIcon className="w-5 h-5" />
            Googleで今すぐはじめる
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 py-10 px-6 text-center">
        <div className="max-w-[980px] mx-auto">
          <div className="flex items-center justify-center gap-2 font-bold text-zinc-100 mb-4 text-[15px]">
            <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center text-zinc-950 text-[13px]">✦</div>
            Logic Post
          </div>
          <div className="flex gap-6 justify-center flex-wrap mb-4">
            <a href="#" className="text-[13px] text-zinc-500 hover:text-emerald-400 transition-colors">利用規約</a>
            <a href="#" className="text-[13px] text-zinc-500 hover:text-emerald-400 transition-colors">プライバシーポリシー</a>
            <a href="#" className="text-[13px] text-zinc-500 hover:text-emerald-400 transition-colors">お問い合わせ</a>
          </div>
          <div className="text-xs text-zinc-500">© 2026 Logic Post. All rights reserved.</div>
        </div>
      </footer>

    </div>
  );
}

// ========== ローディング画面 ==========
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center glow-accent animate-pulse">
        <Sparkles className="w-6 h-6 text-zinc-950" />
      </div>
      <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
    </div>
  );
}

// ========== メインアプリ ==========
function SEOContentGenerator() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const { toasts, addToast, removeToast } = useToast();
  const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);
  const [showAppConnectionsOverlay, setShowAppConnectionsOverlay] = useState(false);
  const [showUpgradeOverlay, setShowUpgradeOverlay] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<{
    allowed: boolean;
    used: number;
    limit: number | null;
    remaining: number | null;
    plan: string;
    dailyUsed?: number;
    dailyLimit?: number;
    dailyRemaining?: number;
    canGenerateBlog?: boolean;
    isPracticeMode?: boolean;
  } | null>(null);
  const [showPracticeCelebration, setShowPracticeCelebration] = useState(false);
  const [showLimitExceededModal, setShowLimitExceededModal] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"all" | "today" | "week">("all");
  const resultsRef = useRef<HTMLDivElement>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<TreatmentTagId | null>(null);
  const [optionalMemos, setOptionalMemos] = useState({ reaction: "", beforeAfter: "" });
  const [selectedEducation, setSelectedEducation] = useState<EducationTagId | null>(null);
  const [educationMemo, setEducationMemo] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<StaffMessageTagId | null>(null);
  const [staffMemo, setStaffMemo] = useState("");
  const [selectedScene, setSelectedScene] = useState<SalonSceneTagId | null>(null);
  const [selectedSceneMessage, setSelectedSceneMessage] = useState<SceneMessageTagId | null>(null);
  const [sceneMemo, setSceneMemo] = useState("");
  const [selectedNoticeType, setSelectedNoticeType] = useState<NoticeTypeTagId | null>(null);
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyTagId | null>(null);
  const [noticePeriod, setNoticePeriod] = useState("");
  const [noticeMemo, setNoticeMemo] = useState("");
  const [voiceMemo, setVoiceMemo] = useState("");
  const [selectedVoiceCategory, setSelectedVoiceCategory] = useState<VoiceCategoryId | null>(null);
  const [selectedVoiceOption, setSelectedVoiceOption] = useState<VoiceOptionTagId | null>(null);
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null);
  const [selectedEducationReason, setSelectedEducationReason] = useState<string | null>(null);
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null);
  const [selectedMessageTone, setSelectedMessageTone] = useState<string | null>(null);
  const [selectedPatternCategory, setSelectedPatternCategory] = useState<PatternCategoryId | null>(null);
  const [instagramPostImage, setInstagramPostImage] = useState<{ mimeType: string; data: string } | null>(null);

  // ===== カスタムフック =====
  const shopConfig = useShopConfig(user, addToast, async (userId, isAdmin) => {
    await fetchHistory(userId);
    if (isAdmin) await fetchStores();
  });

  const storeManager = useStoreManager(user, addToast);
  const { fetchStores } = storeManager;

  const shopInfoForGen = generationStatus?.isPracticeMode ? SAMPLE_PRACTICE_SHOP : shopConfig.shopInfo;
  const contentGen = useContentGenerator(user, shopInfoForGen, storeManager.stores, storeManager.selectedStoreId, addToast, () => {
    // 練習モードで初回生成完了時は祝福オーバーレイを表示
    const wasPracticeMode = generationStatus?.isPracticeMode === true;
    if (wasPracticeMode) setShowPracticeCelebration(true);
    // 生成完了セクションへ自動スクロール（DOM更新を待つ）
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    // 生成成功後にプラン情報を再取得（本日 X/5 回を更新）
    fetch("/api/user/plan", { credentials: "same-origin" })
      .then((r) => r.json())
      .then(setGenerationStatus)
      .catch(() => {});
  }, generationStatus?.canGenerateBlog, generationStatus?.isPracticeMode, () => setShowLimitExceededModal(true));
  const { fetchHistory } = contentGen;
  const router = useRouter();
  const searchParams = useSearchParams();

  // ===== Late OAuth コールバック後のトースト =====
  const lateHandledRef = useRef<string | null>(null);
  useEffect(() => {
    const late = searchParams.get("late");
    if (!late) {
      lateHandledRef.current = null;
      return;
    }
    if (lateHandledRef.current === late) return;
    lateHandledRef.current = late;
    if (late === "connected") {
      addToast("Instagram・GBPの接続が完了しました", "success");
      router.replace("/", { scroll: false });
    } else if (late === "error") {
      const reason = searchParams.get("reason");
      if (reason === "no_session") {
        addToast("ログインセッションが切れています。再度ログインしてから接続してください。", "error");
        router.replace("/", { scroll: false });
        return;
      }
      fetch("/api/integrations/late/refresh", { method: "POST" })
        .then((r) => r.json())
        .then((data) => {
          if (data.success && (data.instagram || data.googlebusiness)) {
            addToast("接続を確認しました。投稿できるようになりました。", "success");
          } else if (reason === "no_account" || reason === "no_profile") {
            addToast("Lateで認証を完了しましたか？もう一度「Instagramを接続」または「GBPを接続」からお試しください。", "error");
          } else if (reason === "db") {
            addToast("データの保存に失敗しました。設定から再度お試しください。", "error");
          } else {
            addToast("接続に失敗しました。アプリ接続から再度接続をお試しください。", "error");
          }
        })
        .catch(() => {
          addToast("接続の確認に失敗しました。アプリ接続から再度接続をお試しください。", "error");
        })
        .finally(() => router.replace("/", { scroll: false }));
    }
  }, [searchParams, router, addToast]);

  // ===== 認証 =====
  useEffect(() => {
    // 初期化済みフラグ：getSession と INITIAL_SESSION イベントの両方が走っても
    // fetchShopInfo が2回呼ばれないようにする
    let hasInitialized = false;

    // getSession() で確実に初回セッションを取得（onAuthStateChange が遅れても白画面にならない）
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (hasInitialized) return; // INITIAL_SESSION が先に来た場合はスキップ
      hasInitialized = true;
      setUser(session?.user || null);
      if (session?.user) {
        shopConfig.fetchShopInfo(session.user.id, session.user.email);
      } else {
        shopConfig.setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        // getSession() がまだ済んでいない場合のみ処理（どちらか先着1回だけ実行）
        if (hasInitialized) return;
        hasInitialized = true;
        setUser(session?.user || null);
        if (session?.user) {
          shopConfig.fetchShopInfo(session.user.id, session.user.email);
        } else {
          shopConfig.setIsLoading(false);
        }
        return;
      }

      // SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED など以降のイベント
      setUser(session?.user || null);
      if (!session?.user) {
        // ログアウト時のリセット
        shopConfig.setShopInfo({
          name: "", address: "", phone: "", lineUrl: "", businessHours: "", holidays: "",
          features: "", industry: "", snsUrl: "", sampleTexts: "", scrapedContent: "",
          referenceUrls: [], wpCategoryId: "", wpTagId: "", wpAuthorId: "",
          outputTargets: { instagram: true, gbp: true, portal: true, line: true, short: false }
        });
        shopConfig.setScrapedPreview("");
        sessionStorage.removeItem("shopInfoDraft");
        shopConfig.setIsConfigured(false);
        shopConfig.setIsLoading(false);
        storeManager.setStores([]);
        storeManager.setSelectedStoreId(null);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 管理者は常に /admin へ（フックは早期 return の前に必ず呼ぶ）
  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) router.replace("/admin");
  }, [user?.email, router]);

  // 初回ロード時にプラン・生成回数情報を取得（Cookie で認証）
  useEffect(() => {
    if (!user) return;
    fetch("/api/user/plan", { credentials: "same-origin" })
      .then((r) => r.json())
      .then(setGenerationStatus)
      .catch(() => setGenerationStatus(null));
  }, [user]);

  // 初期設定完了→メイン画面への切り替え時にスクロールを先頭に戻す（早期 return の前に必ず呼ぶ）
  useEffect(() => {
    if (shopConfig.isConfigured) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [shopConfig.isConfigured]);

  // 早期 return の前に必ず destructure と useEffect を実行（React Hooks のルール）
  const { shopInfo, setShopInfo, isConfigured, setIsConfigured, setupStep, setSetupStep, setupPath, setSetupPath,
    scrapeUrl, setScrapeUrl, isScraping, isExtractingInfo, scrapedPreview, setScrapedPreview,
    handleScrapeUrl, handleScrapeUrls, handleReadAndProceed, handleExtractInfo, handleSaveShopInfo, handleSkipWithMinimal,
    settingsScrapeUrl, setSettingsScrapeUrl, isScrapingSettings,
    handleScrapeUrlForSettings, handleScrapeUrlsForSettings, handleQuickSaveSettings,
    analysisResult, isAnalyzing,
  } = shopConfig;

  const { selectedPattern, setSelectedPattern, handlePatternChange, currentPattern,
    formData, setFormData, replyPlatform, setReplyPlatform,
    receivedComment, setReceivedComment, replyNote, setReplyNote,
    uploadImageData, setUploadImageData, imageMemo, setImageMemo,
    isGenerating, generationProgress, generatedResults, setGeneratedResults, copiedTab, editingTab, setEditingTab,
    generationHistory, showHistory, setShowHistory,
    deletingHistoryId, handleGenerate,
    handleCopy, handleRestoreHistory, handleDeleteHistory,
    lineIncludeSeasonalGreeting, setLineIncludeSeasonalGreeting,
    refineInstruction, setRefineInstruction, isRefining, handleRefine,
    isLlmoGenerating, handleGenerateLlmo,
  } = contentGen;

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleUpgrade = () => {
    setShowUpgradeOverlay(true);
  };

  const handleSelectPlan = async (plan: "light" | "standard" | "pro") => {
    setIsCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else if (data?.error) {
        addToast(data.error, "error");
      }
    } catch {
      addToast("チェックアウトの開始に失敗しました", "error");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  // ===== ローディング・未ログイン =====
  if (shopConfig.isLoading) return <LoadingScreen />;
  if (!user) return <LoginPage onLogin={handleLogin} />;

  // 管理者は /admin へリダイレクトするので一瞬だけローディング表示
  if (user.email === ADMIN_EMAIL) return <LoadingScreen />;

  const { stores, selectedStoreId, setSelectedStoreId, showStoreManager, setShowStoreManager,
    showStoreForm, setShowStoreForm, editingStoreId, setEditingStoreId,
    storeFormData, setStoreFormData, isSavingStore, isDeletingStore,
    storeScrapeUrl, setStoreScrapeUrl, isScrapingStore,
    handleSaveStore, handleDeleteStore, openEditStore, handleScrapeUrlForStore,
  } = storeManager;

  // 選択中の店舗があればその設定、なければデフォルトのshopInfoを使う
  const activeShopInfo = selectedStoreId
    ? (stores.find(s => s.id === selectedStoreId)?.settings ?? shopInfo)
    : shopInfo;

  const industryKey = activeShopInfo.industry || "salon";
  const tags = INDUSTRY_DATA[industryKey] || INDUSTRY_DATA["salon"];

  const canGenerate =
    selectedPattern === "G" ? receivedComment.trim().length > 0
      : selectedPattern === "I" ? !!uploadImageData
        : currentPattern.isTagSelect === true
            ? (currentPattern.id === "A" ? selectedTreatment !== null && selectedConcern !== null
              : currentPattern.id === "B" ? selectedEducation !== null && selectedEducationReason !== null
              : currentPattern.id === "C" ? selectedNoticeType !== null && selectedUrgency !== null
              : currentPattern.id === "D" ? selectedVoiceOption !== null && voiceMemo.trim() !== ""
              : currentPattern.id === "E" ? selectedMessage !== null && staffMemo.trim() !== ""
              : currentPattern.id === "H" ? selectedScene !== null && selectedSceneMessage !== null
              : false)
            : (formData.q1.trim() || formData.q2.trim() || formData.q3.trim());

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50 font-sans selection:bg-emerald-500/30 selection:text-zinc-950 pb-[max(5rem,calc(5rem+env(safe-area-inset-bottom)))]">
      {/* トースト通知 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* 開発環境のみ：初回設定画面を再表示するデバッグボタン */}
      {process.env.NODE_ENV === "development" && (
        <button
          type="button"
          onClick={() => setIsConfigured(false)}
          className="fixed bottom-4 right-4 z-50 bg-red-500 text-white text-xs px-3 py-2 rounded-lg opacity-50 hover:opacity-100"
        >
          🔧 初回設定をリセット
        </button>
      )}

      {/* ===== オーバーレイ群 ===== */}
      <UpgradeOverlay
        show={showUpgradeOverlay}
        onClose={() => setShowUpgradeOverlay(false)}
        currentPlan={generationStatus?.plan ?? "free"}
        onSelectPlan={handleSelectPlan}
        isLoading={isCheckoutLoading}
      />
      <LimitExceededModal
        show={showLimitExceededModal}
        onClose={() => setShowLimitExceededModal(false)}
        onUpgrade={handleUpgrade}
        currentPlan={generationStatus?.plan}
      />
      <StoreManagerOverlay
        showStoreManager={showStoreManager}
        setShowStoreManager={setShowStoreManager}
        showStoreForm={showStoreForm}
        setShowStoreForm={setShowStoreForm}
        stores={stores}
        storeFormData={storeFormData}
        setStoreFormData={setStoreFormData}
        editingStoreId={editingStoreId}
        setEditingStoreId={setEditingStoreId}
        isSavingStore={isSavingStore}
        isDeletingStore={isDeletingStore}
        handleSaveStore={handleSaveStore}
        handleDeleteStore={handleDeleteStore}
        openEditStore={openEditStore}
        storeScrapeUrl={storeScrapeUrl}
        setStoreScrapeUrl={setStoreScrapeUrl}
        handleScrapeUrlForStore={handleScrapeUrlForStore}
        isScrapingStore={isScrapingStore}
        canGenerateBlog={generationStatus?.canGenerateBlog}
      />

      <SettingsOverlay
        showSettingsOverlay={showSettingsOverlay}
        setShowSettingsOverlay={setShowSettingsOverlay}
        shopInfo={shopInfo}
        setShopInfo={setShopInfo}
        settingsScrapeUrl={settingsScrapeUrl}
        setSettingsScrapeUrl={setSettingsScrapeUrl}
        isScrapingSettings={isScrapingSettings}
        handleScrapeUrlForSettings={handleScrapeUrlForSettings}
        handleScrapeUrlsForSettings={handleScrapeUrlsForSettings}
        handleQuickSaveSettings={handleQuickSaveSettings}
        user={user}
        analysisResult={analysisResult}
        isAnalyzing={isAnalyzing}
        addToast={addToast}
        canGenerateBlog={generationStatus?.canGenerateBlog}
      />

      <AppConnectionsOverlay
        show={showAppConnectionsOverlay}
        onClose={() => setShowAppConnectionsOverlay(false)}
        addToast={addToast}
      />

      {/* ===== ヘッダー ===== */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/90 bg-zinc-950/90 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between min-h-[44px]">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-lg gradient-accent flex items-center justify-center glow-accent transition-smooth shrink-0">
              <Sparkles className="w-5 h-5 text-zinc-950" />
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight leading-tight gradient-accent-text truncate">Logic Post</h1>
              {user?.email && (
                <span className="text-sm sm:text-base font-normal text-zinc-400 truncate leading-tight hidden sm:block">{user.email}</span>
              )}
            </div>
          </div>

          {/* デスクトップ：右側ボタン群 */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {user?.email === ADMIN_EMAIL && (
              <Button variant="ghost" size="sm" onClick={() => setShowStoreManager(true)} className="text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 gap-1.5 min-h-[44px]" aria-label="店舗管理">
                <Store className="w-4 h-4" />
                <span className="text-sm">店舗管理</span>
              </Button>
            )}
            {user?.email === ADMIN_EMAIL && (
              <Link href="/admin" className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-100 transition-colors px-3 py-2 rounded hover:bg-zinc-800 min-h-[44px]">
                🔧 管理画面
              </Link>
            )}
            <span className="flex items-center gap-1.5">
              {(generationStatus?.plan ?? "free") === "pro" && (
                <span className="text-sm font-medium px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">✨ プロ（無制限）</span>
              )}
              {(generationStatus?.plan ?? "free") === "standard" && (
                <span className="text-sm font-medium px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">✨ スタンダード 残り{generationStatus?.remaining ?? 0}回</span>
              )}
              {(generationStatus?.plan ?? "free") === "light" && (
                <span className={`text-sm font-medium px-2 py-1 rounded-full border ${(generationStatus?.remaining ?? 0) === 0 ? "bg-destructive/20 text-destructive border-destructive/40" : "bg-muted text-muted-foreground border-border"}`}>
                  📊 ライト 残り{generationStatus?.remaining ?? 0}回/30回
                </span>
              )}
              {(generationStatus?.plan ?? "free") === "free" && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-400">
                  <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                  今月 残り{generationStatus?.remaining ?? 0}回 / 5回
                </span>
              )}
            </span>
            {isConfigured && (
              <Button variant="ghost" size="sm" onClick={() => setShowAppConnectionsOverlay(true)} className="text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 gap-1.5 min-h-[44px]" aria-label="アプリ接続">
                <Plug className="w-4 h-4" />
                <span className="text-sm">アプリ接続</span>
              </Button>
            )}
            {isConfigured && (
              <Button variant="ghost" size="sm" onClick={() => setShowSettingsOverlay(true)} className="text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 gap-1.5 min-h-[44px]" aria-label="設定">
                <Settings className="w-4 h-4" />
                <span className="text-sm">設定</span>
              </Button>
            )}
            {((generationStatus?.plan ?? "free") === "free" || (generationStatus?.plan ?? "free") === "light" || (generationStatus?.plan ?? "free") === "standard") && (
              <Button size="sm" onClick={handleUpgrade} className="gap-1.5 rounded-full gradient-accent hover:opacity-95 text-zinc-950 font-semibold px-4 py-2.5 border-0 shadow-lg shadow-emerald-500/20 transition-smooth min-h-[44px]">
                <Crown className="w-4 h-4" />
                <span className="text-sm">アップグレード</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-zinc-500 hover:text-red-400 hover:bg-zinc-800 min-h-[44px] min-w-[44px]" aria-label="ログアウト">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          {/* モバイル：ハンバーガーボタン */}
          <button
            type="button"
            onClick={() => setShowHeaderMenu(true)}
            className="md:hidden flex items-center justify-center text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 min-h-[56px] min-w-[56px] rounded-md shrink-0"
            aria-label="メニューを開く"
          >
            <Menu className="size-10" strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* モバイル用ハンバーガーメニュー（スライドオーバーレイ） */}
      {showHeaderMenu && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setShowHeaderMenu(false)} aria-hidden="true" />
          <div className="fixed top-0 right-0 bottom-0 z-[70] w-[min(320px,85vw)] bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col md:hidden animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800 shrink-0 pt-[max(1rem,env(safe-area-inset-top))]">
              <span className="font-display text-lg font-semibold text-emerald-400">メニュー</span>
              <button type="button" onClick={() => setShowHeaderMenu(false)} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="閉じる">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {/* プラン表示 */}
              <div className="px-3 py-2 mb-3 rounded-lg bg-zinc-800/50">
                {(generationStatus?.plan ?? "free") === "pro" && <p className="text-sm font-medium text-emerald-400">✨ プロ（無制限）</p>}
                {(generationStatus?.plan ?? "free") === "standard" && <p className="text-sm font-medium text-emerald-400">✨ スタンダード 残り{generationStatus?.remaining ?? 0}回</p>}
                {(generationStatus?.plan ?? "free") === "light" && <p className={`text-sm font-medium ${(generationStatus?.remaining ?? 0) === 0 ? "text-destructive" : "text-zinc-300"}`}>📊 ライト 残り{generationStatus?.remaining ?? 0}回/30回</p>}
                {(generationStatus?.plan ?? "free") === "free" && <p className="text-sm font-medium text-zinc-400">今月 残り{generationStatus?.remaining ?? 0}回 / 5回</p>}
              </div>
              {user?.email === ADMIN_EMAIL && (
                <button type="button" onClick={() => { setShowStoreManager(true); setShowHeaderMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-zinc-200 hover:bg-zinc-800 transition-colors min-h-[48px]">
                  <Store className="w-5 h-5 text-amber-500" />
                  <span>店舗管理</span>
                </button>
              )}
              {user?.email === ADMIN_EMAIL && (
                <Link href="/admin" onClick={() => setShowHeaderMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-200 hover:bg-zinc-800 transition-colors min-h-[48px]">
                  <span className="text-lg">🔧</span>
                  <span>管理画面</span>
                </Link>
              )}
              {isConfigured && (
                <button type="button" onClick={() => { setShowAppConnectionsOverlay(true); setShowHeaderMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-zinc-200 hover:bg-zinc-800 transition-colors min-h-[48px]">
                  <Plug className="w-5 h-5 text-emerald-500" />
                  <span>アプリ接続</span>
                </button>
              )}
              {isConfigured && (
                <button type="button" onClick={() => { setShowSettingsOverlay(true); setShowHeaderMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-zinc-200 hover:bg-zinc-800 transition-colors min-h-[48px]">
                  <Settings className="w-5 h-5 text-emerald-500" />
                  <span>設定</span>
                </button>
              )}
              {((generationStatus?.plan ?? "free") === "free" || (generationStatus?.plan ?? "free") === "light" || (generationStatus?.plan ?? "free") === "standard") && (
                <button type="button" onClick={() => { handleUpgrade(); setShowHeaderMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-zinc-200 hover:bg-zinc-800 transition-colors min-h-[48px]">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span className="font-medium">アップグレード</span>
                </button>
              )}
              <button type="button" onClick={() => { handleLogout(); setShowHeaderMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-400 hover:bg-zinc-800 transition-colors min-h-[48px] mt-2">
                <LogOut className="w-5 h-5" />
                <span>ログアウト</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* 練習完了祝福オーバーレイ */}
      {showPracticeCelebration && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="max-w-md w-full rounded-2xl border border-emerald-500/40 bg-zinc-900 p-6 sm:p-8 shadow-2xl shadow-emerald-500/10 animate-in zoom-in-95 duration-300">
            <p className="text-center text-4xl mb-4">🎉</p>
            <h2 className="font-display text-2xl font-bold text-white text-center mb-2">生成完了！</h2>
            <p className="text-center text-zinc-400 text-sm mb-6">
              Instagram・GoogleMap投稿など複数媒体分ができました。コピーしてそのまま使えます。
            </p>
            <Button
              onClick={() => setShowPracticeCelebration(false)}
              className="w-full gradient-accent hover:opacity-95 text-zinc-950 font-bold py-6 rounded-xl"
            >
              生成テキストを表示し本番モードへ
            </Button>
          </div>
        </div>
      )}

      {/* ===== メインコンテンツ ===== */}
      <main className="container mx-auto px-4 sm:px-6 py-10 max-w-4xl">
        {!isConfigured ? (
          /* ===== 初期設定ウィザード ===== */
          <InitialSetup
            setupStep={setupStep}
            setSetupStep={(step) => setSetupStep(step as 1 | 2 | 3)}
            setupPath={setupPath}
            setSetupPath={setSetupPath}
            shopInfo={shopInfo}
            setShopInfo={setShopInfo as React.Dispatch<React.SetStateAction<ShopInfo>>}
            scrapeUrl={scrapeUrl}
            setScrapeUrl={setScrapeUrl}
            isScraping={isScraping}
            isExtractingInfo={isExtractingInfo}
            handleScrapeUrl={handleScrapeUrl}
            handleScrapeUrls={handleScrapeUrls}
            handleReadAndProceed={handleReadAndProceed}
            handleExtractInfo={handleExtractInfo}
            scrapedPreview={scrapedPreview}
            setScrapedPreview={(v) => setScrapedPreview(v ?? "")}
            handleSaveShopInfo={handleSaveShopInfo}
            handleSkipWithMinimal={handleSkipWithMinimal}
            onGoToMain={() => setIsConfigured(true)}
            user={user}
            canGenerateBlog={generationStatus?.canGenerateBlog}
          />
        ) : (
          /* ===== メイン生成UI ===== */
          <div className="space-y-12 animate-in fade-in duration-500">

            {searchParams.get("upgraded") === "true" && (
              <div className="mx-4 mb-3 rounded-lg p-3 bg-green-500/10 border border-green-500/30 text-sm text-green-700 dark:text-green-400">
                🎉 プランへのアップグレードが完了しました！
              </div>
            )}

            {/* 残り1回バナー（無料プラン・使い切る前にスタンダードへ） */}
            {(generationStatus?.plan ?? "free") === "free" && (generationStatus?.remaining ?? 0) === 1 && !generationStatus?.isPracticeMode && (
              <div className="mx-4 mb-3 rounded-lg p-4 bg-amber-500/10 border-2 border-amber-500/40">
                <p className="font-semibold text-amber-200">⚠️ 今月あと1回使えます</p>
                <p className="mt-1 text-sm text-zinc-300">使い切る前にスタンダードへ</p>
                <Button
                  size="sm"
                  onClick={handleUpgrade}
                  className="mt-3 gradient-accent hover:opacity-95 text-zinc-950 font-semibold"
                >
                  スタンダードプランを見る
                </Button>
              </div>
            )}

            {/* 練習モードバナー */}
            {generationStatus?.isPracticeMode && (
              <div className="mx-4 mb-3 rounded-lg p-4 bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-200">
                <p className="font-semibold">🎯 練習モード</p>
                <p className="mt-1 text-zinc-300">まずは1回、生成を試してみましょう。この1回は無料5回枠にカウントされません。</p>
              </div>
            )}

            {/* 未設定時バナー：設定を促す */}
            {shopInfo.name === "未設定の店舗" && (
              <div className="mx-4 mt-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    💡 店舗情報を設定するとより精度が上がります
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 text-xs border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200"
                    onClick={() => setShowSettingsOverlay(true)}
                  >
                    設定する
                  </Button>
                </div>
              </div>
            )}


            {/* 管理者向け：生成対象店舗の選択 */}
            {user?.email === ADMIN_EMAIL && stores.length > 0 && (
              <section className="bg-zinc-900/70 border border-emerald-500/20 rounded-xl p-4 space-y-3 card-elevated transition-smooth">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-500" />
                  <span className="font-display text-sm font-semibold text-emerald-400">生成対象の店舗を選択</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stores.map((store) => (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => setSelectedStoreId(store.id === selectedStoreId ? null : store.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${selectedStoreId === store.id
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                        : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                        }`}
                    >
                      {selectedStoreId === store.id && <Check className="w-3.5 h-3.5" />}
                      {store.name}
                      {store.settings.industry && <span className="text-xs opacity-60">({store.settings.industry})</span>}
                    </button>
                  ))}
                </div>
                {!selectedStoreId && (
                  <p className="text-xs text-zinc-500">店舗を選択していない場合は、デフォルトの設定（shops テーブル）を使用します</p>
                )}
              </section>
            )}

            {/* ===== ①目的を決める / ②投稿パターンの選択（練習モード時は非表示） ===== */}
            {!generationStatus?.isPracticeMode && (
            <section className="space-y-5">
              {/* ①目的を決める */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center justify-center w-9 h-9 rounded-full gradient-accent text-zinc-950 text-lg font-bold shrink-0">1</span>
                  <h2 className="font-display text-2xl font-bold text-white">目的を決める</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {PATTERN_CATEGORIES.map((cat) => {
                    const effectiveCategory = selectedPatternCategory ?? getPatternCategoryId(selectedPattern);
                    const isActive = effectiveCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatternCategory(cat.id);
                          // 単一パターンのカテゴリー（返信、画像投稿など）の場合は自動選択
                          if (cat.patternIds.length === 1) {
                            const singlePatternId = cat.patternIds[0];
                            handlePatternChange(singlePatternId);

                            if (cat.id === "reply") {
                              setReplyPlatform("sns");
                            }
                          }
                        }}
                        className={`text-left p-4 rounded-xl border-2 transition-smooth bg-zinc-900 hover:border-emerald-500/60 hover:bg-zinc-800/80 ${isActive ? "ring-2 ring-emerald-500 border-emerald-500 bg-zinc-800" : "border-zinc-700"}`}
                      >
                        <p className="text-base font-bold text-white leading-snug">{cat.label}</p>
                        <p className="text-xs text-zinc-400 mt-1">{cat.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* ②投稿パターンの選択 */}
              {!(selectedPatternCategory === "image" || selectedPatternCategory === "reply") && (
              <div className="mt-12">
                {(() => {
                  const effectiveCategory = selectedPatternCategory ?? getPatternCategoryId(selectedPattern);
                  const category = PATTERN_CATEGORIES.find((c) => c.id === effectiveCategory);
                  if (!category) return null;
                  const patternsInCategory = PATTERNS.filter((p) => (category.patternIds as readonly string[]).includes(p.id));
                  return (
                    <div key={effectiveCategory} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="flex items-center justify-center w-9 h-9 rounded-full gradient-accent text-zinc-950 text-lg font-bold shrink-0">2</span>
                        <h2 className="font-display text-2xl font-bold text-white">投稿パターンの選択</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {patternsInCategory.map((pattern, index) => (
                          <Card
                            key={pattern.id}
                            style={{ animationDelay: `${index * 80}ms` }}
                            className={`cursor-pointer transition-smooth border-zinc-700 bg-zinc-900 card-elevated hover:border-emerald-500/60 hover:bg-zinc-800/80 animate-in fade-in slide-in-from-bottom-2 duration-400 ${selectedPattern === pattern.id ? "ring-2 ring-emerald-500 border-emerald-500 bg-zinc-800 glow-accent" : ""}`}
                            onClick={() => {
                              setSelectedTreatment(null);
                              setOptionalMemos({ reaction: "", beforeAfter: "" });
                              setSelectedEducation(null);
                              setEducationMemo("");
                              setSelectedMessage(null);
                              setStaffMemo("");
                              setSelectedScene(null);
                              setSelectedSceneMessage(null);
                              setSceneMemo("");
                              setSelectedNoticeType(null);
                              setSelectedUrgency(null);
                              setNoticePeriod("");
                              setNoticeMemo("");
                              setVoiceMemo("");
                              setSelectedVoiceCategory(null);
                              setSelectedVoiceOption(null);
                              setSelectedConcern(null);
                              setSelectedEducationReason(null);
                              setSelectedFocus(null);
                              setSelectedMessageTone(null);
                              handlePatternChange(pattern.id as Pattern);
                            }}
                          >
                            <CardHeader className="p-5 pb-2">
                              <CardTitle className="text-xs font-medium text-zinc-500 flex items-center gap-1.5 mb-2 uppercase tracking-wider">
                                {selectedPattern === pattern.id ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <span className="w-3.5 h-3.5 shrink-0" />}
                                パターン {pattern.id}
                              </CardTitle>
                              <p className="text-base font-bold text-white leading-snug">{pattern.title}</p>
                            </CardHeader>
                            <CardContent className="px-5 pb-5 pt-2 text-base text-zinc-400 leading-relaxed">{pattern.description}</CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
              )}
            </section>
            )}

            {/* ===== ③投稿内容を決める（練習モード時はステップ1として表示） ===== */}
            <section className="space-y-5">
              <div id="input-section-header" className="flex items-center gap-3">
                {!(selectedPatternCategory === "image" || selectedPatternCategory === "reply") && (
                  <span className="flex items-center justify-center w-9 h-9 rounded-full gradient-accent text-zinc-950 text-lg font-bold shrink-0">{generationStatus?.isPracticeMode ? "1" : "3"}</span>
                )}
                <h2 className="font-display text-2xl font-bold text-white">
                  {selectedPattern === "G" ? "返信する内容の入力" : selectedPattern === "I" ? "画像のアップロード" : "投稿内容を決める"}
                </h2>
              </div>

              {selectedPattern === "G" ? (
                /* パターンG：コメント返信フォーム */
                <Card className="border-zinc-700 bg-zinc-900 card-elevated transition-smooth">
                  <CardContent className="p-4 sm:p-7 space-y-7">
                    <div className="space-y-3">
                      <Label className="text-base font-semibold text-zinc-100">返信するプラットフォームを選択</Label>
                      <div className="flex gap-3">
                        {[
                          { id: "sns", label: "📱 SNS（Instagram・X 等）" },
                          { id: "gbp", label: "🗺️ Google クチコミ（GBP）" },
                        ].map(({ id, label }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setReplyPlatform(id as "sns" | "gbp")}
                            className={`flex-1 py-3 px-4 rounded-xl border text-base font-semibold transition-all ${replyPlatform === id
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                              : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-500"
                              }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="receivedComment" className="text-base font-semibold text-zinc-100">
                        もらったコメント・クチコミ <span className="text-red-400">*</span>
                      </Label>
                      <p className="text-base text-zinc-400">返信したいコメントやクチコミの文章をそのまま貼り付けてください。</p>
                      <Textarea
                        id="receivedComment"
                        value={receivedComment}
                        onChange={(e) => setReceivedComment(e.target.value)}
                        placeholder={replyPlatform === "gbp"
                          ? "例: 初めて利用しました。スタッフの方がとても丁寧で、施術後は体がスッキリしました。また来たいと思います。"
                          : "例: 先日はありがとうございました！おかげで肩がすごく楽になりました😊 また予約します！"}
                        className="h-[140px] bg-zinc-950 border-zinc-800 focus-visible:ring-emerald-500 text-zinc-100 placeholder:text-zinc-500 resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="replyNote" className="text-base font-semibold text-zinc-100">特記事項・返信に含めたい内容（任意）</Label>
                      <p className="text-base text-zinc-400">返信に加えたい補足情報があれば記入してください。</p>
                      <Textarea
                        id="replyNote"
                        value={replyNote}
                        onChange={(e) => setReplyNote(e.target.value)}
                        placeholder="例: 来月キャンペーン実施予定なので触れてほしい / 次回予約への誘導を入れてほしい"
                        className="h-[110px] bg-zinc-950 border-zinc-800 focus-visible:ring-emerald-500 text-zinc-100 placeholder:text-zinc-500 resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : selectedPattern === "I" ? (
                /* パターンI：画像アップロードフォーム */
                <Card className="border-zinc-700 bg-zinc-900 card-elevated transition-smooth">
                  <CardContent className="p-4 sm:p-7 space-y-7">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                        <Pencil className="w-4 h-4 text-emerald-500" />
                        投稿に使う画像をアップロード
                      </Label>
                      <p className="text-sm text-zinc-400">
                        施術の様子、メニュー、店内、ビフォーアフターなど、投稿に載せたい画像を選んでください。AIが画像を分析して投稿文を生成します。
                      </p>
                      <div className="mt-3">
                        <input
                          type="file"
                          id="image-upload"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const mime = file.type as "image/jpeg" | "image/png" | "image/webp";
                            if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) {
                              addToast("JPEG / PNG / WebP 形式の画像を選んでください。", "error");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              const result = reader.result as string;
                              const base64 = result.includes(",") ? result.split(",")[1] : result;
                              if (base64 && base64.length < 6 * 1024 * 1024) {
                                setUploadImageData({ mimeType: mime, data: base64 });
                              } else {
                                addToast("画像サイズが大きすぎます。4MB以下にしてください。", "error");
                              }
                            };
                            reader.readAsDataURL(file);
                            e.target.value = "";
                          }}
                        />
                        <label
                          htmlFor="image-upload"
                          className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-zinc-600 hover:border-emerald-500/60 bg-zinc-950/50 cursor-pointer transition-colors text-zinc-300 hover:text-emerald-400"
                        >
                          <Pencil className="w-5 h-5" />
                          {uploadImageData ? "画像を変更する" : "画像を選択する（JPEG / PNG / WebP）"}
                        </label>
                        {uploadImageData && (
                          <div className="mt-4 flex items-start gap-4">
                            <img
                              src={`data:${uploadImageData.mimeType};base64,${uploadImageData.data}`}
                              alt="アップロード済み"
                              className="w-32 h-32 object-cover rounded-lg border border-zinc-700"
                            />
                            <div className="flex-1">
                              <p className="text-sm text-emerald-400 font-medium">✓ 画像を選択しました</p>
                              <p className="text-xs text-zinc-500 mt-1">「生成する」ボタンで投稿文を生成できます</p>
                              <button
                                type="button"
                                onClick={() => setUploadImageData(null)}
                                className="mt-2 text-xs text-red-400 hover:text-red-300"
                              >
                                画像を削除
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3 pt-2">
                       <div className="flex items-center gap-2">
                         <Label className="text-base font-semibold text-zinc-100 italic">
                           画像の内容や、伝えたいこと（任意）
                         </Label>
                       </div>
                       <Textarea
                         placeholder="例：新しく導入したトリートメントのツヤ感をアピールしたい / 今日のお客様の素敵な笑顔を伝えたい"
                         value={imageMemo}
                         onChange={(e) => setImageMemo(e.target.value)}
                         className="min-h-[100px] text-sm bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-emerald-500"
                       />
                       <p className="text-xs text-zinc-500 pl-1">
                         ※ 画像でAIが内容を判断しますが、補足情報を入力するとより精度の高い文章になります。
                       </p>
                    </div>
                  </CardContent>
                </Card>
              ) : currentPattern.isTagSelect ? (
                currentPattern.id === "A" ? (
                /* パターンA：施術タグ選択＋任意2問 */
                <Card className="border-zinc-700 bg-zinc-900 card-elevated transition-smooth">
                  <CardContent className="p-4 sm:p-7 space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-base font-semibold text-zinc-100">{tags.labelTreatment}</Label>
                        <span className="text-xs text-red-500 font-medium">必須</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tags.TREATMENT_TAGS.map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() =>
                              setSelectedTreatment(
                                selectedTreatment === tag.id ? null : tag.id
                              )
                            }
                              className={`
                              px-4 py-3 rounded-full text-sm font-medium
                              border-2 transition-all duration-150 select-none
                              active:scale-95
                              ${selectedTreatment === tag.id
                                ? "bg-emerald-500 text-zinc-950 border-emerald-500 scale-105"
                                : "bg-zinc-950 text-zinc-100 border-zinc-700 hover:border-zinc-600"
                              }
                            `}
                          >
                            {tag.emoji} {tag.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {selectedTreatment && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-semibold text-zinc-100">{tags.labelConcern}</Label>
                          <span className="text-xs text-red-500 font-medium">必須</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tags.CONCERN_TAGS.map((tag) => (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() =>
                                setSelectedConcern(selectedConcern === tag.id ? null : tag.id)
                              }
                              className={`
                                px-4 py-3 rounded-full text-sm font-medium
                                border-2 transition-all duration-150 select-none active:scale-95
                                ${selectedConcern === tag.id
                                  ? "bg-emerald-500 text-zinc-950 border-emerald-500 scale-105"
                                  : "bg-zinc-950 text-zinc-100 border-zinc-700 hover:border-zinc-600"
                                }
                              `}
                            >
                              {tag.emoji} {tag.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {!generationStatus?.isPracticeMode && (
                    <details className="group">
                      <summary className="flex items-center gap-2 cursor-pointer text-sm text-zinc-400 list-none select-none">
                        <span className="border border-emerald-500/40 rounded-full px-4 py-2 text-sm font-medium text-emerald-400 group-open:bg-emerald-500/10 transition-colors">
                          ＋ より具体的な投稿にする（推奨）
                        </span>
                      </summary>
                      <div className="space-y-4 mt-4">
                        {[
                          {
                            key: "reaction" as const,
                            label: "😊 お客様の反応・喜びの声",
                            placeholder: "例：仕上がりを見て「こんなにサラサラになるの！？」と驚いてくれた",
                          },
                          {
                            key: "beforeAfter" as const,
                            label: "✨ ビフォーアフターの変化",
                            placeholder: "例：ごわごわだった髪が、手触りシルクみたいになった",
                          },
                        ].map(({ key, label, placeholder }) => (
                          <div key={key} className="space-y-1">
                            <Label className="text-sm text-zinc-200">{label}</Label>
                            <Textarea
                              placeholder={placeholder}
                              value={optionalMemos[key]}
                              onChange={(e) =>
                                setOptionalMemos((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                              className="min-h-[72px] text-sm bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
                            />
                          </div>
                        ))}
                      </div>
                    </details>
                    )}
                  </CardContent>
                </Card>
                ) : currentPattern.id === "B" ? (
                  /* パターンB：教育テーマタグ選択＋一言メモ */
                  <Card className="border-zinc-700 bg-zinc-900 card-elevated transition-smooth">
                    <CardContent className="p-4 sm:p-7 space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-semibold text-zinc-100">{tags.labelEducation}</Label>
                          <span className="text-xs text-red-500 font-medium">必須</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tags.EDUCATION_TAGS.map((tag) => (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() =>
                                setSelectedEducation(
                                  selectedEducation === tag.id ? null : tag.id
                                )
                              }
                              className={`
                                px-4 py-3 rounded-full text-sm font-medium
                                border-2 transition-all duration-150 select-none
                                active:scale-95
                                ${selectedEducation === tag.id
                                  ? "bg-emerald-500 text-zinc-950 border-emerald-500 scale-105"
                                  : "bg-zinc-950 text-zinc-100 border-zinc-700 hover:border-zinc-600"
                                }
                              `}
                            >
                              {tag.emoji} {tag.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {selectedEducation && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Label className="text-base font-semibold text-zinc-100">{tags.labelEducationReason}</Label>
                            <span className="text-xs text-red-500 font-medium">必須</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {tags.EDUCATION_REASON_TAGS.map((tag) => (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() =>
                                  setSelectedEducationReason(selectedEducationReason === tag.id ? null : tag.id)
                                }
                                className={`
                                  px-4 py-3 rounded-full text-sm font-medium
                                  border-2 transition-all duration-150 select-none active:scale-95
                                  ${selectedEducationReason === tag.id
                                    ? "bg-emerald-500 text-zinc-950 border-emerald-500 scale-105"
                                    : "bg-zinc-950 text-zinc-100 border-zinc-700 hover:border-zinc-600"
                                  }
                                `}
                              >
                                {tag.emoji} {tag.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <details className="group">
                        <summary className="flex items-center gap-2 cursor-pointer text-sm text-zinc-400 list-none select-none">
                          <span className="border border-zinc-700 rounded-full px-3 py-1 text-xs group-open:bg-zinc-800 transition-colors">
                            ＋ 一言メモを追加（任意）
                          </span>
                        </summary>
                        <div className="mt-4">
                          <Textarea
                            placeholder="例：最近お客様から多い質問　/　梅雨前に伝えたい　/　特にくせ毛の方向け"
                            value={educationMemo}
                            onChange={(e) => setEducationMemo(e.target.value)}
                            className="min-h-[72px] text-sm bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
                          />
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                ) : currentPattern.id === "C" ? (
                  /* パターンC：お知らせ種類＋緊急度＋一言メモ */
                  <Card className="border-zinc-700 bg-zinc-900 card-elevated transition-smooth">
                    <CardContent className="p-4 sm:p-7 space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-semibold text-zinc-100">お知らせの種類</Label>
                          <span className="text-xs text-red-500 font-medium">必須①</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tags.NOTICE_TYPE_TAGS.map((tag) => (
                            <button key={tag.id} type="button" onClick={() => setSelectedNoticeType(selectedNoticeType === tag.id ? null : tag.id)} className={`px-4 py-3 rounded-full text-sm font-medium border-2 transition-all duration-150 select-none active:scale-95 ${selectedNoticeType === tag.id ? "bg-emerald-500 text-zinc-950 border-emerald-500 scale-105" : "bg-zinc-950 text-zinc-100 border-zinc-700 hover:border-zinc-600"}`}>
                              {tag.emoji} {tag.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {selectedNoticeType && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Label className="text-base font-semibold text-zinc-100">いつまでですか？</Label>
                            <span className="text-xs text-red-500 font-medium">必須②</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {tags.URGENCY_TAGS.map((tag) => (
                              <button key={tag.id} type="button" onClick={() => setSelectedUrgency(selectedUrgency === tag.id ? null : tag.id)} className={`px-4 py-3 rounded-full text-sm font-medium border-2 transition-all duration-150 select-none active:scale-95 ${selectedUrgency === tag.id ? "bg-emerald-500 text-zinc-950 border-emerald-500 scale-105" : "bg-zinc-950 text-zinc-100 border-zinc-700 hover:border-zinc-600"}`}>
                                {tag.emoji} {tag.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedNoticeType && selectedUrgency && (
                        <div className="space-y-1">
                          <Label className="text-sm text-zinc-300">いつから・いつまで（任意）</Label>
                          <Input
                            type="text"
                            placeholder="例：3月10日〜3月20日／本日〜今週末"
                            value={noticePeriod}
                            onChange={(e) => setNoticePeriod(e.target.value)}
                            className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 text-sm"
                          />
                        </div>
                      )}
                      <details className="group">
                        <summary className="flex items-center gap-2 cursor-pointer text-sm text-zinc-400 list-none select-none">
                          <span className="border border-zinc-700 rounded-full px-3 py-1 text-xs group-open:bg-zinc-800 transition-colors">＋ 詳細を追加（任意）</span>
                        </summary>
                        <div className="mt-4">
                          <Textarea placeholder="例：14時〜15時に1枠空きあり／髪質改善コースが20%OFF／新しいトリートメントの名前" value={noticeMemo} onChange={(e) => setNoticeMemo(e.target.value)} className="min-h-[72px] text-sm bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500" />
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                ) : currentPattern.id === "D" ? (
                  /* パターンD：2段階選択（厳選10個）＋お客様の声 */
                  <Card className="border-zinc-700 bg-zinc-900 card-elevated transition-smooth">
                    <CardContent className="p-4 sm:p-7 space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-semibold text-zinc-100">カテゴリを選んでください</Label>
                          <span className="text-xs text-red-500 font-medium">必須①</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tags.VOICE_CATEGORIES.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setSelectedVoiceCategory(selectedVoiceCategory === cat.id ? null : cat.id);
                                setSelectedVoiceOption(null);
                              }}
                              className={`px-4 py-3 rounded-full text-sm font-medium border-2 transition-all duration-150 select-none active:scale-95 ${selectedVoiceCategory === cat.id ? "bg-emerald-500 text-zinc-950 border-emerald-500 scale-105" : "bg-zinc-950 text-zinc-100 border-zinc-700 hover:border-zinc-600"}`}
                            >
                              {cat.emoji} {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {selectedVoiceCategory && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Label className="text-base font-semibold text-zinc-100">内容を1つ選んでください</Label>
                            <span className="text-xs text-red-500 font-medium">必須②</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {tags.VOICE_OPTION_TAGS.filter((t) => (t as any).categoryId === selectedVoiceCategory).map((tag) => (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => setSelectedVoiceOption(selectedVoiceOption === tag.id ? null : tag.id)}
                                className={`px-4 py-3 rounded-full text-sm font-medium border-2 transition-all duration-150 select-none active:scale-95 ${selectedVoiceOption === tag.id ? "bg-emerald-500 text-zinc-950 border-emerald-500 scale-105" : "bg-zinc-950 text-zinc-100 border-zinc-700 hover:border-zinc-600"}`}
                              >
                                {tag.emoji} {tag.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedVoiceOption && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-base font-semibold text-zinc-100">お客様の一言（短くてOK）</Label>
                            <span className="text-xs text-red-500 font-medium">必須</span>
                          </div>
                          <Textarea
                            placeholder="例：「こんなにサラサラになるの！？」　/　「朝が楽になった」　/　「また来ます！」"
                            value={voiceMemo}
                            onChange={(e) => setVoiceMemo(e.target.value)}
                            className="min-h-[72px] text-sm bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
                          />
                          <p className="text-xs text-zinc-500 pl-1">※ 短い一言でも大丈夫です。そのままの言葉が一番伝わります。</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : currentPattern.id === "E" ? (
                  /* パターンE：伝えたいことタグ＋一言メモ（必須） */
                  <Card className="border-zinc-700 bg-zinc-900 card-elevated transition-smooth">
                    <CardContent className="p-4 sm:p-7 space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-semibold text-zinc-100">伝えたいことを選んでください</Label>
                          <span className="text-xs text-red-500 font-medium">必須①</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tags.STAFF_MESSAGE_TAGS.map((tag) => (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => setSelectedMessage(selectedMessage === tag.id ? null : tag.id)}
                              className={`px-4 py-3 rounded-full text-sm font-medium border-2 transition-all duration-150 select-none active:scale-95 ${selectedMessage === tag.id ? "bg-emerald-500 text-zinc-950 border-emerald-500 scale-105" : "bg-zinc-950 text-zinc-100 border-zinc-700 hover:border-zinc-600"}`}
                            >
                              {tag.emoji} {tag.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-semibold text-zinc-100">一言メモ</Label>
                          <span className="text-xs text-red-500 font-medium">必須②</span>
                        </div>
                        <Textarea placeholder="例：担当スタッフ名：田中　/　最近印象に残ったエピソード　/　指名してほしいお客様像" value={staffMemo} onChange={(e) => setStaffMemo(e.target.value)} className="min-h-[72px] text-sm bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500" />
                      </div>
                    </CardContent>
                  </Card>
                ) : currentPattern.id === "H" ? (
                  /* パターンH：場面タグ＋伝えたいことタグ＋一言メモ */
                  <Card className="border-zinc-700 bg-zinc-900 card-elevated transition-smooth">
                    <CardContent className="p-4 sm:p-7 space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-semibold text-zinc-100">{tags.labelScene}</Label>
                          <span className="text-xs text-red-500 font-medium">必須①</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tags.SALON_SCENE_TAGS.map((tag) => (
                            <button key={tag.id} type="button" onClick={() => setSelectedScene(selectedScene === tag.id ? null : tag.id)} className={`px-4 py-3 rounded-full text-sm font-medium border-2 transition-all duration-150 select-none active:scale-95 ${selectedScene === tag.id ? "bg-emerald-500 text-zinc-950 border-emerald-500 scale-105" : "bg-zinc-950 text-zinc-100 border-zinc-700 hover:border-zinc-600"}`}>
                              {tag.emoji} {tag.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {selectedScene && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Label className="text-base font-semibold text-zinc-100">その場面から何を伝えますか？</Label>
                            <span className="text-xs text-red-500 font-medium">必須②</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {tags.SCENE_MESSAGE_TAGS.map((tag) => (
                              <button key={tag.id} type="button" onClick={() => setSelectedSceneMessage(selectedSceneMessage === tag.id ? null : tag.id)} className={`px-4 py-3 rounded-full text-sm font-medium border-2 transition-all duration-150 select-none active:scale-95 ${selectedSceneMessage === tag.id ? "bg-emerald-500 text-zinc-950 border-emerald-500 scale-105" : "bg-zinc-950 text-zinc-100 border-zinc-700 hover:border-zinc-600"}`}>
                                {tag.emoji} {tag.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedSceneMessage && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-zinc-300">
                            伝え方のトーン
                            <span className="ml-2 text-xs text-zinc-500 font-normal">（任意・選ぶだけでOK）</span>
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {tags.MESSAGE_TONE_TAGS.map((tag) => (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() =>
                                  setSelectedMessageTone(selectedMessageTone === tag.id ? null : tag.id)
                                }
                                className={`
                                  px-4 py-2 rounded-full text-sm font-medium
                                  border-2 transition-all duration-150 select-none active:scale-95
                                  ${selectedMessageTone === tag.id
                                    ? "bg-emerald-500 text-zinc-950 border-emerald-500 scale-105"
                                    : "bg-zinc-950 text-zinc-100 border-zinc-700 hover:border-zinc-600"
                                  }
                                `}
                              >
                                {tag.emoji} {tag.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <details className="group">
                        <summary className="flex items-center gap-2 cursor-pointer text-sm text-zinc-400 list-none select-none">
                          <span className="border border-zinc-700 rounded-full px-3 py-1 text-xs group-open:bg-zinc-800 transition-colors">＋ 一言メモを追加（任意）</span>
                        </summary>
                        <div className="mt-4">
                          <Textarea placeholder="例：新しいケラチントリートメントが届いた　/　今週の空きも伝えたい" value={sceneMemo} onChange={(e) => setSceneMemo(e.target.value)} className="min-h-[72px] text-sm bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500" />
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                ) : null
              ) : (
                /* パターンC〜D：3問フォーム */
                <Card className="border-zinc-700 bg-zinc-900 card-elevated transition-smooth">
                  <CardContent className="p-4 sm:p-7 space-y-7">
                    {(["q1", "q2", "q3"] as const).map((qKey) => (
                      <div key={qKey} className="space-y-2">
                        <Label htmlFor={qKey} className="text-base font-semibold text-zinc-100">{currentPattern.questions[qKey]}</Label>
                        <Textarea
                          id={qKey}
                          value={formData[qKey]}
                          onChange={(e) => setFormData(prev => ({ ...prev, [qKey]: e.target.value }))}
                          placeholder={currentPattern.questions[`ex${qKey.slice(1)}` as "ex1" | "ex2" | "ex3"]}
                          className="h-[100px] bg-zinc-950 border-zinc-800 focus-visible:ring-emerald-500 text-zinc-100 placeholder:text-zinc-500 resize-none"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </section>

            {/* 生成前エリア：出力先・オプション・ボタンを1カードにまとめる */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5 space-y-4">
              {/* 出力先＋設定リンク（練習モード時は非表示） */}
              {!generationStatus?.isPracticeMode && (
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-zinc-400">
                <span>出力先:</span>
                <span>{[activeShopInfo.outputTargets?.instagram !== false && "Instagram", activeShopInfo.outputTargets?.gbp !== false && "GoogleMap投稿", activeShopInfo.outputTargets?.portal !== false && generationStatus?.canGenerateBlog && "ブログ", activeShopInfo.outputTargets?.line !== false && "LINE", activeShopInfo.outputTargets?.short && "ショート動画"].filter(Boolean).join("、")}</span>
                <button type="button" onClick={() => setShowSettingsOverlay(true)} className="gradient-accent-text hover:opacity-90 underline underline-offset-2 font-medium" aria-label="設定で変更">
                  設定で変更
                </button>
              </div>
              )}

              {/* 生成進捗バー */}
              <div className={`w-full overflow-hidden transition-all duration-300 ease-out ${generationProgress > 0 || isGenerating ? "max-h-12 opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${generationProgress}%` }} />
                </div>
                <p className="text-center text-xs text-zinc-500 mt-1">生成中… {generationProgress}%</p>
              </div>

              {/* LINE用：季節の挨拶オプション（練習モード時は非表示） */}
              {!generationStatus?.isPracticeMode && activeShopInfo.outputTargets?.line !== false && (
                <label className="flex items-center justify-center gap-2 cursor-pointer select-none group">
                  <input type="checkbox" checked={lineIncludeSeasonalGreeting} onChange={(e) => setLineIncludeSeasonalGreeting(e.target.checked)} className="w-5 h-5 rounded accent-emerald-500" />
                  <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">季節の挨拶を含める（例：3月も半ば、いかがお過ごしですか？）</span>
                </label>
              )}

              {/* 生成ボタン */}
              <div className="flex flex-col items-center gap-3 pt-1">
              <Button
                onClick={() => {
                  if (!generationStatus?.isPracticeMode && generationStatus != null && generationStatus?.allowed === false) {
                    setShowLimitExceededModal(true);
                    return;
                  }
                  setInstagramPostImage(null);
                  handleGenerate(selectedTreatment, optionalMemos, selectedEducation, educationMemo, selectedMessage, staffMemo, selectedScene, selectedSceneMessage, sceneMemo, selectedNoticeType, selectedUrgency, noticePeriod, noticeMemo, voiceMemo, selectedVoiceOption, selectedConcern, selectedEducationReason, selectedFocus, selectedMessageTone, imageMemo);
                }}
                disabled={isGenerating || !canGenerate}
                title={
                  !generationStatus?.isPracticeMode && generationStatus != null && generationStatus?.allowed === false
                    ? "タップでアップグレード案内を表示"
                    : !canGenerate
                      ? "入力内容を確認してください"
                      : undefined
                }
                className="gradient-accent hover:opacity-95 text-zinc-950 font-bold text-xl h-16 px-16 min-w-0 w-full max-w-[340px] sm:max-w-[380px] rounded-full glow-accent transition-smooth active:scale-[0.98] group flex items-center justify-center gap-3 min-h-[64px] shadow-lg shadow-emerald-500/20"
              >
                {isGenerating ? (
                  <><Loader2 className="h-6 w-6 animate-spin text-zinc-950" /><span>AIがテキストを生成中...</span></>
                ) : (
                  <><span>この内容で生成する</span><ChevronRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </div>
            </div>

            {/* ===== STEP 3: 生成結果 ===== */}
            {generatedResults && (
              <section ref={resultsRef} className="space-y-4 pt-8 animate-in fade-in duration-300 scroll-mt-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center justify-center w-9 h-9 rounded-full gradient-accent text-zinc-950 text-lg font-bold shrink-0">3</span>
                  <h2 className="font-display text-2xl font-bold gradient-accent-text">生成完了</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setGeneratedResults(null); setEditingTab(null); }}
                    className="ml-auto text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/10 h-9 min-h-[44px] px-3"
                  >
                    <RefreshCw className="w-4 h-4 mr-1.5" />
                    もう一度生成
                  </Button>
                </div>

                <Tabs defaultValue={
                  selectedPattern === "G" ? "reply" :
                    activeShopInfo.outputTargets?.instagram ? "instagram" :
                      activeShopInfo.outputTargets?.gbp ? "gbp" :
                        activeShopInfo.outputTargets?.portal && generationStatus?.canGenerateBlog ? "portal" :
                          activeShopInfo.outputTargets?.short ? "short" : "line"
                } className="w-full">
                  <div className="relative">
                    <TabsList className="flex w-full bg-zinc-900/80 border border-zinc-800 p-1.5 overflow-x-auto scrollbar-none rounded-xl transition-smooth gap-1">
                    {selectedPattern === "G" ? (
                      <TabsTrigger value="reply" className="flex-1 min-w-fit min-h-[44px] py-2 text-base font-medium text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400 data-[state=active]:ring-1 data-[state=active]:ring-emerald-500/30 whitespace-nowrap">
                        {replyPlatform === "gbp" ? "🗺️ GoogleMap返信" : "📱 SNS返信"}
                      </TabsTrigger>
                    ) : (
                      <>
                        {activeShopInfo.outputTargets?.instagram !== false && <TabsTrigger value="instagram" className="flex-1 min-w-fit min-h-[44px] py-2 text-base font-medium text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400 data-[state=active]:ring-1 data-[state=active]:ring-emerald-500/30 whitespace-nowrap"><span className="hidden sm:inline">📸 Instagram</span><span className="sm:hidden">📸 IG</span></TabsTrigger>}
                        {activeShopInfo.outputTargets?.gbp !== false && <TabsTrigger value="gbp" className="flex-1 min-w-fit min-h-[44px] py-2 text-base font-medium text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400 data-[state=active]:ring-1 data-[state=active]:ring-emerald-500/30 whitespace-nowrap"><span className="hidden sm:inline">🗺️ GoogleMap投稿</span><span className="sm:hidden">🗺️ Map</span></TabsTrigger>}
                        {activeShopInfo.outputTargets?.portal !== false && generationStatus?.canGenerateBlog && <TabsTrigger value="portal" className="flex-1 min-w-fit min-h-[44px] py-2 text-base font-medium text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400 data-[state=active]:ring-1 data-[state=active]:ring-emerald-500/30 whitespace-nowrap"><span className="hidden sm:inline">📝 ブログ</span><span className="sm:hidden">📝 ブログ</span></TabsTrigger>}
                        {activeShopInfo.outputTargets?.line !== false && <TabsTrigger value="line" className="flex-1 min-w-fit min-h-[44px] py-2 text-base font-medium text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400 data-[state=active]:ring-1 data-[state=active]:ring-emerald-500/30 whitespace-nowrap">💬 LINE</TabsTrigger>}
                        {activeShopInfo.outputTargets?.short && <TabsTrigger value="short" className="flex-1 min-w-fit min-h-[44px] py-2 text-base font-medium text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400 data-[state=active]:ring-1 data-[state=active]:ring-emerald-500/30 whitespace-nowrap">🎬 ショート</TabsTrigger>}
                      </>
                    )}
                  </TabsList>
                    <span className="sm:hidden absolute right-0 top-1/2 -translate-y-1/2 w-6 h-8 bg-gradient-to-l from-zinc-900/90 to-transparent pointer-events-none flex items-center justify-end pr-1 text-zinc-500 text-xs" aria-hidden="true">→</span>
                  </div>

                  {selectedPattern === "G" ? (
                    /* パターンG 返信テキスト */
                    generatedResults.reply && (
                      <TabsContent value="reply">
                        <Card className="border-zinc-800 bg-zinc-900/80 card-elevated transition-smooth">
                          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
                            <span className="text-base font-medium text-zinc-400">返信テキスト</span>
                            <Button variant="secondary" size="sm" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 h-9" onClick={() => handleCopy(generatedResults.reply as string, "reply")}>
                              {copiedTab === "reply" ? <><Check className="w-4 h-4 mr-2 text-green-500" /> コピー完了</> : <><Copy className="w-4 h-4 mr-2" /> コピー</>}
                            </Button>
                          </div>
                          <CardContent className="p-6">
                            <div className="mb-5 p-4 bg-zinc-950 rounded-xl border border-zinc-700">
                              <p className="text-xs text-zinc-400 mb-2 font-semibold uppercase tracking-wider">📨 受信したコメント</p>
                              <p className="text-base text-zinc-300 whitespace-pre-wrap leading-relaxed">{receivedComment}</p>
                            </div>
                            <p className="text-base text-emerald-500 font-semibold mb-3">✍️ 生成された返信文</p>
                            <div className="whitespace-pre-wrap text-zinc-100 text-base font-medium leading-relaxed">{generatedResults.reply}</div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )
                  ) : (
                    /* 通常パターン タブ群 */
                    [
                      { id: "instagram", data: generatedResults.instagram, active: activeShopInfo.outputTargets?.instagram !== false },
                      { id: "gbp", data: generatedResults.gbp, active: activeShopInfo.outputTargets?.gbp !== false },
                      { id: "portal", data: generatedResults.portal, active: activeShopInfo.outputTargets?.portal !== false && !!generationStatus?.canGenerateBlog },
                      { id: "line", data: generatedResults.line, active: activeShopInfo.outputTargets?.line !== false },
                      { id: "short", data: generatedResults.shortScript, active: !!activeShopInfo.outputTargets?.short },
                    ].filter(t => t.active && t.data).map((tab) => (
                      <TabsContent key={tab.id} value={tab.id}>
                        <Card className="border-zinc-800 bg-zinc-900/80 card-elevated transition-smooth">
                          {/* カードヘッダー：ボタンバー */}
                          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 flex-wrap gap-2">
                            <span className="text-base font-medium text-zinc-400">
                              {tab.id === "instagram" ? "Instagram用テキスト" : tab.id === "gbp" ? "GoogleMap投稿用テキスト" : tab.id === "portal" ? "ブログ用テキスト" : tab.id === "line" ? "LINE用テキスト" : "ショート動画台本"}
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* ブログ（旧ポータル）向けLLMOボタンのみ */}
                              {tab.id === "portal" && generatedResults.portalTitle && (
                                <>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/40 h-9"
                                    onClick={handleGenerateLlmo}
                                    disabled={isLlmoGenerating}
                                  >
                                    {isLlmoGenerating ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        LLMO化中...
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        LLMO対応データ生成
                                      </>
                                    )}
                                  </Button>
                                </>
                              )}
                              {tab.id !== "short" && (
                                <>
                                  <Button
                                    variant="secondary" size="sm"
                                    className={`h-9 border ${editingTab === tab.id ? "gradient-accent hover:opacity-95 text-zinc-950 border-transparent" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700"}`}
                                    onClick={() => setEditingTab(editingTab === tab.id ? null : tab.id)}
                                  >
                                    {editingTab === tab.id ? <><Check className="w-4 h-4 mr-2 text-zinc-950" /> 編集完了</> : <><Pencil className="w-4 h-4 mr-2" /> 編集</>}
                                  </Button>
                                  <Button variant="secondary" size="sm" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 h-9" onClick={() => handleCopy(tab.data as string, tab.id)}>
                                    {copiedTab === tab.id ? <><Check className="w-4 h-4 mr-2 text-green-500" /> コピー完了</> : <><Copy className="w-4 h-4 mr-2" /> コピー</>}
                                  </Button>
                                  {tab.id === "line" && typeof tab.data === "string" && (
                                    <PostToLineButton message={tab.data} addToast={addToast} />
                                  )}
                                  {tab.id === "instagram" && typeof tab.data === "string" && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {!(uploadImageData || instagramPostImage) && (
                                        <label className="cursor-pointer">
                                          <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (!file) return;
                                              const mime = file.type as "image/jpeg" | "image/png" | "image/webp";
                                              if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) {
                                                addToast("JPEG / PNG / WebP 形式を選んでください。", "error");
                                                return;
                                              }
                                              const reader = new FileReader();
                                              reader.onload = () => {
                                                const b = reader.result as string;
                                                const base64 = b.includes(",") ? b.split(",")[1]! : b;
                                                if (base64.length > 4 * 1024 * 1024) {
                                                  addToast("画像は4MB以下にしてください。", "error");
                                                  return;
                                                }
                                                setInstagramPostImage({ mimeType: mime, data: base64 });
                                              };
                                              reader.readAsDataURL(file);
                                            }}
                                          />
                                          <span className="inline-flex items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-base font-medium text-emerald-400 hover:bg-emerald-500/20 h-9">
                                            画像を選択
                                          </span>
                                        </label>
                                      )}
                                      {instagramPostImage && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-zinc-400 hover:text-zinc-200 h-9 px-2"
                                          onClick={() => setInstagramPostImage(null)}
                                        >
                                          画像を解除
                                        </Button>
                                      )}
                                      <PostToLateButton
                                        platform="instagram"
                                        content={tab.data}
                                        imageData={uploadImageData || instagramPostImage}
                                        addToast={addToast}
                                      />
                                    </div>
                                  )}
                                  {tab.id === "gbp" && typeof tab.data === "string" && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {!(uploadImageData || instagramPostImage) && (
                                        <label className="cursor-pointer">
                                          <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (!file) return;
                                              const mime = file.type as "image/jpeg" | "image/png" | "image/webp";
                                              if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) {
                                                addToast("JPEG / PNG / WebP 形式を選んでください。", "error");
                                                return;
                                              }
                                              const reader = new FileReader();
                                              reader.onload = () => {
                                                const b = reader.result as string;
                                                const base64 = b.includes(",") ? b.split(",")[1]! : b;
                                                if (base64.length > 4 * 1024 * 1024) {
                                                  addToast("画像は4MB以下にしてください。", "error");
                                                  return;
                                                }
                                                setInstagramPostImage({ mimeType: mime, data: base64 });
                                              };
                                              reader.readAsDataURL(file);
                                            }}
                                          />
                                          <span className="inline-flex items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-base font-medium text-emerald-400 hover:bg-emerald-500/20 h-9">
                                            画像を選択
                                          </span>
                                        </label>
                                      )}
                                      {instagramPostImage && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-zinc-400 hover:text-zinc-200 h-9 px-2"
                                          onClick={() => setInstagramPostImage(null)}
                                        >
                                          画像を解除
                                        </Button>
                                      )}
                                      <PostToLateButton
                                        platform="gbp"
                                        content={tab.data}
                                        title={generatedResults.portalTitle}
                                        imageData={uploadImageData || instagramPostImage}
                                        addToast={addToast}
                                      />
                                    </div>
                                  )}
                                </>
                              )}
                              {tab.id === "short" && (() => {
                                const raw = tab.data as string;
                                let parsed: ShortScriptData | null = null;
                                try {
                                  parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
                                } catch {
                                  // ignore
                                }
                                const copyText = parsed
                                  ? `${parsed.hook}\n\n${(parsed.scenes || []).map(s => s.text + (s.note ? ` （${s.note}）` : "")).join("\n")}\n\n${parsed.cta}`
                                  : raw || "";
                                return (
                                  <Button
                                    variant="secondary" size="sm"
                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 h-9"
                                    onClick={() => handleCopy(copyText, "short")}
                                  >
                                    {copiedTab === "short" ? <><Check className="w-4 h-4 mr-2 text-green-500" /> コピー完了</> : <><Copy className="w-4 h-4 mr-2" /> コピー</>}
                                  </Button>
                                );
                              })()}
                            </div>
                          </div>
                          <CardContent className="p-6">
                            {tab.id === "portal" && generatedResults.portalTitle && (
                              <div className="mb-6 p-4 bg-zinc-950 rounded-lg border border-zinc-800 space-y-4">
                                <div>
                                  <p className="text-zinc-400 text-xs mb-1.5 font-semibold uppercase tracking-wider">生成されたタイトル</p>
                                  <h3 className="text-lg font-bold text-white mb-2">{generatedResults.portalTitle}</h3>
                                  <p className="text-zinc-400 text-sm">※上記のタイトルと下の本文がWordPressに送信されます。</p>
                                </div>
                                {generatedResults.llmo?.schemaJson && (
                                  <div className="mt-1 pt-3 border-t border-zinc-800 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-xs text-emerald-400 font-semibold">JSON-LD（検索エンジン・AI向け構造化データ）</p>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="xs"
                                        className="h-7 px-2 text-[11px] text-zinc-300 hover:text-emerald-400 hover:bg-zinc-800"
                                        onClick={() => handleCopy(generatedResults.llmo?.schemaJson || "", "portal-llmo-schema")}
                                      >
                                        <Copy className="w-3 h-3 mr-1" />
                                        JSON-LDをコピー
                                      </Button>
                                    </div>
                                    <textarea
                                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-[11px] text-zinc-300 font-mono resize-y min-h-[160px]"
                                      readOnly
                                      value={generatedResults.llmo.schemaJson}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                            {tab.id === "short" ? (() => {
                              const raw = tab.data as string;
                              let parsed: ShortScriptData | null = null;
                              try {
                                parsed = typeof raw === "string" ? JSON.parse(raw) : (raw as ShortScriptData);
                              } catch {
                                // ignore
                              }
                              if (!parsed || !parsed.hook) {
                                return <div className="text-zinc-400 text-sm">台本の解析に失敗しました。生データ: <pre className="mt-2 p-3 bg-zinc-950 rounded text-xs overflow-x-auto">{String(raw ?? "").slice(0, 500)}</pre></div>;
                              }

                              const updateShortScript = (updater: (draft: ShortScriptData) => ShortScriptData) => {
                                setGeneratedResults(prev => {
                                  if (!prev) return prev;
                                  const currentRaw = prev.shortScript as string;
                                  let current: ShortScriptData | null = null;
                                  try {
                                    current = typeof currentRaw === "string" ? JSON.parse(currentRaw) : (currentRaw as ShortScriptData);
                                  } catch {
                                    current = parsed;
                                  }
                                  if (!current) return prev;
                                  const next = updater(current);
                                  return { ...prev, shortScript: JSON.stringify(next) };
                                });
                              };

                              return (
                                <div className="space-y-6 text-zinc-300">
                                  <div>
                                    <p className="text-xs font-semibold text-emerald-500 mb-1">🎬 フック（冒頭3〜5秒）</p>
                                    <textarea
                                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-100 resize-y focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
                                      value={parsed.hook}
                                      onChange={(e) =>
                                        updateShortScript(draft => ({ ...draft, hook: e.target.value }))
                                      }
                                      spellCheck={false}
                                    />
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-emerald-500 mb-2">📝 本編</p>
                                    <ul className="space-y-3">
                                      {(parsed.scenes || []).map((s, i) => (
                                        <li key={i} className="flex gap-3 items-start">
                                          <span className="shrink-0 text-zinc-500 text-xs w-10">[{s.sec}秒]</span>
                                          <div className="flex-1 space-y-1.5">
                                            <textarea
                                              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-100 resize-y focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
                                              value={s.text}
                                              onChange={(e) =>
                                                updateShortScript(draft => {
                                                  const nextScenes = [...(draft.scenes || [])];
                                                  nextScenes[i] = { ...nextScenes[i], text: e.target.value };
                                                  return { ...draft, scenes: nextScenes };
                                                })
                                              }
                                              spellCheck={false}
                                            />
                                            <input
                                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                                              placeholder="撮り方のメモ（任意）"
                                              value={s.note ?? ""}
                                              onChange={(e) =>
                                                updateShortScript(draft => {
                                                  const nextScenes = [...(draft.scenes || [])];
                                                  nextScenes[i] = { ...nextScenes[i], note: e.target.value || undefined };
                                                  return { ...draft, scenes: nextScenes };
                                                })
                                              }
                                              spellCheck={false}
                                            />
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-emerald-500 mb-1">👉 最後の誘導文</p>
                                    <textarea
                                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-100 resize-y focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
                                      value={parsed.cta}
                                      onChange={(e) =>
                                        updateShortScript(draft => ({ ...draft, cta: e.target.value }))
                                      }
                                      spellCheck={false}
                                    />
                                  </div>
                                </div>
                              );
                            })() : editingTab === tab.id ? (
                              <textarea
                                className="w-full min-h-[240px] bg-zinc-950 border border-emerald-500/30 rounded-lg p-4 text-zinc-300 text-base font-medium leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                value={tab.data as string}
                                onChange={(e) => setGeneratedResults(prev => prev ? { ...prev, [tab.id]: e.target.value } : prev)}
                                spellCheck={false}
                              />
                            ) : (
                              <div className="whitespace-pre-wrap text-zinc-100 font-medium leading-loose text-base">
                                {typeof tab.data === "string" ? linkifyText(tab.data) : (tab.data != null ? JSON.stringify(tab.data) : "")}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        {/* 改善して再生成 */}
                        <div className="mt-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
                          <p className="text-base font-semibold text-zinc-200 mb-3">改善して再生成</p>
                          <p className="text-base text-zinc-400 mb-3">指示を1つ選んでからボタンを押すと、このタブの文章だけを改善して再生成します。</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {REFINE_OPTIONS.map((opt) => (
                              <label
                                key={opt.id}
                                className={`flex items-center gap-2 text-base cursor-pointer select-none px-3 py-2 rounded-lg border transition-colors ${(refineInstruction[tab.id] ?? null) === opt.id ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-600"}`}
                              >
                                <input
                                  type="radio"
                                  name={`refine-${tab.id}`}
                                  checked={(refineInstruction[tab.id] ?? null) === opt.id}
                                  onChange={() => setRefineInstruction(tab.id, opt.id)}
                                  className="w-3.5 h-3.5 accent-emerald-500"
                                />
                                {opt.label}
                              </label>
                            ))}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="gradient-accent hover:opacity-95 text-zinc-950 border-transparent"
                            disabled={isRefining || !(refineInstruction[tab.id] ?? null)}
                            title={!(refineInstruction[tab.id] ?? null) ? "改善指示を1つ選んでから押してください" : undefined}
                            onClick={() => {
                              const currentText = typeof tab.data === "string" ? tab.data : JSON.stringify(tab.data);
                              const extra = tab.id === "portal" && generatedResults.portalTitle ? { portalTitle: generatedResults.portalTitle } : undefined;
                              handleRefine(tab.id, currentText, extra);
                            }}
                          >
                            {isRefining ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 再生成中...</> : "選択して再生成"}
                          </Button>
                        </div>
                      </TabsContent>
                    ))
                  )}
                </Tabs>
              </section>
            )}

            {/* ===== 生成履歴パネル（最下部） ===== */}
            {generationHistory.length > 0 && (
              <section className="space-y-2 border-t border-zinc-800 pt-8">
                <button
                  type="button"
                  onClick={() => setShowHistory(v => !v)}
                  className="flex items-center gap-2 w-full text-left text-sm text-zinc-400 hover:text-zinc-200 transition-colors group min-h-[44px] py-2"
                >
                  <History className="w-4 h-4 text-emerald-500/70 group-hover:text-emerald-500 transition-colors shrink-0" />
                  <span className="font-medium">生成履歴</span>
                  <span className="text-sm text-zinc-400 ml-1">（{generationHistory.length}件）</span>
                  <span className={`ml-auto text-zinc-600 transition-transform duration-200 shrink-0 ${showHistory ? "rotate-90" : ""}`}>▶</span>
                </button>

                {showHistory && (
                  <>
                    <div className="flex gap-2 flex-wrap">
                      {(["all", "today", "week"] as const).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setHistoryFilter(key)}
                          className={`px-3 py-1.5 rounded-lg text-base font-medium transition-smooth min-h-[36px] ${historyFilter === key ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-500"}`}
                        >
                          {key === "all" ? "すべて" : key === "today" ? "今日" : "今週"}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      {(() => {
                        const now = new Date();
                        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                        const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
                        const filteredHistory = generationHistory.filter((entry) => {
                          const t = new Date(entry.created_at).getTime();
                          if (historyFilter === "today") return t >= todayStart;
                          if (historyFilter === "week") return t >= weekStart;
                          return true;
                        });
                        return filteredHistory.length === 0 ? (
                          <p className="col-span-full text-sm text-zinc-500 py-4">該当する履歴がありません</p>
                        ) : (
                          filteredHistory.map((entry) => {
                            const shortPreview = (() => {
                              const s = entry.results.shortScript;
                              if (!s) return "";
                              if (typeof s === "string") {
                                try {
                                  const p = JSON.parse(s) as ShortScriptData;
                                  return p.hook || s.slice(0, 80);
                                } catch {
                                  return s.slice(0, 80);
                                }
                              }
                              return (s as ShortScriptData).hook || "";
                            })();
                            const previewText = entry.results.instagram ?? entry.results.gbp ?? entry.results.line ?? entry.results.reply ?? entry.results.portal ?? shortPreview ?? "";
                            const dateStr = new Date(entry.created_at).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
                            return (
                              <div key={entry.id} className="relative group bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 card-elevated transition-smooth">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    <span className="text-xs text-zinc-400 shrink-0">{dateStr}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5 whitespace-nowrap">
                                      {entry.pattern_id}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteHistory(entry.id)}
                                      disabled={deletingHistoryId === entry.id}
                                      className="text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50"
                                      title="履歴を削除"
                                    >
                                      {deletingHistoryId === entry.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </div>
                                <p className="text-base font-medium text-zinc-200 mb-1.5">{entry.pattern_title}</p>
                                {previewText && (
                                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                                    {previewText.replace(/<[^>]+>/g, "").slice(0, 80)}...
                                  </p>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRestoreHistory(entry)}
                                  className="w-full min-h-[44px] text-xs text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-lg py-2"
                                >
                                  ↩ 再利用する
                                </Button>
                              </div>
                            );
                          })
                        );
                      })()}
                    </div>
                  </>
                )}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SEOContentGenerator />
    </Suspense>
  );
}
