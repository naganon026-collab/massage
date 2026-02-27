"use client";

import { useEffect, useState } from "react";
import { Check, X, AlertCircle } from "lucide-react";

// トーストの種別
export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

// トーストの表示コンポーネント
function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // マウント後にアニメーション開始
        const showTimer = setTimeout(() => setVisible(true), 10);
        // 3.5秒後にフェードアウト → 削除
        const hideTimer = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onRemove(toast.id), 300);
        }, 3500);
        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, [toast.id, onRemove]);

    const iconMap: Record<ToastType, React.ReactElement> = {
        success: <Check className="w-4 h-4 text-green-400 shrink-0" />,
        error: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
        info: <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />,
    };

    const borderMap: Record<ToastType, string> = {
        success: "border-green-500/40",
        error: "border-red-500/40",
        info: "border-amber-500/40",
    };

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-zinc-900/95 backdrop-blur-sm shadow-xl transition-all duration-300 ${borderMap[toast.type]} ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}
        >
            {iconMap[toast.type]}
            <p className="text-sm text-zinc-200 flex-1">{toast.message}</p>
            <button
                onClick={() => {
                    setVisible(false);
                    setTimeout(() => onRemove(toast.id), 300);
                }}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

// トーストコンテナ（画面右下に固定）
export function ToastContainer({ toasts, onRemove }: { toasts: ToastMessage[]; onRemove: (id: string) => void }) {
    return (
        <div className="fixed bottom-6 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {toasts.map((t) => (
                <div key={t.id} className="pointer-events-auto">
                    <ToastItem toast={t} onRemove={onRemove} />
                </div>
            ))}
        </div>
    );
}

// トースト管理のカスタムフック
export function useToast() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = (message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { id, message, type }]);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return { toasts, addToast, removeToast };
}
