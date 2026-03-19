"use client";

import React from "react";
import { X, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  show: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  currentPlan?: string;
};

export function LimitExceededModal({ show, onClose, onUpgrade, currentPlan }: Props) {
  if (!show) return null;

  const isLight = currentPlan === "light";
  const title = isLight ? "今月の30回を使い切りました" : "今月の無料分は5回まで";
  const subtitle = "スタンダードなら月100回＋そのまま投稿できます";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pb-[max(1rem,calc(1rem+env(safe-area-inset-bottom)))]">
      <div className="bg-zinc-900 border border-amber-500/40 rounded-xl max-w-md w-full shadow-xl overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="rounded-lg bg-zinc-800/80 border border-zinc-700 p-4 space-y-3">
            <p className="text-sm font-semibold text-zinc-200">スタンダードの投稿機能</p>
            <p className="text-sm text-zinc-400">
              「生成→コピー→貼り付け」の3ステップが<br />
              <span className="text-emerald-400 font-medium">「生成→1クリック投稿」</span>に
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            >
              閉じる
            </Button>
            <Button
              onClick={() => {
                onClose();
                onUpgrade();
              }}
              className="flex-1 gradient-accent hover:opacity-95 text-zinc-950 font-semibold gap-2"
            >
              <Crown className="w-4 h-4" />
              スタンダードへ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
