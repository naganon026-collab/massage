import { useState, useRef } from "react";
import { Pattern, HistoryEntry, ShopInfo, PATTERNS, StoreRecord, ShortScriptData, LlmoArticleData, INDUSTRY_DATA } from "@/types";
import type { TreatmentTagId, EducationTagId, StaffMessageTagId, SalonSceneTagId, SceneMessageTagId, NoticeTypeTagId, UrgencyTagId, VoiceOptionTagId } from "@/types";
const REFINE_TAB_IDS = ["instagram", "gbp", "portal", "line", "short"] as const;
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export function useContentGenerator(
    user: User | null,
    shopInfo: ShopInfo,
    stores: StoreRecord[],
    selectedStoreId: string | null,
    addToast: (msg: string, type: "success" | "error") => void,
    onGenerateSuccess?: () => void,
    canGenerateBlog?: boolean,
    isPracticeMode?: boolean,
    onLimitExceeded?: () => void
) {
    const supabase = createClient();

    const [selectedPattern, setSelectedPattern] = useState<Pattern>("A");
    const [formData, setFormData] = useState({ q1: "", q2: "", q3: "" });

    const [replyPlatform, setReplyPlatform] = useState<"sns" | "gbp">("sns");
    const [receivedComment, setReceivedComment] = useState("");
    const [replyNote, setReplyNote] = useState("");
    const [userOriginalEpisode, setUserOriginalEpisode] = useState("");

    const [uploadImageData, setUploadImageData] = useState<{ mimeType: string; data: string } | null>(null);

    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

    const [generationHistory, setGenerationHistory] = useState<HistoryEntry[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null);

    const [refineInstruction, setRefineInstructionState] = useState<Record<string, string | null>>(
        Object.fromEntries(REFINE_TAB_IDS.map((id) => [id, null]))
    );
    const [isRefining, setIsRefining] = useState(false);
    /** LINE用：季節の挨拶（例：3月も半ば、いかがお過ごしですか？）を含めるか。デフォルトtrue */
    const [lineIncludeSeasonalGreeting, setLineIncludeSeasonalGreeting] = useState(true);
    const [isLlmoGenerating, setIsLlmoGenerating] = useState(false);
    const [imageMemo, setImageMemo] = useState("");

    const setRefineInstruction = (tabId: string, value: string | null) => {
        setRefineInstructionState((prev) => ({ ...prev, [tabId]: value }));
    };

    const currentPattern = PATTERNS.find(p => p.id === selectedPattern) || PATTERNS[0];

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
        const rawPatternId = entry.pattern_id as string;
        const patternId = rawPatternId as Pattern;
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
        setImageMemo("");
        setReceivedComment("");
        setReplyNote("");
        setUserOriginalEpisode("");
        setGeneratedResults(null);
    };

    const handleGenerate = async (
        selectedTreatmentArg?: TreatmentTagId | null,
        optionalMemosArg?: { reaction: string; beforeAfter: string },
        selectedEducationArg?: EducationTagId | null,
        educationMemoArg?: string,
        selectedMessageArg?: StaffMessageTagId | null,
        staffMemoArg?: string,
        selectedSceneArg?: SalonSceneTagId | null,
        selectedSceneMessageArg?: SceneMessageTagId | null,
        sceneMemoArg?: string,
        selectedNoticeTypeArg?: NoticeTypeTagId | null,
        selectedUrgencyArg?: UrgencyTagId | null,
        noticePeriodArg?: string,
        noticeMemoArg?: string,
        voiceMemoArg?: string,
        selectedVoiceOptionArg?: VoiceOptionTagId | null,
        selectedConcernArg?: string | null,
        selectedEducationReasonArg?: string | null,
        selectedFocusArg?: string | null,
        selectedMessageToneArg?: string | null,
        imageMemoArg?: string
    ) => {
        if (selectedPattern === "I") {
            if (!uploadImageData) {
                addToast("画像をアップロードしてください。", "error");
                return;
            }
        }
        if (selectedPattern === "A") {
            if (!selectedTreatmentArg && !selectedConcernArg) {
                addToast("施術タグまたはお客様のお悩みを1つ選んでください。", "error");
                return;
            }
        }
        if (selectedPattern === "B") {
            if (!selectedEducationArg) {
                addToast("教育テーマを1つ選んでください。", "error");
                return;
            }
            if (!selectedEducationReasonArg) {
                addToast("今日これを投稿する理由を1つ選んでください。", "error");
                return;
            }
        }
        if (selectedPattern === "C" && (!selectedNoticeTypeArg || !selectedUrgencyArg)) {
            addToast("お知らせの種類と緊急度を選んでください。", "error");
            return;
        }
        if (selectedPattern === "D") {
            if (!selectedVoiceOptionArg) {
                addToast("カテゴリと内容を選んでください。", "error");
                return;
            }
        }
        if (selectedPattern === "E") {
            if (!selectedMessageArg) {
                addToast("伝えたいことを1つ選んでください。", "error");
                return;
            }
        }
        if (selectedPattern === "H" && (!selectedSceneArg || !selectedSceneMessageArg)) {
            addToast("今日の場面と伝えたいことを選んでください。", "error");
            return;
        }
        setIsGenerating(true);
        setGenerationProgress(0);
        progressIntervalRef.current = setInterval(() => {
            setGenerationProgress((p) => {
                if (p >= 90) return 90;
                return p + 2;
            });
        }, 220);

        try {
            const endpoint = selectedPattern === "G" ? "/api/generate-reply" : "/api/generate";

            const activeShopInfo: ShopInfo = (() => {
                if (selectedStoreId) {
                    const found = stores.find(s => s.id === selectedStoreId);
                    if (found) return found.settings;
                }
                return shopInfo;
            })();

            const useWeather = currentPattern.useWeather ?? false;
            const baseOutputTargets = activeShopInfo.outputTargets || { instagram: true, gbp: true, portal: true, line: false, short: false };
            const outputTargets = canGenerateBlog === false
                ? { ...baseOutputTargets, portal: false }
                : baseOutputTargets;
            let normalBody: {
                patternTitle: string;
                useWeather: boolean;
                q1: string;
                q2: string;
                q3: string;
                shopInfo: ShopInfo;
                outputTargets: { instagram: boolean; gbp: boolean; portal: boolean; line: boolean; short?: boolean };
                generatedAt: string;
                patternId?: string;
                additionalContext?: string;
            } = {
                patternTitle: currentPattern.title,
                useWeather,
                q1: formData.q1,
                q2: formData.q2,
                q3: formData.q3,
                shopInfo: activeShopInfo,
                outputTargets,
                generatedAt: new Date().toISOString(),
            };
            const industryKey = activeShopInfo.industry || "salon";
            const tags = INDUSTRY_DATA[industryKey] || INDUSTRY_DATA["salon"];
            if (selectedPattern === "A" && selectedTreatmentArg) {
                const tag = tags.TREATMENT_TAGS.find((t) => t.id === selectedTreatmentArg)!;
                const concernLabel = tags.CONCERN_TAGS.find((t) => t.id === selectedConcernArg)?.label ?? tag.concern;
                normalBody = {
                    ...normalBody,
                    patternId: "A",
                    q1: concernLabel,
                    q2: `${tag.label}｜${tag.approach}`,
                    q3: tag.result,
                    additionalContext: JSON.stringify({
                        treatment: tag.label,
                        concern: concernLabel,
                        approach: tag.approach,
                        result: tag.result,
                        reaction: optionalMemosArg?.reaction ?? "",
                        beforeAfter: optionalMemosArg?.beforeAfter ?? "",
                        targetUser: "20〜30代女性",
                    }),
                };
            }
            if (selectedPattern === "B" && selectedEducationArg && selectedEducationReasonArg) {
                const tag = tags.EDUCATION_TAGS.find((t) => t.id === selectedEducationArg)!;
                normalBody = {
                    ...normalBody,
                    patternId: "B",
                    q1: tag.theme,
                    q2: tag.items,
                    q3: tag.solution,
                    additionalContext: JSON.stringify({
                        theme: tag.theme,
                        items: tag.items,
                        solution: tag.solution,
                        memo: educationMemoArg ?? "",
                        reason: tags.EDUCATION_REASON_TAGS.find((t) => t.id === selectedEducationReasonArg)?.label ?? "",
                    }),
                };
            }
            if (selectedPattern === "C" && selectedNoticeTypeArg && selectedUrgencyArg) {
                const noticeTag = tags.NOTICE_TYPE_TAGS.find((t) => t.id === selectedNoticeTypeArg)!;
                const urgencyTag = tags.URGENCY_TAGS.find((t) => t.id === selectedUrgencyArg)!;
                normalBody = {
                    ...normalBody,
                    patternId: "C",
                    q1: `${noticeTag.type}（${urgencyTag.urgency}）`,
                    q2: urgencyTag.phrase,
                    q3: noticeTag.detail,
                    additionalContext: JSON.stringify({
                        noticeType: noticeTag.type,
                        noticeDetail: noticeTag.detail,
                        urgency: urgencyTag.urgency,
                        urgencyPhrase: urgencyTag.phrase,
                        period: noticePeriodArg?.trim() ?? "",
                        memo: noticeMemoArg ?? "",
                    }),
                };
            }
            if (selectedPattern === "D" && selectedVoiceOptionArg) {
                const tag = tags.VOICE_OPTION_TAGS.find((t) => t.id === selectedVoiceOptionArg)!;
                normalBody = {
                    ...normalBody,
                    patternId: "D",
                    q1: voiceMemoArg || `${tag.label}のお客様の喜びの声`,
                    q2: `${tag.label}｜お悩み：${tag.concern}`,
                    q3: tag.result,
                    additionalContext: JSON.stringify({
                        treatment: tag.label,
                        concern: tag.concern,
                        result: tag.result,
                        voice: voiceMemoArg ?? "",
                    }),
                };
            }
            if (selectedPattern === "E" && selectedMessageArg) {
                const msg = tags.STAFF_MESSAGE_TAGS.find((t) => t.id === selectedMessageArg)!;
                normalBody = {
                    ...normalBody,
                    patternId: "E",
                    q1: msg.hook,
                    q2: msg.message,
                    q3: msg.target,
                    additionalContext: JSON.stringify({
                        hook: msg.hook,
                        message: msg.message,
                        target: msg.target,
                        memo: staffMemoArg ?? "",
                    }),
                };
            }
            if (selectedPattern === "H" && selectedSceneArg && selectedSceneMessageArg) {
                const scene = tags.SALON_SCENE_TAGS.find((t) => t.id === selectedSceneArg)!;
                const msg = tags.SCENE_MESSAGE_TAGS.find((t) => t.id === selectedSceneMessageArg)!;
                const messageTone = selectedMessageToneArg ? tags.MESSAGE_TONE_TAGS.find((t) => t.id === selectedMessageToneArg)?.note ?? "" : "";
                normalBody = {
                    ...normalBody,
                    patternId: "H",
                    q1: scene.scene,
                    q2: msg.message,
                    q3: msg.target,
                    additionalContext: JSON.stringify({
                        scene: scene.scene,
                        message: msg.message,
                        target: msg.target,
                        memo: sceneMemoArg ?? "",
                        messageTone,
                    }),
                };
            }

            const requestBody =
                selectedPattern === "G"
                    ? {
                        patternTitle: currentPattern.title,
                        platform: replyPlatform,
                        receivedComment,
                        replyNote,
                        shopInfo: activeShopInfo,
                    }
                    : selectedPattern === "I"
                            ? {
                                patternTitle: currentPattern.title,
                                useWeather: currentPattern.useWeather ?? false,
                                q1: imageMemoArg ?? "",
                                q2: "",
                                q3: "",
                                shopInfo: activeShopInfo,
                                outputTargets,
                                imageData: uploadImageData!,
                                generatedAt: new Date().toISOString(),
                            }
                            : normalBody;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...requestBody, userOriginalEpisode, lineIncludeSeasonalGreeting, isPracticeMode: isPracticeMode === true }),
            });

            const responseData = await response.json();

            if (!response.ok) {
                if (response.status === 403 && responseData.error === "LIMIT_EXCEEDED") {
                    onLimitExceeded?.();
                }
                const msg =
                    response.status === 403 && responseData.message
                        ? responseData.message
                        : responseData.error || "APIリクエストに失敗しました。";
                throw new Error(msg);
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
                        : selectedPattern === 'I'
                                ? { imageUploaded: true, memo: imageMemoArg ?? "" }
                                : selectedPattern === 'A' && selectedTreatmentArg
                                    ? { treatmentTagId: selectedTreatmentArg, reaction: optionalMemosArg?.reaction ?? "", beforeAfter: optionalMemosArg?.beforeAfter ?? "" }
                                    : selectedPattern === 'B' && selectedEducationArg
                                        ? { educationTagId: selectedEducationArg, educationMemo: educationMemoArg ?? "" }
                                        : selectedPattern === 'C' && selectedNoticeTypeArg && selectedUrgencyArg
                                            ? { noticeTypeTagId: selectedNoticeTypeArg, urgencyTagId: selectedUrgencyArg, noticePeriod: noticePeriodArg ?? "", noticeMemo: noticeMemoArg ?? "" }
                                            : selectedPattern === 'D' && selectedVoiceOptionArg
                                                ? { voiceOptionTagId: selectedVoiceOptionArg, voiceMemo: voiceMemoArg ?? "" }
                                                : selectedPattern === 'E' && selectedMessageArg
                                                    ? { staffMessageTagId: selectedMessageArg, staffMemo: staffMemoArg ?? "" }
                                                    : selectedPattern === 'H' && selectedSceneArg && selectedSceneMessageArg
                                                        ? { sceneTagId: selectedSceneArg, sceneMessageTagId: selectedSceneMessageArg, sceneMemo: sceneMemoArg ?? "" }
                                                        : { q1: formData.q1, q2: formData.q2, q3: formData.q3 };
                const meta = (data as { _meta?: { model?: string; tokens?: number } })._meta;
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
                    model: meta?.model ?? null,
                    tokens: meta?.tokens ?? null,
                    error: null,
                    is_practice: isPracticeMode === true,
                }).then(({ error }) => {
                    if (error) console.error('履歴保存エラー:', error);
                    else fetchHistory(user.id);
                });
            }

            if (onGenerateSuccess) onGenerateSuccess();
            addToast("生成完了！おつかれさまでした。", "success");

        } catch (error) {
            console.error(error);
            if (user && selectedPattern && currentPattern) {
                const errMsg = error instanceof Error ? error.message : "不明なエラー";
                supabase.from("generation_history").insert({
                    user_id: user.id,
                    pattern_id: selectedPattern,
                    pattern_title: currentPattern.title,
                    inputs: {},
                    results: {},
                    model: "gemini-2.5-flash",
                    tokens: 0,
                    error: errMsg,
                    is_practice: isPracticeMode === true,
                }).then(({ error: insertErr }) => {
                    if (insertErr) console.error("履歴エラー保存失敗:", insertErr);
                });
            }
            if (error instanceof Error) {
                addToast(error.message || "テキストの生成中にエラーが発生しました。", "error");
            } else {
                addToast("テキストの生成中にエラーが発生しました。", "error");
            }
        } finally {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
            setGenerationProgress(100);
            setTimeout(() => setGenerationProgress(0), 350);
            setIsGenerating(false);
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
                    ctaType: activeShopInfo.ctaType,
                    ctaValue: activeShopInfo.ctaValue,
                    ctaText: activeShopInfo.ctaText,
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
        uploadImageData, setUploadImageData,
        userOriginalEpisode, setUserOriginalEpisode,
        imageMemo, setImageMemo,
        isGenerating, setIsGenerating,
        generationProgress,
        generatedResults, setGeneratedResults,
        copiedTab, setCopiedTab,
        editingTab, setEditingTab,
        generationHistory, setGenerationHistory,
        showHistory, setShowHistory,
        deletingHistoryId, setDeletingHistoryId,
        currentPattern,
        fetchHistory,
        handleRestoreHistory,
        handleDeleteHistory,
        handleInputChange,
        handlePatternChange,
        handleGenerate,
        handleCopy,
        lineIncludeSeasonalGreeting,
        setLineIncludeSeasonalGreeting,
        refineInstruction,
        setRefineInstruction,
        isRefining,
        handleRefine,
        isLlmoGenerating,
        handleGenerateLlmo,
    };
}
