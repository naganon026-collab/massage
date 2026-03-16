"use client";

import React from "react";
import { X } from "lucide-react";
import { PLANS, type PlanId } from "@/lib/stripe";

const PAID_PLANS = ["light", "standard", "pro"] as const;
type PaidPlanId = (typeof PAID_PLANS)[number];

type Props = {
    show: boolean;
    onClose: () => void;
    currentPlan: string;
    onSelectPlan: (plan: PaidPlanId) => void;
    isLoading?: boolean;
};

export function UpgradeOverlay({ show, onClose, currentPlan, onSelectPlan, isLoading }: Props) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-md w-full shadow-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-zinc-700">
                    <h2 className="text-lg font-semibold text-zinc-100">プランを選択</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4 space-y-3">
                    {PAID_PLANS.map((planId) => {
                        const plan = PLANS[planId];
                        const isCurrent = currentPlan === planId;
                        const limitText = plan.limit === null ? "無制限" : `月${plan.limit}回`;
                        return (
                            <button
                                key={planId}
                                type="button"
                                disabled={isCurrent || isLoading}
                                onClick={() => onSelectPlan(planId)}
                                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                                    isCurrent
                                        ? "border-emerald-500/50 bg-emerald-500/10 cursor-default"
                                        : "border-zinc-700 hover:border-emerald-500/50 hover:bg-zinc-800/80"
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium text-zinc-100">{plan.name}</div>
                                        <div className="text-xs text-zinc-400 mt-0.5">{plan.description}</div>
                                        <div className="text-sm text-emerald-400 mt-1">
                                            ¥{plan.price.toLocaleString()}/月 · {limitText}
                                            {plan.canPost && " · 投稿可"}
                                        </div>
                                    </div>
                                    {!isCurrent && (
                                        <span className="text-xs font-medium text-emerald-400">
                                            {isLoading ? "処理中..." : "選択"}
                                        </span>
                                    )}
                                    {isCurrent && (
                                        <span className="text-xs text-emerald-400 font-medium">現在のプラン</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
