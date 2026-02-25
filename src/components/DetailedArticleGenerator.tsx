import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Send, Copy, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DetailedArticleGeneratorProps {
    currentShop: {
        name: string;
        address: string;
        businessHours: string;
        features: string;
    };
}

export default function DetailedArticleGenerator({ currentShop }: DetailedArticleGeneratorProps) {

    const [formData, setFormData] = useState({
        keyword: "",
        strengthApproach: "",
        strengthTimePerf: "",
        strengthPrivacy: "",
        stanceOwner: ""
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedResults, setGeneratedResults] = useState<{
        title: string;
        meta_description: string;
        content_html: string;
        json_ld: string;
    } | null>(null);
    const [copiedTab, setCopiedTab] = useState<string | null>(null);
    const [isPostingToWP, setIsPostingToWP] = useState(false);

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCopy = (text: string, tabId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedTab(tabId);
        setTimeout(() => setCopiedTab(null), 2000);
    };

    const handleGenerate = async () => {
        if (!formData.keyword) {
            alert("狙うキーワードは必須です");
            return;
        }

        setIsGenerating(true);
        try {
            const payload = {
                ...formData,
                clinicName: currentShop.name,
                address: currentShop.address,
                hours: currentShop.businessHours,
                features: currentShop.features,
            };

            const res = await fetch("/api/generate-ortho-blog", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "生成に失敗しました");
            }

            setGeneratedResults(data);
        } catch (error: any) {
            alert("エラーが発生しました: " + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePostToWP = async (status: "draft" | "publish") => {
        if (!generatedResults?.title || !generatedResults?.content_html) {
            alert("記事が生成されていません");
            return;
        }

        const actionText = status === "draft" ? "下書き保存" : "公開";
        if (!confirm(`生成された記事をWordPressへ${actionText}しますか？`)) return;

        setIsPostingToWP(true);
        try {
            // 既存のWP Post APIを再利用（必要に応じてwpCategoryId等も拡張可能）
            // 今回はまずタイトルと本文を送る
            const res = await fetch("/api/wppost", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: generatedResults.title,
                    content: generatedResults.content_html,
                    status: status
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || data.details || "投稿に失敗しました");

            alert(`WordPressへ${actionText}しました！\n投稿ID: ${data.postId}`);
            if (data.link) {
                window.open(data.link, '_blank');
            }
        } catch (error: any) {
            alert("エラーが発生しました: " + error.message);
        } finally {
            setIsPostingToWP(false);
        }
    };

    return (
        <div className="space-y-8 pb-32">
            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm shadow-xl">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 font-bold">1</span>
                        <CardTitle className="text-2xl text-white">記事要素の設定</CardTitle>
                    </div>
                    <CardDescription className="text-zinc-400">
                        大人の男性ビジネスマンに響く、説得力のある記事のソースを入力してください。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <Label className="text-zinc-300">狙うキーワード <span className="text-red-400">*</span></Label>
                            <Input
                                value={formData.keyword}
                                onChange={e => handleInputChange('keyword', e.target.value)}
                                placeholder="例: 長野市 マッサージ 大人の男性"
                                className="bg-zinc-950 border-zinc-700 focus-visible:ring-amber-500 text-zinc-100"
                            />
                        </div>
                    </div>

                    <div className="my-6 border-t border-zinc-800"></div>

                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-amber-500">店舗の強み・スタンス</h3>
                        <div className="space-y-2">
                            <Label className="text-zinc-300">① 独自の手法・アプローチ</Label>
                            <Textarea
                                value={formData.strengthApproach}
                                onChange={e => handleInputChange('strengthApproach', e.target.value)}
                                placeholder="例: 独自の手技で深層筋にアプローチ。指圧とオイルを組み合わせた男性向け特別メニュー。"
                                className="min-h-[80px] bg-zinc-950 border-zinc-700 focus-visible:ring-amber-500 text-zinc-100 resize-y"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300">② タイパ・利便性</Label>
                            <Textarea
                                value={formData.strengthTimePerf}
                                onChange={e => handleInputChange('strengthTimePerf', e.target.value)}
                                placeholder="例: 駅から徒歩1分。仕事帰りや休憩中にサクッと通える短時間集中コースを用意。"
                                className="min-h-[80px] bg-zinc-950 border-zinc-700 focus-visible:ring-amber-500 text-zinc-100 resize-y"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300">③ 設備・プライバシー空間</Label>
                            <Textarea
                                value={formData.strengthPrivacy}
                                onChange={e => handleInputChange('strengthPrivacy', e.target.value)}
                                placeholder="例: 完全個室のプライベート空間。他のお客様と顔を合わせない動線設計。"
                                className="min-h-[80px] bg-zinc-950 border-zinc-700 focus-visible:ring-amber-500 text-zinc-100 resize-y"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300">④ オーナー・セラピストのスタンス</Label>
                            <Textarea
                                value={formData.stanceOwner}
                                onChange={e => handleInputChange('stanceOwner', e.target.value)}
                                placeholder="例: 日々闘うビジネスパーソンの心身をリセットする場所でありたいと思っています。"
                                className="min-h-[100px] bg-zinc-950 border-zinc-700 focus-visible:ring-amber-500 text-zinc-100 resize-y"
                            />
                        </div>
                    </div>

                </CardContent>
            </Card>

            <div className="text-center pb-8">
                <Button
                    size="lg"
                    onClick={handleGenerate}
                    disabled={isGenerating || !formData.keyword}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-bold px-12 py-6 rounded-full shadow-lg shadow-amber-900/20 transition-all hover:scale-105"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            記事を生成中...お待ちください
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            SEO最強の記事を生成する
                        </>
                    )}
                </Button>
            </div>

            {/* 生成結果表示エリア */}
            {generatedResults && (
                <Card className="border-amber-500/30 bg-zinc-900 shadow-2xl overflow-hidden mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-6 border-b border-zinc-800">
                        <h2 className="text-2xl font-bold text-amber-500 flex items-center gap-2">
                            <Sparkles className="w-6 h-6" />
                            生成完了
                        </h2>
                        <p className="text-zinc-400 mt-1">SEO/LLMO最適化されたJSONデータをもとに構築・構造化されました。</p>
                    </div>

                    <CardContent className="p-6">

                        <Tabs defaultValue="preview" className="w-full">
                            <TabsList className="mb-6 bg-zinc-950 border border-zinc-800">
                                <TabsTrigger value="preview" className="data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950">プレビュー</TabsTrigger>
                                <TabsTrigger value="html" className="data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950">HTML/JSON-LD ソース</TabsTrigger>
                            </TabsList>

                            <TabsContent value="preview" className="space-y-6">
                                <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800">
                                    <h3 className="text-xl font-bold text-white mb-2">{generatedResults.title}</h3>
                                    <p className="text-zinc-400 text-sm mb-6 pb-6 border-b border-zinc-800">{generatedResults.meta_description}</p>

                                    <div
                                        className="prose prose-invert prose-amber max-w-none 
                      prose-h2:text-amber-500 prose-h2:border-b prose-h2:border-zinc-800 prose-h2:pb-2
                      prose-blockquote:border-l-4 prose-blockquote:border-amber-500 prose-blockquote:bg-zinc-900 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                      prose-table:border prose-table:border-zinc-800 prose-th:bg-zinc-900 prose-td:border-zinc-800"
                                        dangerouslySetInnerHTML={{ __html: generatedResults.content_html }}
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 p-6 bg-amber-500/5 rounded-xl border border-amber-500/20">
                                    <div className="flex-1">
                                        <h4 className="text-lg font-bold text-amber-500 mb-2">WordPressへ自動投稿</h4>
                                        <p className="text-sm text-zinc-400">作成した記事をサイトへ直接入稿します。</p>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            variant="outline"
                                            className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-zinc-950"
                                            onClick={() => handlePostToWP("draft")}
                                            disabled={isPostingToWP}
                                        >
                                            {isPostingToWP ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                            下書き保存
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="html" className="space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-zinc-400 text-sm">タイトル</Label>
                                        <Button variant="ghost" size="sm" onClick={() => handleCopy(generatedResults.title, 'title')} className="h-8 text-zinc-400">
                                            {copiedTab === 'title' ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                                            コピー
                                        </Button>
                                    </div>
                                    <Textarea readOnly value={generatedResults.title} className="bg-zinc-950 border-zinc-800 text-zinc-300 font-mono text-sm resize-none" />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-zinc-400 text-sm">メタディスクリプション (meta description)</Label>
                                        <Button variant="ghost" size="sm" onClick={() => handleCopy(generatedResults.meta_description, 'meta')} className="h-8 text-zinc-400">
                                            {copiedTab === 'meta' ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                                            コピー
                                        </Button>
                                    </div>
                                    <Textarea readOnly value={generatedResults.meta_description} className="bg-zinc-950 border-zinc-800 text-zinc-300 font-mono text-sm resize-y" />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-zinc-400 text-sm">HTML本文 (content_html)</Label>
                                        <Button variant="ghost" size="sm" onClick={() => handleCopy(generatedResults.content_html, 'html')} className="h-8 text-zinc-400">
                                            {copiedTab === 'html' ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                                            コピー
                                        </Button>
                                    </div>
                                    <div className="relative">
                                        <pre className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 overflow-x-auto text-zinc-300 font-mono text-xs max-h-96 overflow-y-auto whitespace-pre-wrap">
                                            <code>{generatedResults.content_html}</code>
                                        </pre>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-zinc-400 text-sm">構造化データ (JSON-LD)</Label>
                                        <Button variant="ghost" size="sm" onClick={() => handleCopy(generatedResults.json_ld, 'jsonld')} className="h-8 text-zinc-400">
                                            {copiedTab === 'jsonld' ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                                            コピー
                                        </Button>
                                    </div>
                                    <div className="relative">
                                        <pre className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 overflow-x-auto text-zinc-300 font-mono text-xs max-h-96 overflow-y-auto whitespace-pre-wrap">
                                            <code>{generatedResults.json_ld}</code>
                                        </pre>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                    </CardContent>
                </Card>
            )}
        </div>
    );
}
