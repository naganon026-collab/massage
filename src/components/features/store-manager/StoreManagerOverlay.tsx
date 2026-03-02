import React from "react";
import { Store, X, Loader2, Globe, Sparkles, Pencil, Trash2, ChevronLeft, Check, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StoreRecord, SHORT_HOOK_OPTIONS } from "@/types";

interface StoreManagerOverlayProps {
    showStoreManager: boolean;
    setShowStoreManager: (show: boolean) => void;
    showStoreForm: boolean;
    setShowStoreForm: (show: boolean) => void;
    stores: StoreRecord[];
    storeFormData: StoreRecord["settings"];
    setStoreFormData: React.Dispatch<React.SetStateAction<StoreRecord["settings"]>>;
    editingStoreId: string | null;
    setEditingStoreId: (id: string | null) => void;
    isSavingStore: boolean;
    isDeletingStore: string | null;
    handleSaveStore: () => void;
    handleDeleteStore: (id: string) => void;
    openEditStore: (store: StoreRecord) => void;
    storeScrapeUrl: string;
    setStoreScrapeUrl: (url: string) => void;
    handleScrapeUrlForStore: () => void;
    isScrapingStore: boolean;
}

export function StoreManagerOverlay({
    showStoreManager,
    setShowStoreManager,
    showStoreForm,
    setShowStoreForm,
    stores,
    storeFormData,
    setStoreFormData,
    editingStoreId,
    setEditingStoreId,
    isSavingStore,
    isDeletingStore,
    handleSaveStore,
    handleDeleteStore,
    openEditStore,
    storeScrapeUrl,
    setStoreScrapeUrl,
    handleScrapeUrlForStore,
    isScrapingStore,
}: StoreManagerOverlayProps) {
    if (!showStoreManager) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm px-4 pt-16 md:pt-20"
            onClick={(e) => { if (e.target === e.currentTarget) { setShowStoreManager(false); setShowStoreForm(false); } }}
        >
            <div className="w-full max-w-3xl rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl card-elevated max-h-[85vh] overflow-hidden flex flex-col">
                {/* ヘッダー */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <Store className="w-5 h-5 text-amber-500" />
                        <h2 className="font-display text-base font-bold text-white">
                            {showStoreForm ? (editingStoreId ? "店舗情報を編集" : "新しい店舗を登録") : "店舗管理"}
                        </h2>
                        {!showStoreForm && (
                            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{stores.length}件</span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => { setShowStoreManager(false); setShowStoreForm(false); setEditingStoreId(null); setStoreScrapeUrl(""); }}
                        className="text-zinc-500 hover:text-zinc-200 text-sm"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1">
                    {showStoreForm ? (
                        /* ===== 店舗登録/編集フォーム ===== */
                        <div className="px-6 py-5 space-y-5">
                            {/* URLから自動取得（管理者用） */}
                            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                                <Label className="text-sm font-medium text-amber-500">🔗 URLから店舗情報を自動取得</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="url"
                                        value={storeScrapeUrl}
                                        onChange={(e) => setStoreScrapeUrl(e.target.value)}
                                        placeholder="店舗のWEBサイトURLを入力（例：https://example.com）"
                                        className="flex-1 bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleScrapeUrlForStore())}
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleScrapeUrlForStore}
                                        disabled={isScrapingStore || !storeScrapeUrl.trim().startsWith("http")}
                                        className="shrink-0 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/40"
                                    >
                                        {isScrapingStore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                                        {isScrapingStore ? "取得中…" : "URLから取得"}
                                    </Button>
                                </div>
                                <p className="text-xs text-zinc-500">店舗のWEBサイトURLを入力して「URLから取得」をクリックすると、業種・店舗名・住所などを自動入力し、下のテキストを投稿生成時の参照情報として保存します。</p>
                                {/* 抽出テキスト（投稿生成時の参照情報） */}
                                <div className="space-y-2 pt-2 border-t border-zinc-800">
                                    <Label className="text-sm font-medium text-zinc-300">📄 サイトから抽出したテキスト（投稿生成時の参照情報）</Label>
                                    <p className="text-xs text-zinc-500">このテキストはAIが投稿を生成する際の参考情報として使用されます。内容を確認・編集できます。</p>
                                    <Textarea
                                        value={storeFormData.scrapedContent || ""}
                                        onChange={(e) => setStoreFormData({ ...storeFormData, scrapedContent: e.target.value })}
                                        placeholder="URLから取得するか、手動で貼り付けてください。投稿生成時にAIが参照します。"
                                        className="min-h-[140px] max-h-[160px] w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-y overflow-y-auto"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sf-industry" className="text-sm font-medium text-zinc-300">業種 <span className="text-red-400">*</span></Label>
                                    <Input id="sf-industry" value={storeFormData.industry || ""} onChange={(e) => setStoreFormData({ ...storeFormData, industry: e.target.value })} placeholder="例：美容室、整体院" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sf-name" className="text-sm font-medium text-zinc-300">店舗名 <span className="text-red-400">*</span></Label>
                                    <Input id="sf-name" value={storeFormData.name || ""} onChange={(e) => setStoreFormData({ ...storeFormData, name: e.target.value })} placeholder="例：The Gentry" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="sf-address" className="text-sm font-medium text-zinc-300">住所 <span className="text-red-400">*</span></Label>
                                    <Input id="sf-address" value={storeFormData.address || ""} onChange={(e) => setStoreFormData({ ...storeFormData, address: e.target.value })} placeholder="例：長野県長野市〇〇1-2-3" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sf-phone" className="text-sm font-medium text-zinc-300">電話番号 <span className="text-red-400">*</span></Label>
                                    <Input id="sf-phone" type="tel" value={storeFormData.phone || ""} onChange={(e) => setStoreFormData({ ...storeFormData, phone: e.target.value })} placeholder="例：026-000-0000" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sf-lineUrl" className="text-sm font-medium text-zinc-300">LINE/予約URL</Label>
                                    <Input id="sf-lineUrl" type="url" value={storeFormData.lineUrl || ""} onChange={(e) => setStoreFormData({ ...storeFormData, lineUrl: e.target.value })} placeholder="例：https://lin.ee/xxxxx" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sf-businessHours" className="text-sm font-medium text-zinc-300">営業時間 <span className="text-red-400">*</span></Label>
                                    <Input id="sf-businessHours" value={storeFormData.businessHours || ""} onChange={(e) => setStoreFormData({ ...storeFormData, businessHours: e.target.value })} placeholder="例：10:00〜20:00" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sf-holidays" className="text-sm font-medium text-zinc-300">定休日 <span className="text-red-400">*</span></Label>
                                    <Input id="sf-holidays" value={storeFormData.holidays || ""} onChange={(e) => setStoreFormData({ ...storeFormData, holidays: e.target.value })} placeholder="例：毎週火曜・年末年始" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                                </div>
                            </div>

                            <details className="group bg-zinc-800/20 rounded-xl border border-zinc-800/50 overflow-hidden">
                                <summary className="px-4 py-3 cursor-pointer list-none flex items-center justify-between text-sm text-zinc-300 hover:bg-zinc-800/30">
                                    <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> あなたらしさ（文調の学習）・特記事項</span>
                                    <span className="text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="px-4 pb-4 space-y-4 border-t border-zinc-800 pt-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="sf-sampleTexts" className="text-sm">今まで書いた文章のサンプル（2〜3投稿分コピペ）</Label>
                                        <Textarea id="sf-sampleTexts" value={storeFormData.sampleTexts || ""} onChange={(e) => setStoreFormData({ ...storeFormData, sampleTexts: e.target.value })} placeholder="例：これまでSNSに投稿していた文章を2〜3件コピペすると、文体を学習します。" className="min-h-[80px] bg-zinc-900 border-zinc-700 text-zinc-100 resize-y" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sf-snsUrl" className="text-sm">SNSのURL（任意）</Label>
                                        <Input id="sf-snsUrl" type="url" value={storeFormData.snsUrl || ""} onChange={(e) => setStoreFormData({ ...storeFormData, snsUrl: e.target.value })} placeholder="例：https://instagram.com/〇〇" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sf-features" className="text-sm">その他特記事項（任意）</Label>
                                        <Textarea id="sf-features" value={storeFormData.features || ""} onChange={(e) => setStoreFormData({ ...storeFormData, features: e.target.value })} placeholder="例：VIPルームあり、無料駐車場" className="min-h-[60px] bg-zinc-900 border-zinc-700 text-zinc-100 resize-y" />
                                    </div>
                                </div>
                            </details>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* WordPress設定 */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-sm font-medium text-zinc-300">WordPress 投稿設定（任意）</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <Input placeholder="カテゴリID" value={storeFormData.wpCategoryId || ""} onChange={(e) => setStoreFormData({ ...storeFormData, wpCategoryId: e.target.value })} className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                                        <Input placeholder="タグID" value={storeFormData.wpTagId || ""} onChange={(e) => setStoreFormData({ ...storeFormData, wpTagId: e.target.value })} className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                                        <Input placeholder="著者ID" value={storeFormData.wpAuthorId || ""} onChange={(e) => setStoreFormData({ ...storeFormData, wpAuthorId: e.target.value })} className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                                    </div>
                                </div>
                                {/* 出力媒体 */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-sm font-medium text-zinc-300">出力する媒体</Label>
                                    <div className="flex flex-wrap gap-4">
                                        {[
                                            { key: "instagram", label: "Instagram用" },
                                            { key: "gbp", label: "GBP用" },
                                            { key: "portal", label: "ポータル用" },
                                            { key: "line", label: "LINE用" },
                                            { key: "short", label: "ショート動画の台本" },
                                        ].map(({ key, label }) => (
                                            <label key={key} className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={storeFormData.outputTargets?.[key as keyof typeof storeFormData.outputTargets] ?? true}
                                                    onChange={(e) => setStoreFormData({ ...storeFormData, outputTargets: { ...storeFormData.outputTargets!, [key]: e.target.checked } })}
                                                    className="w-4 h-4 rounded accent-amber-500"
                                                />
                                                {label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                {(storeFormData.outputTargets?.short) && (
                                    <div className="space-y-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
                                        <Label className="text-sm font-medium text-amber-400">ショート動画の設定</Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-zinc-400">フックのタイプ</Label>
                                                <select
                                                    value={storeFormData.shortHookType ?? SHORT_HOOK_OPTIONS[0].id}
                                                    onChange={(e) => setStoreFormData({ ...storeFormData, shortHookType: e.target.value })}
                                                    className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                                                >
                                                    {SHORT_HOOK_OPTIONS.map((opt) => (
                                                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-zinc-400">想定尺（秒）</Label>
                                        <select
                                            value={storeFormData.shortTargetDuration ?? 60}
                                            onChange={(e) => setStoreFormData({ ...storeFormData, shortTargetDuration: Number(e.target.value) })}
                                            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                                        >
                                            <option value={10}>10秒</option>
                                            <option value={20}>20秒</option>
                                            <option value={30}>30秒</option>
                                            <option value={45}>45秒</option>
                                            <option value={60}>60秒</option>
                                            <option value={90}>90秒</option>
                                        </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-zinc-400">主な投稿先</Label>
                                                <select
                                                    value={storeFormData.shortPlatform ?? ""}
                                                    onChange={(e) => setStoreFormData({ ...storeFormData, shortPlatform: e.target.value })}
                                                    className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                                                >
                                                    <option value="">指定なし</option>
                                                    <option value="Instagram Reels">Instagram Reels</option>
                                                    <option value="TikTok">TikTok</option>
                                                    <option value="YouTube Shorts">YouTube Shorts</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-zinc-400">ショート用サンプル台本</Label>
                                            <Textarea
                                                value={storeFormData.shortSampleScript ?? ""}
                                                onChange={(e) => setStoreFormData({ ...storeFormData, shortSampleScript: e.target.value })}
                                                placeholder="話し言葉のサンプルを貼り付けるとトーンが揃います"
                                                className="min-h-[80px] bg-zinc-950 border-zinc-800 text-zinc-100 resize-y"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-zinc-400">ショート用メモ</Label>
                                            <Input
                                                value={storeFormData.shortMemo ?? ""}
                                                onChange={(e) => setStoreFormData({ ...storeFormData, shortMemo: e.target.value })}
                                                placeholder="例：CTAはLINE誘導のみ"
                                                className="bg-zinc-950 border-zinc-800 text-zinc-100"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* ===== 店舗一覧 ===== */
                        <div className="px-6 py-5 space-y-3">
                            {stores.length === 0 ? (
                                <div className="text-center py-12 text-zinc-500">
                                    <Store className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">まだ店舗が登録されていません</p>
                                    <p className="text-xs mt-1">下の「＋ 新しい店舗を登録」ボタンから追加してください</p>
                                </div>
                            ) : (
                                stores.map((store) => (
                                    <div key={store.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 hover:border-zinc-700 transition-colors">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-zinc-100 truncate">{store.name}</p>
                                            <p className="text-xs text-zinc-500 truncate">
                                                {store.settings.industry && <span className="text-amber-500/80 mr-2">{store.settings.industry}</span>}
                                                {store.settings.address}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-3">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditStore(store)}
                                                className="h-8 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800"
                                            >
                                                <Pencil className="w-3.5 h-3.5 mr-1" />
                                                編集
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteStore(store.id)}
                                                disabled={isDeletingStore === store.id}
                                                className="h-8 text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                                            >
                                                {isDeletingStore === store.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* フッター */}
                <div className="px-6 py-4 border-t border-zinc-800 flex justify-between gap-3 bg-zinc-950/80">
                    {showStoreForm ? (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                                onClick={() => { setShowStoreForm(false); setEditingStoreId(null); }}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                一覧へ戻る
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
                                onClick={handleSaveStore}
                                disabled={isSavingStore}
                            >
                                {isSavingStore ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />保存中...</> : <><Check className="w-4 h-4 mr-2" />{editingStoreId ? "更新する" : "登録する"}</>}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                                onClick={() => { setShowStoreManager(false); }}
                            >
                                閉じる
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
                                onClick={() => { setEditingStoreId(null); setStoreScrapeUrl(""); setStoreFormData({ name: "", address: "", phone: "", lineUrl: "", businessHours: "", holidays: "", features: "", industry: "", snsUrl: "", sampleTexts: "", referenceUrls: [], wpCategoryId: "", wpTagId: "", wpAuthorId: "", outputTargets: { instagram: true, gbp: true, portal: true, line: true, short: false } }); setShowStoreForm(true); }}
                            >
                                <PlusCircle className="w-4 h-4 mr-2" />
                                新しい店舗を登録
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
