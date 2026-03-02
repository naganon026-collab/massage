import React from "react";
import { Settings, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShopInfo, ADMIN_EMAIL, SHORT_HOOK_OPTIONS } from "@/types";
import { User } from "@supabase/supabase-js";

interface SettingsOverlayProps {
    showSettingsOverlay: boolean;
    setShowSettingsOverlay: (show: boolean) => void;
    shopInfo: ShopInfo;
    setShopInfo: React.Dispatch<React.SetStateAction<ShopInfo>>;
    settingsScrapeUrl: string;
    setSettingsScrapeUrl: (url: string) => void;
    isScrapingSettings: boolean;
    handleScrapeUrlForSettings: () => void;
    handleQuickSaveSettings: (onSuccess?: () => void) => void;
    user: User | null;
}

const sectionTitle = "text-base font-semibold text-white mt-8 first:mt-0 mb-3";
const fieldLabel = "text-sm font-medium text-zinc-200 mb-1.5 block";
const fieldHint = "text-xs text-zinc-500 mt-1";
const inputBase = "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/40 transition-colors";

export function SettingsOverlay({
    showSettingsOverlay,
    setShowSettingsOverlay,
    shopInfo,
    setShopInfo,
    settingsScrapeUrl,
    setSettingsScrapeUrl,
    isScrapingSettings,
    handleScrapeUrlForSettings,
    handleQuickSaveSettings,
    user,
}: SettingsOverlayProps) {
    const ot = shopInfo.outputTargets;
    const outputTargetsWith = (key: keyof NonNullable<ShopInfo["outputTargets"]>, value: boolean) => ({
        instagram: ot?.instagram ?? true,
        gbp: ot?.gbp ?? true,
        portal: ot?.portal ?? true,
        line: ot?.line ?? true,
        short: ot?.short ?? false,
        [key]: value,
    });
    if (!showSettingsOverlay) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm px-4 pt-20 pb-8"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    setShowSettingsOverlay(false);
                    setSettingsScrapeUrl("");
                }
            }}
        >
            <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl card-elevated max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-amber-500" />
                        <h2 className="font-display text-lg font-semibold text-white">店舗設定の編集</h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => { setShowSettingsOverlay(false); setSettingsScrapeUrl(""); }}
                        className="text-zinc-500 hover:text-zinc-200 text-sm p-1"
                    >
                        閉じる ✕
                    </button>
                </div>
                <div className="px-6 py-5 space-y-1 overflow-y-auto flex-1">
                    <p className="text-sm text-zinc-400 mb-6">
                        初期設定で登録した内容を編集できます。変更後は「設定を保存する」でクラウドに反映されます。
                    </p>

                    {/* 保存済みデータ */}
                    {(shopInfo.referenceUrls?.length > 0 || shopInfo.scrapedContent) && (
                        <details className="group bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden mb-6">
                            <summary className="flex items-center justify-between px-4 py-3.5 cursor-pointer list-none select-none hover:bg-zinc-800/50 transition-colors">
                                <div className="flex items-center gap-2.5 text-sm font-medium text-zinc-200">
                                    <span className="text-amber-500">💾</span>
                                    保存済みデータ
                                    {shopInfo.referenceUrls?.length > 0 && (
                                        <span className="bg-amber-500/20 text-amber-400 text-xs px-2.5 py-0.5 rounded-full">URL {shopInfo.referenceUrls.length}件</span>
                                    )}
                                    {shopInfo.scrapedContent && (
                                        <span className="bg-zinc-700 text-zinc-300 text-xs px-2.5 py-0.5 rounded-full">抽出テキストあり</span>
                                    )}
                                </div>
                                <span className="text-zinc-500 text-xs group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-4 pb-4 space-y-4 border-t border-zinc-800 pt-3">
                                {shopInfo.referenceUrls?.length > 0 && (
                                    <div>
                                        <p className="text-xs text-zinc-400 font-medium mb-2">📋 参照URL（取得済み）</p>
                                        <div className="flex flex-col gap-1.5">
                                            {shopInfo.referenceUrls.map((url: string, i: number) => (
                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-amber-400 hover:underline truncate max-w-full">
                                                    {url}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {shopInfo.scrapedContent && (
                                    <div>
                                        <p className="text-xs text-zinc-400 font-medium mb-2">📄 抽出テキスト（AI参照中）</p>
                                        <p className="text-xs text-zinc-500">下の「お店のURLを入力」のテキストエリアで編集できます。</p>
                                    </div>
                                )}
                            </div>
                        </details>
                    )}

                    {/* URLから取得 */}
                    <h3 className={sectionTitle}>お店のURLを入力</h3>
                    <p className={fieldHint}>店舗のWEBサイトURLを入力すると、業種・店舗名・住所などを自動で取得し、投稿生成時の参照情報として保存します。</p>
                    <div className="flex gap-2 mt-3">
                        <Input
                            type="url"
                            value={settingsScrapeUrl}
                            onChange={(e) => setSettingsScrapeUrl(e.target.value)}
                            placeholder="https://example.com"
                            className={`flex-1 ${inputBase}`}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleScrapeUrlForSettings())}
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleScrapeUrlForSettings}
                            disabled={isScrapingSettings || !settingsScrapeUrl.trim().startsWith("http")}
                            className="shrink-0 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/40 h-[46px] px-5"
                        >
                            {isScrapingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                            {isScrapingSettings ? "取得中…" : "URLから取得"}
                        </Button>
                    </div>
                    <details className="mt-3 group/details rounded-lg border border-zinc-800 overflow-hidden bg-zinc-900/30">
                        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none select-none hover:bg-zinc-800/50 transition-colors text-sm text-zinc-300">
                            <span>URLから取得した情報・直接貼り付け</span>
                            <span className="text-zinc-500 text-xs transition-transform group-open/details:rotate-180">▼</span>
                        </summary>
                        <div className="px-4 pb-4 pt-0">
                            <p className="text-xs text-zinc-500 mb-2">サイトから取得したテキスト、または「当店について」「アクセス」などのテキストを貼り付けてください。投稿生成時にAIが参照します。</p>
                            <Textarea
                                value={shopInfo.scrapedContent || ""}
                                onChange={(e) => setShopInfo({ ...shopInfo, scrapedContent: e.target.value })}
                                placeholder="「当店について」「アクセス」「営業時間」などのテキストをここに貼り付けてください。"
                                className={`h-[150px] mt-2 ${inputBase} resize-none overflow-y-auto`}
                            />
                        </div>
                    </details>

                    {/* 基本情報 */}
                    <h3 className={sectionTitle}>基本情報</h3>
                    <div className="space-y-5">
                        <div>
                            <Label htmlFor="quickIndustry" className={fieldLabel}>業種 <span className="text-red-400">*</span></Label>
                            <Input
                                id="quickIndustry"
                                value={shopInfo.industry || ""}
                                onChange={(e) => setShopInfo({ ...shopInfo, industry: e.target.value })}
                                placeholder="例：整体院、美容室、カフェ"
                                className={inputBase}
                            />
                        </div>
                        <div>
                            <Label htmlFor="quickName" className={fieldLabel}>店舗名 <span className="text-red-400">*</span></Label>
                            <Input
                                id="quickName"
                                value={shopInfo.name}
                                onChange={(e) => setShopInfo({ ...shopInfo, name: e.target.value })}
                                placeholder="例：The Gentry"
                                className={inputBase}
                            />
                        </div>
                        <div>
                            <Label htmlFor="quickAddress" className={fieldLabel}>住所 <span className="text-red-400">*</span></Label>
                            <Input
                                id="quickAddress"
                                value={shopInfo.address}
                                onChange={(e) => setShopInfo({ ...shopInfo, address: e.target.value })}
                                placeholder="例：長野県長野市〇〇1-2-3"
                                className={inputBase}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <Label htmlFor="quickPhone" className={fieldLabel}>電話番号</Label>
                                <Input
                                    id="quickPhone"
                                    type="tel"
                                    value={shopInfo.phone}
                                    onChange={(e) => setShopInfo({ ...shopInfo, phone: e.target.value })}
                                    placeholder="例：026-000-0000"
                                    className={inputBase}
                                />
                            </div>
                            <div>
                                <Label htmlFor="quickLine" className={fieldLabel}>LINE/予約URL</Label>
                                <Input
                                    id="quickLine"
                                    type="url"
                                    value={shopInfo.lineUrl}
                                    onChange={(e) => setShopInfo({ ...shopInfo, lineUrl: e.target.value })}
                                    placeholder="https://lin.ee/xxxxx"
                                    className={inputBase}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <Label htmlFor="quickBusinessHours" className={fieldLabel}>営業時間</Label>
                                <Input
                                    id="quickBusinessHours"
                                    value={shopInfo.businessHours}
                                    onChange={(e) => setShopInfo({ ...shopInfo, businessHours: e.target.value })}
                                    placeholder="例：10:00〜20:00"
                                    className={inputBase}
                                />
                            </div>
                            <div>
                                <Label htmlFor="quickHolidays" className={fieldLabel}>定休日</Label>
                                <Input
                                    id="quickHolidays"
                                    value={shopInfo.holidays}
                                    onChange={(e) => setShopInfo({ ...shopInfo, holidays: e.target.value })}
                                    placeholder="例：毎週火曜・年末年始"
                                    className={inputBase}
                                />
                            </div>
                        </div>
                    </div>

                    {/* あなたらしさ・特記事項 */}
                    <h3 className={sectionTitle}>あなたらしさ（文調の学習）・特記事項</h3>
                    <div>
                        <Label htmlFor="quickSampleTexts" className={fieldLabel}>文章サンプル</Label>
                        <p className={fieldHint}>今までの投稿文を2〜3件コピペすると、文体を学習します。</p>
                        <Textarea
                            id="quickSampleTexts"
                            value={shopInfo.sampleTexts || ""}
                            onChange={(e) => setShopInfo({ ...shopInfo, sampleTexts: e.target.value })}
                            placeholder="これまでSNSに投稿していた文章を2〜3件貼り付けてください。"
                            className={`min-h-[100px] mt-2 ${inputBase} resize-y`}
                        />
                    </div>
                    <div>
                        <Label htmlFor="quickSnsUrl" className={fieldLabel}>SNS URL（任意）</Label>
                        <Input
                            id="quickSnsUrl"
                            type="url"
                            value={shopInfo.snsUrl || ""}
                            onChange={(e) => setShopInfo({ ...shopInfo, snsUrl: e.target.value })}
                            placeholder="例：https://instagram.com/〇〇"
                            className={`mt-2 ${inputBase}`}
                        />
                    </div>
                    <div>
                        <Label htmlFor="quickFeatures" className={fieldLabel}>その他特記事項（任意）</Label>
                        <Textarea
                            id="quickFeatures"
                            value={shopInfo.features}
                            onChange={(e) => setShopInfo({ ...shopInfo, features: e.target.value })}
                            placeholder="例：完全個室／無料駐車場あり／メンズ専用　など"
                            className={`min-h-[80px] mt-2 ${inputBase} resize-y`}
                        />
                    </div>

                    {user?.email === ADMIN_EMAIL && (
                        <>
                            <h3 className={sectionTitle}>WordPress 投稿設定（任意）</h3>
                            <p className={fieldHint}>記事をWordPressに送る場合のカテゴリ・タグ・著者ID</p>
                            <div className="grid grid-cols-3 gap-4 mt-3">
                                <div>
                                    <label className="text-xs text-zinc-500 mb-1 block">カテゴリID</label>
                                    <Input
                                        value={shopInfo.wpCategoryId || ""}
                                        onChange={(e) => setShopInfo({ ...shopInfo, wpCategoryId: e.target.value })}
                                        placeholder="1"
                                        className={inputBase}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 mb-1 block">タグID</label>
                                    <Input
                                        value={shopInfo.wpTagId || ""}
                                        onChange={(e) => setShopInfo({ ...shopInfo, wpTagId: e.target.value })}
                                        placeholder="5"
                                        className={inputBase}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 mb-1 block">著者ID</label>
                                    <Input
                                        value={shopInfo.wpAuthorId || ""}
                                        onChange={(e) => setShopInfo({ ...shopInfo, wpAuthorId: e.target.value })}
                                        placeholder="1"
                                        className={inputBase}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* 出力する媒体 */}
                    <h3 className={sectionTitle}>出力する媒体</h3>
                    <p className={fieldHint}>チェックした媒体用のテキストが生成されます。</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-3 mt-3">
                        {[
                            { key: "instagram" as const, label: "Instagram用" },
                            { key: "gbp" as const, label: "Google Map/GBP用" },
                            { key: "portal" as const, label: "ブログ/ポータル用" },
                            { key: "line" as const, label: "LINE用" },
                            { key: "short" as const, label: "ショート動画の台本" },
                        ].map(({ key, label }) => (
                            <label key={key} className="flex items-center gap-2.5 text-sm text-zinc-200 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={shopInfo.outputTargets?.[key] ?? (key !== "short")}
                                    onChange={(e) =>
                                        setShopInfo({
                                            ...shopInfo,
                                            outputTargets: outputTargetsWith(key, e.target.checked),
                                        })
                                    }
                                    className="w-4 h-4 rounded accent-amber-500"
                                />
                                {label}
                            </label>
                        ))}
                    </div>

                    {/* ショート動画の設定 */}
                    {(shopInfo.outputTargets?.short) && (
                        <>
                            <h3 className={sectionTitle}>ショート動画の設定</h3>
                            <div className="space-y-5 p-5 rounded-xl border border-amber-500/30 bg-amber-500/5">
                                <div>
                                    <label htmlFor="short-hook-type" className={`${fieldLabel} text-amber-400/90`}>
                                        フックのタイプ（冒頭で視聴者を止めるパターン）
                                    </label>
                                    <select
                                        id="short-hook-type"
                                        value={shopInfo.shortHookType ?? SHORT_HOOK_OPTIONS[0].id}
                                        onChange={(e) => setShopInfo({ ...shopInfo, shortHookType: e.target.value })}
                                        className={`mt-2 ${inputBase} border-amber-500/40`}
                                        aria-label="バズりやすいフックの選択肢"
                                    >
                                        {SHORT_HOOK_OPTIONS.map((opt) => (
                                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <p className={fieldHint}>問いかけ型・共感型・ベネフィット型など、バズりやすい冒頭パターンから選択</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <Label className={fieldLabel}>想定尺（秒）</Label>
                                        <select
                                            value={shopInfo.shortTargetDuration ?? 60}
                                            onChange={(e) => setShopInfo({ ...shopInfo, shortTargetDuration: Number(e.target.value) })}
                                            className={`mt-2 ${inputBase}`}
                                        >
                                            <option value={10}>10秒</option>
                                            <option value={20}>20秒</option>
                                            <option value={30}>30秒</option>
                                            <option value={45}>45秒</option>
                                            <option value={60}>60秒</option>
                                            <option value={90}>90秒</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label className={fieldLabel}>主な投稿先</Label>
                                        <select
                                            value={shopInfo.shortPlatform ?? ""}
                                            onChange={(e) => setShopInfo({ ...shopInfo, shortPlatform: e.target.value })}
                                            className={`mt-2 ${inputBase}`}
                                        >
                                            <option value="">指定なし</option>
                                            <option value="Instagram Reels">Instagram Reels</option>
                                            <option value="TikTok">TikTok</option>
                                            <option value="YouTube Shorts">YouTube Shorts</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <Label className={fieldLabel}>ショート用サンプル台本</Label>
                                    <p className={fieldHint}>話し言葉のサンプルを貼り付けるとトーンが揃います</p>
                                    <Textarea
                                        value={shopInfo.shortSampleScript ?? ""}
                                        onChange={(e) => setShopInfo({ ...shopInfo, shortSampleScript: e.target.value })}
                                        placeholder="過去に使った台本や、話し言葉のサンプルを貼り付け"
                                        className={`min-h-[90px] mt-2 ${inputBase} resize-y`}
                                    />
                                </div>
                                <div>
                                    <Label className={fieldLabel}>ショート用メモ</Label>
                                    <Input
                                        value={shopInfo.shortMemo ?? ""}
                                        onChange={(e) => setShopInfo({ ...shopInfo, shortMemo: e.target.value })}
                                        placeholder="例：CTAはLINE誘導のみ"
                                        className={`mt-2 ${inputBase}`}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className="px-6 py-5 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-950/95 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 px-5 py-2.5"
                        onClick={() => { setShowSettingsOverlay(false); setSettingsScrapeUrl(""); }}
                    >
                        キャンセル
                    </Button>
                    <Button
                        type="button"
                        className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold px-6 py-2.5"
                        onClick={() => handleQuickSaveSettings(() => {
                            setShowSettingsOverlay(false);
                            setSettingsScrapeUrl("");
                        })}
                    >
                        設定を保存する
                    </Button>
                </div>
            </div>
        </div>
    );
}
