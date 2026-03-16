"use client";

import { Plug } from "lucide-react";
import { LineIntegrationCard } from "./LineIntegrationCard";
import { LateIntegrationCard } from "./LateIntegrationCard";

interface AppConnectionsOverlayProps {
    show: boolean;
    onClose: () => void;
    addToast: (msg: string, type: "success" | "error") => void;
}

export function AppConnectionsOverlay({ show, onClose, addToast }: AppConnectionsOverlayProps) {
    if (!show) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm px-4 sm:px-6 pt-20 pb-8"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="w-full max-w-2xl rounded-2xl border-2 border-zinc-700 bg-zinc-950 shadow-2xl card-elevated max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <Plug className="w-6 h-6 text-emerald-500" />
                        <h2 className="font-display text-xl font-semibold text-emerald-400">アプリ接続</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-zinc-500 hover:text-zinc-200 text-sm p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                        閉じる ✕
                    </button>
                </div>
                <div className="px-8 py-6 space-y-6 overflow-y-auto flex-1 scrollbar-none">
                    <p className="text-sm text-zinc-400">
                        LINE・Instagram・Google Map など、外部サービスとの連携を管理します。
                    </p>
                    <LineIntegrationCard addToast={addToast} />
                    <LateIntegrationCard addToast={addToast} />
                </div>
            </div>
        </div>
    );
}
