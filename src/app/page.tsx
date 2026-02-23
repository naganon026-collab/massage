"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Copy, Loader2, Sparkles, Check, ChevronRight, Settings, Send, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Pattern = "A" | "B" | "C" | "D" | "E" | "F";

interface PatternData {
  id: Pattern;
  title: string;
  description: string;
  questions: {
    q1: string;
    ex1: string;
    q2: string;
    ex2: string;
    q3: string;
    ex3: string;
  };
}

const PATTERNS: PatternData[] = [
  {
    id: "A",
    title: "ビフォーアフター・お悩み解決",
    description: "お客様の変化を通じて、施術の効果をアピールします",
    questions: {
      q1: "お客様の具体的なお悩みは？",
      ex1: "例: 長時間のPC作業による眼精疲労と首の痛み",
      q2: "どの部位を、どんな独自技術でアプローチしましたか？",
      ex2: "例: 首の付け根の〇〇筋を深層からほぐす独自の指圧で",
      q3: "施術後、お客様はどう変化しましたか？",
      ex3: "例: 視界が広くなり、腕が上がりやすくなったと驚かれた",
    }
  },
  {
    id: "B",
    title: "プロのこだわり・裏側公開",
    description: "独自の技術や素材へのこだわりで信頼感を高めます",
    questions: {
      q1: "今回紹介する施術やオイル等の「独自のこだわり」は？",
      ex1: "例: 長野県産の白樺オイルを使用、完全個室空間",
      q2: "なぜその手法・素材を選んだのですか？",
      ex2: "例: 男性特有の厚い筋肉に浸透しやすいため",
      q3: "どんなお客様に一番体験してほしいですか？",
      ex3: "例: 慢性的な疲労が抜けない経営者の方へ",
    }
  },
  {
    id: "C",
    title: "今日の空き状況・限定メニュー",
    description: "タイムリーな情報の発信で、即時来店を促します",
    questions: {
      q1: "本日や今週の「狙い目の空き時間」はいつですか？",
      ex1: "例: 本日14:00〜16:00",
      q2: "今だけの限定メニューや特典は何ですか？",
      ex2: "例: 平日昼限定でヘッドスパ10分延長無料",
      q3: "来店するとどんな良い気分を味わえますか？",
      ex3: "例: 午後の仕事のパフォーマンスが劇的に上がります",
    }
  },
  {
    id: "D",
    title: "お客様の喜びの声",
    description: "第三者の客観的な評価で安心感を与え、来店を後押しします",
    questions: {
      q1: "お客様からどんな嬉しい言葉をいただきましたか？",
      ex1: "例: 「もっと早く来ればよかった」と言われました",
      q2: "その方はどんなお悩みを抱えて来店されましたか？",
      ex2: "例: 睡眠が浅く、朝から体が重い",
      q3: "次回に向けてどんなケアを提案しましたか？",
      ex3: "例: 就寝前の簡単なストレッチと、月1回の定期メンテナンス",
    }
  },
  {
    id: "E",
    title: "スタッフの紹介・想い",
    description: "施術者の人柄や情熱を伝え、親近感と信頼を生み出します",
    questions: {
      q1: "このスタッフの得意な施術や特技は何ですか？",
      ex1: "例: 強めの圧で凝りを深層からほぐす「アロマトリートメント」",
      q2: "施術において、一番大切にしている信念・想いは何ですか？",
      ex2: "例: お客様が明日から最高のパフォーマンスを出せるように全力で向き合う",
      q3: "この記事を読んでいるお客様へ一言メッセージを。",
      ex3: "例: どんなに頑固な疲れでもお任せください！",
    }
  },
  {
    id: "F",
    title: "季節や気候に合わせたケア",
    description: "季節特有の悩みに寄り添い、「今行くべき理由」を作ります",
    questions: {
      q1: "今の季節・気候ならではの、お客様が抱えやすい不調は何ですか？",
      ex1: "例: 寒さ・冷え込みによる首肩の凝りと血行不良",
      q2: "その不調に対して、どのような特別なケアを提供・提案しましたか？",
      ex2: "例: 温感オイルを使った重点的な首周りのトリートメント",
      q3: "ケアを受けた後、お客様はどのような状態を実感されましたか？",
      ex3: "例: 手足の先までポカポカになり、寝付きが良くなった",
    }
  }
];

export interface ShopInfo {
  name: string;
  address: string;
  phone: string;
  lineUrl: string;
  businessHours: string;
  holidays: string;
  features: string;
  referenceUrls: string[];
  wpCategoryId?: string;
  wpTagId?: string;
  wpAuthorId?: string;
  outputTargets?: {
    instagram: boolean;
    gbp: boolean;
    portal: boolean;
  };
  generateImage?: boolean;
}

export default function SEOContentGenerator() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  const [shopInfo, setShopInfo] = useState<ShopInfo>({
    name: "", address: "", phone: "", lineUrl: "", businessHours: "", holidays: "", features: "", referenceUrls: [],
    wpCategoryId: "", wpTagId: "", wpAuthorId: "",
    outputTargets: { instagram: true, gbp: true, portal: true },
    generateImage: false
  });
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [scrapeUrl, setScrapeUrl] = useState<string>("");
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [isExtractingInfo, setIsExtractingInfo] = useState<boolean>(false);

  const [selectedPattern, setSelectedPattern] = useState<Pattern>("A");
  const [formData, setFormData] = useState({ q1: "", q2: "", q3: "" });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<{
    instagram?: string;
    gbp?: string;
    portal?: string;
    portalTitle?: string;
    imageUrl?: string;
  } | null>(null);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [isPostingToWP, setIsPostingToWP] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) fetchShopInfo(session.user.id);
      else setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchShopInfo(session.user.id);
      } else {
        setShopInfo({
          name: "", address: "", phone: "", lineUrl: "", businessHours: "", holidays: "", features: "", referenceUrls: [],
          wpCategoryId: "", wpTagId: "", wpAuthorId: "",
          outputTargets: { instagram: true, gbp: true, portal: true },
          generateImage: false
        });
        setIsConfigured(false);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchShopInfo = async (userId: string) => {
    setIsLoading(true);
    const { data } = await supabase.from('shops').select('settings').eq('user_id', userId).single();
    if (data && data.settings) {
      setShopInfo((prev) => ({ ...prev, ...data.settings }));
      setIsConfigured(true);
    }
    setIsLoading(false);
  };

  const handleSaveShopInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Supabaseへの保存
    const { error } = await supabase.from('shops').upsert({
      user_id: user.id,
      settings: shopInfo,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    if (error) {
      alert("設定の保存に失敗しました：" + error.message);
    } else {
      setIsConfigured(true);
      alert("クラウドに設定を保存しました！");
    }
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleExtractInfo = async (textToExtract: string) => {
    if (!textToExtract.trim()) return;

    setIsExtractingInfo(true);
    try {
      const res = await fetch("/api/extract-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToExtract }),
      });
      const data = await res.json();

      if (!res.ok) {
        console.error("情報抽出エラー:", data.error);
        return; // エラー時は何もしない（裏側の機能なのでアラートは極力出さないか、出すなら控えめに）
      }

      setShopInfo((prev) => {
        const nextInfo = { ...prev };
        let updated = false;

        // 既存の入力が空の場合のみ、抽出された情報を埋める
        if (!nextInfo.address && data.address) { nextInfo.address = data.address; updated = true; }
        if (!nextInfo.phone && data.phone) { nextInfo.phone = data.phone; updated = true; }
        if (!nextInfo.lineUrl && data.lineUrl) { nextInfo.lineUrl = data.lineUrl; updated = true; }
        if (!nextInfo.businessHours && data.businessHours) { nextInfo.businessHours = data.businessHours; updated = true; }
        if (!nextInfo.holidays && data.holidays) { nextInfo.holidays = data.holidays; updated = true; }

        if (updated) {
          // 少し遅れてユーザーに気づかせるためトースト的にお知らせ（今回は簡易的にalertか、何もしなくても視覚的に埋まるのでOK）
          setTimeout(() => alert("✨ 入力された文章から、住所・電話番号・営業時間などを自動抽出して入力しました。"), 500);
        }

        return nextInfo;
      });
    } catch (error) {
      console.error("情報抽出例外:", error);
    } finally {
      setIsExtractingInfo(false);
    }
  };

  const handleScrapeUrl = async () => {
    if (!scrapeUrl || !scrapeUrl.startsWith("http")) {
      alert("有効なURLを入力してください。");
      return;
    }
    setIsScraping(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "抽出失敗");

      const addedText = `\n\n【参考サイト（${scrapeUrl}）からの抽出情報】\n${data.text}`;
      setShopInfo((prev) => ({
        ...prev,
        features: prev.features + addedText
      }));
      setScrapeUrl("");
      alert("抽出が完了し、自由記述欄に追記されました！");

      // スクレイピングで得たテキストからも住所等を裏で抽出
      handleExtractInfo(data.text);

    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsScraping(false);
    }
  };

  const handleFeaturesPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // ペーストされたテキストを取得
    const pastedText = e.clipboardData.getData("text");
    if (pastedText.length > 20) {
      // 少し長めのテキストがペーストされた場合のみ、自動抽出を裏で走らせる
      handleExtractInfo(pastedText);
    }
  };

  const handlePatternChange = (patternId: Pattern) => {
    setSelectedPattern(patternId);
    setFormData({ q1: "", q2: "", q3: "" });
    setGeneratedResults(null);
  };

  const handlePostToWP = async (status: "draft" | "publish") => {
    if (!generatedResults?.portalTitle || !generatedResults?.portal) {
      alert("ポータルサイト用のタイトルと本文が生成されていません。");
      return;
    }

    const actionText = status === "draft" ? "下書き保存" : "公開";
    if (!confirm(`生成されたポータル用テキストをWordPressへ${actionText}しますか？`)) {
      return;
    }

    setIsPostingToWP(true);
    try {
      const res = await fetch("/api/wppost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generatedResults.portalTitle,
          content: generatedResults.portal,
          status: status,
          wpCategoryId: shopInfo.wpCategoryId,
          wpTagId: shopInfo.wpTagId,
          wpAuthorId: shopInfo.wpAuthorId,
          imageUrl: generatedResults.imageUrl
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || "投稿に失敗しました");
      }

      alert(`WordPressへ${actionText}しました！\n投稿ID: ${data.postId}`);
      if (data.link) {
        window.open(data.link, '_blank');
      }
    } catch (error: any) {
      alert("エラーが発生しました: " + error.message);
    } finally {
      setIsPostingToWP(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patternTitle: currentPattern.title,
          q1: formData.q1,
          q2: formData.q2,
          q3: formData.q3,
          shopInfo: shopInfo,
          outputTargets: shopInfo.outputTargets || { instagram: true, gbp: true, portal: true },
          generateImage: shopInfo.generateImage || false,
        }),
      });

      if (!response.ok) {
        throw new Error("APIリクエストに失敗しました。");
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedResults({
        instagram: data.instagram,
        gbp: data.gbp,
        portal: data.portal,
        portalTitle: data.portalTitle,
        imageUrl: data.imageUrl,
      });

    } catch (error: any) {
      console.error(error);
      alert(error.message || "テキストの生成中にエラーが発生しました。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, tabId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabId);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const currentPattern = PATTERNS.find(p => p.id === selectedPattern)!;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 mb-8 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-900/20">
          <Sparkles className="w-8 h-8 text-zinc-950" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">SEO投稿ジェネレーター</h1>
        <p className="text-zinc-400 mb-8 text-center max-w-sm leading-relaxed">
          店舗の魅力を最大限に引き出す、高品質な投稿テキストと画像をAIが自動生成します。
        </p>
        <Button
          onClick={handleLogin}
          className="bg-white hover:bg-zinc-200 text-zinc-900 font-bold px-8 py-6 rounded-full shadow-xl transition-all active:scale-95 flex items-center gap-3 text-lg"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Googleでログインしてはじめる
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50 font-sans selection:bg-amber-500/30 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-zinc-950" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 truncate">
              {shopInfo.name || "店舗"} <span className="text-zinc-400 font-normal text-sm hidden sm:inline-block">- 投稿ジェネレーター</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isConfigured && (
              <Button variant="ghost" size="sm" onClick={() => setIsConfigured(false)} className="text-zinc-400 hover:text-white hidden sm:flex">
                <Settings className="w-4 h-4 mr-2" />
                設定
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-zinc-400 hover:text-white">
              <LogOut className="w-4 h-4 mr-2 sm:mr-0 lg:mr-2" />
              <span className="hidden lg:inline-block">ログアウト</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {!isConfigured ? (
          // 店舗情報の初期設定フォーム
          <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">初期設定（店舗情報）</h2>
              <p className="text-zinc-400">作成される文章に埋め込むための基本情報を設定してください。</p>
            </div>
            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <form onSubmit={handleSaveShopInfo} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="shopName">店舗名</Label>
                    <Input id="shopName" required value={shopInfo.name} onChange={(e) => setShopInfo({ ...shopInfo, name: e.target.value })} className="bg-zinc-900 border-zinc-700 text-white" placeholder="例：The Gentry" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shopAddress">住所</Label>
                    <Input id="shopAddress" required value={shopInfo.address} onChange={(e) => setShopInfo({ ...shopInfo, address: e.target.value })} className="bg-zinc-900 border-zinc-700 text-white" placeholder="例：長野県長野市〇〇1-2-3" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="shopPhone">電話番号</Label>
                      <Input id="shopPhone" required value={shopInfo.phone} onChange={(e) => setShopInfo({ ...shopInfo, phone: e.target.value })} className="bg-zinc-900 border-zinc-700 text-white" placeholder="例：026-000-0000" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shopLine">LINE/予約へのアクセスURL</Label>
                      <Input id="shopLine" required value={shopInfo.lineUrl} onChange={(e) => setShopInfo({ ...shopInfo, lineUrl: e.target.value })} className="bg-zinc-900 border-zinc-700 text-white" placeholder="例：https://lin.ee/xxxxx" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="shopBusinessHours">営業時間</Label>
                      <Input id="shopBusinessHours" required value={shopInfo.businessHours} onChange={(e) => setShopInfo({ ...shopInfo, businessHours: e.target.value })} className="bg-zinc-900 border-zinc-700 text-white" placeholder="例：10:00〜20:00" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shopHolidays">定休日</Label>
                      <Input id="shopHolidays" required value={shopInfo.holidays} onChange={(e) => setShopInfo({ ...shopInfo, holidays: e.target.value })} className="bg-zinc-900 border-zinc-700 text-white" placeholder="例：毎週火曜・年末年始" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shopFeatures">店舗の独自情報・強み・想い（自由記述）</Label>
                    <textarea
                      id="shopFeatures"
                      value={shopInfo.features}
                      onChange={(e) => setShopInfo({ ...shopInfo, features: e.target.value })}
                      onPaste={handleFeaturesPaste}
                      className="flex min-h-[120px] w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="例：独自の手技で深層筋にアプローチ。完全個室で周りを気にせずリラックス。PC作業による首肩こり・眼精疲労に悩む男性への施術が得意です。"
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <p className="text-xs text-zinc-500">※ここに書いたお店のこだわりが、生成される文章に自然に反映されるようになります！（長文OK）</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExtractInfo(shopInfo.features)}
                        disabled={isExtractingInfo || !shopInfo.features}
                        className="text-amber-500 hover:text-amber-400 hover:bg-zinc-800 h-8 text-xs shrink-0"
                      >
                        {isExtractingInfo ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                        入力内容から連絡先を自動抽出
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-zinc-800">
                    <div>
                      <Label>WEBサイトから自動抽出して追記</Label>
                      <p className="text-xs text-zinc-500 mb-2">※お店のトップページやメニュー表のURLを入れると、中の文字を自動で抜き出して上の枠に一発で合体させます。（何ページでも追加可能）</p>
                    </div>

                    <div className="flex gap-2 items-center">
                      <Input
                        value={scrapeUrl}
                        onChange={(e) => setScrapeUrl(e.target.value)}
                        className="bg-zinc-900 border-zinc-700 text-white flex-1"
                        placeholder="https://..."
                      />
                      <Button type="button" onClick={handleScrapeUrl} disabled={isScraping || !scrapeUrl} className="bg-zinc-800 text-amber-500 hover:bg-zinc-700 border border-zinc-700 shrink-0">
                        {isScraping ? "抽出中..." : "抽出して追記する"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-zinc-800">
                    <div>
                      <Label className="text-amber-500 flex items-center gap-2"><Settings className="w-4 h-4" /> WordPress 連携設定（任意）</Label>
                      <p className="text-xs text-zinc-500 mb-4 mt-2 leading-relaxed">
                        WordPressへ直接投稿する際に、カテゴリーやタグ、店舗名（カスタムタクソノミー）を自動でセットしたい場合は以下の欄にそれぞれのIDを数字で入力してください。<br />
                        ※複数指定する場合は「1,2」のように半角カンマで区切ってください。
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="wpCategoryId" className="text-xs text-zinc-400">カテゴリーID</Label>
                        <Input
                          id="wpCategoryId"
                          value={shopInfo.wpCategoryId || ""}
                          onChange={(e) => setShopInfo({ ...shopInfo, wpCategoryId: e.target.value })}
                          className="bg-zinc-900 border-zinc-800 focus:border-amber-500/50"
                          placeholder="例: 1,2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wpTagId" className="text-xs text-zinc-400">タグID</Label>
                        <Input
                          id="wpTagId"
                          value={shopInfo.wpTagId || ""}
                          onChange={(e) => setShopInfo({ ...shopInfo, wpTagId: e.target.value })}
                          className="bg-zinc-900 border-zinc-800 focus:border-amber-500/50"
                          placeholder="例: 3,4"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wpAuthorId" className="text-xs text-zinc-400 flex items-center gap-1">投稿作成者(ユーザー)ID</Label>
                        <Input
                          id="wpAuthorId"
                          value={shopInfo.wpAuthorId || ""}
                          onChange={(e) => setShopInfo({ ...shopInfo, wpAuthorId: e.target.value })}
                          className="bg-zinc-900 border-zinc-800 focus:border-amber-500/50"
                          placeholder="例: 2 (空白=管理者)"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-zinc-800">
                    <div>
                      <Label>出力する媒体</Label>
                      <p className="text-xs text-zinc-500 mb-2">※チェックを入れた媒体のみAIがテキストを生成します。</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-6 pb-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shopInfo.outputTargets?.instagram ?? true}
                          onChange={(e) => setShopInfo((prev) => ({ ...prev, outputTargets: { ...prev.outputTargets!, instagram: e.target.checked } }))}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm text-zinc-300">Instagram用</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shopInfo.outputTargets?.gbp ?? true}
                          onChange={(e) => setShopInfo((prev) => ({ ...prev, outputTargets: { ...prev.outputTargets!, gbp: e.target.checked } }))}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm text-zinc-300">Google Map(MEO)用</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shopInfo.outputTargets?.portal ?? true}
                          onChange={(e) => setShopInfo((prev) => ({ ...prev, outputTargets: { ...prev.outputTargets!, portal: e.target.checked } }))}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm text-zinc-300">ブログ(ポータル)用</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-zinc-800">
                    <div>
                      <Label>AI画像生成オプション（任意）</Label>
                      <p className="text-xs text-zinc-500 mb-2">※チェックを入れると、テキストと一緒にAIが関連イメージ画像を生成します。（WordPressへの自動サムネイル挿入に対応）</p>
                    </div>
                    <div className="flex items-center gap-2 pb-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shopInfo.generateImage || false}
                          onChange={(e) => setShopInfo((prev) => ({ ...prev, generateImage: e.target.checked }))}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm text-zinc-300">テキストと同時にAI画像を生成する（1回約6円目安）</span>
                      </label>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold h-12">
                    設定を保存してはじめる
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in duration-500">

            {/* Step 1: Pattern Selection */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 text-sm font-bold">1</span>
                <h2 className="text-xl font-semibold">投稿パターンの選択</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PATTERNS.map((pattern) => (
                  <Card
                    key={pattern.id}
                    className={`cursor-pointer transition-all duration-200 border-zinc-800 bg-zinc-900/50 hover:border-amber-500/50 hover:bg-zinc-900 ${selectedPattern === pattern.id ? "ring-2 ring-amber-500 border-amber-500 bg-zinc-900 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : ""
                      }`}
                    onClick={() => handlePatternChange(pattern.id)}
                  >
                    <CardHeader className="p-5">
                      <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
                        {selectedPattern === pattern.id && <Check className="w-4 h-4 text-amber-500" />}
                        パターン {pattern.id}
                      </CardTitle>
                      <CardDescription className="text-zinc-400 mt-2 font-medium">
                        {pattern.title}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 text-sm text-zinc-500">
                      {pattern.description}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Step 2: Dynamic Form */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 text-sm font-bold">2</span>
                <h2 className="text-xl font-semibold">事実（ファクト）の入力</h2>
              </div>

              <Card className="border-zinc-800 bg-zinc-900">
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="q1" className="text-base text-zinc-200">{currentPattern.questions.q1}</Label>
                    <Input
                      id="q1"
                      value={formData.q1}
                      onChange={(e) => handleInputChange(e, "q1")}
                      placeholder={currentPattern.questions.ex1}
                      className="bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500 text-zinc-100 placeholder:text-zinc-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="q2" className="text-base text-zinc-200">{currentPattern.questions.q2}</Label>
                    <Input
                      id="q2"
                      value={formData.q2}
                      onChange={(e) => handleInputChange(e, "q2")}
                      placeholder={currentPattern.questions.ex2}
                      className="bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500 text-zinc-100 placeholder:text-zinc-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="q3" className="text-base text-zinc-200">{currentPattern.questions.q3}</Label>
                    <Input
                      id="q3"
                      value={formData.q3}
                      onChange={(e) => handleInputChange(e, "q3")}
                      placeholder={currentPattern.questions.ex3}
                      className="bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500 text-zinc-100 placeholder:text-zinc-600"
                    />
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Step 3: Action Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-bold text-lg h-16 w-full max-w-sm rounded-full shadow-lg shadow-amber-900/20 transition-all active:scale-95 group flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-950" />
                    <span>AIがテキストを生成中...</span>
                  </>
                ) : (
                  <>
                    <span>この内容で生成する</span>
                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>

            {/* Step 4: Results */}
            {generatedResults && (
              <section className="space-y-4 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 text-sm font-bold">3</span>
                    <h2 className="text-xl font-semibold text-amber-500">生成完了</h2>
                  </div>
                </div>

                <Tabs defaultValue={
                  shopInfo.outputTargets?.instagram ? "instagram" :
                    shopInfo.outputTargets?.gbp ? "gbp" :
                      shopInfo.outputTargets?.portal ? "portal" : "instagram"
                } className="w-full">
                  <TabsList className="flex w-full bg-zinc-900 border border-zinc-800 p-1">
                    {shopInfo.outputTargets?.instagram !== false && (
                      <TabsTrigger value="instagram" className="flex-1 data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-500">Instagram用</TabsTrigger>
                    )}
                    {shopInfo.outputTargets?.gbp !== false && (
                      <TabsTrigger value="gbp" className="flex-1 data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-500">Googleの最新情報用</TabsTrigger>
                    )}
                    {shopInfo.outputTargets?.portal !== false && (
                      <TabsTrigger value="portal" className="flex-1 data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-500">ポータルサイト用</TabsTrigger>
                    )}
                  </TabsList>

                  {[
                    { id: "instagram", data: generatedResults.instagram, active: shopInfo.outputTargets?.instagram !== false },
                    { id: "gbp", data: generatedResults.gbp, active: shopInfo.outputTargets?.gbp !== false },
                    { id: "portal", data: generatedResults.portal, active: shopInfo.outputTargets?.portal !== false }
                  ].filter(t => t.active && t.data).map((tab) => (
                    <TabsContent key={tab.id} value={tab.id}>
                      <Card className="border-zinc-800 bg-zinc-900 relative overflow-hidden group">
                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                          {tab.id === "portal" && generatedResults.portalTitle && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700 h-9"
                                onClick={() => handlePostToWP("draft")}
                                disabled={isPostingToWP}
                              >
                                {isPostingToWP ? (
                                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 送信中</>
                                ) : (
                                  <>📝 下書き保存</>
                                )}
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                                onClick={() => handlePostToWP("publish")}
                                disabled={isPostingToWP}
                              >
                                {isPostingToWP ? (
                                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 送信中</>
                                ) : (
                                  <><Send className="w-4 h-4 mr-2" /> すぐに公開</>
                                )}
                              </Button>
                            </div>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 h-9"
                            onClick={() => handleCopy(tab.data as string, tab.id)}
                          >
                            {copiedTab === tab.id ? (
                              <><Check className="w-4 h-4 mr-2 text-green-500" /> コピー完了</>
                            ) : (
                              <><Copy className="w-4 h-4 mr-2" /> コピー</>
                            )}
                          </Button>
                        </div>
                        <CardContent className="p-6 pt-16">
                          {tab.id === "portal" && generatedResults.portalTitle && (
                            <div className="mb-6 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                              <p className="text-zinc-400 text-xs mb-1 font-semibold uppercase tracking-wider">生成されたタイトル</p>
                              <h3 className="text-lg font-bold text-white mb-2">{generatedResults.portalTitle}</h3>
                              <p className="text-zinc-500 text-xs">※上記のタイトルと下の本文がWordPressに送信されます。</p>
                            </div>
                          )}
                          {tab.id === "portal" && generatedResults.imageUrl && (
                            <div className="mb-6">
                              <p className="text-zinc-400 text-xs mb-2 font-semibold uppercase tracking-wider">生成されたイメージ画像（アイキャッチ対象）</p>
                              <div className="relative w-full max-w-md aspect-square rounded-lg overflow-hidden border border-zinc-800">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={generatedResults.imageUrl} alt="AI生成画像" className="w-full h-full object-cover" />
                              </div>
                            </div>
                          )}
                          <div className="whitespace-pre-wrap text-zinc-300 font-medium leading-relaxed">
                            {tab.data}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>
              </section>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
