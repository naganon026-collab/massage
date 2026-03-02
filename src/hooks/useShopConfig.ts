import { useState, useEffect } from "react";
import { ShopInfo, ADMIN_EMAIL } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export function useShopConfig(
    user: User | null,
    addToast: (msg: string, type: "success" | "error") => void,
    onShopFetched?: (userId: string, isAdmin: boolean) => Promise<void>
) {
    const supabase = createClient();
    const [shopInfo, setShopInfo] = useState<ShopInfo>({
        name: "", address: "", phone: "", lineUrl: "", businessHours: "", holidays: "", features: "", industry: "", snsUrl: "", sampleTexts: "", referenceUrls: [],
        wpCategoryId: "", wpTagId: "", wpAuthorId: "",
        outputTargets: { instagram: true, gbp: true, portal: true, line: true, short: false }
    });
    const [isConfigured, setIsConfigured] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [scrapeUrl, setScrapeUrl] = useState<string>("");
    const [isScraping, setIsScraping] = useState<boolean>(false);
    const [isExtractingInfo, setIsExtractingInfo] = useState<boolean>(false);
    const [scrapedPreview, setScrapedPreview] = useState<string>("");
    const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1);
    const [setupPath, setSetupPath] = useState<"url" | "manual" | null>(null);
    const [settingsScrapeUrl, setSettingsScrapeUrl] = useState("");
    const [isScrapingSettings, setIsScrapingSettings] = useState(false);

    // shopInfoの変更をsessionStorageに自動保存
    useEffect(() => {
        if (user && !isLoading) {
            sessionStorage.setItem('shopInfoDraft', JSON.stringify(shopInfo));
        }
    }, [shopInfo, user, isLoading]);

    const fetchShopInfo = async (userId: string) => {
        setIsLoading(true);
        const { data } = await supabase.from('shops').select('settings').eq('user_id', userId).maybeSingle();

        let isAdmin = false;
        const currentUser = (await supabase.auth.getUser()).data.user;
        if (currentUser?.email === ADMIN_EMAIL) {
            isAdmin = true;
        }

        if (data && data.settings) {
            const draft = sessionStorage.getItem('shopInfoDraft');
            if (draft) {
                try {
                    const parsed = JSON.parse(draft);
                    setShopInfo(parsed);
                    if (parsed.scrapedContent) setScrapedPreview(parsed.scrapedContent);
                } catch {
                    setShopInfo((prev) => ({ ...prev, ...data.settings }));
                    if (data.settings.scrapedContent) setScrapedPreview(data.settings.scrapedContent);
                }
            } else {
                setShopInfo((prev) => ({ ...prev, ...data.settings }));
                if (data.settings.scrapedContent) setScrapedPreview(data.settings.scrapedContent);
            }
            setIsConfigured(true);
        } else {
            if (isAdmin) {
                setIsConfigured(true);
            } else {
                setIsConfigured(false);
            }
        }

        if (onShopFetched) {
            await onShopFetched(userId, isAdmin);
        }

        setIsLoading(false);
    };

    const handleScrapeUrlForSettings = async () => {
        if (!settingsScrapeUrl?.trim().startsWith("http")) {
            addToast("有効なURLを入力してください。", "error");
            return;
        }
        const urlToAdd = settingsScrapeUrl.trim();
        setIsScrapingSettings(true);
        try {
            const res = await fetch("/api/scrape", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: urlToAdd }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "抽出失敗");

            const extractRes = await fetch("/api/extract-info", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: data.text }),
            });
            const extracted = await extractRes.json();

            setShopInfo((prev) => {
                const next = { ...prev };
                if (extractRes.ok && extracted) {
                    if (extracted.industry) next.industry = extracted.industry;
                    if (extracted.name) next.name = extracted.name;
                    if (extracted.address) next.address = extracted.address;
                    if (extracted.phone) next.phone = extracted.phone;
                    if (extracted.lineUrl) next.lineUrl = extracted.lineUrl;
                    if (extracted.businessHours) next.businessHours = extracted.businessHours;
                    if (extracted.holidays) next.holidays = extracted.holidays;
                }
                next.scrapedContent = prev.scrapedContent
                    ? prev.scrapedContent + "\n\n---\n\n" + data.text
                    : data.text;
                next.referenceUrls = prev.referenceUrls.includes(urlToAdd)
                    ? prev.referenceUrls
                    : [...prev.referenceUrls, urlToAdd];
                return next;
            });
            setSettingsScrapeUrl("");
            addToast("URLから店舗情報を取得しました。", "success");
        } catch (error) {
            if (error instanceof Error) addToast(error.message, "error");
            else addToast("予期せぬエラーが発生しました", "error");
        } finally {
            setIsScrapingSettings(false);
        }
    };

    const saveShopInfo = async (infoToSave: typeof shopInfo) => {
        if (!user) return;
        const { error } = await supabase.from('shops').upsert({
            user_id: user.id,
            settings: infoToSave,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        if (error) addToast("保存に失敗しました：" + error.message, "error");
    };

    const handleSaveShopInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        const { error } = await supabase.from('shops').upsert({
            user_id: user.id,
            settings: shopInfo,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        if (error) {
            addToast("設定の保存に失敗しました：" + error.message, "error");
        } else {
            setIsConfigured(true);
            addToast("クラウドに設定を保存しました！", "success");
        }
    };

    const getMinimalShopInfo = (): ShopInfo => ({
        name: "未設定の店舗",
        address: "未設定",
        phone: "",
        lineUrl: "",
        businessHours: "未設定",
        holidays: "未設定",
        features: "",
        industry: "サロン",
        snsUrl: "",
        sampleTexts: "",
        scrapedContent: "",
        referenceUrls: [],
        wpCategoryId: "",
        wpTagId: "",
        wpAuthorId: "",
        outputTargets: { instagram: true, gbp: true, portal: true, line: true, short: false }
    });

    const handleSkipWithMinimal = async () => {
        if (!user) return;
        const minimal = getMinimalShopInfo();
        setShopInfo(minimal);
        const { error } = await supabase.from('shops').upsert({
            user_id: user.id,
            settings: minimal,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        if (error) {
            addToast("スキップの保存に失敗しました：" + error.message, "error");
        } else {
            setIsConfigured(true);
            addToast("あとで設定から店舗情報を入力できます", "success");
        }
    };

    const handleExtractInfo = async (textToExtract: string, overwrite = false, confirmOverwrite?: (conflicts: string[]) => boolean) => {
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
                return;
            }

            let allowOverwrite = overwrite;
            if (overwrite) {
                const conflicts: string[] = [];
                if (data.name && shopInfo.name && data.name.trim() !== shopInfo.name.trim()) conflicts.push("店舗名");
                if (data.address && shopInfo.address && data.address.trim() !== shopInfo.address.trim()) conflicts.push("住所");
                if (data.phone && shopInfo.phone && data.phone.trim() !== shopInfo.phone.trim()) conflicts.push("電話番号");

                if (conflicts.length > 0 && confirmOverwrite) {
                    const ok = confirmOverwrite(conflicts);
                    if (!ok) allowOverwrite = false;
                }
            }

            setShopInfo((prev) => {
                const nextInfo = { ...prev };
                if (data.industry && (allowOverwrite || !nextInfo.industry)) nextInfo.industry = data.industry;
                if (data.name && (allowOverwrite || !nextInfo.name)) nextInfo.name = data.name;
                if (data.address && (allowOverwrite || !nextInfo.address)) nextInfo.address = data.address;
                if (data.phone && (allowOverwrite || !nextInfo.phone)) nextInfo.phone = data.phone;
                if (data.lineUrl && (allowOverwrite || !nextInfo.lineUrl)) nextInfo.lineUrl = data.lineUrl;
                if (data.businessHours && (allowOverwrite || !nextInfo.businessHours)) nextInfo.businessHours = data.businessHours;
                if (data.holidays && (allowOverwrite || !nextInfo.holidays)) nextInfo.holidays = data.holidays;
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
            addToast("有効なURLを入力してください。", "error");
            return;
        }
        const urlToAdd = scrapeUrl;
        setIsScraping(true);
        try {
            const res = await fetch("/api/scrape", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: urlToAdd }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "抽出失敗");

            const hasExistingShop = !!(shopInfo.name?.trim() || shopInfo.address?.trim() || shopInfo.phone?.trim());
            if (hasExistingShop && data.text?.trim()) {
                const extractRes = await fetch("/api/extract-info", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: data.text }),
                });
                const extracted = await extractRes.json();
                if (extractRes.ok && extracted) {
                    const conflicts: string[] = [];
                    if (extracted.name?.trim() && shopInfo.name?.trim() && extracted.name.trim() !== shopInfo.name.trim()) conflicts.push("店舗名");
                    if (extracted.address?.trim() && shopInfo.address?.trim() && extracted.address.trim() !== shopInfo.address.trim()) conflicts.push("住所");
                    if (extracted.phone?.trim() && shopInfo.phone?.trim() && extracted.phone.trim() !== shopInfo.phone.trim()) conflicts.push("電話番号");
                    if (conflicts.length > 0) {
                        const doOverwrite = window.confirm("別のお店のURLのようです。このURLで全て書き換えますか。");
                        if (!doOverwrite) {
                            setScrapeUrl("");
                            setIsScraping(false);
                            return;
                        }
                        setShopInfo((prev) => ({
                            ...prev,
                            name: extracted.name || prev.name,
                            address: extracted.address || prev.address,
                            phone: extracted.phone || prev.phone,
                            industry: extracted.industry || prev.industry,
                            businessHours: extracted.businessHours || prev.businessHours,
                            holidays: extracted.holidays || prev.holidays,
                            lineUrl: extracted.lineUrl || prev.lineUrl,
                            referenceUrls: [urlToAdd],
                            scrapedContent: data.text,
                        }));
                        setScrapedPreview(data.text);
                        addToast("新しい店舗情報を取得しました", "success");
                        setScrapeUrl("");
                        setIsScraping(false);
                        return;
                    }
                }
            }

            setShopInfo((prev) => ({
                ...prev,
                scrapedContent: prev.scrapedContent ? prev.scrapedContent + "\n\n---\n\n" + data.text : data.text,
                referenceUrls: prev.referenceUrls.includes(urlToAdd) ? prev.referenceUrls : [...prev.referenceUrls, urlToAdd]
            }));
            setScrapedPreview((prev) => prev ? prev + "\n\n---\n\n" + data.text : data.text);

            await handleExtractInfo(data.text, false);
            addToast("URLから店舗情報を取得しました。", "success");
            setScrapeUrl("");
            setSetupStep(2);
        } catch (error) {
            if (error instanceof Error) addToast(error.message, "error");
            else addToast("予期せぬエラーが発生しました", "error");
        } finally {
            setIsScraping(false);
        }
    };

    const handleQuickSaveSettings = async (onSuccess?: () => void) => {
        if (!user) return;
        const { error } = await supabase.from('shops').upsert({
            user_id: user.id,
            settings: shopInfo,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        if (error) {
            addToast("保存に失敗しました: " + error.message, "error");
        } else {
            addToast("店舗設定を保存しました", "success");
            onSuccess?.();
        }
    };

    return {
        shopInfo, setShopInfo,
        isConfigured, setIsConfigured,
        isLoading, setIsLoading,
        scrapeUrl, setScrapeUrl,
        isScraping, setIsScraping,
        isExtractingInfo, setIsExtractingInfo,
        scrapedPreview, setScrapedPreview,
        setupStep, setSetupStep,
        setupPath, setSetupPath,
        settingsScrapeUrl, setSettingsScrapeUrl,
        isScrapingSettings, setIsScrapingSettings,
        fetchShopInfo,
        handleScrapeUrlForSettings,
        saveShopInfo,
        handleSaveShopInfo,
        handleSkipWithMinimal,
        handleExtractInfo,
        handleScrapeUrl,
        handleQuickSaveSettings,
    };
}
