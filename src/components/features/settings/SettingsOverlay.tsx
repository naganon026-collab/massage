import React from "react";
import { Settings, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShopInfo, ADMIN_EMAIL } from "@/types";
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
    if (!showSettingsOverlay) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-24 md:pt-28"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    setShowSettingsOverlay(false);
                    setSettingsScrapeUrl("");
                }
            }}
        >
            <div className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-amber-500" />
                        <h2 className="text-base font-semibold text-white">店舗設定の編集</h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => { setShowSettingsOverlay(false); setSettingsScrapeUrl(""); }}
                        className="text-zinc-500 hover:text-zinc-200 text-sm"
                    >
                        閉じる ✕
                    </button>
                </div>
                <div className="px-6 py-4 space-y-6 overflow-y-auto">
                    <div className="space-y-2">
                        <p className="text-xs text-zinc-400">
                            初期設定で登録した内容を、一覧でまとめて編集できます。変更内容は「設定を保存する」を押すとクラウドに反映されます。
                        </p>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                        <Label className="text-sm font-medium text-amber-500">🔗 URLから店舗情報を自動取得</Label>
                        <div className="flex gap-2">
                            <Input
                                type="url"
                                value={settingsScrapeUrl}
                                onChange={(e) => setSettingsScrapeUrl(e.target.value)}
                                placeholder="店舗のWEBサイトURLを入力（例：https://example.com）"
                                className="flex-1 bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleScrapeUrlForSettings())}
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleScrapeUrlForSettings}
                                disabled={isScrapingSettings || !settingsScrapeUrl.trim().startsWith("http")}
                                className="shrink-0 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/40"
                            >
                                {isScrapingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                                {isScrapingSettings ? "取得中…" : "URLから取得"}
                            </Button>
                        </div>
                        <p className="text-xs text-zinc-500">店舗のWEBサイトURLを入力して「URLから取得」をクリックすると、業種・店舗名・住所などを自動入力し、下のテキストを投稿生成時の参照情報として保存します。</p>
                        <div className="space-y-2 pt-2 border-t border-zinc-800">
                            <Label className="text-sm font-medium text-zinc-300">📄 サイトから抽出したテキスト（投稿生成時の参照情報）</Label>
                            <p className="text-xs text-zinc-500">このテキストはAIが投稿を生成する際の参考情報として使用されます。内容を確認・編集できます。</p>
                            <Textarea
                                value={shopInfo.scrapedContent || ""}
                                onChange={(e) => setShopInfo({ ...shopInfo, scrapedContent: e.target.value })}
                                placeholder="URLから取得するか、手動で貼り付けてください。投稿生成時にAIが参照します。"
                                className="min-h-[140px] max-h-[160px] w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-y overflow-y-auto"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="quickIndustry" className="text-sm font-medium text-zinc-200">
                                    業種 <span className="text-red-400 text-xs align-middle">*</span>
                                </Label>
                                <Input
                                    id="quickIndustry"
                                    value={shopInfo.industry || ""}
                                    onChange={(e) => setShopInfo({ ...shopInfo, industry: e.target.value })}
                                    placeholder="例：整体院、美容室、カフェ"
                                    className="bg-zinc-950 border-zinc-800 text-zinc-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quickName" className="text-sm font-medium text-zinc-200">
                                    店舗名 <span className="text-red-400 text-xs align-middle">*</span>
                                </Label>
                                <Input
                                    id="quickName"
                                    value={shopInfo.name}
                                    onChange={(e) => setShopInfo({ ...shopInfo, name: e.target.value })}
                                    placeholder="例：The Gentry"
                                    className="bg-zinc-950 border-zinc-800 text-zinc-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quickAddress" className="text-sm font-medium text-zinc-200">
                                    住所 <span className="text-red-400 text-xs align-middle">*</span>
                                </Label>
                                <Input
                                    id="quickAddress"
                                    value={shopInfo.address}
                                    onChange={(e) => setShopInfo({ ...shopInfo, address: e.target.value })}
                                    placeholder="例：長野県長野市〇〇1-2-3"
                                    className="bg-zinc-950 border-zinc-800 text-zinc-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quickPhone" className="text-sm font-medium text-zinc-200">電話番号</Label>
                                <Input
                                    id="quickPhone"
                                    type="tel"
                                    value={shopInfo.phone}
                                    onChange={(e) => setShopInfo({ ...shopInfo, phone: e.target.value })}
                                    placeholder="例：026-000-0000"
                                    className="bg-zinc-950 border-zinc-800 text-zinc-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quickLine" className="text-sm font-medium text-zinc-200">LINE/予約URL</Label>
                                <Input
                                    id="quickLine"
                                    type="url"
                                    value={shopInfo.lineUrl}
                                    onChange={(e) => setShopInfo({ ...shopInfo, lineUrl: e.target.value })}
                                    placeholder="例：https://lin.ee/xxxxx"
                                    className="bg-zinc-950 border-zinc-800 text-zinc-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quickBusinessHours" className="text-sm font-medium text-zinc-200">営業時間</Label>
                                <Input
                                    id="quickBusinessHours"
                                    value={shopInfo.businessHours}
                                    onChange={(e) => setShopInfo({ ...shopInfo, businessHours: e.target.value })}
                                    placeholder="例：10:00〜20:00"
                                    className="bg-zinc-950 border-zinc-800 text-zinc-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quickHolidays" className="text-sm font-medium text-zinc-200">定休日</Label>
                                <Input
                                    id="quickHolidays"
                                    value={shopInfo.holidays}
                                    onChange={(e) => setShopInfo({ ...shopInfo, holidays: e.target.value })}
                                    placeholder="例：毎週火曜・年末年始"
                                    className="bg-zinc-950 border-zinc-800 text-zinc-100"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="quickSampleTexts" className="text-sm font-medium text-zinc-200">
                                    文章サンプル
                                </Label>
                                <Textarea
                                    id="quickSampleTexts"
                                    value={shopInfo.sampleTexts || ""}
                                    onChange={(e) => setShopInfo({ ...shopInfo, sampleTexts: e.target.value })}
                                    placeholder="今までの投稿文を2〜3件コピペすると、文体を学習します。"
                                    className="min-h-[80px] bg-zinc-950 border-zinc-800 text-zinc-100 resize-y"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quickSnsUrl" className="text-sm font-medium text-zinc-200">SNS URL（任意）</Label>
                                <Input
                                    id="quickSnsUrl"
                                    type="url"
                                    value={shopInfo.snsUrl || ""}
                                    onChange={(e) => setShopInfo({ ...shopInfo, snsUrl: e.target.value })}
                                    placeholder="例：https://instagram.com/〇〇"
                                    className="bg-zinc-950 border-zinc-800 text-zinc-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quickFeatures" className="text-sm font-medium text-zinc-200">その他特記事項（任意）</Label>
                                <Textarea
                                    id="quickFeatures"
                                    value={shopInfo.features}
                                    onChange={(e) => setShopInfo({ ...shopInfo, features: e.target.value })}
                                    placeholder="例：完全個室／無料駐車場あり／メンズ専用　など"
                                    className="min-h-[80px] bg-zinc-950 border-zinc-800 text-zinc-100 resize-y"
                                />
                            </div>
                            {user?.email === ADMIN_EMAIL && (
                                <div className="space-y-3 pt-2 border-t border-zinc-800">
                                    <Label className="text-sm font-medium text-zinc-200">WordPress 投稿設定（任意）</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <Input
                                            placeholder="カテゴリID"
                                            value={shopInfo.wpCategoryId || ""}
                                            onChange={(e) => setShopInfo({ ...shopInfo, wpCategoryId: e.target.value })}
                                            className="bg-zinc-950 border-zinc-800 text-zinc-100"
                                        />
                                        <Input
                                            placeholder="タグID"
                                            value={shopInfo.wpTagId || ""}
                                            onChange={(e) => setShopInfo({ ...shopInfo, wpTagId: e.target.value })}
                                            className="bg-zinc-950 border-zinc-800 text-zinc-100"
                                        />
                                        <Input
                                            placeholder="著者ID"
                                            value={shopInfo.wpAuthorId || ""}
                                            onChange={(e) => setShopInfo({ ...shopInfo, wpAuthorId: e.target.value })}
                                            className="bg-zinc-950 border-zinc-800 text-zinc-100"
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2 pt-2 border-t border-zinc-800">
                                <Label className="text-sm font-medium text-zinc-200">出力する媒体</Label>
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={shopInfo.outputTargets?.instagram ?? true}
                                            onChange={(e) =>
                                                setShopInfo({
                                                    ...shopInfo,
                                                    outputTargets: { ...shopInfo.outputTargets!, instagram: e.target.checked },
                                                })
                                            }
                                            className="w-4 h-4 rounded accent-amber-500"
                                        />
                                        Instagram用
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={shopInfo.outputTargets?.gbp ?? true}
                                            onChange={(e) =>
                                                setShopInfo({
                                                    ...shopInfo,
                                                    outputTargets: { ...shopInfo.outputTargets!, gbp: e.target.checked },
                                                })
                                            }
                                            className="w-4 h-4 rounded accent-amber-500"
                                        />
                                        Google Map/GBP用
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={shopInfo.outputTargets?.portal ?? true}
                                            onChange={(e) =>
                                                setShopInfo({
                                                    ...shopInfo,
                                                    outputTargets: { ...shopInfo.outputTargets!, portal: e.target.checked },
                                                })
                                            }
                                            className="w-4 h-4 rounded accent-amber-500"
                                        />
                                        ブログ/ポータル用
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={shopInfo.outputTargets?.line ?? true}
                                            onChange={(e) =>
                                                setShopInfo({
                                                    ...shopInfo,
                                                    outputTargets: { ...shopInfo.outputTargets!, line: e.target.checked },
                                                })
                                            }
                                            className="w-4 h-4 rounded accent-amber-500"
                                        />
                                        LINE用
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-950/80">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        onClick={() => { setShowSettingsOverlay(false); setSettingsScrapeUrl(""); }}
                    >
                        キャンセル
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
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
