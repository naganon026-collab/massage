import React, { useState, useEffect } from "react";
import { Globe, ChevronRight, FileText, Loader2, Check, Settings, Sparkles, ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShopInfo, ADMIN_EMAIL, SHORT_HOOK_OPTIONS, CTA_TYPE_OPTIONS, isCtaSet, type CtaType } from "@/types";
import { User } from "@supabase/supabase-js";

interface InitialSetupProps {
    setupStep: number;
    setSetupStep: (step: number) => void;
    setupPath: "url" | "manual" | null;
    setSetupPath: (path: "url" | "manual" | null) => void;
    shopInfo: ShopInfo;
    setShopInfo: React.Dispatch<React.SetStateAction<ShopInfo>>;
    scrapeUrl: string;
    setScrapeUrl: (url: string) => void;
    isScraping: boolean;
    isExtractingInfo: boolean;
    handleScrapeUrl: () => Promise<void>;
    handleScrapeUrls: (urls: string[]) => Promise<void>;
    handleReadAndProceed?: (urls: string[], existingText: string, onProceed: () => void) => Promise<void>;
    handleExtractInfo: (text: string, save: boolean) => Promise<void>;
    scrapedPreview: string | null;
    setScrapedPreview: (preview: string | null) => void;
    handleSaveShopInfo: (e: React.FormEvent, options?: { fromStep3Complete?: boolean }) => Promise<boolean>;
    handleSkipWithMinimal?: () => Promise<void>;
    onGoToMain?: () => void;
    user: User | null;
    canGenerateBlog?: boolean;
}

export function InitialSetup({
    setupStep,
    setSetupStep,
    setupPath,
    setSetupPath,
    shopInfo,
    setShopInfo,
    scrapeUrl,
    setScrapeUrl,
    isScraping,
    isExtractingInfo,
    handleScrapeUrl,
    handleScrapeUrls,
    handleReadAndProceed,
    handleExtractInfo,
    scrapedPreview,
    setScrapedPreview,
    handleSaveShopInfo,
    handleSkipWithMinimal,
    onGoToMain,
    user,
    canGenerateBlog = true,
}: InitialSetupProps) {
    const [isSetupComplete, setIsSetupComplete] = useState(false);
    const [scrapeUrls, setScrapeUrls] = useState<string[]>(["", "", ""]);
    const ot = shopInfo.outputTargets;

    useEffect(() => {
        if (!isSetupComplete || !onGoToMain) return;
        const t = setTimeout(onGoToMain, 3000);
        return () => clearTimeout(t);
    }, [isSetupComplete, onGoToMain]);
    const outputTargetsWith = (key: keyof NonNullable<ShopInfo["outputTargets"]>, value: boolean) => ({
        instagram: ot?.instagram ?? true,
        gbp: ot?.gbp ?? true,
        portal: ot?.portal ?? true,
        line: ot?.line ?? true,
        short: ot?.short ?? false,
        [key]: value,
    });
    if (isSetupComplete) {
        return (
            <div className="flex flex-col items-center justify-center space-y-6 py-12 text-center">
                <div className="text-6xl">🎉</div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">
                        設定完了！投稿を作ってみましょう
                    </h2>
                    <p className="text-sm text-zinc-400">
                        まずはビフォーアフター投稿から試してみてください
                    </p>
                </div>
                <div className="w-full max-w-sm space-y-3 text-left">
                    {[
                        { step: "1", title: "パターンAを選ぶ", desc: "「ビフォーアフター」が新規集客に最も効果的です" },
                        { step: "2", title: "施術タグをタップする", desc: "今日行った施術を1つ選ぶだけでOK" },
                        { step: "3", title: "生成ボタンを押す", desc: "Instagram・LINE等の投稿文が一括で生成されます" },
                    ].map(({ step, title, desc }) => (
                        <div key={step} className="flex items-start gap-3 bg-zinc-800/50 rounded-lg p-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-zinc-950 text-xs font-bold flex items-center justify-center">
                                {step}
                            </span>
                            <div>
                                <p className="text-sm font-medium text-white">{title}</p>
                                <p className="text-xs text-zinc-400">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <Button
                    size="lg"
                    className="w-full max-w-sm gradient-accent hover:opacity-95 text-zinc-950 font-semibold"
                    onClick={() => onGoToMain?.()}
                >
                    さっそく投稿を作る →
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {handleSkipWithMinimal && (
                <Button
                    type="button"
                    onClick={handleSkipWithMinimal}
                    className="w-full gradient-accent hover:opacity-95 text-zinc-950 font-semibold"
                >
                    まずはアプリを使う（設定は後でする）
                </Button>
            )}
            <div className="text-center space-y-2">
                <h2 className="font-display text-2xl font-bold text-white">初期設定（店舗情報）</h2>
                <p className="text-zinc-400">作成される文章に埋め込むための基本情報を設定してください。</p>
                <div className="flex items-center justify-center gap-2 pt-2">
                    <span className={`flex items-center gap-1 text-sm ${setupStep === 1 ? "text-emerald-500 font-semibold" : "text-zinc-500"}`}>
                        <span className={`flex w-7 h-7 items-center justify-center rounded-full ${setupStep === 1 ? "gradient-accent text-zinc-950" : "bg-zinc-700 text-zinc-400"}`}>1</span>
                        <Globe className="w-4 h-4 hidden sm:inline" />
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-600" />
                    <span className={`flex items-center gap-1 text-sm ${setupStep === 2 ? "text-emerald-500 font-semibold" : "text-zinc-500"}`}>
                        <span className={`flex w-7 h-7 items-center justify-center rounded-full ${setupStep === 2 ? "gradient-accent text-zinc-950" : "bg-zinc-700 text-zinc-400"}`}>2</span>
                        <FileText className="w-4 h-4 hidden sm:inline" />
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-600" />
                    <span className={`flex items-center gap-1 text-sm ${setupStep === 3 ? "text-emerald-500 font-semibold" : "text-zinc-500"}`}>
                        <span className={`flex w-7 h-7 items-center justify-center rounded-full ${setupStep === 3 ? "gradient-accent text-zinc-950" : "bg-zinc-700 text-zinc-400"}`}>3</span>
                    </span>
                </div>
            </div>
            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm card-elevated">
                <CardContent className="pt-6">
                    <form
                        onSubmit={async (e) => {
                            if (setupStep === 3) {
                                const ok = await handleSaveShopInfo(e, { fromStep3Complete: true });
                                if (ok) onGoToMain?.();
                            } else {
                                await handleSaveShopInfo(e);
                            }
                        }}
                        className="space-y-6"
                    >
                        {setupStep === 1 && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="space-y-3">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Globe className="w-5 h-5 text-emerald-500" />
                                        お店のホームページのアドレスを入力してください（最大3件）
                                    </h3>
                                    <p className="text-sm text-zinc-300">トップページ・メニュー表・ブログなど、複数URLを入れると情報がまとまって読み取られます。</p>
                                </div>
                                <div className="space-y-2">
                                    {[0, 1, 2].map((i) => (
                                        <Input
                                            key={i}
                                            value={scrapeUrls[i] ?? ""}
                                            onChange={(e) => setScrapeUrls((prev) => {
                                                const next = [...prev];
                                                next[i] = e.target.value;
                                                return next;
                                            })}
                                            className="bg-zinc-950 border-zinc-700 text-white"
                                            placeholder={`URL ${i + 1}（例: https://...）`}
                                        />
                                    ))}
                                </div>
                                <div className="space-y-3 pt-4 border-t border-zinc-800">
                                    <p className="text-sm text-emerald-500 font-medium">読み取り結果 — この情報をもとに、基本情報や投稿が生成されます。</p>
                                    <p className="text-sm text-zinc-400">URLを入力するか、ここにコピーしたテキストを貼り付けてください。メニュー表・ブログ・口コミなど、貼り足すほど生成の精度が上がります。</p>
                                    <textarea
                                        value={scrapedPreview ?? ""}
                                        onChange={(e) => setScrapedPreview(e.target.value)}
                                        className="flex min-h-[280px] max-h-[420px] w-full rounded-md border border-emerald-500/30 bg-zinc-950 px-3 py-2 text-base text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y overflow-y-auto"
                                        placeholder="URLを入力して下のボタンを押すか、ここにテキストを貼り付けてください。"
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            if (handleReadAndProceed) {
                                                setSetupPath(scrapeUrls.some((u) => u?.trim().startsWith("http")) ? "url" : "manual");
                                                void handleReadAndProceed(scrapeUrls, scrapedPreview ?? "", () => setSetupStep(2));
                                            } else {
                                                void handleExtractInfo((scrapedPreview ?? "") + "\n" + shopInfo.features + "\n" + (shopInfo.sampleTexts || ""), true).then(() => setSetupStep(2));
                                            }
                                        }}
                                        disabled={isScraping || isExtractingInfo || (!scrapeUrls.some((u) => u?.trim().startsWith("http")) && !scrapedPreview?.trim())}
                                        className="w-full gradient-accent hover:opacity-95 text-zinc-950 font-semibold"
                                    >
                                        {(isScraping || isExtractingInfo) ? <><Loader2 className="w-4 h-4 animate-spin" /> 読み取り中...</> : <><Check className="w-4 h-4" /> URLを読み取って基本情報を入力し、次へ</>}
                                    </Button>
                                </div>
                                <div className="pt-4 border-t border-zinc-800 space-y-3">
                                    <button
                                        type="button"
                                        onClick={() => { setSetupPath("manual"); setSetupStep(2); }}
                                        className="text-sm text-zinc-400 hover:text-emerald-500 underline underline-offset-2 transition-colors"
                                    >
                                        お店のホームページがない場合はこちら
                                    </button>
                                    <p className="text-sm text-zinc-400">手入力で住所や電話番号などを入力して進めます。</p>
                                </div>
                            </div>
                        )}

                        {setupStep === 2 && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="border-b border-zinc-800 pb-4 mb-2">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-emerald-500" />
                                        店舗の基本情報
                                    </h3>
                                    <p className="text-sm text-zinc-300 mt-1">
                                    {setupPath === "url" ? "自動で入力された内容を確認・修正してください。" : "以下の項目を入力してください。* のついた項目は必須です。"}
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="shopIndustry" className="font-medium">業種 <span className="text-red-500">*</span></Label>
                                        <select
                                            id="shopIndustry"
                                            required
                                            value={shopInfo.industry || "salon"}
                                            onChange={(e) => setShopInfo({ ...shopInfo, industry: e.target.value })}
                                            className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        >
                                            <option value="salon">美容院・サロン</option>
                                            <option value="restaurant">飲食店</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="shopName" className="font-medium">店舗名 <span className="text-red-500">*</span></Label>
                                        <Input id="shopName" required value={shopInfo.name} onChange={(e) => setShopInfo({ ...shopInfo, name: e.target.value })} className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-amber-500/50" placeholder="例：サロン名" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="shopAddress" className="font-medium">住所 <span className="text-red-500">*</span></Label>
                                        <Input id="shopAddress" required value={shopInfo.address} onChange={(e) => setShopInfo({ ...shopInfo, address: e.target.value })} className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-amber-500/50" placeholder="例：長野県長野市〇〇1-2-3" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="shopPhone" className="font-medium">電話番号 <span className="text-red-500">*</span></Label>
                                            <Input id="shopPhone" type="tel" required value={shopInfo.phone} onChange={(e) => setShopInfo({ ...shopInfo, phone: e.target.value })} className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-amber-500/50" placeholder="例：026-000-0000" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="shopLine" className="font-medium">LINE/予約URL</Label>
                                            <Input id="shopLine" type="url" value={shopInfo.lineUrl} onChange={(e) => setShopInfo({ ...shopInfo, lineUrl: e.target.value })} className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-amber-500/50" placeholder="例：https://lin.ee/xxxxx" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="shopBusinessHours" className="font-medium">営業時間 <span className="text-red-500">*</span></Label>
                                            <Input id="shopBusinessHours" required value={shopInfo.businessHours} onChange={(e) => setShopInfo({ ...shopInfo, businessHours: e.target.value })} className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-amber-500/50" placeholder="例：10:00〜20:00" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="shopHolidays" className="font-medium">定休日 <span className="text-red-500">*</span></Label>
                                            <Input id="shopHolidays" required value={shopInfo.holidays} onChange={(e) => setShopInfo({ ...shopInfo, holidays: e.target.value })} className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-amber-500/50" placeholder="例：毎週火曜・年末年始" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 pt-4">
                                    {(!shopInfo.name?.trim() || !shopInfo.address?.trim() || !shopInfo.phone?.trim() || !shopInfo.businessHours?.trim() || !shopInfo.holidays?.trim()) && (
                                        <p className="text-xs text-amber-400">※ 店舗名・住所・電話番号・営業時間・定休日は必須です</p>
                                    )}
                                    <div className="flex gap-3">
                                        <Button type="button" variant="outline" className="border-zinc-600 text-zinc-300 hover:bg-zinc-800" onClick={() => setSetupStep(1)}>
                                            <ChevronLeft className="w-4 h-4 mr-1" /> 戻る
                                        </Button>
                                        <Button
                                            type="button"
                                            className="gradient-accent hover:opacity-95 text-zinc-950 font-semibold flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => setSetupStep(3)}
                                            disabled={
                                                !shopInfo.name?.trim() ||
                                                !shopInfo.address?.trim() ||
                                                !shopInfo.phone?.trim() ||
                                                !shopInfo.businessHours?.trim() ||
                                                !shopInfo.holidays?.trim()
                                            }
                                        >
                                            次へ <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {setupStep === 3 && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="border-b border-zinc-800 pb-4 mb-2">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Settings className="w-5 h-5 text-emerald-500" />
                                        オプション設定
                                    </h3>
                                    <p className="text-sm text-zinc-300 mt-1">任意の項目は後から設定画面で変更できます。</p>
                                </div>

                                {/* 投稿の締め文（予約・問い合わせの誘導）（必須） */}
                                <div className="space-y-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                                    <h4 className="font-semibold text-emerald-400 text-sm">投稿の締め文（予約・問い合わせの誘導） <span className="text-emerald-400/80 font-normal">（必須）</span></h4>
                                    {!isCtaSet(shopInfo) && (
                                        <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-amber-500/60 bg-amber-500/10 text-amber-200">
                                            <span className="text-xl">⚠️</span>
                                            <div>
                                                <p className="font-semibold text-amber-400 text-sm">締め文を設定してください</p>
                                                <p className="text-xs mt-0.5">種類を選び、URLまたは電話番号を入力しないと投稿を生成できません。</p>
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-xs text-zinc-400">種類を選び、URLまたは電話番号を入力すると生成投稿の最後に反映されます。</p>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm text-zinc-200">締め文の種類</Label>
                                            <select
                                                value={shopInfo.ctaType ?? "line"}
                                                onChange={(e) => {
                                                    const next: CtaType = e.target.value as CtaType;
                                                    setShopInfo({
                                                        ...shopInfo,
                                                        ctaType: next,
                                                        ctaValue: next === "line" && !(shopInfo.ctaValue ?? "").trim() ? (shopInfo.lineUrl ?? "") : (shopInfo.ctaValue ?? ""),
                                                        ctaText: "",
                                                    });
                                                }}
                                                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                            >
                                                {CTA_TYPE_OPTIONS.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm text-zinc-200">
                                                {CTA_TYPE_OPTIONS.find((o) => o.value === (shopInfo.ctaType ?? "line"))?.valueLabel ?? "URL・電話番号"}
                                            </Label>
                                            {shopInfo.ctaType === "other" ? (
                                                <textarea
                                                    value={shopInfo.ctaValue ?? ""}
                                                    onChange={(e) => setShopInfo({ ...shopInfo, ctaValue: e.target.value })}
                                                    placeholder={CTA_TYPE_OPTIONS.find((o) => o.value === "other")?.valuePlaceholder}
                                                    className="flex min-h-[80px] w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
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
                                                    className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <details className="group bg-zinc-800/20 rounded-xl border border-zinc-800/50 overflow-hidden">
                                    <summary className="px-4 py-3 cursor-pointer list-none flex items-center justify-between text-sm text-zinc-300 hover:bg-zinc-800/30">
                                        <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-emerald-500" /> あなたらしさ（文調の学習）・特記事項</span>
                                        <span className="text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
                                    </summary>
                                    <div className="px-4 pb-4 space-y-4 border-t border-zinc-800 pt-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="shopSampleTexts" className="text-sm">
                                                今まで書いた文章のサンプル（2〜3投稿分コピペ・任意）
                                            </Label>
                                            <Textarea
                                                id="shopSampleTexts"
                                                value={shopInfo.sampleTexts || ""}
                                                onChange={(e) => setShopInfo({ ...shopInfo, sampleTexts: e.target.value })}
                                                placeholder="例：これまでSNSに投稿していた文章を2〜3件コピペすると、文体を学習します。"
                                                className="h-[100px] bg-zinc-950 border-zinc-800 text-zinc-100 resize-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="shopSnsUrl" className="text-sm">SNSのURL（任意）</Label>
                                            <Input
                                                id="shopSnsUrl"
                                                type="url"
                                                value={shopInfo.snsUrl || ""}
                                                onChange={(e) => setShopInfo({ ...shopInfo, snsUrl: e.target.value })}
                                                placeholder="例：https://instagram.com/〇〇"
                                                className="bg-zinc-950 border-zinc-800 text-zinc-100"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="shopFeatures" className="text-sm">その他特記事項（任意）</Label>
                                            <textarea id="shopFeatures" value={shopInfo.features} onChange={(e) => setShopInfo({ ...shopInfo, features: e.target.value })} placeholder="例：VIPルームあり、無料駐車場" className="flex min-h-[80px] w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white resize-y" />
                                        </div>
                                    </div>
                                </details>

                                {user?.email === ADMIN_EMAIL && (
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-emerald-500 text-sm flex items-center gap-2">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" /></svg>
                                            WordPress 投稿設定（任意）
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <Label htmlFor="wpCategoryId" className="text-xs">カテゴリ ID</Label>
                                                <Input id="wpCategoryId" value={shopInfo.wpCategoryId || ""} onChange={(e) => setShopInfo({ ...shopInfo, wpCategoryId: e.target.value })} className="bg-zinc-950 border-zinc-800 text-white" placeholder="例：1" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="wpTagId" className="text-xs">タグ ID</Label>
                                                <Input id="wpTagId" value={shopInfo.wpTagId || ""} onChange={(e) => setShopInfo({ ...shopInfo, wpTagId: e.target.value })} className="bg-zinc-950 border-zinc-800 text-white" placeholder="例：5" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="wpAuthorId" className="text-xs">著者 ID</Label>
                                                <Input id="wpAuthorId" value={shopInfo.wpAuthorId || ""} onChange={(e) => setShopInfo({ ...shopInfo, wpAuthorId: e.target.value })} className="bg-zinc-950 border-zinc-800 text-white" placeholder="例：1" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-zinc-200 text-base">出力する媒体</h4>
                                    <div className="flex flex-wrap gap-6">
                                        <label className="flex items-center gap-2 cursor-pointer select-none text-base text-zinc-100">
                                            <input type="checkbox" checked={shopInfo.outputTargets?.instagram ?? true} onChange={(e) => setShopInfo({ ...shopInfo, outputTargets: outputTargetsWith("instagram", e.target.checked) })} className="w-5 h-5 rounded accent-emerald-500" />
                                            Instagram用
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer select-none text-base text-zinc-100">
                                            <input type="checkbox" checked={shopInfo.outputTargets?.gbp ?? true} onChange={(e) => setShopInfo({ ...shopInfo, outputTargets: outputTargetsWith("gbp", e.target.checked) })} className="w-5 h-5 rounded accent-emerald-500" />
                                            Google Map/GBP用
                                        </label>
                                        <label className={`flex items-center gap-2 select-none text-base text-zinc-100 ${!canGenerateBlog ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
                                            <input type="checkbox" checked={canGenerateBlog ? (shopInfo.outputTargets?.portal ?? true) : false} onChange={(e) => setShopInfo({ ...shopInfo, outputTargets: outputTargetsWith("portal", e.target.checked) })} disabled={!canGenerateBlog} className="w-5 h-5 rounded accent-emerald-500" />
                                            ブログ用{!canGenerateBlog && <span className="text-xs text-amber-400">（プロプラン限定）</span>}
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer select-none text-base text-zinc-100">
                                            <input type="checkbox" checked={shopInfo.outputTargets?.line ?? true} onChange={(e) => setShopInfo({ ...shopInfo, outputTargets: outputTargetsWith("line", e.target.checked) })} className="w-5 h-5 rounded accent-emerald-500" />
                                            LINE用
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer select-none text-base text-zinc-100">
                                            <input type="checkbox" checked={shopInfo.outputTargets?.short ?? false} onChange={(e) => setShopInfo({ ...shopInfo, outputTargets: outputTargetsWith("short", e.target.checked) })} className="w-5 h-5 rounded accent-emerald-500" />
                                            ショート動画の台本
                                        </label>
                                    </div>
                                </div>
                                {(shopInfo.outputTargets?.short) && (
                                    <div className="space-y-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                                        <h4 className="font-semibold text-emerald-400 text-sm">ショート動画の設定（精度向上のため任意で入力）</h4>
                                        <p className="text-sm text-zinc-400">バズりやすいフックのタイプを選ぶと、台本の冒頭が安定して出ます。</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm text-zinc-300">想定尺（秒）</label>
                                                <select
                                                    value={shopInfo.shortTargetDuration ?? 60}
                                                    onChange={(e) => setShopInfo({ ...shopInfo, shortTargetDuration: Number(e.target.value) })}
                                                    className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                                                <label className="text-sm text-zinc-300">主な投稿先</label>
                                                <select
                                                    value={shopInfo.shortPlatform ?? ""}
                                                    onChange={(e) => setShopInfo({ ...shopInfo, shortPlatform: e.target.value })}
                                                    className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                >
                                                    <option value="">指定なし</option>
                                                    <option value="Instagram Reels">Instagram Reels</option>
                                                    <option value="TikTok">TikTok</option>
                                                    <option value="YouTube Shorts">YouTube Shorts</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2 sm:col-span-1">
                                                <label className="text-sm text-zinc-300">フックのタイプ</label>
                                                <select
                                                    value={shopInfo.shortHookType ?? SHORT_HOOK_OPTIONS[0].id}
                                                    onChange={(e) => setShopInfo({ ...shopInfo, shortHookType: e.target.value })}
                                                    className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                >
                                                    {SHORT_HOOK_OPTIONS.map((opt) => (
                                                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-3 pt-6">
                                    <Button type="button" variant="outline" className="border-zinc-600 text-zinc-300 hover:bg-zinc-800" onClick={() => setSetupStep(2)}>
                                        <ChevronLeft className="w-4 h-4 mr-1" /> 戻る
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 gradient-accent hover:opacity-95 text-zinc-950 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!isCtaSet(shopInfo)}
                                    >
                                        <Check className="w-4 h-4 mr-2 inline" />
                                        設定を保存してはじめる
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
