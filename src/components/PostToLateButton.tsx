"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
    platform: "instagram" | "gbp";
    content: string;
    title?: string;
    /** 画像データ（mimeType, base64）。Instagram は必須、GBP は任意（あると画像付きで投稿される） */
    imageData?: { mimeType: string; data: string } | null;
    addToast: (msg: string, type: "success" | "error") => void;
}

const LABELS = {
    instagram: { idle: "Instagramに投稿", loading: "送信中...", success: "✓ 送信完了", error: "再試行" },
    gbp: { idle: "GBPに投稿", loading: "送信中...", success: "✓ 送信完了", error: "再試行" },
};

export function PostToLateButton({ platform, content, title, imageData, addToast }: Props) {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const labels = LABELS[platform];
    const canPost = platform !== "instagram" || !!imageData;

    const handlePost = async () => {
        if (platform === "instagram" && !imageData) {
            addToast("Instagram には画像が必須です。画像をアップロードしてから生成してください。", "error");
            return;
        }
        setStatus("loading");
        try {
            const res = await fetch("/api/post-to-late", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platform,
                    content,
                    ...(platform === "gbp" && title ? { title } : {}),
                    ...(imageData ? { imageData } : {}),
                }),
            });
            const data = await res.json();
            if (data.success) {
                setStatus("success");
                addToast(`${platform === "instagram" ? "Instagram" : "GBP"}に投稿しました`, "success");
                setTimeout(() => setStatus("idle"), 3000);
            } else {
                setStatus("error");
                addToast(data.error ?? "送信失敗", "error");
                setTimeout(() => setStatus("idle"), 3000);
            }
        } catch {
            setStatus("error");
            addToast("送信に失敗しました", "error");
            setTimeout(() => setStatus("idle"), 3000);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handlePost}
            disabled={status === "loading" || !canPost}
            title={platform === "instagram" && !imageData ? "画像をアップロードしてから生成してください" : undefined}
            className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
        >
            {status === "loading" ? labels.loading : status === "success" ? labels.success : status === "error" ? labels.error : labels.idle}
        </Button>
    );
}
