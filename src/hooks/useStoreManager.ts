import { useState } from "react";
import { StoreRecord, ShopInfo, ADMIN_EMAIL } from "@/types";
import { createClient } from "@/lib/supabase/client";

export function useStoreManager(user: any, addToast: (msg: string, type: "success" | "error") => void) {
    const supabase = createClient();

    const [stores, setStores] = useState<StoreRecord[]>([]);
    const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
    const [showStoreManager, setShowStoreManager] = useState(false);
    const [showStoreForm, setShowStoreForm] = useState(false);
    const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
    const [storeFormData, setStoreFormData] = useState<ShopInfo>({
        name: "", address: "", phone: "", lineUrl: "", businessHours: "", holidays: "",
        features: "", industry: "", snsUrl: "", sampleTexts: "", referenceUrls: [],
        wpCategoryId: "", wpTagId: "", wpAuthorId: "",
        outputTargets: { instagram: true, gbp: true, portal: true, line: true, short: false }
    });
    const [isSavingStore, setIsSavingStore] = useState(false);
    const [isDeletingStore, setIsDeletingStore] = useState<string | null>(null);
    const [storeScrapeUrl, setStoreScrapeUrl] = useState("");
    const [isScrapingStore, setIsScrapingStore] = useState(false);

    const fetchStores = async () => {
        const { data, error } = await supabase
            .from('stores')
            .select('id, name, settings, created_at, updated_at')
            .order('created_at', { ascending: false });
        if (!error && data) {
            setStores(data as StoreRecord[]);
        }
    };

    const handleSaveStore = async () => {
        if (!storeFormData.name?.trim()) {
            addToast("店舗名を入力してください。", "error");
            return;
        }
        if (!storeFormData.address?.trim()) {
            addToast("住所を入力してください。", "error");
            return;
        }
        if (!storeFormData.phone?.trim()) {
            addToast("電話番号を入力してください。", "error");
            return;
        }
        if (!storeFormData.businessHours?.trim()) {
            addToast("営業時間を入力してください。", "error");
            return;
        }
        if (!storeFormData.holidays?.trim()) {
            addToast("定休日を入力してください。", "error");
            return;
        }
        setIsSavingStore(true);
        try {
            if (editingStoreId) {
                // 既存店舗の更新
                const { error } = await supabase.from('stores').update({
                    name: storeFormData.name,
                    settings: storeFormData,
                    updated_at: new Date().toISOString(),
                }).eq('id', editingStoreId);
                if (error) throw error;
                addToast("店舗情報を更新しました。", "success");
            } else {
                // 新規店舗の作成
                const { error } = await supabase.from('stores').insert({
                    owner_email: user?.email ?? ADMIN_EMAIL,
                    name: storeFormData.name,
                    settings: storeFormData,
                });
                if (error) throw error;
                addToast("新しい店舗を登録しました！", "success");
            }
            await fetchStores();
            setShowStoreForm(false);
            setShowStoreManager(false);
            setEditingStoreId(null);
            setStoreScrapeUrl("");
            setStoreFormData({
                name: "", address: "", phone: "", lineUrl: "", businessHours: "", holidays: "",
                features: "", industry: "", snsUrl: "", sampleTexts: "", referenceUrls: [],
                wpCategoryId: "", wpTagId: "", wpAuthorId: "",
                outputTargets: { instagram: true, gbp: true, portal: true, line: true }
            });
        } catch (err) {
            // PostgrestError は instanceof Error が false になるため、messageプロパティを直接取得する
            const message = err instanceof Error
                ? err.message
                : (err as { message?: string })?.message ?? "不明なエラーが発生しました";
            addToast("保存に失敗しました: " + message, "error");
        } finally {
            setIsSavingStore(false);
        }
    };

    const handleDeleteStore = async (storeId: string) => {
        if (!confirm("この店舗を削除してもよいですか？")) return;
        setIsDeletingStore(storeId);
        const { error } = await supabase.from('stores').delete().eq('id', storeId);
        if (error) {
            addToast("削除に失敗しました: " + error.message, "error");
        } else {
            addToast("店舗を削除しました。", "success");
            if (selectedStoreId === storeId) setSelectedStoreId(null);
            await fetchStores();
        }
        setIsDeletingStore(null);
    };

    const openEditStore = (store: StoreRecord) => {
        setEditingStoreId(store.id);
        setStoreFormData(store.settings);
        setShowStoreForm(true);
    };

    const handleScrapeUrlForStore = async () => {
        if (!storeScrapeUrl?.trim().startsWith("http")) {
            addToast("有効なURLを入力してください。", "error");
            return;
        }
        const urlToAdd = storeScrapeUrl.trim();
        setIsScrapingStore(true);
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

            setStoreFormData((prev) => {
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
            setStoreScrapeUrl("");
            addToast("URLから店舗情報を取得しました。", "success");
        } catch (error) {
            if (error instanceof Error) addToast(error.message, "error");
            else addToast("予期せぬエラーが発生しました", "error");
        } finally {
            setIsScrapingStore(false);
        }
    };

    return {
        stores,
        setStores,
        selectedStoreId,
        setSelectedStoreId,
        showStoreManager,
        setShowStoreManager,
        showStoreForm,
        setShowStoreForm,
        editingStoreId,
        setEditingStoreId,
        storeFormData,
        setStoreFormData,
        isSavingStore,
        isDeletingStore,
        storeScrapeUrl,
        setStoreScrapeUrl,
        isScrapingStore,
        fetchStores,
        handleSaveStore,
        handleDeleteStore,
        openEditStore,
        handleScrapeUrlForStore,
    };
}
