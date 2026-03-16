"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LineIntegrationCardProps {
    addToast: (msg: string, type: "success" | "error") => void;
}

export function LineIntegrationCard({ addToast }: LineIntegrationCardProps) {
    const [connected, setConnected] = useState(false);
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        fetch("/api/integrations/line")
            .then((r) => r.json())
            .then((d) => setConnected(d.connected))
            .finally(() => setChecking(false));
    }, []);

    const handleConnect = async () => {
        if (!token.trim()) return;
        setLoading(true);
        const res = await fetch("/api/integrations/line", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken: token }),
        });
        const data = await res.json();
        if (data.success) {
            setConnected(true);
            setToken("");
            addToast("LINE連携が完了しました", "success");
        } else {
            addToast(data.error ?? "エラー", "error");
        }
        setLoading(false);
    };

    const handleDisconnect = async () => {
        setLoading(true);
        await fetch("/api/integrations/line", { method: "DELETE" });
        setConnected(false);
        addToast("LINE連携を解除しました", "success");
        setLoading(false);
    };

    if (checking) return null;

    return (
        <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    LINE公式アカウント連携
                    {connected && (
                        <span className="text-sm font-normal text-green-500">● 連携済み</span>
                    )}
                </CardTitle>
                <CardDescription className="text-zinc-400">
                    生成した投稿文をLINE公式アカウントの友だち全員に一斉送信できます。
                    フリープランは月1,000通まで送信可能です。
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!connected ? (
                    <>
                        {/* 接続手順ガイド */}
                        <div className="rounded-lg border border-zinc-700 bg-zinc-950/60 p-4 space-y-3">
                            <p className="text-sm font-medium text-zinc-200">接続手順（初めての方）</p>
                            <ol className="space-y-2 text-xs text-zinc-400">
                                <li className="flex gap-2">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">1</span>
                                    <span>
                                        <a href="https://developers.line.biz/console/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">
                                            LINE Developers Console
                                        </a>
                                        にアクセスし、LINEアカウントでログイン
                                    </span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">2</span>
                                    <span>プロバイダーを選択 → チャネルを作成（Messaging API チャネル）</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">3</span>
                                    <span>チャネル詳細 → <strong className="text-zinc-300">Messaging API設定</strong> タブ → <strong className="text-zinc-300">チャネルアクセストークン（長期）</strong> の「発行」をクリック</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">4</span>
                                    <span>表示されたトークンをコピーし、下の欄に貼り付け</span>
                                </li>
                            </ol>
                            <a
                                href="https://developers.line.biz/console/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                            >
                                LINE Developers Console を開く →
                            </a>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="line-token" className="text-zinc-200">チャネルアクセストークン</Label>
                            <Input
                                id="line-token"
                                type="password"
                                placeholder="トークンを貼り付けてください"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                            />
                            <p className="text-xs text-zinc-500">
                                トークンは外部に漏らさないでください。詳しくは
                                <a href="https://developers.line.biz/ja/docs/messaging-api/getting-started/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline ml-1">
                                    Messaging API ドキュメント
                                </a>
                                を参照。
                            </p>
                        </div>
                        <Button
                            onClick={handleConnect}
                            disabled={!token.trim() || loading}
                            className="gradient-accent hover:opacity-95 text-zinc-950 font-semibold"
                        >
                            {loading ? "確認中..." : "連携する"}
                        </Button>
                    </>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-zinc-400">
                            LINE公式アカウントと連携中です。投稿画面の「LINEに投稿」ボタンから送信できます。
                        </p>
                        <Button
                            variant="outline"
                            onClick={handleDisconnect}
                            disabled={loading}
                            className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                        >
                            {loading ? "処理中..." : "連携を解除する"}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
