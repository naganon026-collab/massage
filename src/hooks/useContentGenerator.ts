import { useState } from "react";
import { Pattern, HistoryEntry, NewsItem, ShopInfo, PATTERNS, StoreRecord, ShortScriptData, LlmoArticleData } from "@/types";
const REFINE_TAB_IDS = ["instagram", "gbp", "portal", "line", "short"] as const;
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export function useContentGenerator(
    user: User | null,
    shopInfo: ShopInfo,
    stores: StoreRecord[],
    selectedStoreId: string | null,
    addToast: (msg: string, type: "success" | "error") => void,
    onGenerateSuccess?: () => void
) {
    const supabase = createClient();

    const [selectedPattern, setSelectedPattern] = useState<Pattern>("A");
    const [formData, setFormData] = useState({ q1: "", q2: "", q3: "" });

    const [replyPlatform, setReplyPlatform] = useState<"sns" | "gbp">("sns");
    const [receivedComment, setReceivedComment] = useState("");
    const [replyNote, setReplyNote] = useState("");

    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [selectedNewsIndex, setSelectedNewsIndex] = useState<number | null>(null);
    const [isLoadingNews, setIsLoadingNews] = useState(false);

    const [uploadImageData, setUploadImageData] = useState<{ mimeType: string; data: string } | null>(null);

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedResults, setGeneratedResults] = useState<{
        instagram?: string;
        gbp?: string;
        portal?: string;
        portalTitle?: string;
        imageUrl?: string;
        reply?: string;
        line?: string;
        shortScript?: string | ShortScriptData;
        llmo?: LlmoArticleData;
    } | null>(null);

    const [copiedTab, setCopiedTab] = useState<string | null>(null);
    const [editingTab, setEditingTab] = useState<string | null>(null);
    const [isPostingToWP, setIsPostingToWP] = useState(false);

    const [generationHistory, setGenerationHistory] = useState<HistoryEntry[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null);

    const [refineInstruction, setRefineInstructionState] = useState<Record<string, string | null>>(
        Object.fromEntries(REFINE_TAB_IDS.map((id) => [id, null]))
    );
    const [isRefining, setIsRefining] = useState(false);
    const [isLlmoGenerating, setIsLlmoGenerating] = useState(false);

    const setRefineInstruction = (tabId: string, value: string | null) => {
        setRefineInstructionState((prev) => ({ ...prev, [tabId]: value }));
    };

    const currentPattern = PATTERNS.find(p => p.id === selectedPattern)!;

    const fetchHistory = async (userId: string) => {
        const { data, error } = await supabase
            .from('generation_history')
            .select('id, pattern_id, pattern_title, inputs, results, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);
        if (!error && data) {
            setGenerationHistory(data as HistoryEntry[]);
        }
    };

    // fetchHistoryはonShopFetchedコールバック経由（page.tsx）からのみ呼ばれる
    // useEffectでの自動呼び出しを廃止し、二重フェッチを防止

    const handleRestoreHistory = (entry: HistoryEntry) => {
        const patternId = entry.pattern_id as Pattern;
        setSelectedPattern(patternId);
        setGeneratedResults(entry.results);
        if (patternId === 'G') {
            setReplyPlatform(entry.inputs.platform ?? 'sns');
            setReceivedComment(entry.inputs.receivedComment ?? '');
            setReplyNote(entry.inputs.replyNote ?? '');
        } else if (patternId === 'I') {
            setUploadImageData(null);
        } else {
            setFormData({
                q1: entry.inputs.q1 ?? '',
                q2: entry.inputs.q2 ?? '',
                q3: entry.inputs.q3 ?? '',
            });
        }
        setShowHistory(false);
        setTimeout(() => window.scrollTo({ top: 999, behavior: 'smooth' }), 100);
    };

    const handleDeleteHistory = async (entryId: string) => {
        setDeletingHistoryId(entryId);
        const { error } = await supabase
            .from('generation_history')
            .delete()
            .eq('id', entryId);
        if (error) {
            addToast("履歴の削除に失敗しました", "error");
        } else {
            setGenerationHistory((prev) => prev.filter((e) => e.id !== entryId));
        }
        setDeletingHistoryId(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handlePatternChange = (patternId: Pattern) => {
        setSelectedPattern(patternId);
        if (patternId !== "I") setUploadImageData(null);
        setFormData({ q1: "", q2: "", q3: "" });
        setReceivedComment("");
        setReplyNote("");
        setNewsItems([]);
        setSelectedNewsIndex(null);
        setGeneratedResults(null);
    };

    const handleFetchNews = async () => {
        if (!shopInfo.industry) {
            addToast("まず初期設定で業種を入力してください。", "error");
            return;
        }
        setIsLoadingNews(true);
        try {
            const res = await fetch("/api/news", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    industry: shopInfo.industry,
                    address: shopInfo.address || "",
                }),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.error || "ニュースの取得に失敗しました。");
            }
            const articles: NewsItem[] = data.articles || [];
            setNewsItems(articles);
            setSelectedNewsIndex(articles.length > 0 ? 0 : null);
            if (articles.length > 0) {
                addToast(`ニュース候補を${articles.length}件取得しました。`, "success");
            } else {
                addToast("本日は該当するニュースはありませんでした。", "error");
            }
        } catch (error) {
            if (error instanceof Error) {
                addToast(error.message, "error");
            } else {
                addToast("ニュースの取得中にエラーが発生しました。", "error");
            }
        } finally {
            setIsLoadingNews(false);
        }
    };

    const handleGenerate = async () => {
        if (selectedPattern === "H") {
            if (selectedNewsIndex === null || !newsItems[selectedNewsIndex]) {
                addToast("まずニュースを選択してください。", "error");
                return;
            }
        }
        if (selectedPattern === "I") {
            if (!uploadImageData) {
                addToast("画像をアップロードしてください。", "error");
                return;
            }
        }
        setIsGenerating(true);

        try {
            const endpoint = selectedPattern === "G" ? "/api/generate-reply" : "/api/generate";
            const selectedNews = selectedPattern === "H" && selectedNewsIndex !== null
                ? newsItems[selectedNewsIndex]
                : undefined;

            const activeShopInfo: ShopInfo = (() => {
                if (selectedStoreId) {
                    const found = stores.find(s => s.id === selectedStoreId);
                    if (found) return found.settings;
                }
                return shopInfo;
            })();

            const requestBody =
                selectedPattern === "G"
                    ? {
                        patternTitle: currentPattern.title,
                        platform: replyPlatform,
                        receivedComment,
                        replyNote,
                        shopInfo: activeShopInfo,
                    }
                    : selectedPattern === "H"
                        ? {
                            patternTitle: currentPattern.title,
                            q1: "",
                            q2: "",
                            q3: "",
                            shopInfo: activeShopInfo,
                            outputTargets: activeShopInfo.outputTargets || { instagram: true, gbp: true, portal: true, line: false, short: false },
                            news: selectedNews,
                            generatedAt: new Date().toISOString(),
                        }
                        : selectedPattern === "I"
                            ? {
                                patternTitle: currentPattern.title,
                                q1: "",
                                q2: "",
                                q3: "",
                                shopInfo: activeShopInfo,
                                outputTargets: activeShopInfo.outputTargets || { instagram: true, gbp: true, portal: true, line: false, short: false },
                                imageData: uploadImageData!,
                                generatedAt: new Date().toISOString(),
                            }
                            : {
                                patternTitle: currentPattern.title,
                                q1: formData.q1,
                                q2: formData.q2,
                                q3: formData.q3,
                                shopInfo: activeShopInfo,
                                outputTargets: activeShopInfo.outputTargets || { instagram: true, gbp: true, portal: true, line: false, short: false },
                                generatedAt: new Date().toISOString(),
                            };

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || "APIリクエストに失敗しました。");
            }

            const data = responseData;

            if (data.error) {
                throw new Error(data.error);
            }

            setGeneratedResults({
                instagram: data.instagram,
                gbp: data.gbp,
                portal: data.portal,
                portalTitle: data.portalTitle,
                imageUrl: data.imageUrl,
                reply: data.reply,
                line: data.line,
                shortScript: data.shortScript,
                llmo: data.llmo,
            });

            if (user) {
                const inputs =
                    selectedPattern === 'G'
                        ? { platform: replyPlatform, receivedComment, replyNote }
                        : selectedPattern === 'H'
                            ? { newsTitle: selectedNews?.title, newsLink: selectedNews?.link }
                            : selectedPattern === 'I'
                                ? { imageUploaded: true }
                                : { q1: formData.q1, q2: formData.q2, q3: formData.q3 };
                supabase.from('generation_history').insert({
                    user_id: user.id,
                    pattern_id: selectedPattern,
                    pattern_title: currentPattern.title,
                    inputs,
                    results: {
                        instagram: data.instagram,
                        gbp: data.gbp,
                        portal: data.portal,
                        portalTitle: data.portalTitle,
                        line: data.line,
                        reply: data.reply,
                        shortScript: data.shortScript,
                        llmo: data.llmo,
                    },
                }).then(({ error }) => {
                    if (error) console.error('履歴保存エラー:', error);
                    else fetchHistory(user.id);
                });
            }

            if (onGenerateSuccess) onGenerateSuccess();
            addToast("生成完了！おつかれさまでした。", "success");

        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                addToast(error.message || "テキストの生成中にエラーが発生しました。", "error");
            } else {
                addToast("テキストの生成中にエラーが発生しました。", "error");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePostToWP = async (status: "draft" | "publish") => {
        if (!generatedResults?.portalTitle || !generatedResults?.portal) {
            addToast("ポータルサイト用のタイトルと本文が生成されていません。", "error");
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

            addToast(`WordPressへ${actionText}しました！（投稿ID: ${data.postId}）`, "success");
            if (data.link) {
                window.open(data.link, '_blank');
            }
        } catch (error) {
            if (error instanceof Error) {
                addToast("エラーが発生しました: " + error.message, "error");
            } else {
                addToast("予期せぬエラーが発生しました", "error");
            }
        } finally {
            setIsPostingToWP(false);
        }
    };

    const handleCopy = (text: string, tabId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedTab(tabId);
        setTimeout(() => setCopiedTab(null), 2000);
    };

    const handleRefine = async (
        tabId: string,
        currentText: string,
        extra?: { portalTitle?: string }
    ) => {
        const instruction = refineInstruction[tabId];
        if (!instruction?.trim()) {
            addToast("改善指示を1つ選んでから「選択して再生成」を押してください。", "error");
            return;
        }
        const activeShopInfo: ShopInfo = selectedStoreId
            ? (stores.find((s) => s.id === selectedStoreId)?.settings ?? shopInfo)
            : shopInfo;

        setIsRefining(true);
        try {
            const body: Record<string, unknown> = {
                currentText,
                instruction,
                target: tabId,
                shopInfo: {
                    name: activeShopInfo.name,
                    industry: activeShopInfo.industry,
                    lineUrl: activeShopInfo.lineUrl,
                    sampleTexts: activeShopInfo.sampleTexts,
                },
                patternTitle: currentPattern.title,
            };
            if (tabId === "portal" && extra?.portalTitle) body.portalTitle = extra.portalTitle;

            const res = await fetch("/api/generate-refine", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "再生成に失敗しました。");

            setGeneratedResults((prev) => (prev ? { ...prev, ...data } : prev));
            addToast("改善して再生成しました。", "success");
        } catch (e) {
            const msg = e instanceof Error ? e.message : "再生成中にエラーが発生しました。";
            addToast(msg, "error");
        } finally {
            setIsRefining(false);
        }
    };

    const handleGenerateLlmo = async () => {
        if (!generatedResults?.portal || !generatedResults?.portalTitle) {
            addToast("まずブログ用のタイトルと本文を生成してください。", "error");
            return;
        }

        const activeShopInfo: ShopInfo = selectedStoreId
            ? (stores.find((s) => s.id === selectedStoreId)?.settings ?? shopInfo)
            : shopInfo;

        setIsLlmoGenerating(true);
        try {
            const res = await fetch("/api/llmo-enhance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: generatedResults.portalTitle,
                    html: generatedResults.portal,
                    shopInfo: {
                        name: activeShopInfo.name,
                        address: activeShopInfo.address,
                        industry: activeShopInfo.industry,
                        features: activeShopInfo.features,
                    },
                }),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.error || "LLMO対応データの生成に失敗しました。");
            }

            setGeneratedResults(prev => prev ? { ...prev, llmo: data as LlmoArticleData } : prev);

            if (user && generatedResults) {
                supabase.from('generation_history')
                    .update({ results: { ...generatedResults, llmo: data as LlmoArticleData } })
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .then(({ error }) => {
                        if (error) console.error('LLMO結果の履歴更新エラー:', error);
                        else fetchHistory(user.id);
                    });
            }

            addToast("LLMO対応の構造化データを生成しました。", "success");
        } catch (e) {
            const msg = e instanceof Error ? e.message : "LLMO対応データの生成中にエラーが発生しました。";
            addToast(msg, "error");
        } finally {
            setIsLlmoGenerating(false);
        }
    };

    return {
        selectedPattern, setSelectedPattern,
        formData, setFormData,
        replyPlatform, setReplyPlatform,
        receivedComment, setReceivedComment,
        replyNote, setReplyNote,
        newsItems, setNewsItems,
        selectedNewsIndex, setSelectedNewsIndex,
        isLoadingNews, setIsLoadingNews,
        uploadImageData, setUploadImageData,
        isGenerating, setIsGenerating,
        generatedResults, setGeneratedResults,
        copiedTab, setCopiedTab,
        editingTab, setEditingTab,
        isPostingToWP, setIsPostingToWP,
        generationHistory, setGenerationHistory,
        showHistory, setShowHistory,
        deletingHistoryId, setDeletingHistoryId,
        currentPattern,
        fetchHistory,
        handleRestoreHistory,
        handleDeleteHistory,
        handleInputChange,
        handlePatternChange,
        handleFetchNews,
        handleGenerate,
        handlePostToWP,
        handleCopy,
        refineInstruction,
        setRefineInstruction,
        isRefining,
        handleRefine,
        isLlmoGenerating,
        handleGenerateLlmo,
    };
}
