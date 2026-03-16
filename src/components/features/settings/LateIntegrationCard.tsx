"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Instagram, Building2, Loader2 } from "lucide-react";

interface LateIntegrationCardProps {
    addToast: (msg: string, type: "success" | "error") => void;
}

export function LateIntegrationCard({ addToast }: LateIntegrationCardProps) {
    const [instagram, setInstagram] = useState(false);
    const [googlebusiness, setGooglebusiness] = useState(false);
    const [instagramAccountName, setInstagramAccountName] = useState<string | null>(null);
    const [googlebusinessAccountName, setGooglebusinessAccountName] = useState<string | null>(null);
    const [loading, setLoading] = useState<string | null>(null);
    const [checking, setChecking] = useState(true);

    const fetchStatus = () => {
        fetch("/api/integrations/late")
            .then((r) => r.json())
            .then((d) => {
                setInstagram(d.instagram ?? false);
                setGooglebusiness(d.googlebusiness ?? false);
                setInstagramAccountName(d.instagramUsername ?? d.instagramDisplayName ?? null);
                setGooglebusinessAccountName(d.googlebusinessName ?? null);
            })
            .finally(() => setChecking(false));
    };

    useEffect(() => fetchStatus(), []);

    const handleConnect = async (platform: "instagram" | "googlebusiness") => {
        setLoading(platform);
        try {
            const res = await fetch(`/api/integrations/late/connect?platform=${platform}`);
            const data = await res.json();
            if (data.authUrl) {
                window.location.href = data.authUrl;
                return;
            }
            addToast(data.error ?? "接続に失敗しました", "error");
        } catch {
            addToast("接続に失敗しました", "error");
        }
        setLoading(null);
    };

    const handleDisconnect = async () => {
        setLoading("disconnect");
        try {
            await fetch("/api/integrations/late", { method: "DELETE" });
            setInstagram(false);
            setGooglebusiness(false);
            setInstagramAccountName(null);
            setGooglebusinessAccountName(null);
            addToast("Late連携を解除しました", "success");
        } catch {
            addToast("解除に失敗しました", "error");
        }
        setLoading(null);
    };

    if (checking) return null;

    const connected = instagram || googlebusiness;

    return (
        <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    Instagram・GBP 投稿連携（Late）
                    {connected && (
                        <span className="text-sm font-normal text-green-500">● 連携済み</span>
                    )}
                </CardTitle>
                <CardDescription className="text-zinc-400">
                    以下の接続設定をすると生成した投稿をそのまま送信できます。
                    <span className="block mt-2 text-emerald-300/90 text-sm">
                        ① 下のボタンを押す → ② 表示された画面で認証（GBPは店舗を選択）→ ③ この画面に戻る
                    </span>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 items-center">
                    <Button
                        variant={instagram ? "secondary" : "default"}
                        size="sm"
                        onClick={() => handleConnect("instagram")}
                        disabled={!!loading}
                        className={instagram ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "gradient-accent text-zinc-950 font-semibold"}
                    >
                        {loading === "instagram" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Instagram className="w-4 h-4 mr-1.5" />
                        )}
                        {instagram
                            ? (instagramAccountName ? `Instagram: ${instagramAccountName}` : "Instagram 接続済み")
                            : "Instagramを接続"}
                    </Button>
                    <Button
                        variant={googlebusiness ? "secondary" : "default"}
                        size="sm"
                        onClick={() => handleConnect("googlebusiness")}
                        disabled={!!loading}
                        className={googlebusiness ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "gradient-accent text-zinc-950 font-semibold"}
                    >
                        {loading === "googlebusiness" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Building2 className="w-4 h-4 mr-1.5" />
                        )}
                        {googlebusiness
                            ? (googlebusinessAccountName ? `GBP: ${googlebusinessAccountName}` : "GBP 接続済み")
                            : "GBPを接続"}
                    </Button>
                </div>
                {connected && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDisconnect}
                        disabled={!!loading}
                        className="border-zinc-600 text-zinc-400 hover:bg-zinc-800"
                    >
                        {loading === "disconnect" ? "処理中..." : "連携を解除する"}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
