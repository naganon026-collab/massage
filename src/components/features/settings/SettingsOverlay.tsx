import React, { useState } from "react";
import { Settings, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShopInfo, ADMIN_EMAIL, SHORT_HOOK_OPTIONS, CTA_TYPE_OPTIONS, isCtaSet, type CtaType } from "@/types";
import { User } from "@supabase/supabase-js";

type AnalysisResult = {
    concept: { status: string; reason: string };
    strengths: { status: string; reason: string };
    target: { status: string; reason: string };
    staff: { status: string; reason: string };
    voice: { status: string; reason: string };
};

interface SettingsOverlayProps {
    showSettingsOverlay: boolean;
    setShowSettingsOverlay: (show: boolean) => void;
    shopInfo: ShopInfo;
    setShopInfo: React.Dispatch<React.SetStateAction<ShopInfo>>;
    settingsScrapeUrl: string;
    setSettingsScrapeUrl: (url: string) => void;
    isScrapingSettings: boolean;
    handleScrapeUrlForSettings: () => void;
    handleScrapeUrlsForSettings: (urls: string[]) => Promise<void>;
    handleQuickSaveSettings: (onSuccess?: () => void) => void;
    user: User | null;
    analysisResult: AnalysisResult | null;
    isAnalyzing: boolean;
    addToast: (msg: string, type: "success" | "error") => void;
    canGenerateBlog?: boolean;
}

const sectionTitle = "text-xl font-bold text-emerald-400 mt-10 first:mt-0 mb-4 pb-2 border-b border-emerald-500/30";
const fieldLabel = "text-sm font-semibold text-zinc-100 mb-2 block";
const fieldHint = "text-sm text-zinc-400 mt-1.5 leading-relaxed";
const inputBase = "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/40 transition-colors";

export function SettingsOverlay({
    showSettingsOverlay,
    setShowSettingsOverlay,
    shopInfo,
    setShopInfo,
    settingsScrapeUrl,
    setSettingsScrapeUrl,
    isScrapingSettings,
    handleScrapeUrlForSettings,
    handleScrapeUrlsForSettings,
    handleQuickSaveSettings,
    user,
    analysisResult,
    isAnalyzing,
    addToast,
    canGenerateBlog = true,
}: SettingsOverlayProps) {
    const [settingsScrapeUrls, setSettingsScrapeUrls] = useState<string[]>(["", "", ""]);
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
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm px-4 sm:px-6 pt-20 pb-[max(2rem,calc(2rem+env(safe-area-inset-bottom)))]"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    setShowSettingsOverlay(false);
                    setSettingsScrapeUrl("");
                }
            }}
        >
            <div className="w-full max-w-3xl rounded-2xl border-2 border-zinc-700 bg-zinc-950 shadow-2xl card-elevated max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <Settings className="w-6 h-6 text-emerald-500" />
                        <h2 className="font-display text-xl font-semibold text-emerald-400">店舗設定の編集</h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => { setShowSettingsOverlay(false); setSettingsScrapeUrl(""); }}
                        className="text-zinc-500 hover:text-zinc-200 text-sm p-2 rounded-lg hover:bg-zinc-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="閉じる"
                    >
                        閉じる ✕
                    </button>
                </div>
                <div className="px-8 py-6 space-y-2 overflow-y-auto flex-1 scrollbar-none">
                    {/* URLから取得（3件＋蓄積枠） */}
                    <h3 className={sectionTitle}>① お店のURLを入力して基本情報を自動入力（最大3件）</h3>
                    <p className={fieldHint}>トップページ・メニュー表・ブログなど、複数URLを入れると情報がまとまって読み取られます。</p>
                    <div className="space-y-2 mt-3">
                        {[0, 1, 2].map((i) => (
                            <Input
                                key={i}
                                type="url"
                                value={settingsScrapeUrls[i] ?? ""}
                                onChange={(e) => setSettingsScrapeUrls((prev) => {
                                    const next = [...prev];
                                    next[i] = e.target.value;
                                    return next;
                                })}
                                placeholder={`URL ${i + 1}（例: https://...）`}
                                className={inputBase}
                            />
                        ))}
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleScrapeUrlsForSettings(settingsScrapeUrls)}
                            disabled={isScrapingSettings || !settingsScrapeUrls.some((u) => u?.trim().startsWith("http"))}
                            className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/40"
                        >
                            {isScrapingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                            {isScrapingSettings ? "読み取り中…" : "まとめて読み取る"}
                        </Button>
                    </div>
                    <div className="space-y-2 mt-4 pt-4 border-t border-zinc-800">
                        <p className="text-xs text-emerald-500 font-medium">読み取り結果 — この情報をもとに、基本情報や投稿が生成されます。</p>
                        <p className="text-xs text-zinc-400">ここにURLやコピーしたテキストをどんどん追加してください。メニュー表・ブログ・口コミなど、貼り足すほど生成の精度が上がります。</p>
                        <textarea
                            value={shopInfo.scrapedContent ?? ""}
                            onChange={(e) => setShopInfo((prev) => ({ ...prev, scrapedContent: e.target.value }))}
                            placeholder="上で「まとめて読み取る」を押すとここに結果が追記されます。ほかのページをコピーしたテキストも貼り付けてOKです。"
                            className={`flex min-h-[280px] max-h-[420px] w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-base text-zinc-300 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-y overflow-y-auto ${inputBase}`}
                        />
                    </div>
                    {isAnalyzing && (
                        <div className="flex items-center gap-2 mt-3 text-sm text-zinc-400">
                            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            AI が取得内容を分析中...
                        </div>
                    )}

                    {analysisResult && !isAnalyzing && (() => {
                        const keys = ["concept", "strengths", "target", "staff", "voice"] as const;
                        const isValid = keys.every((k) => analysisResult[k]?.status != null && analysisResult[k]?.reason != null);
                        if (!isValid) return null;
                        return (
                        <div className="space-y-4 mt-4">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-zinc-100">不足情報の補足</p>
                                <span className="text-xs text-zinc-500">※ 入力するとより精度の高い投稿が生成されます</span>
                            </div>
                            {keys.every((k) => analysisResult[k].status === "sufficient") ? (
                                <p className="text-xs text-emerald-500 flex items-center gap-1">
                                    ✅ 必要な情報はすべてサイトから取得できました
                                </p>
                            ) : (
                                [
                                    { key: "concept" as const, label: "サロンのコンセプト・想い", placeholder: "例：地域に根ざした家族で通えるサロン。忙しい日常の中でほっとできる空間を提供" },
                                    { key: "strengths" as const, label: "技術的な強み・得意施術・資格", placeholder: "例：縮毛矯正が得意。○○認定資格保有。ダメージレスブリーチに自信あり" },
                                    { key: "target" as const, label: "ターゲット・来てほしいお客様", placeholder: "例：くせ毛に悩む30代女性。初めての方も歓迎。学生からシニアまで対応" },
                                    { key: "staff" as const, label: "スタッフの人柄・こだわり", placeholder: "例：カウンセリングに時間をかけます。お客様の話をじっくり聞くことを大切に" },
                                    { key: "voice" as const, label: "お客様の声・よくいただく感想", placeholder: "例：「毎回おまかせ」「子どもと一緒に来られて助かる」" },
                                ]
                                    .filter((item) => analysisResult[item.key]?.status === "insufficient")
                                    .map(({ key, label, placeholder }) => (
                                        <div key={key} className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Label className="text-sm text-zinc-200">{label}</Label>
                                                <span className="text-xs text-amber-500">⚠️ {analysisResult[key]?.reason ?? ""}</span>
                                            </div>
                                            <Textarea
                                                placeholder={placeholder}
                                                value={shopInfo.manualSupplements?.[key] ?? ""}
                                                onChange={(e) =>
                                                    setShopInfo((prev) => ({
                                                        ...prev,
                                                        manualSupplements: {
                                                            concept: "",
                                                            strengths: "",
                                                            target: "",
                                                            staff: "",
                                                            voice: "",
                                                            ...prev.manualSupplements,
                                                            [key]: e.target.value,
                                                        },
                                                    }))
                                                }
                                                className={`min-h-[80px] text-sm ${inputBase}`}
                                            />
                                        </div>
                                    ))
                            )}
                        </div>
                        );
                    })()}

                    {/* 基本情報 */}
                    <h3 className={sectionTitle}>基本情報</h3>
                    <div className="space-y-5">
                        <div>
                            <Label htmlFor="quickIndustry" className={fieldLabel}>業種 <span className="text-red-400">*</span></Label>
                            <select
                                id="quickIndustry"
                                required
                                value={shopInfo.industry || "salon"}
                                onChange={(e) => setShopInfo({ ...shopInfo, industry: e.target.value })}
                                className={inputBase}
                            >
                                <option value="salon">美容院・サロン</option>
                                <option value="restaurant">飲食店</option>
                            </select>
                        </div>
                        <div>
                            <Label htmlFor="quickName" className={fieldLabel}>店舗名 <span className="text-red-400">*</span></Label>
                            <Input
                                id="quickName"
                                value={shopInfo.name}
                                onChange={(e) => setShopInfo({ ...shopInfo, name: e.target.value })}
                                placeholder="例：サロン名"
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
                    <h3 className={sectionTitle}>②あなたらしさ（文調の学習）・特記事項</h3>
                    <div>
                        <Label htmlFor="quickSampleTexts" className={fieldLabel}>文章サンプル</Label>
                        <p className={fieldHint}>今までの投稿文を2〜3件コピペすると、文体を学習します。</p>
                        <Textarea
                            id="quickSampleTexts"
                            value={shopInfo.sampleTexts || ""}
                            onChange={(e) => setShopInfo({ ...shopInfo, sampleTexts: e.target.value })}
                            placeholder="これまでSNSに投稿していた文章を2〜3件貼り付けてください。"
                            className={`min-h-[120px] mt-2 ${inputBase} resize-y`}
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
                                    <label className="text-sm text-zinc-300 mb-1 block">カテゴリID</label>
                                    <Input
                                        value={shopInfo.wpCategoryId || ""}
                                        onChange={(e) => setShopInfo({ ...shopInfo, wpCategoryId: e.target.value })}
                                        placeholder="1"
                                        className={inputBase}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-zinc-300 mb-1 block">タグID</label>
                                    <Input
                                        value={shopInfo.wpTagId || ""}
                                        onChange={(e) => setShopInfo({ ...shopInfo, wpTagId: e.target.value })}
                                        placeholder="5"
                                        className={inputBase}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-zinc-300 mb-1 block">著者ID</label>
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
                    <h3 className={sectionTitle}>③出力する媒体</h3>
                    <p className={fieldHint}>チェックした媒体用のテキストが生成されます。</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-3 mt-3">
                        {[
                            { key: "instagram" as const, label: "Instagram用" },
                            { key: "gbp" as const, label: "Google Map/GBP用" },
                            { key: "portal" as const, label: "ブログ用", proOnly: true },
                            { key: "line" as const, label: "LINE用" },
                            { key: "short" as const, label: "ショート動画の台本" },
                        ].map(({ key, label, proOnly }) => {
                            const disabled = proOnly && !canGenerateBlog;
                            const checked = disabled && key === "portal" ? false : (shopInfo.outputTargets?.[key] ?? (key !== "short"));
                            return (
                                <label key={key} className={`flex items-center gap-2.5 text-base text-zinc-100 select-none ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) =>
                                            setShopInfo({
                                                ...shopInfo,
                                                outputTargets: outputTargetsWith(key, e.target.checked),
                                            })
                                        }
                                        disabled={disabled}
                                        className="w-5 h-5 rounded accent-emerald-500"
                                    />
                                    {label}{disabled && <span className="text-xs text-amber-400">（プロプラン限定）</span>}
                                </label>
                            );
                        })}
                    </div>

                    {/* 投稿の締め文（予約・問い合わせの誘導） */}
                    <h3 className={sectionTitle}>投稿の締め文（予約・問い合わせの誘導） <span className="text-amber-400 font-normal text-sm">（必須）</span></h3>
                    {!isCtaSet(shopInfo) && (
                        <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-amber-500/60 bg-amber-500/10 text-amber-200">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <p className="font-semibold text-amber-400">締め文が設定されていません</p>
                                <p className="text-sm mt-1">投稿生成の前に、種類を選びURLまたは電話番号を入力してください。未設定のままでは生成できません。</p>
                            </div>
                        </div>
                    )}
                    <p className="fieldHint">種類を選び、URLまたは電話番号を入力すると生成投稿の最後に反映されます。</p>
                    <div className="space-y-4 mt-3">
                        <div>
                            <Label className={fieldLabel}>締め文の種類</Label>
                            <select
                                id="cta-type"
                                value={shopInfo.ctaType ?? "line"}
                                onChange={(e) => {
                                    const next: CtaType = e.target.value as CtaType;
                                    setShopInfo({
                                        ...shopInfo,
                                        ctaType: next,
                                        ctaValue: next === "line" && !(shopInfo.ctaValue ?? "").trim() ? (shopInfo.lineUrl ?? "") : (shopInfo.ctaValue ?? ""),
                                        ctaText: "", // 選択式を使うため旧 ctaText はクリア（API は ctaType+ctaValue を優先）
                                    });
                                }}
                                className={`mt-2 ${inputBase}`}
                                aria-label="締め文の種類"
                            >
                                {CTA_TYPE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label className={fieldLabel}>
                                {CTA_TYPE_OPTIONS.find((o) => o.value === (shopInfo.ctaType ?? "line"))?.valueLabel ?? "URL・電話番号"}
                            </Label>
                            {shopInfo.ctaType === "other" ? (
                                <Textarea
                                    value={shopInfo.ctaValue ?? ""}
                                    onChange={(e) => setShopInfo({ ...shopInfo, ctaValue: e.target.value })}
                                    placeholder={CTA_TYPE_OPTIONS.find((o) => o.value === "other")?.valuePlaceholder}
                                    className={`min-h-[80px] mt-2 ${inputBase} resize-y`}
                                    aria-label="締めの一文"
                                />
                            ) : (
                                <Input
                                    type={shopInfo.ctaType === "phone" ? "tel" : "url"}
                                    value={shopInfo.ctaValue ?? ""}
                                    onChange={(e) => setShopInfo({ ...shopInfo, ctaValue: e.target.value })}
                                    placeholder={
                                        shopInfo.ctaType === "line"
                                            ? (shopInfo.lineUrl || CTA_TYPE_OPTIONS.find((o) => o.value === "line")?.valuePlaceholder)
                                            : CTA_TYPE_OPTIONS.find((o) => o.value === (shopInfo.ctaType ?? "line"))?.valuePlaceholder
                                    }
                                    className={`mt-2 ${inputBase}`}
                                    aria-label="締め文のURL・電話番号"
                                />
                            )}
                        </div>
                    </div>

                    {/* ショート動画の設定 */}
                    {(shopInfo.outputTargets?.short) && (
                        <>
                            <h3 className={sectionTitle}>ショート動画の設定</h3>
                            <div className="space-y-5 p-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                                <div>
                                    <label htmlFor="short-hook-type" className={`${fieldLabel} text-emerald-400/90`}>
                                        フックのタイプ（冒頭で視聴者を止めるパターン）
                                    </label>
                                    <select
                                        id="short-hook-type"
                                        value={shopInfo.shortHookType ?? SHORT_HOOK_OPTIONS[0].id}
                                        onChange={(e) => setShopInfo({ ...shopInfo, shortHookType: e.target.value })}
                                        className={`mt-2 ${inputBase} border-emerald-500/40`}
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
                            </div>
                        </>
                    )}
                </div>
                <div className="px-8 py-6 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-950/95 shrink-0">
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
                        className="gradient-accent hover:opacity-95 text-zinc-950 font-semibold px-6 py-2.5"
                        onClick={() => {
                            const ctaType = shopInfo.ctaType ?? "line";
                            const ctaValue = (shopInfo.ctaValue ?? "").trim();
                            if (ctaType === "other") {
                                if (!ctaValue) {
                                    addToast("締めの一文を入力してください。", "error");
                                    return;
                                }
                            } else if (ctaType !== "line" && !ctaValue) {
                                addToast("締め文のURLまたは電話番号を入力してください。", "error");
                                return;
                            }
                            handleQuickSaveSettings(() => {
                                setShowSettingsOverlay(false);
                                setSettingsScrapeUrl("");
                            });
                        }}
                    >
                        設定を保存する
                    </Button>
                </div>
            </div>
        </div>
    );
}
