"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type TabId = "users" | "stats" | "history" | "errors";

interface UserRow {
    id: string;
    email: string | null;
    created_at: string | null;
    last_sign_in_at: string | null;
}

interface ShopRow {
    user_id: string;
    settings: { name?: string } | null;
    created_at: string | null;
    updated_at: string | null;
}

interface HistoryRow {
    id: string;
    user_id: string;
    pattern_id: string;
    pattern_title: string;
    created_at: string;
    tokens: number | null;
    model: string | null;
    error: string | null;
}

function formatJst(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    return new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(d);
}

function formatNum(n: number): string {
    return n.toLocaleString("ja-JP");
}

export default function AdminPage() {
    const router = useRouter();
    const [tab, setTab] = useState<TabId>("users");
    const [users, setUsers] = useState<UserRow[]>([]);
    const [shops, setShops] = useState<ShopRow[]>([]);
    const [genCounts, setGenCounts] = useState<Record<string, number>>({});
    const [monthlyCount, setMonthlyCount] = useState<number | null>(null);
    const [totalCount, setTotalCount] = useState<number | null>(null);
    const [totalTokensKpi, setTotalTokensKpi] = useState<number | null>(null);
    const [patternStats, setPatternStats] = useState<{ pattern_id: string; pattern_title: string; count: number }[]>([]);
    const [tokenStats, setTokenStats] = useState<{ tokens: number | null; model: string | null; created_at: string }[]>([]);
    const [dailyCounts, setDailyCounts] = useState<{ date: string; count: number }[]>([]);
    const [history, setHistory] = useState<HistoryRow[]>([]);
    const [errors, setErrors] = useState<HistoryRow[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);

                const [usersRes, shopsRes, historyRes, monthlyRes, totalRes, tokensRes] = await Promise.all([
                    supabase.rpc("get_all_users"),
                    supabase.from("shops").select("user_id, settings, created_at, updated_at"),
                    supabase.from("generation_history").select("user_id, pattern_id, pattern_title, created_at"),
                    supabase.from("generation_history").select("*", { count: "exact", head: true }).gte("created_at", startOfMonth.toISOString()),
                    supabase.from("generation_history").select("*", { count: "exact", head: true }),
                    supabase.from("generation_history").select("tokens"),
                ]);

                const usersData = (usersRes.data ?? []) as UserRow[];
                const shopsData = (shopsRes.data ?? []) as ShopRow[];
                const allHistory = (historyRes.data ?? []) as { user_id: string; pattern_id: string; pattern_title: string; created_at: string }[];

                setUsers(usersData);
                setShops(shopsData);
                setMonthlyCount(monthlyRes.count ?? 0);
                setTotalCount(totalRes.count ?? 0);
                const tokens = (tokensRes.data ?? []) as { tokens: number | null }[];
                setTotalTokensKpi(tokens.reduce((s, r) => s + (r.tokens ?? 0), 0));

                const counts: Record<string, number> = {};
                allHistory.forEach((r) => {
                    counts[r.user_id] = (counts[r.user_id] ?? 0) + 1;
                });
                setGenCounts(counts);
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        })();
    }, []);

    useEffect(() => {
        if (tab !== "stats") return;
        (async () => {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const [monthlyRes, totalRes, patternRes, tokensRes, recentRes] = await Promise.all([
                supabase.from("generation_history").select("*", { count: "exact", head: true }).gte("created_at", startOfMonth.toISOString()),
                supabase.from("generation_history").select("*", { count: "exact", head: true }),
                supabase.from("generation_history").select("pattern_id, pattern_title"),
                supabase.from("generation_history").select("tokens, model, created_at"),
                supabase.from("generation_history").select("created_at").order("created_at", { ascending: false }).limit(100),
            ]);

            setMonthlyCount(monthlyRes.count ?? 0);
            setTotalCount(totalRes.count ?? 0);

            const patternRows = (patternRes.data ?? []) as { pattern_id: string; pattern_title: string }[];
            const patternMap: Record<string, { title: string; count: number }> = {};
            patternRows.forEach((r) => {
                const key = r.pattern_id;
                if (!patternMap[key]) patternMap[key] = { title: r.pattern_title || key, count: 0 };
                patternMap[key].count += 1;
            });
            setPatternStats(Object.entries(patternMap).map(([pattern_id, v]) => ({ pattern_id, pattern_title: v.title, count: v.count })).sort((a, b) => b.count - a.count));

            setTokenStats((tokensRes.data ?? []) as { tokens: number | null; model: string | null; created_at: string }[]);

            const recent = (recentRes.data ?? []) as { created_at: string }[];
            const byDay: Record<string, number> = {};
            recent.forEach((r) => {
                const day = r.created_at.slice(0, 10);
                byDay[day] = (byDay[day] ?? 0) + 1;
            });
            setDailyCounts(Object.entries(byDay).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)).slice(-14));
        })();
    }, [tab]);

    useEffect(() => {
        if (tab !== "history") return;
        (async () => {
            const { data } = await supabase
                .from("generation_history")
                .select("id, user_id, pattern_id, pattern_title, created_at, tokens, model, error")
                .order("created_at", { ascending: false })
                .limit(100);
            setHistory((data ?? []) as HistoryRow[]);
        })();
    }, [tab]);

    useEffect(() => {
        if (tab !== "errors") return;
        (async () => {
            const { data } = await supabase
                .from("generation_history")
                .select("id, user_id, pattern_id, pattern_title, created_at, error")
                .not("error", "is", null)
                .order("created_at", { ascending: false })
                .limit(50);
            setErrors((data ?? []) as HistoryRow[]);
        })();
    }, [tab]);

    const shopsMap: Record<string, string> = (shops ?? []).reduce((acc, s) => {
        acc[s.user_id] = s.settings?.name ?? "未設定";
        return acc;
    }, {} as Record<string, string>);

    const tabs: { id: TabId; icon: string; label: string }[] = [
        { id: "users", icon: "👥", label: "ユーザー・店舗" },
        { id: "stats", icon: "📊", label: "生成統計" },
        { id: "history", icon: "📝", label: "生成履歴" },
        { id: "errors", icon: "⚠️", label: "エラーログ" },
    ];

    const totalTokens = tokenStats.reduce((s, r) => s + (r.tokens ?? 0), 0);
    const estimatedCost = ((totalTokensKpi ?? totalTokens) / 1_000_000) * 3;
    const maxDayCount = dailyCounts.length ? Math.max(...dailyCounts.map((d) => d.count)) : 0;

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
                <div className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-lg">Logic Post</span>
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                            管理者
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border px-3 py-1.5 rounded-md hover:bg-muted transition-colors"
                    >
                        ログアウト
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: "総ユーザー数", value: `${users?.length ?? 0}人`, icon: "👥" },
                        { label: "今月の生成数", value: `${monthlyCount ?? 0}件`, icon: "📝" },
                        { label: "累計生成数", value: `${totalCount ?? 0}件`, icon: "📊" },
                        { label: "推定コスト", value: `$${estimatedCost.toFixed(2)}`, icon: "💰" },
                    ].map(({ label, value, icon }) => (
                        <div key={label} className="rounded-lg border bg-card p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-muted-foreground">{label}</span>
                                <span className="text-xl">{icon}</span>
                            </div>
                            <div className="text-2xl font-bold">{value}</div>
                        </div>
                    ))}
                </div>

                <div className="flex gap-1 border-b mb-6">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setTab(t.id)}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                                tab === t.id
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

            {loading && tab === "users" && (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-12 bg-zinc-800 rounded animate-pulse" />
                    ))}
                </div>
            )}

            {!loading && tab === "users" && (
                <div className="overflow-x-auto rounded-lg border border-zinc-700">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-zinc-700 bg-zinc-800/50">
                                <th className="text-left p-3 font-medium text-zinc-300">メール</th>
                                <th className="text-left p-3 font-medium text-zinc-300">店舗名</th>
                                <th className="text-left p-3 font-medium text-zinc-300">登録日</th>
                                <th className="text-left p-3 font-medium text-zinc-300">最終ログイン</th>
                                <th className="text-right p-3 font-medium text-zinc-300">生成数</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id} className="border-b border-zinc-800 hover:bg-muted/30 transition-colors">
                                    <td className="p-3 text-zinc-200">{u.email ?? "—"}</td>
                                    <td className="p-3 text-zinc-200">{shopsMap[u.id] ?? "—"}</td>
                                    <td className="p-3 text-zinc-400">{formatJst(u.created_at)}</td>
                                    <td className="p-3 text-zinc-400">{formatJst(u.last_sign_in_at)}</td>
                                    <td className="p-3 text-right text-zinc-200">{formatNum(genCounts[u.id] ?? 0)}件</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === "stats" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
                            <p className="text-xs text-zinc-400 mb-1">今月の総生成数</p>
                            <p className="text-2xl font-bold text-white">{monthlyCount != null ? formatNum(monthlyCount) : "—"}件</p>
                        </div>
                        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
                            <p className="text-xs text-zinc-400 mb-1">累計総生成数</p>
                            <p className="text-2xl font-bold text-white">{totalCount != null ? formatNum(totalCount) : "—"}件</p>
                        </div>
                    </div>
                    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
                        <p className="text-sm font-medium text-zinc-300 mb-3">パターン別生成数</p>
                        <ul className="space-y-2">
                            {patternStats.map((p) => (
                                <li key={p.pattern_id} className="flex justify-between text-sm">
                                    <span className="text-zinc-200">{p.pattern_title || p.pattern_id}</span>
                                    <span className="text-zinc-400">{formatNum(p.count)}件</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
                        <p className="text-xs text-zinc-400 mb-1">推定コスト（$3/1M tokens）</p>
                        <p className="text-xl font-bold text-white">${estimatedCost.toFixed(2)}</p>
                        <p className="text-xs text-zinc-500 mt-1">総トークン: {formatNum(totalTokens)}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
                        <p className="text-sm font-medium text-zinc-300 mb-3">日別生成数（直近100件）</p>
                        <div className="flex flex-wrap gap-2 items-end">
                            {dailyCounts.map(({ date, count }) => (
                                <div key={date} className="flex flex-col items-center gap-1">
                                    <div className="w-8 bg-emerald-600 rounded-t" style={{ height: maxDayCount ? (count / maxDayCount) * 48 : 0 }} title={`${date}: ${count}件`} />
                                    <span className="text-[10px] text-zinc-500">{date.slice(5)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {tab === "history" && (
                <div className="overflow-x-auto rounded-lg border border-zinc-700">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-zinc-700 bg-zinc-800/50">
                                <th className="text-left p-3 font-medium text-zinc-300">日時</th>
                                <th className="text-left p-3 font-medium text-zinc-300">店舗名</th>
                                <th className="text-left p-3 font-medium text-zinc-300">パターン</th>
                                <th className="text-right p-3 font-medium text-zinc-300">トークン</th>
                                <th className="text-left p-3 font-medium text-zinc-300">モデル</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((r) => (
                                <tr key={r.id} className="border-b border-zinc-800 hover:bg-muted/30 transition-colors">
                                    <td className="p-3 text-zinc-400">{formatJst(r.created_at)}</td>
                                    <td className="p-3 text-zinc-200">{shopsMap[r.user_id] ?? "—"}</td>
                                    <td className="p-3 text-zinc-200">{r.pattern_title || r.pattern_id}</td>
                                    <td className="p-3 text-right text-zinc-400">{r.tokens != null ? formatNum(r.tokens) : "—"}</td>
                                    <td className="p-3 text-zinc-400">{r.model ?? "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === "errors" && (
                <>
                    {errors?.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <div className="text-4xl mb-3">✅</div>
                            <p className="font-medium">エラーはありません</p>
                            <p className="text-xs mt-1">すべての生成が正常に完了しています</p>
                        </div>
                    )}
                    {errors && errors.length > 0 && (
                        <div className="overflow-x-auto rounded-lg border border-zinc-700">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-700 bg-zinc-800/50">
                                        <th className="text-left p-3 font-medium text-zinc-300">日時</th>
                                        <th className="text-left p-3 font-medium text-zinc-300">店舗名</th>
                                        <th className="text-left p-3 font-medium text-zinc-300">パターン</th>
                                        <th className="text-left p-3 font-medium text-zinc-300">エラー内容</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {errors.map((r) => (
                                        <tr key={r.id} className="border-b border-zinc-800 hover:bg-muted/30 transition-colors">
                                    <td className="p-3 text-zinc-400">{formatJst(r.created_at)}</td>
                                    <td className="p-3 text-zinc-200">{shopsMap[r.user_id] ?? "—"}</td>
                                    <td className="p-3 text-zinc-200">{r.pattern_title || r.pattern_id}</td>
                                    <td className="p-3 text-red-400 max-w-md truncate" title={r.error ?? ""}>{r.error ?? "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
            </main>
        </div>
    );
}
