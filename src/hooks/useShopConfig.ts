import { useState, useEffect, useRef } from "react";
import { ShopInfo, ADMIN_EMAIL, isCtaSet } from "@/types";
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
    const [analysisResult, setAnalysisResult] = useState<{
        concept: { status: string; reason: string };
        strengths: { status: string; reason: string };
        target: { status: string; reason: string };
        staff: { status: string; reason: string };
        voice: { status: string; reason: string };
    } | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // debounce用タイマーを保持するref
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // shopInfoの変更をsessionStorageに自動保存（500msデバウンスで書き込み頻度を抑制）
    useEffect(() => {
        if (user && !isLoading) {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
                sessionStorage.setItem('shopInfoDraft', JSON.stringify(shopInfo));
            }, 500);
        }
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [shopInfo, user, isLoading]);

    const fetchShopInfo = async (userId: string, userEmail?: string) => {
        setIsLoading(true);
        const { data } = await supabase.from('shops').select('settings').eq('user_id', userId).maybeSingle();

        // 引数で渡されたメールアドレスを使い、追加のgetUser()呼び出しを排除
        const isAdmin = userEmail === ADMIN_EMAIL;

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

            setIsAnalyzing(true);
            try {
                const analyzeRes = await fetch("/api/analyze-shop", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ scrapedContent: data.text }),
                });
                const analysis = await analyzeRes.json();
                const keys = ["concept", "strengths", "target", "staff", "voice"] as const;
                const isValid = analyzeRes.ok && keys.every(
                    (k) => analysis?.[k] && typeof analysis[k].status === "string" && typeof analysis[k].reason === "string"
                );
                if (isValid) {
                    setAnalysisResult(analysis);
                } else if (!analyzeRes.ok) {
                    const msg = analysis?.error ?? "";
                    if (typeof msg === "string" && msg.includes("GEMINI_API_KEY")) {
                        addToast("AI分析を利用するには .env.local に GEMINI_API_KEY を設定してください。", "error");
                    } else {
                        addToast("AI分析に失敗しました。", "error");
                    }
                }
            } catch (e) {
                console.error("分析エラー:", e);
                addToast("AI分析の通信に失敗しました。", "error");
            } finally {
                setIsAnalyzing(false);
            }
        } catch (error) {
            if (error instanceof Error) addToast(error.message, "error");
            else addToast("予期せぬエラーが発生しました", "error");
        } finally {
            setIsScrapingSettings(false);
        }
    };

    /** 設定画面用：複数URLを順に読み取り、scrapedContent に追記して extract・分析まで実行 */
    const handleScrapeUrlsForSettings = async (urls: string[]) => {
        const valid = urls.filter((u) => u?.trim().startsWith("http"));
        if (valid.length === 0) {
            addToast("1つ以上有効なURLを入力してください。", "error");
            return;
        }
        setIsScrapingSettings(true);
        try {
            let allText = "";
            const addedUrls: string[] = [];
            for (const url of valid) {
                const res = await fetch("/api/scrape", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: url.trim() }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "読み取り失敗");
                if (data.text?.trim()) {
                    const sep = allText ? "\n\n---\n\n" : "";
                    allText += sep + data.text.trim();
                    addedUrls.push(url.trim());
                }
            }
            if (!allText) {
                addToast("読み取れたテキストがありませんでした。", "error");
                return;
            }
            const fullText = (shopInfo.scrapedContent || "").trim()
                ? (shopInfo.scrapedContent || "") + "\n\n---\n\n" + allText
                : allText;
            setShopInfo((prev) => ({
                ...prev,
                scrapedContent: fullText,
                referenceUrls: [...new Set([...prev.referenceUrls, ...addedUrls])],
            }));
            await handleExtractInfo(fullText, false);
            addToast(`${addedUrls.length}件のURLから読み取りました。下の枠に追記されました。`, "success");
            setIsAnalyzing(true);
            try {
                const analyzeRes = await fetch("/api/analyze-shop", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ scrapedContent: fullText }),
                });
                const analysis = await analyzeRes.json();
                const keys = ["concept", "strengths", "target", "staff", "voice"] as const;
                const isValid = analyzeRes.ok && keys.every(
                    (k) => analysis?.[k] && typeof analysis[k].status === "string" && typeof analysis[k].reason === "string"
                );
                if (isValid) setAnalysisResult(analysis);
            } catch (e) {
                console.error("分析エラー:", e);
            } finally {
                setIsAnalyzing(false);
            }
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

    const handleSaveShopInfo = async (
        e: React.FormEvent,
        options?: { fromStep3Complete?: boolean }
    ): Promise<boolean> => {
        e.preventDefault();
        if (!user) return false;
        if (options?.fromStep3Complete && !isCtaSet(shopInfo)) {
            addToast("締め文を設定してください。予約・問い合わせの誘導の種類とURL・電話番号を入力してください。", "error");
            return false;
        }
        const { error } = await supabase.from('shops').upsert({
            user_id: user.id,
            settings: shopInfo,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        if (error) {
            addToast("設定の保存に失敗しました：" + error.message, "error");
            return false;
        }
        if (!options?.fromStep3Complete) {
            setIsConfigured(true);
        }
        addToast("クラウドに設定を保存しました！", "success");
        return true;
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
                const msg = typeof data?.error === "string" ? data.error : "基本情報の自動抽出に失敗しました。";
                if (msg.includes("GEMINI_API_KEY") || msg.includes("Gemini APIキー")) {
                    addToast("基本情報の自動抽出には .env.local に GEMINI_API_KEY の設定が必要です。", "error");
                } else {
                    addToast(msg, "error");
                }
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

    /** URL読み取り＋基本情報抽出＋次へ を1ボタンで完結（初回設定用） */
    const handleReadAndProceed = async (
        urls: string[],
        existingText: string,
        onProceed: () => void
    ): Promise<void> => {
        const validUrls = urls.filter((u) => u?.trim().startsWith("http"));
        let fullText = (existingText ?? "").trim();

        if (validUrls.length > 0) {
            setIsScraping(true);
            try {
                let allText = "";
                const addedUrls: string[] = [];
                for (const url of validUrls) {
                    const res = await fetch("/api/scrape", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url: url.trim() }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "読み取り失敗");
                    if (data.text?.trim()) {
                        const sep = allText ? "\n\n---\n\n" : "";
                        allText += sep + data.text.trim();
                        addedUrls.push(url.trim());
                    }
                }
                const scrapedContent = shopInfo.scrapedContent ? shopInfo.scrapedContent + "\n\n---\n\n" + allText : allText;
                fullText = fullText ? fullText + "\n\n---\n\n" + allText : allText;
                setScrapedPreview((prev) => (prev ? prev + "\n\n---\n\n" + allText : allText));
                setShopInfo((prev) => ({
                    ...prev,
                    scrapedContent,
                    referenceUrls: [...new Set([...prev.referenceUrls, ...addedUrls])],
                }));
                if (!allText) {
                    addToast("読み取れたテキストがありませんでした。", "error");
                    return;
                }
            } catch (error) {
                if (error instanceof Error) addToast(error.message, "error");
                else addToast("予期せぬエラーが発生しました", "error");
                return;
            } finally {
                setIsScraping(false);
            }
        }

        if (!fullText.trim()) {
            addToast("URLを入力するか、テキストを貼り付けてください。", "error");
            return;
        }

        if (validUrls.length === 0) {
            setShopInfo((prev) => ({ ...prev, scrapedContent: fullText }));
        }

        setIsExtractingInfo(true);
        try {
            const textToExtract = fullText + "\n" + (shopInfo.features || "") + "\n" + (shopInfo.sampleTexts || "");
            const res = await fetch("/api/extract-info", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: textToExtract }),
            });
            const data = await res.json();

            if (!res.ok) {
                const msg = typeof data?.error === "string" ? data.error : "基本情報の自動抽出に失敗しました。";
                if (msg.includes("GEMINI_API_KEY") || msg.includes("Gemini APIキー")) {
                    addToast("基本情報の自動抽出には .env.local に GEMINI_API_KEY の設定が必要です。手動で入力してください。", "error");
                } else {
                    addToast(msg + " 手動で入力してください。", "error");
                }
                return;
            }

            setShopInfo((prev) => {
                const nextInfo = { ...prev };
                if (data.industry) nextInfo.industry = data.industry;
                if (data.name) nextInfo.name = data.name;
                if (data.address) nextInfo.address = data.address;
                if (data.phone) nextInfo.phone = data.phone;
                if (data.lineUrl) nextInfo.lineUrl = data.lineUrl;
                if (data.businessHours) nextInfo.businessHours = data.businessHours;
                if (data.holidays) nextInfo.holidays = data.holidays;
                return nextInfo;
            });

            if (data.name || data.address || data.phone) {
                addToast("店舗名・住所・電話番号などを自動入力しました。", "success");
            }
            onProceed();
        } catch (error) {
            console.error("情報抽出エラー:", error);
            addToast("基本情報の自動抽出に失敗しました。手動で入力してください。", "error");
        } finally {
            setIsExtractingInfo(false);
        }
    };

    /** 複数URLを順に読み取り、結果を蓄積エリアに追記する（初回設定用）。step は進めない。 */
    const handleScrapeUrls = async (urls: string[]) => {
        const valid = urls.filter((u) => u?.trim().startsWith("http"));
        if (valid.length === 0) {
            addToast("1つ以上有効なURLを入力してください。", "error");
            return;
        }
        setIsScraping(true);
        try {
            let allText = "";
            const addedUrls: string[] = [];
            for (const url of valid) {
                const res = await fetch("/api/scrape", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: url.trim() }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "読み取り失敗");
                if (data.text?.trim()) {
                    const sep = allText ? "\n\n---\n\n" : "";
                    allText += sep + data.text.trim();
                    addedUrls.push(url.trim());
                }
            }
            if (allText) {
                const fullText = shopInfo.scrapedContent ? shopInfo.scrapedContent + "\n\n---\n\n" + allText : allText;
                setScrapedPreview((prev) => (prev ? prev + "\n\n---\n\n" + allText : allText));
                addToast(`${addedUrls.length}件のURLから読み取りました。基本情報を抽出しています…`, "success");
                try {
                    const extractRes = await fetch("/api/extract-info", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text: fullText }),
                    });
                    const extracted = await extractRes.json();
                    setShopInfo((prev) => {
                        const next = {
                            ...prev,
                            scrapedContent: prev.scrapedContent ? prev.scrapedContent + "\n\n---\n\n" + allText : allText,
                            referenceUrls: [...new Set([...prev.referenceUrls, ...addedUrls])],
                        };
                        if (extractRes.ok && extracted) {
                            if (extracted.industry) next.industry = extracted.industry;
                            if (extracted.name) next.name = extracted.name;
                            if (extracted.address) next.address = extracted.address;
                            if (extracted.phone) next.phone = extracted.phone;
                            if (extracted.lineUrl) next.lineUrl = extracted.lineUrl;
                            if (extracted.businessHours) next.businessHours = extracted.businessHours;
                            if (extracted.holidays) next.holidays = extracted.holidays;
                        }
                        return next;
                    });
                    if (extractRes.ok && extracted && (extracted.name || extracted.address || extracted.phone)) {
                        addToast("店舗名・住所・電話番号などを自動入力しました。", "success");
                    } else if (!extractRes.ok) {
                        const errMsg = typeof extracted?.error === "string" ? extracted.error : "基本情報の自動抽出に失敗しました。";
                        if (errMsg.includes("GEMINI_API_KEY") || errMsg.includes("Gemini APIキー")) {
                            addToast("基本情報の自動抽出には .env.local に GEMINI_API_KEY の設定が必要です。手動で入力してください。", "error");
                        } else {
                            addToast(errMsg + " 手動で入力してください。", "error");
                        }
                    }
                } catch (e) {
                    console.error("情報抽出エラー:", e);
                    setShopInfo((prev) => ({
                        ...prev,
                        scrapedContent: prev.scrapedContent ? prev.scrapedContent + "\n\n---\n\n" + allText : allText,
                        referenceUrls: [...new Set([...prev.referenceUrls, ...addedUrls])],
                    }));
                    addToast("基本情報の自動抽出に失敗しました（通信エラー）。手動で入力してください。", "error");
                }
            } else {
                addToast("読み取れたテキストがありませんでした。", "error");
            }
        } catch (error) {
            if (error instanceof Error) addToast(error.message, "error");
            else addToast("予期せぬエラーが発生しました", "error");
        } finally {
            setIsScraping(false);
        }
    };

    const handleQuickSaveSettings = async (onSuccess?: () => void) => {
        if (!user) return;
        const supplements = shopInfo.manualSupplements;
        const supplementText = supplements
            ? Object.entries(supplements)
                .filter(([, v]) => v && String(v).trim() !== "")
                .map(([key, value]) => {
                    const labels: Record<string, string> = {
                        concept: "サロンのコンセプト",
                        strengths: "強み・得意施術",
                        target: "ターゲット顧客",
                        staff: "スタッフ情報",
                        voice: "お客様の声",
                    };
                    return `【${labels[key] ?? key}】\n${value}`;
                })
                .join("\n\n")
            : "";
        const mergedFeatures = [shopInfo.features, supplementText].filter(Boolean).join("\n\n");
        const shopInfoToSave = { ...shopInfo, features: mergedFeatures };
        const { error } = await supabase.from('shops').upsert({
            user_id: user.id,
            settings: shopInfoToSave,
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
        handleScrapeUrlsForSettings,
        saveShopInfo,
        handleSaveShopInfo,
        handleSkipWithMinimal,
        handleExtractInfo,
        handleScrapeUrl,
        handleScrapeUrls,
        handleReadAndProceed,
        handleQuickSaveSettings,
        analysisResult,
        isAnalyzing,
        setAnalysisResult,
    };
}
