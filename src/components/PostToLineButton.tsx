"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
    message: string;
    addToast: (msg: string, type: "success" | "error") => void;
}

export function PostToLineButton({ message, addToast }: Props) {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    const handlePost = async () => {
        setStatus("loading");
        const res = await fetch("/api/post-to-line", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
        });
        const data = await res.json();
        if (data.success) {
            setStatus("success");
            addToast("LINEに送信しました", "success");
            setTimeout(() => setStatus("idle"), 3000);
        } else {
            setStatus("error");
            addToast(data.error ?? "送信失敗", "error");
            setTimeout(() => setStatus("idle"), 3000);
        }
    };

    const labels = {
        idle: "LINEに投稿",
        loading: "送信中...",
        success: "✓ 送信完了",
        error: "再試行",
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handlePost}
            disabled={status === "loading"}
            className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
        >
            {labels[status]}
        </Button>
    );
}
