"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  Copy, Loader2, Sparkles, Check, ChevronRight, Settings, Send,
  LogOut, History, Clock, Pencil, Trash2, Newspaper, Store, X, ArrowDown, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToastContainer, useToast } from "@/components/ui/toast";

import { ADMIN_EMAIL, PATTERNS, REFINE_OPTIONS, ShopInfo, ShortScriptData } from "@/types";
import { useStoreManager } from "@/hooks/useStoreManager";
import { useShopConfig } from "@/hooks/useShopConfig";
import { useContentGenerator } from "@/hooks/useContentGenerator";
import { SettingsOverlay } from "@/components/features/settings/SettingsOverlay";
import { StoreManagerOverlay } from "@/components/features/store-manager/StoreManagerOverlay";
import { InitialSetup } from "@/components/features/settings/InitialSetup";

// ========== ログイン画面 ==========
function LoginPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-20 h-20 mb-8 rounded-2xl gradient-accent flex items-center justify-center glow-amber-sm transition-smooth">
        <Sparkles className="w-10 h-10 text-zinc-950" />
      </div>
      <h1 className="font-display text-4xl font-bold text-white mb-2 tracking-tight">Post Support</h1>
      <p className="text-zinc-400 mb-10 text-center max-w-sm leading-relaxed text-[15px]">
        店舗の魅力を最大限に引き出す、高品質な投稿テキストと画像をAIが自動生成します。
      </p>
      <Button
        onClick={onLogin}
        className="bg-white hover:bg-zinc-100 text-zinc-900 font-bold !px-16 py-4 rounded-full shadow-xl glow-amber-sm transition-smooth active:scale-[0.98] flex items-center gap-3 text-base"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Googleで続ける
      </Button>
    </div>
  );
}

// ========== ローディング画面 ==========
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center glow-amber-sm animate-pulse">
        <Sparkles className="w-6 h-6 text-zinc-950" />
      </div>
      <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
    </div>
  );
}

// ========== メインアプリ ==========
export default function SEOContentGenerator() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const { toasts, addToast, removeToast } = useToast();
  const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"all" | "today" | "week">("all");
  const resultsRef = useRef<HTMLDivElement>(null);

  // ===== カスタムフック =====
  const shopConfig = useShopConfig(user, addToast, async (userId, isAdmin) => {
    await fetchHistory(userId);
    if (isAdmin) await fetchStores();
  });

  const storeManager = useStoreManager(user, addToast);
  const { fetchStores } = storeManager;

  const contentGen = useContentGenerator(user, shopConfig.shopInfo, storeManager.stores, storeManager.selectedStoreId, addToast, () => {
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  });
  const { fetchHistory } = contentGen;

  // ===== 認証 =====
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        shopConfig.fetchShopInfo(session.user.id);
      } else {
        shopConfig.setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        shopConfig.fetchShopInfo(session.user.id);
      } else {
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

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ===== ローディング・未ログイン =====
  if (shopConfig.isLoading) return <LoadingScreen />;
  if (!user) return <LoginPage onLogin={handleLogin} />;

  const { shopInfo, setShopInfo, isConfigured, setupStep, setSetupStep, setupPath, setSetupPath,
    scrapeUrl, setScrapeUrl, isScraping, isExtractingInfo, scrapedPreview, setScrapedPreview,
    handleScrapeUrl, handleExtractInfo, handleSaveShopInfo, handleSkipWithMinimal,
    settingsScrapeUrl, setSettingsScrapeUrl, isScrapingSettings,
    handleScrapeUrlForSettings, handleQuickSaveSettings,
  } = shopConfig;

  const { stores, selectedStoreId, setSelectedStoreId, showStoreManager, setShowStoreManager,
    showStoreForm, setShowStoreForm, editingStoreId, setEditingStoreId,
    storeFormData, setStoreFormData, isSavingStore, isDeletingStore,
    storeScrapeUrl, setStoreScrapeUrl, isScrapingStore,
    handleSaveStore, handleDeleteStore, openEditStore, handleScrapeUrlForStore,
  } = storeManager;

  const { selectedPattern, handlePatternChange, currentPattern,
    formData, setFormData, replyPlatform, setReplyPlatform,
    receivedComment, setReceivedComment, replyNote, setReplyNote,
    newsItems, selectedNewsIndex, setSelectedNewsIndex, isLoadingNews,
    isGenerating, generatedResults, setGeneratedResults, copiedTab, editingTab, setEditingTab,
    isPostingToWP, generationHistory, showHistory, setShowHistory,
    deletingHistoryId, handleFetchNews, handleGenerate, handlePostToWP,
    handleCopy, handleRestoreHistory, handleDeleteHistory,
    refineInstruction, setRefineInstruction, isRefining, handleRefine,
  } = contentGen;

  // 選択中の店舗があればその設定、なければデフォルトのshopInfoを使う
  const activeShopInfo = selectedStoreId
    ? (stores.find(s => s.id === selectedStoreId)?.settings ?? shopInfo)
    : shopInfo;

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50 font-sans selection:bg-amber-500/30 pb-20 selection:text-zinc-950">
      {/* トースト通知 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* ===== オーバーレイ群 ===== */}
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
        handleQuickSaveSettings={handleQuickSaveSettings}
        user={user}
      />

      {/* ===== ヘッダー ===== */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/90 bg-zinc-950/90 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-accent flex items-center justify-center glow-amber-sm transition-smooth">
              <Sparkles className="w-5 h-5 text-zinc-950" />
            </div>
            <h1 className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-2 truncate">
              Post Support
              {shopInfo.name && (
                <span className="text-sm font-normal text-zinc-500 truncate hidden sm:inline">— {shopInfo.name}</span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* 管理者向け：店舗管理ボタン */}
            {user?.email === ADMIN_EMAIL && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStoreManager(true)}
                className="text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 gap-1.5"
              >
                <Store className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">店舗管理</span>
              </Button>
            )}

            {/* 設定ボタン */}
            {isConfigured && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettingsOverlay(true)}
                className="text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 gap-1.5"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">設定</span>
              </Button>
            )}

            {/* ログアウトボタン */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-zinc-500 hover:text-red-400 hover:bg-zinc-800"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ===== メインコンテンツ ===== */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
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
            handleExtractInfo={handleExtractInfo}
            scrapedPreview={scrapedPreview}
            setScrapedPreview={(v) => setScrapedPreview(v ?? "")}
            handleSaveShopInfo={handleSaveShopInfo}
            handleSkipWithMinimal={handleSkipWithMinimal}
            user={user}
          />
        ) : (
          /* ===== メイン生成UI ===== */
          <div className="space-y-10 animate-in fade-in duration-500">

            {/* 未設定時バナー：設定を促す */}
            {isConfigured && shopInfo.name === "未設定の店舗" && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-amber-200">
                  初期設定を完了すると、より良い文章が生成されます。
                </p>
                <Button variant="outline" size="sm" onClick={() => setShowSettingsOverlay(true)} className="border-amber-500/40 text-amber-400 hover:bg-amber-500/20 min-h-[40px]">
                  <Settings className="w-4 h-4 mr-1.5" />
                  設定を完了する
                </Button>
              </div>
            )}

            {/* 生成履歴パネル */}
            {generationHistory.length > 0 && (
              <section className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowHistory(v => !v)}
                  className="flex items-center gap-2 w-full text-left text-sm text-zinc-400 hover:text-zinc-200 transition-colors group min-h-[44px] py-2"
                >
                  <History className="w-4 h-4 text-amber-500/70 group-hover:text-amber-500 transition-colors shrink-0" />
                  <span className="font-medium">生成履歴</span>
                  <span className="text-xs text-zinc-600 ml-1">（{generationHistory.length}件）</span>
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-smooth min-h-[36px] ${historyFilter === key ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600"}`}
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
                              <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                              <span className="text-xs text-zinc-500 shrink-0">{dateStr}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5 whitespace-nowrap">
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
                          <p className="text-xs font-medium text-zinc-300 mb-1.5">{entry.pattern_title}</p>
                          {previewText && (
                            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-3">
                              {previewText.replace(/<[^>]+>/g, "").slice(0, 80)}...
                            </p>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRestoreHistory(entry)}
                            className="w-full min-h-[44px] text-xs text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 rounded-lg py-2"
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

            {/* 管理者向け：生成対象店舗の選択 */}
            {user?.email === ADMIN_EMAIL && stores.length > 0 && (
              <section className="bg-zinc-900/70 border border-amber-500/20 rounded-xl p-4 space-y-3 card-elevated transition-smooth">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-500" />
                  <span className="font-display text-sm font-semibold text-amber-400">生成対象の店舗を選択</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stores.map((store) => (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => setSelectedStoreId(store.id === selectedStoreId ? null : store.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${selectedStoreId === store.id
                        ? "border-amber-500 bg-amber-500/10 text-amber-400"
                        : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                        }`}
                    >
                      {selectedStoreId === store.id && <Check className="w-3.5 h-3.5" />}
                      {store.name}
                      {store.settings.industry && <span className="text-xs opacity-60">({store.settings.industry})</span>}
                    </button>
                  ))}
                </div>
                {selectedStoreId ? (
                  <p className="text-xs text-zinc-500">✅ 選択中: <span className="text-amber-400 font-medium">{stores.find(s => s.id === selectedStoreId)?.name}</span> の店舗情報を使って生成します</p>
                ) : (
                  <p className="text-xs text-zinc-500">店舗を選択していない場合は、デフォルトの設定（shops テーブル）を使用します</p>
                )}
              </section>
            )}

            {/* ===== STEP 1: パターン選択 ===== */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-500 text-sm font-bold">1</span>
                <h2 className="font-display text-xl font-semibold text-white">投稿パターンの選択</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PATTERNS.map((pattern) => (
                  <Card
                    key={pattern.id}
                    className={`cursor-pointer transition-smooth border-zinc-800 bg-zinc-900/50 card-elevated hover:border-amber-500/40 hover:bg-zinc-900 ${selectedPattern === pattern.id ? "ring-2 ring-amber-500 border-amber-500 bg-zinc-900 glow-amber-sm" : ""
                      }`}
                    onClick={() => handlePatternChange(pattern.id)}
                  >
                    <CardHeader className="p-5">
                      <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
                        {selectedPattern === pattern.id && <Check className="w-4 h-4 text-amber-500" />}
                        パターン {pattern.id}
                      </CardTitle>
                      <CardDescription className="text-zinc-400 mt-2 font-medium">{pattern.title}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 text-sm text-zinc-500">{pattern.description}</CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* ===== STEP 2: 入力フォーム ===== */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-500 text-sm font-bold">2</span>
                <h2 className="font-display text-xl font-semibold text-white">
                  {selectedPattern === "G" ? "返信する内容の入力" : selectedPattern === "H" ? "ニュースの選択" : "事実（ファクト）の入力"}
                </h2>
              </div>

              {selectedPattern === "G" ? (
                /* パターンG：コメント返信フォーム */
                <Card className="border-zinc-800 bg-zinc-900/80 card-elevated transition-smooth">
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-3">
                      <Label className="text-base text-zinc-200">返信するプラットフォームを選択</Label>
                      <div className="flex gap-3">
                        {[
                          { id: "sns", label: "📱 SNS（Instagram・X 等）" },
                          { id: "gbp", label: "🗺️ Google クチコミ（GBP）" },
                        ].map(({ id, label }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setReplyPlatform(id as "sns" | "gbp")}
                            className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${replyPlatform === id
                              ? "border-amber-500 bg-amber-500/10 text-amber-400"
                              : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-500"
                              }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="receivedComment" className="text-base text-zinc-200">
                        もらったコメント・クチコミ <span className="text-red-400 text-sm">*</span>
                      </Label>
                      <p className="text-xs text-zinc-500">返信したいコメントやクチコミの文章をそのまま貼り付けてください。</p>
                      <Textarea
                        id="receivedComment"
                        value={receivedComment}
                        onChange={(e) => setReceivedComment(e.target.value)}
                        placeholder={replyPlatform === "gbp"
                          ? "例: 初めて利用しました。スタッフの方がとても丁寧で、施術後は体がスッキリしました。また来たいと思います。"
                          : "例: 先日はありがとうございました！おかげで肩がすごく楽になりました😊 また予約します！"}
                        className="h-[120px] bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500 text-zinc-100 placeholder:text-zinc-600 resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="replyNote" className="text-base text-zinc-200">特記事項・返信に含めたい内容（任意）</Label>
                      <p className="text-xs text-zinc-500">返信に加えたい補足情報があれば記入してください。</p>
                      <Textarea
                        id="replyNote"
                        value={replyNote}
                        onChange={(e) => setReplyNote(e.target.value)}
                        placeholder="例: 来月キャンペーン実施予定なので触れてほしい / 次回予約への誘導を入れてほしい"
                        className="h-[90px] bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500 text-zinc-100 placeholder:text-zinc-600 resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : selectedPattern === "H" ? (
                /* パターンH：ニュース連動フォーム */
                <Card className="border-zinc-800 bg-zinc-900/80 card-elevated transition-smooth">
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Label className="text-base text-zinc-200 flex items-center gap-2">
                        <Newspaper className="w-4 h-4 text-amber-500" />
                        業種に関連するニュースを選んでください
                      </Label>
                      <p className="text-xs text-zinc-500">
                        Googleニュースから、あなたの業種（{shopInfo.industry || "未設定"}）に関連する最新トピックを取得します。
                      </p>
                      <Button
                        type="button"
                        onClick={handleFetchNews}
                        disabled={isLoadingNews || !shopInfo.industry}
                        className="mt-1 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold disabled:opacity-60"
                      >
                        {isLoadingNews ? <><Loader2 className="w-4 h-4 animate-spin" />ニュースを読み込み中...</> : <><Newspaper className="w-4 h-4" />ニュース候補を取得する</>}
                      </Button>
                      {!shopInfo.industry && <p className="text-xs text-red-400 mt-1">※ 先に初期設定で「業種」を入力してください。</p>}
                    </div>
                    {newsItems.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-zinc-800">
                        <p className="text-xs text-zinc-400">下の中から、投稿の題材にしたいニュースを1つ選んでください。</p>
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                          {newsItems.map((news, index) => (
                            <label
                              key={news.link || news.title + index}
                              className={`flex gap-3 p-3 rounded-lg border text-sm cursor-pointer transition-colors ${selectedNewsIndex === index ? "border-amber-500 bg-amber-500/5" : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
                                }`}
                            >
                              <input type="radio" className="mt-1 accent-amber-500" checked={selectedNewsIndex === index} onChange={() => setSelectedNewsIndex(index)} />
                              <div className="space-y-1 flex-1">
                                <p className="font-semibold text-zinc-100 text-sm">{news.title}</p>
                                {news.snippet && <p className="text-xs text-zinc-400 line-clamp-3">{news.snippet}</p>}
                                {news.link && <a href={news.link} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-400 hover:underline">記事を開く ↗</a>}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                /* 通常パターン（A〜F）フォーム */
                <Card className="border-zinc-800 bg-zinc-900/80 card-elevated transition-smooth">
                  <CardContent className="p-6 space-y-6">
                    {(["q1", "q2", "q3"] as const).map((qKey) => (
                      <div key={qKey} className="space-y-2">
                        <Label htmlFor={qKey} className="text-base text-zinc-200">{currentPattern.questions[qKey]}</Label>
                        <Textarea
                          id={qKey}
                          value={formData[qKey]}
                          onChange={(e) => setFormData(prev => ({ ...prev, [qKey]: e.target.value }))}
                          placeholder={currentPattern.questions[`ex${qKey.slice(1)}` as "ex1" | "ex2" | "ex3"]}
                          className="h-[80px] bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500 text-zinc-100 placeholder:text-zinc-600 resize-none"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </section>

            {/* 入力完了ヒント */}
            {(() => {
              const canGenerate =
                selectedPattern === "G" ? receivedComment.trim().length > 0
                : selectedPattern === "H" ? newsItems.length > 0 && selectedNewsIndex !== null
                : (formData.q1.trim() || formData.q2.trim() || formData.q3.trim());
              return canGenerate ? (
                <p className="text-center text-sm text-amber-500/90 flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4" />
                  入力完了 — 生成できます
                </p>
              ) : (
                <p className="text-center text-sm text-zinc-500">
                  {selectedPattern === "G" ? "コメントを入力すると生成できます" : selectedPattern === "H" ? "ニュースを取得して1つ選ぶと生成できます" : "3つの質問に答えると生成できます"}
                </p>
              );
            })()}

            {/* 出力先の説明（設定で変更可能であることを明示） */}
            <div className="flex flex-wrap items-center justify-center gap-2 py-2 text-sm text-zinc-500">
              <span>出力先:</span>
              {[
                activeShopInfo.outputTargets?.instagram !== false && "Instagram",
                activeShopInfo.outputTargets?.gbp !== false && "GBP",
                activeShopInfo.outputTargets?.portal !== false && "ポータル",
                activeShopInfo.outputTargets?.line !== false && "LINE",
                activeShopInfo.outputTargets?.short && "ショート動画",
              ].filter(Boolean).join("、")}
              <button
                type="button"
                onClick={() => setShowSettingsOverlay(true)}
                className="text-amber-500 hover:text-amber-400 underline underline-offset-2"
              >
                設定で変更
              </button>
            </div>

            {/* ===== 生成ボタン ===== */}
            <div className="flex flex-col items-center gap-3 pt-2">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="gradient-accent hover:opacity-95 text-zinc-950 font-semibold text-base h-12 px-10 min-w-[280px] rounded-full glow-amber transition-smooth active:scale-[0.98] group flex items-center justify-center gap-3 min-h-[48px]"
              >
                {isGenerating ? (
                  <><Loader2 className="h-5 w-5 animate-spin text-zinc-950" /><span>AIがテキストを生成中...</span></>
                ) : (
                  <><span>この内容で生成する</span><ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
              {generatedResults && (
                <button
                  type="button"
                  onClick={() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="flex items-center gap-2 text-sm text-amber-500 hover:text-amber-400 transition-colors"
                >
                  <ArrowDown className="w-4 h-4" />
                  結果へジャンプ
                </button>
              )}
            </div>

            {/* ===== STEP 3: 生成結果 ===== */}
            {generatedResults && (
              <section ref={resultsRef} className="space-y-4 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 scroll-mt-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-500 text-sm font-bold">3</span>
                  <h2 className="font-display text-xl font-semibold text-amber-400">生成完了</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setGeneratedResults(null); setEditingTab(null); }}
                    className="ml-auto text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10 h-9 min-h-[44px] px-3"
                  >
                    <RefreshCw className="w-4 h-4 mr-1.5" />
                    もう一度生成
                  </Button>
                </div>

                <Tabs defaultValue={
                  selectedPattern === "G" ? "reply" :
                    activeShopInfo.outputTargets?.instagram ? "instagram" :
                      activeShopInfo.outputTargets?.gbp ? "gbp" :
                        activeShopInfo.outputTargets?.portal ? "portal" :
                          activeShopInfo.outputTargets?.short ? "short" : "line"
                } className="w-full">
                  <TabsList className="flex w-full bg-zinc-900/80 border border-zinc-800 p-1.5 overflow-x-auto scrollbar-none rounded-xl transition-smooth gap-1">
                    {selectedPattern === "G" ? (
                      <TabsTrigger value="reply" className="flex-1 min-w-fit min-h-[44px] py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-500 whitespace-nowrap">
                        {replyPlatform === "gbp" ? "🗺️ GBP返信" : "📱 SNS返信"}
                      </TabsTrigger>
                    ) : (
                      <>
                        {activeShopInfo.outputTargets?.instagram !== false && <TabsTrigger value="instagram" className="flex-1 min-w-fit min-h-[44px] py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-500 whitespace-nowrap"><span className="hidden sm:inline">Instagram用</span><span className="sm:hidden">📸 IG</span></TabsTrigger>}
                        {activeShopInfo.outputTargets?.gbp !== false && <TabsTrigger value="gbp" className="flex-1 min-w-fit min-h-[44px] py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-500 whitespace-nowrap"><span className="hidden sm:inline">Googleの最新情報用</span><span className="sm:hidden">🗺️ GBP</span></TabsTrigger>}
                        {activeShopInfo.outputTargets?.portal !== false && <TabsTrigger value="portal" className="flex-1 min-w-fit min-h-[44px] py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-500 whitespace-nowrap"><span className="hidden sm:inline">ポータルサイト用</span><span className="sm:hidden">📝 ブログ</span></TabsTrigger>}
                        {activeShopInfo.outputTargets?.line !== false && <TabsTrigger value="line" className="flex-1 min-w-fit min-h-[44px] py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-500 whitespace-nowrap"><span className="hidden sm:inline">💬 LINE用</span><span className="sm:hidden">💬 LINE</span></TabsTrigger>}
                        {activeShopInfo.outputTargets?.short && <TabsTrigger value="short" className="flex-1 min-w-fit min-h-[44px] py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-500 whitespace-nowrap"><span className="hidden sm:inline">🎬 ショート台本</span><span className="sm:hidden">🎬 ショート</span></TabsTrigger>}
                      </>
                    )}
                  </TabsList>

                  {selectedPattern === "G" ? (
                    /* パターンG 返信テキスト */
                    generatedResults.reply && (
                      <TabsContent value="reply">
                        <Card className="border-zinc-800 bg-zinc-900/80 card-elevated relative overflow-hidden transition-smooth">
                          <div className="absolute top-4 right-4 z-10">
                            <Button variant="secondary" size="sm" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 h-9" onClick={() => handleCopy(generatedResults.reply as string, "reply")}>
                              {copiedTab === "reply" ? <><Check className="w-4 h-4 mr-2 text-green-500" /> コピー完了</> : <><Copy className="w-4 h-4 mr-2" /> コピー</>}
                            </Button>
                          </div>
                          <CardContent className="p-6 pt-16">
                            <div className="mb-4 p-3 bg-zinc-950 rounded-lg border border-zinc-700">
                              <p className="text-xs text-zinc-500 mb-1 font-semibold">📨 受信したコメント</p>
                              <p className="text-sm text-zinc-400 whitespace-pre-wrap">{receivedComment}</p>
                            </div>
                            <p className="text-xs text-amber-500 font-semibold mb-2">✍️ 生成された返信文</p>
                            <div className="whitespace-pre-wrap text-zinc-300 font-medium leading-relaxed">{generatedResults.reply}</div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )
                  ) : (
                    /* 通常パターン タブ群 */
                    [
                      { id: "instagram", data: generatedResults.instagram, active: activeShopInfo.outputTargets?.instagram !== false },
                      { id: "gbp", data: generatedResults.gbp, active: activeShopInfo.outputTargets?.gbp !== false },
                      { id: "portal", data: generatedResults.portal, active: activeShopInfo.outputTargets?.portal !== false },
                      { id: "line", data: generatedResults.line, active: activeShopInfo.outputTargets?.line !== false },
                      { id: "short", data: generatedResults.shortScript, active: !!activeShopInfo.outputTargets?.short },
                    ].filter(t => t.active && t.data).map((tab) => (
                      <TabsContent key={tab.id} value={tab.id}>
                        <Card className="border-zinc-800 bg-zinc-900/80 card-elevated relative overflow-hidden group transition-smooth">
                          <div className="absolute top-4 right-4 z-10 flex gap-2">
                            {/* ポータル向けWordPress投稿ボタン */}
                            {tab.id === "portal" && generatedResults.portalTitle && (
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700 h-9" onClick={() => handlePostToWP("draft")} disabled={isPostingToWP}>
                                  {isPostingToWP ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 送信中</> : <>📝 下書き保存</>}
                                </Button>
                                <Button variant="default" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 shadow-[0_0_15px_rgba(79,70,229,0.5)]" onClick={() => handlePostToWP("publish")} disabled={isPostingToWP}>
                                  {isPostingToWP ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 送信中</> : <><Send className="w-4 h-4 mr-2" /> すぐに公開</>}
                                </Button>
                              </div>
                            )}
                            {tab.id !== "short" && (
                              <>
                                <Button
                                  variant="secondary" size="sm"
                                  className={`h-9 border ${editingTab === tab.id ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/40" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700"}`}
                                  onClick={() => setEditingTab(editingTab === tab.id ? null : tab.id)}
                                >
                                  {editingTab === tab.id ? <><Check className="w-4 h-4 mr-2 text-amber-400" /> 編集完了</> : <><Pencil className="w-4 h-4 mr-2" /> 編集</>}
                                </Button>
                                <Button variant="secondary" size="sm" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 h-9" onClick={() => handleCopy(tab.data as string, tab.id)}>
                                  {copiedTab === tab.id ? <><Check className="w-4 h-4 mr-2 text-green-500" /> コピー完了</> : <><Copy className="w-4 h-4 mr-2" /> コピー</>}
                                </Button>
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
                                ? `【フック】\n${parsed.hook}\n\n【本編】\n${(parsed.scenes || []).map(s => `[${s.sec}秒] ${s.text}${s.note ? ` （${s.note}）` : ""}`).join("\n")}\n\n【CTA】\n${parsed.cta}`
                                : raw || "";
                              return (
                                <Button variant="secondary" size="sm" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 h-9" onClick={() => handleCopy(copyText, "short")}>
                                  {copiedTab === "short" ? <><Check className="w-4 h-4 mr-2 text-green-500" /> コピー完了</> : <><Copy className="w-4 h-4 mr-2" /> コピー</>}
                                </Button>
                              );
                            })()}
                          </div>
                          <CardContent className="p-6 pt-16">
                            {tab.id === "portal" && generatedResults.portalTitle && (
                              <div className="mb-6 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                                <p className="text-zinc-400 text-xs mb-1 font-semibold uppercase tracking-wider">生成されたタイトル</p>
                                <h3 className="text-lg font-bold text-white mb-2">{generatedResults.portalTitle}</h3>
                                <p className="text-zinc-500 text-xs">※上記のタイトルと下の本文がWordPressに送信されます。</p>
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
                              return (
                                <div className="space-y-6 text-zinc-300">
                                  <div>
                                    <p className="text-xs font-semibold text-amber-500 mb-1">🎬 フック（冒頭3〜5秒）</p>
                                    <p className="font-medium">{parsed.hook}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-amber-500 mb-2">📝 本編</p>
                                    <ul className="space-y-2">
                                      {(parsed.scenes || []).map((s, i) => (
                                        <li key={i} className="flex gap-3 items-start">
                                          <span className="shrink-0 text-zinc-500 text-xs w-10">[{s.sec}秒]</span>
                                          <div>
                                            <p className="font-medium">{s.text}</p>
                                            {s.note && <p className="text-xs text-zinc-500 mt-0.5">{s.note}</p>}
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-amber-500 mb-1">👉 CTA（最後の誘導）</p>
                                    <p className="font-medium">{parsed.cta}</p>
                                  </div>
                                </div>
                              );
                            })() : editingTab === tab.id ? (
                              <textarea
                                className="w-full min-h-[240px] bg-zinc-950 border border-amber-500/30 rounded-lg p-4 text-zinc-300 text-sm font-medium leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
                                value={tab.data as string}
                                onChange={(e) => setGeneratedResults(prev => prev ? { ...prev, [tab.id]: e.target.value } : prev)}
                                spellCheck={false}
                              />
                            ) : (
                              <div className="whitespace-pre-wrap text-zinc-300 font-medium leading-relaxed">
                                {typeof tab.data === "string" ? tab.data : (tab.data != null ? JSON.stringify(tab.data) : "")}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        {/* 改善して再生成 */}
                        <div className="mt-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
                          <p className="text-sm font-medium text-zinc-300 mb-3">改善して再生成</p>
                          <p className="text-xs text-zinc-500 mb-3">指示を1つ選んでからボタンを押すと、このタブの文章だけを改善して再生成します。</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
                            {REFINE_OPTIONS.map((opt) => (
                              <label key={opt.id} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name={`refine-${tab.id}`}
                                  checked={(refineInstruction[tab.id] ?? null) === opt.id}
                                  onChange={() => setRefineInstruction(tab.id, opt.id)}
                                  className="w-3.5 h-3.5 accent-amber-500"
                                />
                                {opt.label}
                              </label>
                            ))}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/40"
                            disabled={isRefining}
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
          </div>
        )}
      </main>
    </div>
  );
}
