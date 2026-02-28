"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Copy, Loader2, Sparkles, Check, ChevronRight, ChevronLeft, Settings, Send, LogOut, History, Clock, Pencil, Trash2, Globe, FileText, Newspaper, Store, PlusCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToastContainer, useToast } from "@/components/ui/toast";

type Pattern = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";

const ADMIN_EMAIL = "naganon026@gmail.com";

// 管理者が登録した店舗の型
interface StoreRecord {
  id: string;
  name: string;
  settings: ShopInfo;
  created_at: string;
  updated_at: string;
}

// 生成履歴の1件分の型
interface HistoryEntry {
  id: string;
  pattern_id: string;
  pattern_title: string;
  inputs: {
    q1?: string; q2?: string; q3?: string;
    platform?: "sns" | "gbp";
    receivedComment?: string;
    replyNote?: string;
    newsTitle?: string;
    newsLink?: string;
  };
  results: {
    instagram?: string; gbp?: string;
    portal?: string; portalTitle?: string;
    line?: string; reply?: string; imageUrl?: string;
  };
  created_at: string;
}

interface PatternData {
  id: Pattern;
  title: string;
  description: string;
  questions: {
    q1: string;
    ex1: string;
    q2: string;
    ex2: string;
    q3: string;
    ex3: string;
  };
}

interface NewsItem {
  title: string;
  link: string;
  snippet: string;
}

const PATTERNS: PatternData[] = [
  {
    id: "A",
    title: "ビフォーアフター・お悩み解決",
    description: "お客様の変化を通じて、商品・サービスの価値をアピールします",
    questions: {
      q1: "来店前、お客様はどんなお悩みや不満を抱えていましたか？",
      ex1: "例: 〇〇に悩んでいた／〇〇がうまくいかなかった",
      q2: "あなたの商品・サービスのどんな点がそのお悩みに応えましたか？",
      ex2: "例: 〇〇という特徴が、△△というお悩みにぴったりだった",
      q3: "利用後、お客様はどのように変わりましたか？",
      ex3: "例: 〇〇が改善され「またお願いしたい」と言ってもらえた",
    }
  },
  {
    id: "B",
    title: "プロのこだわり・裏側公開",
    description: "独自のこだわりや背景を公開して信頼感を高めます",
    questions: {
      q1: "今回紹介する商品・メニュー・サービスの「独自のこだわり」は何ですか？",
      ex1: "例: 〇〇産の素材を使用／完全予約制で一人ひとりに向き合う",
      q2: "なぜその手法・素材・やり方を選んだのですか？",
      ex2: "例: お客様に△△を提供したいという想いから／〇〇のほうが効果が高いため",
      q3: "どんなお客様に一番体験してほしいですか？",
      ex3: "例: 〇〇に悩んでいる方／△△を大切にしたい方",
    }
  },
  {
    id: "C",
    title: "今日のお知らせ・限定情報",
    description: "タイムリーな情報の発信で、即時来店・購買を促します",
    questions: {
      q1: "本日や今週の「おすすめの時間帯・タイミング」はいつですか？",
      ex1: "例: 本日〇〇時〜△△時／今週末",
      q2: "今だけの限定メニュー・商品・特典は何ですか？",
      ex2: "例: 〇〇限定で△△をプレゼント／〇〇が今週のみ特別価格",
      q3: "来店・利用するとどんな良い体験が待っていますか？",
      ex3: "例: 〇〇の気分を味わえる／△△がいつもより快適になる",
    }
  },
  {
    id: "D",
    title: "お客様の喜びの声",
    description: "第三者の言葉で安心感を伝え、来店・購買を後押しします",
    questions: {
      q1: "お客様からどんな嬉しい言葉をいただきましたか？",
      ex1: "例: 「〇〇で本当に良かった」「もっと早く来ればよかった」など",
      q2: "その方はどんな状況・背景で来店されましたか？",
      ex2: "例: 〇〇に困っていた／他で満足できず探していた",
      q3: "次回に向けてどんなご提案をしましたか？",
      ex3: "例: 〇〇のご利用をおすすめした／定期的な〇〇をご提案した",
    }
  },
  {
    id: "E",
    title: "スタッフの紹介・想い",
    description: "スタッフの人柄や熱意を伝え、親近感と信頼を生み出します",
    questions: {
      q1: "このスタッフの得意なこと・強みは何ですか？",
      ex1: "例: 〇〇が得意／△△の経験が豊富",
      q2: "仕事において一番大切にしている信念・想いは何ですか？",
      ex2: "例: お客様に〇〇を感じてもらうこと／△△を妥協しないこと",
      q3: "この投稿を読んでいるお客様へ一言メッセージを。",
      ex3: "例: 〇〇でお待ちしています！／お気軽にご相談ください！",
    }
  },
  {
    id: "F",
    title: "季節・シーズンに合わせた提案",
    description: "季節の変わり目やイベントに乗せて「今行くべき理由」を作ります",
    questions: {
      q1: "今の季節やシーズンならではの、お客様のニーズ・気分は何ですか？",
      ex1: "例: 〇〇の時期だから△△したい気分になる",
      q2: "そのニーズに応える、今おすすめの商品・メニュー・サービスは何ですか？",
      ex2: "例: 季節限定の〇〇／この時期だけのキャンペーン",
      q3: "利用後、どんな気持ちや状態を味わえますか？",
      ex3: "例: 〇〇な気持ちになれる／△△がより楽しくなる",
    }
  },
  {
    id: "G",
    title: "コメント・クチコミへの返信",
    description: "SNSやGBPに届いたコメント・クチコミに、オーナーとして誠実かつ温かみのある返信を生成します",
    questions: {
      q1: "",
      ex1: "",
      q2: "",
      ex2: "",
      q3: "",
      ex3: "",
    }
  },
  {
    id: "H",
    title: "ニュース連動ポスト（業種別）",
    description: "Googleニュースの最新トピックを元に、あなたのお店目線のコメント付き投稿を自動生成します。",
    questions: {
      q1: "",
      ex1: "",
      q2: "",
      ex2: "",
      q3: "",
      ex3: "",
    }
  }
];

export interface ShopInfo {
  name: string;
  address: string;
  phone: string;
  lineUrl: string;
  businessHours: string;
  holidays: string;
  features: string;
  industry?: string;
  snsUrl?: string;
  sampleTexts?: string;
  scrapedContent?: string;
  referenceUrls: string[];
  wpCategoryId?: string;
  wpTagId?: string;
  wpAuthorId?: string;
  outputTargets?: {
    instagram: boolean;
    gbp: boolean;
    portal: boolean;
    line: boolean;
  };
}

export default function SEOContentGenerator() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  const [shopInfo, setShopInfo] = useState<ShopInfo>({
    name: "", address: "", phone: "", lineUrl: "", businessHours: "", holidays: "", features: "", industry: "", snsUrl: "", sampleTexts: "", referenceUrls: [],
    wpCategoryId: "", wpTagId: "", wpAuthorId: "",
    outputTargets: { instagram: true, gbp: true, portal: true, line: true }
  });
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [scrapeUrl, setScrapeUrl] = useState<string>("");
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [isExtractingInfo, setIsExtractingInfo] = useState<boolean>(false);
  const [scrapedPreview, setScrapedPreview] = useState<string>("");

  // 初期設定のステップ形式: 1=URL入力, 2=基本情報, 3=オプション
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1);
  const [setupPath, setSetupPath] = useState<"url" | "manual" | null>(null);
  const [minimalStart, setMinimalStart] = useState(false);

  const [selectedPattern, setSelectedPattern] = useState<Pattern>("A");
  const [formData, setFormData] = useState({ q1: "", q2: "", q3: "" });

  // パターンG（コメント返信）専用の状態
  const [replyPlatform, setReplyPlatform] = useState<"sns" | "gbp">("sns");
  const [receivedComment, setReceivedComment] = useState("");
  const [replyNote, setReplyNote] = useState("");
  // パターンH（ニュース連動）専用の状態
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [selectedNewsIndex, setSelectedNewsIndex] = useState<number | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  // クイック設定編集用のフローティング画面
  const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);

  // ===== 管理者向け複数店舗管理 =====
  // 登録済み店舗一覧
  const [stores, setStores] = useState<StoreRecord[]>([]);
  // 生成対象として選択中の店舗ID（nullは未選択=shopInfo使用）
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  // 管理パネルの表示フラグ
  const [showStoreManager, setShowStoreManager] = useState(false);
  // 新規店舗登録フォームの表示フラグ
  const [showStoreForm, setShowStoreForm] = useState(false);
  // 編集中の店舗ID（nullは新規登録）
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  // 店舗フォームのデータ
  const [storeFormData, setStoreFormData] = useState<ShopInfo>({
    name: "", address: "", phone: "", lineUrl: "", businessHours: "", holidays: "",
    features: "", industry: "", snsUrl: "", sampleTexts: "", referenceUrls: [],
    wpCategoryId: "", wpTagId: "", wpAuthorId: "",
    outputTargets: { instagram: true, gbp: true, portal: true, line: true }
  });
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [isDeletingStore, setIsDeletingStore] = useState<string | null>(null);
  const [storeScrapeUrl, setStoreScrapeUrl] = useState("");
  const [isScrapingStore, setIsScrapingStore] = useState(false);
  const [storeMinimalStart, setStoreMinimalStart] = useState(false);
  const [settingsScrapeUrl, setSettingsScrapeUrl] = useState("");
  const [isScrapingSettings, setIsScrapingSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<{
    instagram?: string;
    gbp?: string;
    portal?: string;
    portalTitle?: string;
    imageUrl?: string;
    reply?: string;
    line?: string;
  } | null>(null);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [editingTab, setEditingTab] = useState<string | null>(null); // 編集中のタブID
  const [isPostingToWP, setIsPostingToWP] = useState(false);

  // 生成履歴
  const [generationHistory, setGenerationHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null);

  // トースト通知
  const { toasts, addToast, removeToast } = useToast();

  // 生成結果セクションへの自動スクロール用 ref
  const resultsRef = useRef<HTMLDivElement>(null);

  // shopInfoの変更をsessionStorageに自動保存（別タブから戻っても入力内容を保持）
  // isLoadingがtrueの間（fetchShopInfo実行中）は保存しない
  // ← ここ重要: ログイン直後にまだ空のshopInfoがsessionStorageに書き込まれるのを防ぐ
  useEffect(() => {
    if (user && !isLoading) {
      sessionStorage.setItem('shopInfoDraft', JSON.stringify(shopInfo));
    }
  }, [shopInfo, user, isLoading]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        // OAuthリダイレクト後などonAuthStateChangeが発火しないケースに対応
        fetchShopInfo(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchShopInfo(session.user.id);
      } else {
        setShopInfo({
          name: "", address: "", phone: "", lineUrl: "", businessHours: "", holidays: "", features: "", industry: "", snsUrl: "", sampleTexts: "", scrapedContent: "", referenceUrls: [],
          wpCategoryId: "", wpTagId: "", wpAuthorId: "",
          outputTargets: { instagram: true, gbp: true, portal: true, line: true }
        });
        setScrapedPreview("");
        // ログアウト時はsessionStorageもクリア
        sessionStorage.removeItem('shopInfoDraft');
        setIsConfigured(false);
        setIsLoading(false);
        setStores([]);
        setSelectedStoreId(null);
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => subscription.unsubscribe();
  }, []);

  const fetchShopInfo = async (userId: string) => {
    setIsLoading(true);
    const { data } = await supabase.from('shops').select('settings').eq('user_id', userId).maybeSingle();
    if (data && data.settings) {
      // sessionStorageにドラフトがあればそちらを優先、なければSupabaseのデータを使う
      const draft = sessionStorage.getItem('shopInfoDraft');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setShopInfo(parsed);
          if (parsed.scrapedContent) setScrapedPreview(parsed.scrapedContent);
        } catch {
          setShopInfo((prev) => ({ ...prev, ...data.settings }));
          if (data.settings.scrapedContent) setScrapedPreview(data.settings.scrapedContent);
        }
      } else {
        setShopInfo((prev) => ({ ...prev, ...data.settings }));
        if (data.settings.scrapedContent) setScrapedPreview(data.settings.scrapedContent);
      }
      // 設定が存在する場合は通常画面からスットく
      setIsConfigured(true);
    } else {
      // 設定がまだない場合
      // 管理者は店舗登録が主目的なので初期設定スキップ
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (currentUser?.email === ADMIN_EMAIL) {
        setIsConfigured(true);
      } else {
        setIsConfigured(false);
      }
    }
    await fetchHistory(userId); // ログイン後に生成履歴を読み込む
    // 管理者の場合はstoresも取得
    const currentUser2 = (await supabase.auth.getUser()).data.user;
    if (currentUser2?.email === ADMIN_EMAIL) {
      await fetchStores();
    }
    setIsLoading(false);
  };

  // 生成履歴を最新20件取得する
  const fetchHistory = async (userId: string) => {
    const { data, error } = await supabase
      .from('generation_history')
      .select('id, pattern_id, pattern_title, inputs, results, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (!error && data) {
      setGenerationHistory(data as HistoryEntry[]);
    }
  };

  // 履歴エントリをステートに復元する
  const handleRestoreHistory = (entry: HistoryEntry) => {
    const patternId = entry.pattern_id as Pattern;
    setSelectedPattern(patternId);
    setGeneratedResults(entry.results);
    if (patternId === 'G') {
      setReplyPlatform(entry.inputs.platform ?? 'sns');
      setReceivedComment(entry.inputs.receivedComment ?? '');
      setReplyNote(entry.inputs.replyNote ?? '');
    } else {
      setFormData({
        q1: entry.inputs.q1 ?? '',
        q2: entry.inputs.q2 ?? '',
        q3: entry.inputs.q3 ?? '',
      });
    }
    setShowHistory(false);
    setTimeout(() => window.scrollTo({ top: 999, behavior: 'smooth' }), 100);
  };

  // ===== 管理者向け店舗 CRUD =====

  /** storesテーブルから全店舗を取得する */
  const fetchStores = async () => {
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, settings, created_at, updated_at')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setStores(data as StoreRecord[]);
    }
  };

  /** 店舗を新規作成または更新して保存する */
  const handleSaveStore = async () => {
    if (!storeFormData.name?.trim()) {
      addToast("店舗名を入力してください。", "error");
      return;
    }
    if (!storeFormData.industry?.trim()) {
      addToast("業種を入力してください。", "error");
      return;
    }
    if (!storeMinimalStart) {
      if (!storeFormData.address?.trim()) {
        addToast("住所を入力してください。", "error");
        return;
      }
      if (!storeFormData.phone?.trim()) {
        addToast("電話番号を入力してください。", "error");
        return;
      }
      if (!storeFormData.lineUrl?.trim()) {
        addToast("LINE/予約URLを入力してください。", "error");
        return;
      }
      if (!storeFormData.businessHours?.trim()) {
        addToast("営業時間を入力してください。", "error");
        return;
      }
      if (!storeFormData.holidays?.trim()) {
        addToast("定休日を入力してください。", "error");
        return;
      }
    }
    setIsSavingStore(true);
    try {
      if (editingStoreId) {
        // 既存店舗の更新
        const { error } = await supabase.from('stores').update({
          name: storeFormData.name,
          settings: storeFormData,
          updated_at: new Date().toISOString(),
        }).eq('id', editingStoreId);
        if (error) throw error;
        addToast("店舗情報を更新しました。", "success");
      } else {
        // 新規店舗の作成
        const { error } = await supabase.from('stores').insert({
          owner_email: user?.email ?? ADMIN_EMAIL,
          name: storeFormData.name,
          settings: storeFormData,
        });
        if (error) throw error;
        addToast("新しい店舗を登録しました！", "success");
      }
      await fetchStores();
      setShowStoreForm(false);
      setEditingStoreId(null);
      setStoreScrapeUrl("");
      setStoreMinimalStart(false);
      setStoreFormData({
        name: "", address: "", phone: "", lineUrl: "", businessHours: "", holidays: "",
        features: "", industry: "", snsUrl: "", sampleTexts: "", referenceUrls: [],
        wpCategoryId: "", wpTagId: "", wpAuthorId: "",
        outputTargets: { instagram: true, gbp: true, portal: true, line: true }
      });
    } catch (err) {
      if (err instanceof Error) addToast("保存に失敗しました: " + err.message, "error");
    } finally {
      setIsSavingStore(false);
    }
  };

  /** 店舗を削除する */
  const handleDeleteStore = async (storeId: string) => {
    if (!confirm("この店舗を削除してもよいですか？")) return;
    setIsDeletingStore(storeId);
    const { error } = await supabase.from('stores').delete().eq('id', storeId);
    if (error) {
      addToast("削除に失敗しました: " + error.message, "error");
    } else {
      addToast("店舗を削除しました。", "success");
      if (selectedStoreId === storeId) setSelectedStoreId(null);
      await fetchStores();
    }
    setIsDeletingStore(null);
  };

  /** 店舗編集フォームを開く */
  const openEditStore = (store: StoreRecord) => {
    setEditingStoreId(store.id);
    setStoreFormData(store.settings);
    setStoreMinimalStart(false);
    setShowStoreForm(true);
  };

  /** 管理者用：URLから店舗情報をスクレイプしてフォームに自動入力 */
  const handleScrapeUrlForStore = async () => {
    if (!storeScrapeUrl?.trim().startsWith("http")) {
      addToast("有効なURLを入力してください。", "error");
      return;
    }
    const urlToAdd = storeScrapeUrl.trim();
    setIsScrapingStore(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToAdd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "抽出失敗");

      const extractRes = await fetch("/api/extract-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: data.text }),
      });
      const extracted = await extractRes.json();

      setStoreFormData((prev) => {
        const next = { ...prev };
        if (extractRes.ok && extracted) {
          if (extracted.industry) next.industry = extracted.industry;
          if (extracted.name) next.name = extracted.name;
          if (extracted.address) next.address = extracted.address;
          if (extracted.phone) next.phone = extracted.phone;
          if (extracted.lineUrl) next.lineUrl = extracted.lineUrl;
          if (extracted.businessHours) next.businessHours = extracted.businessHours;
          if (extracted.holidays) next.holidays = extracted.holidays;
        }
        next.scrapedContent = prev.scrapedContent
          ? prev.scrapedContent + "\n\n---\n\n" + data.text
          : data.text;
        next.referenceUrls = prev.referenceUrls.includes(urlToAdd)
          ? prev.referenceUrls
          : [...prev.referenceUrls, urlToAdd];
        return next;
      });
      setStoreScrapeUrl("");
      addToast("URLから店舗情報を取得しました。", "success");
    } catch (error) {
      if (error instanceof Error) addToast(error.message, "error");
      else addToast("予期せぬエラーが発生しました", "error");
    } finally {
      setIsScrapingStore(false);
    }
  };

  /** 設定オーバーレイ用：URLからshopInfoを取得して自動入力 */
  const handleScrapeUrlForSettings = async () => {
    if (!settingsScrapeUrl?.trim().startsWith("http")) {
      addToast("有効なURLを入力してください。", "error");
      return;
    }
    const urlToAdd = settingsScrapeUrl.trim();
    setIsScrapingSettings(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToAdd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "抽出失敗");

      const extractRes = await fetch("/api/extract-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: data.text }),
      });
      const extracted = await extractRes.json();

      setShopInfo((prev) => {
        const next = { ...prev };
        if (extractRes.ok && extracted) {
          if (extracted.industry) next.industry = extracted.industry;
          if (extracted.name) next.name = extracted.name;
          if (extracted.address) next.address = extracted.address;
          if (extracted.phone) next.phone = extracted.phone;
          if (extracted.lineUrl) next.lineUrl = extracted.lineUrl;
          if (extracted.businessHours) next.businessHours = extracted.businessHours;
          if (extracted.holidays) next.holidays = extracted.holidays;
        }
        next.scrapedContent = prev.scrapedContent
          ? prev.scrapedContent + "\n\n---\n\n" + data.text
          : data.text;
        next.referenceUrls = prev.referenceUrls.includes(urlToAdd)
          ? prev.referenceUrls
          : [...prev.referenceUrls, urlToAdd];
        return next;
      });
      setSettingsScrapeUrl("");
      addToast("URLから店舗情報を取得しました。", "success");
    } catch (error) {
      if (error instanceof Error) addToast(error.message, "error");
      else addToast("予期せぬエラーが発生しました", "error");
    } finally {
      setIsScrapingSettings(false);
    }
  };

  // フォームsubmitに依存しない単独の保存関数
  const saveShopInfo = async (infoToSave: typeof shopInfo) => {
    if (!user) return;
    const { error } = await supabase.from('shops').upsert({
      user_id: user.id,
      settings: infoToSave,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
    if (error) {
      addToast("保存に失敗しました：" + error.message, "error");
    }
  };

  const handleSaveShopInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Supabaseへの保存
    const { error } = await supabase.from('shops').upsert({
      user_id: user.id,
      settings: shopInfo,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    if (error) {
      addToast("設定の保存に失敗しました：" + error.message, "error");
    } else {
      setIsConfigured(true);
      addToast("クラウドに設定を保存しました！", "success");
    }
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleExtractInfo = async (textToExtract: string, overwrite = false) => {
    if (!textToExtract.trim()) return;

    setIsExtractingInfo(true);
    try {
      const res = await fetch("/api/extract-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToExtract }),
      });
      const data = await res.json();

      if (!res.ok) {
        console.error("情報抽出エラー:", data.error);
        return;
      }

      // 上書きモードかつ、既存の店舗情報と大きく異なる場合はアラートで確認
      let allowOverwrite = overwrite;
      if (overwrite) {
        const conflicts: string[] = [];
        if (data.name && shopInfo.name && data.name.trim() !== shopInfo.name.trim()) conflicts.push("店舗名");
        if (data.address && shopInfo.address && data.address.trim() !== shopInfo.address.trim()) conflicts.push("住所");
        if (data.phone && shopInfo.phone && data.phone.trim() !== shopInfo.phone.trim()) conflicts.push("電話番号");

        if (conflicts.length > 0) {
          const ok = window.confirm(
            `すでに登録されている${conflicts.join("・")}と、新しく読み取った情報が異なります。\n別のお店のURLかもしれません。このまま上書きしてもよろしいですか？`
          );
          if (!ok) {
            allowOverwrite = false;
          }
        }
      }

      setShopInfo((prev) => {
        const nextInfo = { ...prev };

        // overwrite=trueの場合は既存の値があっても上書き、falseの場合は空欄のみ埋める
        if (data.industry && (allowOverwrite || !nextInfo.industry)) nextInfo.industry = data.industry;
        if (data.name && (allowOverwrite || !nextInfo.name)) nextInfo.name = data.name;
        if (data.address && (allowOverwrite || !nextInfo.address)) nextInfo.address = data.address;
        if (data.phone && (allowOverwrite || !nextInfo.phone)) nextInfo.phone = data.phone;
        if (data.lineUrl && (allowOverwrite || !nextInfo.lineUrl)) nextInfo.lineUrl = data.lineUrl;
        if (data.businessHours && (allowOverwrite || !nextInfo.businessHours)) nextInfo.businessHours = data.businessHours;
        if (data.holidays && (allowOverwrite || !nextInfo.holidays)) nextInfo.holidays = data.holidays;

        return nextInfo;
      });
    } catch (error) {
      console.error("情報抽出例外:", error);
    } finally {
      setIsExtractingInfo(false);
    }
  };

  const handleScrapeUrl = async () => {
    if (!scrapeUrl || !scrapeUrl.startsWith("http")) {
      addToast("有効なURLを入力してください。", "error");
      return;
    }
    const urlToAdd = scrapeUrl;
    setIsScraping(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToAdd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "抽出失敗");

      // 既に店舗情報がある場合、別店舗のURLでないか先に判定する
      const hasExistingShop = !!(shopInfo.name?.trim() || shopInfo.address?.trim() || shopInfo.phone?.trim());
      if (hasExistingShop && data.text?.trim()) {
        const extractRes = await fetch("/api/extract-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: data.text }),
        });
        const extracted = await extractRes.json();
        if (extractRes.ok && extracted) {
          const conflicts: string[] = [];
          if (extracted.name?.trim() && shopInfo.name?.trim() && extracted.name.trim() !== shopInfo.name.trim()) conflicts.push("店舗名");
          if (extracted.address?.trim() && shopInfo.address?.trim() && extracted.address.trim() !== shopInfo.address.trim()) conflicts.push("住所");
          if (extracted.phone?.trim() && shopInfo.phone?.trim() && extracted.phone.trim() !== shopInfo.phone.trim()) conflicts.push("電話番号");
          if (conflicts.length > 0) {
            const doOverwrite = window.confirm("別のお店のURLのようです。このURLで全て書き換えますか。");
            if (!doOverwrite) {
              setScrapeUrl("");
              setIsScraping(false);
              return;
            }
            // Yes → このURLの内容で全て上書き（取得済みの extracted で基本情報も更新、二重アラートを防ぐ）
            setScrapedPreview(data.text);
            setScrapeUrl("");
            setShopInfo((prev) => ({
              ...prev,
              scrapedContent: data.text,
              referenceUrls: [urlToAdd],
              industry: extracted.industry ?? prev.industry,
              name: extracted.name ?? prev.name,
              address: extracted.address ?? prev.address,
              phone: extracted.phone ?? prev.phone,
              lineUrl: extracted.lineUrl ?? prev.lineUrl,
              businessHours: extracted.businessHours ?? prev.businessHours,
              holidays: extracted.holidays ?? prev.holidays,
            }));
            return;
          }
        }
      }

      // プレビューに表示（同一店舗として追記）
      setScrapedPreview(data.text);
      setScrapeUrl("");

      // shopInfo.scrapedContent に蓄積、使用したURLも referenceUrls に追記
      setShopInfo((prev) => ({
        ...prev,
        scrapedContent: prev.scrapedContent
          ? prev.scrapedContent + "\n\n---\n\n" + data.text
          : data.text,
        referenceUrls: prev.referenceUrls.includes(urlToAdd)
          ? prev.referenceUrls
          : [...prev.referenceUrls, urlToAdd],
      }));

      // スクレイピングで得たテキストからも住所等を裏で抽出
      handleExtractInfo(data.text);

    } catch (error) {
      if (error instanceof Error) {
        addToast(error.message, "error");
      } else {
        addToast("予期せぬエラーが発生しました", "error");
      }
    } finally {
      setIsScraping(false);
    }
  };

  const handleFeaturesPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // ペーストされたテキストを取得
    const pastedText = e.clipboardData.getData("text");
    if (pastedText.length > 20) {
      // 少し長めのテキストがペーストされた場合のみ、自動抽出を裏で走らせる
      handleExtractInfo(pastedText);
    }
  };

  const handleFetchNews = async () => {
    if (!shopInfo.industry) {
      addToast("まず初期設定で業種を入力してください。", "error");
      return;
    }
    setIsLoadingNews(true);
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: shopInfo.industry,
          address: shopInfo.address || "",
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "ニュースの取得に失敗しました。");
      }
      const articles: NewsItem[] = data.articles || [];
      setNewsItems(articles);
      setSelectedNewsIndex(articles.length > 0 ? 0 : null);
      if (articles.length > 0) {
        addToast(`ニュース候補を${articles.length}件取得しました。`, "success");
      } else {
        addToast("本日は該当するニュースはありませんでした。", "error");
      }
    } catch (error) {
      if (error instanceof Error) {
        addToast(error.message, "error");
      } else {
        addToast("ニュースの取得中にエラーが発生しました。", "error");
      }
    } finally {
      setIsLoadingNews(false);
    }
  };

  const handleQuickSaveSettings = async () => {
    if (!shopInfo.industry || !shopInfo.industry.trim()) {
      addToast("業種を入力してください。", "error");
      return;
    }
    if (!shopInfo.name || !shopInfo.name.trim()) {
      addToast("店舗名を入力してください。", "error");
      return;
    }
    if (!shopInfo.address || !shopInfo.address.trim()) {
      addToast("住所を入力してください。", "error");
      return;
    }
    if (!shopInfo.sampleTexts || !shopInfo.sampleTexts.trim()) {
      addToast("文章サンプルを2〜3件コピペしてください。", "error");
      return;
    }
    if (!user) {
      addToast("ログインしてから設定を保存してください。", "error");
      return;
    }
    await saveShopInfo(shopInfo);
    addToast("設定を保存しました。", "success");
    setShowSettingsOverlay(false);
    setSettingsScrapeUrl("");
  };

  const handlePatternChange = (patternId: Pattern) => {
    setSelectedPattern(patternId);
    setFormData({ q1: "", q2: "", q3: "" });
    // パターンG専用フォームをリセット
    setReceivedComment("");
    setReplyNote("");
    setNewsItems([]);
    setSelectedNewsIndex(null);
    setGeneratedResults(null);
  };

  const handlePostToWP = async (status: "draft" | "publish") => {
    if (!generatedResults?.portalTitle || !generatedResults?.portal) {
      addToast("ポータルサイト用のタイトルと本文が生成されていません。", "error");
      return;
    }

    const actionText = status === "draft" ? "下書き保存" : "公開";
    if (!confirm(`生成されたポータル用テキストをWordPressへ${actionText}しますか？`)) {
      return;
    }

    setIsPostingToWP(true);
    try {
      const res = await fetch("/api/wppost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generatedResults.portalTitle,
          content: generatedResults.portal,
          status: status,
          wpCategoryId: shopInfo.wpCategoryId,
          wpTagId: shopInfo.wpTagId,
          wpAuthorId: shopInfo.wpAuthorId,
          imageUrl: generatedResults.imageUrl
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || "投稿に失敗しました");
      }

      addToast(`WordPressへ${actionText}しました！（投稿ID: ${data.postId}）`, "success");
      if (data.link) {
        window.open(data.link, '_blank');
      }
    } catch (error) {
      if (error instanceof Error) {
        addToast("エラーが発生しました: " + error.message, "error");
      } else {
        addToast("予期せぬエラーが発生しました", "error");
      }
    } finally {
      setIsPostingToWP(false);
    }
  };

  // 履歴を1件削除する
  const handleDeleteHistory = async (entryId: string) => {
    setDeletingHistoryId(entryId);
    const { error } = await supabase
      .from('generation_history')
      .delete()
      .eq('id', entryId);
    if (error) {
      addToast("履歴の削除に失敗しました", "error");
    } else {
      setGenerationHistory((prev) => prev.filter((e) => e.id !== entryId));
    }
    setDeletingHistoryId(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleGenerate = async () => {
    if (selectedPattern === "H") {
      if (selectedNewsIndex === null || !newsItems[selectedNewsIndex]) {
        addToast("まずニュースを選択してください。", "error");
        return;
      }
    }
    setIsGenerating(true);

    try {
      // パターンGはコメント返信専用エンドポイントを使用
      const endpoint = selectedPattern === "G" ? "/api/generate-reply" : "/api/generate";
      const selectedNews = selectedPattern === "H" && selectedNewsIndex !== null
        ? newsItems[selectedNewsIndex]
        : undefined;

      // 管理者が店舗を選択している場合はその店舗情報を使用、未選択ならデフォルトのshopInfo
      const activeShopInfo: ShopInfo = (() => {
        if (selectedStoreId) {
          const found = stores.find(s => s.id === selectedStoreId);
          if (found) return found.settings;
        }
        return shopInfo;
      })();

      const requestBody =
        selectedPattern === "G"
          ? {
            patternTitle: currentPattern.title,
            platform: replyPlatform,
            receivedComment,
            replyNote,
            shopInfo: activeShopInfo,
          }
          : selectedPattern === "H"
            ? {
              patternTitle: currentPattern.title,
              q1: "",
              q2: "",
              q3: "",
              shopInfo: activeShopInfo,
              outputTargets: activeShopInfo.outputTargets || { instagram: true, gbp: true, portal: true, line: false },
              news: selectedNews,
            }
            : {
              patternTitle: currentPattern.title,
              q1: formData.q1,
              q2: formData.q2,
              q3: formData.q3,
              shopInfo: activeShopInfo,
              outputTargets: activeShopInfo.outputTargets || { instagram: true, gbp: true, portal: true, line: false },
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("APIリクエストに失敗しました。");
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedResults({
        instagram: data.instagram,
        gbp: data.gbp,
        portal: data.portal,
        portalTitle: data.portalTitle,
        imageUrl: data.imageUrl,
        reply: data.reply,
        line: data.line,
      });

      // 生成成功後、Supabaseに履歴を保存（エラーは無視して続行）
      if (user) {
        const inputs =
          selectedPattern === 'G'
            ? { platform: replyPlatform, receivedComment, replyNote }
            : selectedPattern === 'H'
              ? { newsTitle: selectedNews?.title, newsLink: selectedNews?.link }
              : { q1: formData.q1, q2: formData.q2, q3: formData.q3 };
        supabase.from('generation_history').insert({
          user_id: user.id,
          pattern_id: selectedPattern,
          pattern_title: currentPattern.title,
          inputs,
          results: {
            instagram: data.instagram,
            gbp: data.gbp,
            portal: data.portal,
            portalTitle: data.portalTitle,
            line: data.line,
            reply: data.reply,
          },
        }).then(({ error }) => {
          if (error) console.error('履歴保存エラー:', error);
          else fetchHistory(user.id); // 保存後に履歴を再取得
        });
      }

      // 生成完了後に結果セクションへ自動スクロール
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      addToast("生成完了！おつかれさまでした。", "success");

    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        addToast(error.message || "テキストの生成中にエラーが発生しました。", "error");
      } else {
        addToast("テキストの生成中にエラーが発生しました。", "error");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, tabId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabId);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const currentPattern = PATTERNS.find(p => p.id === selectedPattern)!;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 mb-8 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-900/20">
          <Sparkles className="w-8 h-8 text-zinc-950" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Post Support</h1>
        <p className="text-zinc-400 mb-8 text-center max-w-sm leading-relaxed">
          店舗の魅力を最大限に引き出す、高品質な投稿テキストと画像をAIが自動生成します。
        </p>
        <Button
          onClick={handleLogin}
          className="bg-white hover:bg-zinc-200 text-zinc-900 font-bold !px-16 py-4 rounded-full shadow-xl transition-all active:scale-95 flex items-center gap-3 text-base"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Googleで続ける
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50 font-sans selection:bg-amber-500/30 pb-20">
      {/* ===== 管理者用・店舗管理オーバーレイ ===== */}
      {showStoreManager && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-16 md:pt-20"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowStoreManager(false); setShowStoreForm(false); } }}
        >
          <div className="w-full max-w-3xl rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-white">
                  {showStoreForm ? (editingStoreId ? "店舗情報を編集" : "新しい店舗を登録") : "店舗管理"}
                </h2>
                {!showStoreForm && (
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{stores.length}件</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setShowStoreManager(false); setShowStoreForm(false); setEditingStoreId(null); setStoreScrapeUrl(""); setStoreMinimalStart(false); }}
                className="text-zinc-500 hover:text-zinc-200 text-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {showStoreForm ? (
                /* ===== 店舗登録/編集フォーム ===== */
                <div className="px-6 py-5 space-y-5">
                  {/* URLから自動取得（管理者用） */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                    <Label className="text-sm font-medium text-amber-500">🔗 URLから店舗情報を自動取得</Label>
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        value={storeScrapeUrl}
                        onChange={(e) => setStoreScrapeUrl(e.target.value)}
                        placeholder="店舗のWEBサイトURLを入力（例：https://example.com）"
                        className="flex-1 bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleScrapeUrlForStore())}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleScrapeUrlForStore}
                        disabled={isScrapingStore || !storeScrapeUrl.trim().startsWith("http")}
                        className="shrink-0 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/40"
                      >
                        {isScrapingStore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                        {isScrapingStore ? "取得中…" : "URLから取得"}
                      </Button>
                    </div>
                    <p className="text-xs text-zinc-500">店舗のWEBサイトURLを入力して「URLから取得」をクリックすると、業種・店舗名・住所などを自動入力し、下のテキストを投稿生成時の参照情報として保存します。</p>
                    {/* 抽出テキスト（投稿生成時の参照情報） */}
                    <div className="space-y-2 pt-2 border-t border-zinc-800">
                      <Label className="text-sm font-medium text-zinc-300">📄 サイトから抽出したテキスト（投稿生成時の参照情報）</Label>
                      <p className="text-xs text-zinc-500">このテキストはAIが投稿を生成する際の参考情報として使用されます。内容を確認・編集できます。</p>
                      <Textarea
                        value={storeFormData.scrapedContent || ""}
                        onChange={(e) => setStoreFormData({ ...storeFormData, scrapedContent: e.target.value })}
                        placeholder="URLから取得するか、手動で貼り付けてください。投稿生成時にAIが参照します。"
                        className="min-h-[140px] max-h-[160px] w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-y overflow-y-auto"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-zinc-300">
                    <input type="checkbox" checked={storeMinimalStart} onChange={(e) => setStoreMinimalStart(e.target.checked)} className="rounded accent-amber-500" />
                    最小限で始める（業種・店舗名だけ入力してあとで追記する）
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sf-industry" className="text-sm font-medium text-zinc-300">業種 <span className="text-red-400">*</span></Label>
                      <Input id="sf-industry" value={storeFormData.industry || ""} onChange={(e) => setStoreFormData({ ...storeFormData, industry: e.target.value })} placeholder="例：美容室、整体院" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sf-name" className="text-sm font-medium text-zinc-300">店舗名 <span className="text-red-400">*</span></Label>
                      <Input id="sf-name" value={storeFormData.name || ""} onChange={(e) => setStoreFormData({ ...storeFormData, name: e.target.value })} placeholder="例：The Gentry" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="sf-address" className="text-sm font-medium text-zinc-300">住所 {!storeMinimalStart && <span className="text-red-400">*</span>}</Label>
                      <Input id="sf-address" value={storeFormData.address || ""} onChange={(e) => setStoreFormData({ ...storeFormData, address: e.target.value })} placeholder="例：長野県長野市〇〇1-2-3" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sf-phone" className="text-sm font-medium text-zinc-300">電話番号 {!storeMinimalStart && <span className="text-red-400">*</span>}</Label>
                      <Input id="sf-phone" type="tel" value={storeFormData.phone || ""} onChange={(e) => setStoreFormData({ ...storeFormData, phone: e.target.value })} placeholder="例：026-000-0000" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sf-lineUrl" className="text-sm font-medium text-zinc-300">LINE/予約URL {!storeMinimalStart && <span className="text-red-400">*</span>}</Label>
                      <Input id="sf-lineUrl" type="url" value={storeFormData.lineUrl || ""} onChange={(e) => setStoreFormData({ ...storeFormData, lineUrl: e.target.value })} placeholder="例：https://lin.ee/xxxxx" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sf-businessHours" className="text-sm font-medium text-zinc-300">営業時間 {!storeMinimalStart && <span className="text-red-400">*</span>}</Label>
                      <Input id="sf-businessHours" value={storeFormData.businessHours || ""} onChange={(e) => setStoreFormData({ ...storeFormData, businessHours: e.target.value })} placeholder="例：10:00〜20:00" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sf-holidays" className="text-sm font-medium text-zinc-300">定休日 {!storeMinimalStart && <span className="text-red-400">*</span>}</Label>
                      <Input id="sf-holidays" value={storeFormData.holidays || ""} onChange={(e) => setStoreFormData({ ...storeFormData, holidays: e.target.value })} placeholder="例：毎週火曜・年末年始" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                    </div>
                  </div>

                  <details className="group bg-zinc-800/20 rounded-xl border border-zinc-800/50 overflow-hidden">
                    <summary className="px-4 py-3 cursor-pointer list-none flex items-center justify-between text-sm text-zinc-300 hover:bg-zinc-800/30">
                      <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> あなたらしさ（文調の学習）・特記事項</span>
                      <span className="text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="px-4 pb-4 space-y-4 border-t border-zinc-800 pt-3">
                      <div className="space-y-2">
                        <Label htmlFor="sf-sampleTexts" className="text-sm">今まで書いた文章のサンプル（2〜3投稿分コピペ）</Label>
                        <Textarea id="sf-sampleTexts" value={storeFormData.sampleTexts || ""} onChange={(e) => setStoreFormData({ ...storeFormData, sampleTexts: e.target.value })} placeholder="例：これまでSNSに投稿していた文章を2〜3件コピペすると、文体を学習します。" className="min-h-[80px] bg-zinc-900 border-zinc-700 text-zinc-100 resize-y" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sf-snsUrl" className="text-sm">SNSのURL（任意）</Label>
                        <Input id="sf-snsUrl" type="url" value={storeFormData.snsUrl || ""} onChange={(e) => setStoreFormData({ ...storeFormData, snsUrl: e.target.value })} placeholder="例：https://instagram.com/〇〇" className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sf-features" className="text-sm">その他特記事項（任意）</Label>
                        <Textarea id="sf-features" value={storeFormData.features || ""} onChange={(e) => setStoreFormData({ ...storeFormData, features: e.target.value })} placeholder="例：VIPルームあり、無料駐車場" className="min-h-[60px] bg-zinc-900 border-zinc-700 text-zinc-100 resize-y" />
                      </div>
                    </div>
                  </details>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* WordPress設定 */}
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-medium text-zinc-300">WordPress 投稿設定（任意）</Label>
                      <div className="grid grid-cols-3 gap-3">
                        <Input placeholder="カテゴリID" value={storeFormData.wpCategoryId || ""} onChange={(e) => setStoreFormData({ ...storeFormData, wpCategoryId: e.target.value })} className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                        <Input placeholder="タグID" value={storeFormData.wpTagId || ""} onChange={(e) => setStoreFormData({ ...storeFormData, wpTagId: e.target.value })} className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                        <Input placeholder="著者ID" value={storeFormData.wpAuthorId || ""} onChange={(e) => setStoreFormData({ ...storeFormData, wpAuthorId: e.target.value })} className="bg-zinc-900 border-zinc-700 text-zinc-100" />
                      </div>
                    </div>
                    {/* 出力媒体 */}
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-medium text-zinc-300">出力する媒体</Label>
                      <div className="flex flex-wrap gap-4">
                        {[
                          { key: "instagram", label: "Instagram用" },
                          { key: "gbp", label: "GBP用" },
                          { key: "portal", label: "ポータル用" },
                          { key: "line", label: "LINE用" },
                        ].map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={storeFormData.outputTargets?.[key as keyof typeof storeFormData.outputTargets] ?? true}
                              onChange={(e) => setStoreFormData({ ...storeFormData, outputTargets: { ...storeFormData.outputTargets!, [key]: e.target.checked } })}
                              className="w-4 h-4 rounded accent-amber-500"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ===== 店舗一覧 ===== */
                <div className="px-6 py-5 space-y-3">
                  {stores.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">
                      <Store className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">まだ店舗が登録されていません</p>
                      <p className="text-xs mt-1">下の「＋ 新しい店舗を登録」ボタンから追加してください</p>
                    </div>
                  ) : (
                    stores.map((store) => (
                      <div key={store.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 hover:border-zinc-700 transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-100 truncate">{store.name}</p>
                          <p className="text-xs text-zinc-500 truncate">
                            {store.settings.industry && <span className="text-amber-500/80 mr-2">{store.settings.industry}</span>}
                            {store.settings.address}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditStore(store)}
                            className="h-8 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800"
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            編集
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStore(store.id)}
                            disabled={isDeletingStore === store.id}
                            className="h-8 text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                            {isDeletingStore === store.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* フッター */}
            <div className="px-6 py-4 border-t border-zinc-800 flex justify-between gap-3 bg-zinc-950/80">
              {showStoreForm ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                    onClick={() => { setShowStoreForm(false); setEditingStoreId(null); }}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    一覧へ戻る
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
                    onClick={handleSaveStore}
                    disabled={isSavingStore}
                  >
                    {isSavingStore ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />保存中...</> : <><Check className="w-4 h-4 mr-2" />{editingStoreId ? "更新する" : "登録する"}</>}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                    onClick={() => { setShowStoreManager(false); }}
                  >
                    閉じる
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
                    onClick={() => { setEditingStoreId(null); setStoreScrapeUrl(""); setStoreMinimalStart(false); setStoreFormData({ name: "", address: "", phone: "", lineUrl: "", businessHours: "", holidays: "", features: "", industry: "", snsUrl: "", sampleTexts: "", referenceUrls: [], wpCategoryId: "", wpTagId: "", wpAuthorId: "", outputTargets: { instagram: true, gbp: true, portal: true, line: true } }); setShowStoreForm(true); }}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    新しい店舗を登録
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* クイック設定編集用フローティング画面 */}
      {showSettingsOverlay && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-24 md:pt-28"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSettingsOverlay(false);
              setSettingsScrapeUrl("");
            }
          }}
        >
          <div className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-500" />
                <h2 className="text-base font-semibold text-white">店舗設定の編集</h2>
              </div>
              <button
                type="button"
                onClick={() => { setShowSettingsOverlay(false); setSettingsScrapeUrl(""); }}
                className="text-zinc-500 hover:text-zinc-200 text-sm"
              >
                閉じる ✕
              </button>
            </div>
            <div className="px-6 py-4 space-y-6 overflow-y-auto">
              <div className="space-y-2">
                <p className="text-xs text-zinc-400">
                  初期設定で登録した内容を、一覧でまとめて編集できます。変更内容は「設定を保存する」を押すとクラウドに反映されます。
                </p>
              </div>

              {/* URLから自動取得（店舗管理・設定編集と同様） */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                <Label className="text-sm font-medium text-amber-500">🔗 URLから店舗情報を自動取得</Label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={settingsScrapeUrl}
                    onChange={(e) => setSettingsScrapeUrl(e.target.value)}
                    placeholder="店舗のWEBサイトURLを入力（例：https://example.com）"
                    className="flex-1 bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleScrapeUrlForSettings())}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleScrapeUrlForSettings}
                    disabled={isScrapingSettings || !settingsScrapeUrl.trim().startsWith("http")}
                    className="shrink-0 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/40"
                  >
                    {isScrapingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                    {isScrapingSettings ? "取得中…" : "URLから取得"}
                  </Button>
                </div>
                <p className="text-xs text-zinc-500">店舗のWEBサイトURLを入力して「URLから取得」をクリックすると、業種・店舗名・住所などを自動入力し、下のテキストを投稿生成時の参照情報として保存します。</p>
                {/* 抽出テキスト（投稿生成時の参照情報） */}
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <Label className="text-sm font-medium text-zinc-300">📄 サイトから抽出したテキスト（投稿生成時の参照情報）</Label>
                  <p className="text-xs text-zinc-500">このテキストはAIが投稿を生成する際の参考情報として使用されます。内容を確認・編集できます。</p>
                  <Textarea
                    value={shopInfo.scrapedContent || ""}
                    onChange={(e) => setShopInfo({ ...shopInfo, scrapedContent: e.target.value })}
                    placeholder="URLから取得するか、手動で貼り付けてください。投稿生成時にAIが参照します。"
                    className="min-h-[140px] max-h-[160px] w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-y overflow-y-auto"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quickIndustry" className="text-sm font-medium text-zinc-200">
                      業種 <span className="text-red-400 text-xs align-middle">*</span>
                    </Label>
                    <Input
                      id="quickIndustry"
                      value={shopInfo.industry || ""}
                      onChange={(e) => setShopInfo({ ...shopInfo, industry: e.target.value })}
                      placeholder="例：整体院、美容室、カフェ"
                      className="bg-zinc-950 border-zinc-800 text-zinc-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quickName" className="text-sm font-medium text-zinc-200">
                      店舗名 <span className="text-red-400 text-xs align-middle">*</span>
                    </Label>
                    <Input
                      id="quickName"
                      value={shopInfo.name}
                      onChange={(e) => setShopInfo({ ...shopInfo, name: e.target.value })}
                      placeholder="例：The Gentry"
                      className="bg-zinc-950 border-zinc-800 text-zinc-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quickAddress" className="text-sm font-medium text-zinc-200">
                      住所 <span className="text-red-400 text-xs align-middle">*</span>
                    </Label>
                    <Input
                      id="quickAddress"
                      value={shopInfo.address}
                      onChange={(e) => setShopInfo({ ...shopInfo, address: e.target.value })}
                      placeholder="例：長野県長野市〇〇1-2-3"
                      className="bg-zinc-950 border-zinc-800 text-zinc-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quickPhone" className="text-sm font-medium text-zinc-200">電話番号</Label>
                    <Input
                      id="quickPhone"
                      type="tel"
                      value={shopInfo.phone}
                      onChange={(e) => setShopInfo({ ...shopInfo, phone: e.target.value })}
                      placeholder="例：026-000-0000"
                      className="bg-zinc-950 border-zinc-800 text-zinc-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quickLine" className="text-sm font-medium text-zinc-200">LINE/予約URL</Label>
                    <Input
                      id="quickLine"
                      type="url"
                      value={shopInfo.lineUrl}
                      onChange={(e) => setShopInfo({ ...shopInfo, lineUrl: e.target.value })}
                      placeholder="例：https://lin.ee/xxxxx"
                      className="bg-zinc-950 border-zinc-800 text-zinc-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quickBusinessHours" className="text-sm font-medium text-zinc-200">営業時間</Label>
                    <Input
                      id="quickBusinessHours"
                      value={shopInfo.businessHours}
                      onChange={(e) => setShopInfo({ ...shopInfo, businessHours: e.target.value })}
                      placeholder="例：10:00〜20:00"
                      className="bg-zinc-950 border-zinc-800 text-zinc-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quickHolidays" className="text-sm font-medium text-zinc-200">定休日</Label>
                    <Input
                      id="quickHolidays"
                      value={shopInfo.holidays}
                      onChange={(e) => setShopInfo({ ...shopInfo, holidays: e.target.value })}
                      placeholder="例：毎週火曜・年末年始"
                      className="bg-zinc-950 border-zinc-800 text-zinc-100"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quickSampleTexts" className="text-sm font-medium text-zinc-200">
                      文章サンプル <span className="text-red-400 text-xs align-middle">*</span>
                    </Label>
                    <Textarea
                      id="quickSampleTexts"
                      required
                      value={shopInfo.sampleTexts || ""}
                      onChange={(e) => setShopInfo({ ...shopInfo, sampleTexts: e.target.value })}
                      placeholder="今までの投稿文を2〜3件コピペすると、文体を学習します。"
                      className="min-h-[80px] bg-zinc-950 border-zinc-800 text-zinc-100 resize-y"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quickSnsUrl" className="text-sm font-medium text-zinc-200">SNS URL（任意）</Label>
                    <Input
                      id="quickSnsUrl"
                      type="url"
                      value={shopInfo.snsUrl || ""}
                      onChange={(e) => setShopInfo({ ...shopInfo, snsUrl: e.target.value })}
                      placeholder="例：https://instagram.com/〇〇"
                      className="bg-zinc-950 border-zinc-800 text-zinc-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quickFeatures" className="text-sm font-medium text-zinc-200">その他特記事項（任意）</Label>
                    <Textarea
                      id="quickFeatures"
                      value={shopInfo.features}
                      onChange={(e) => setShopInfo({ ...shopInfo, features: e.target.value })}
                      placeholder="例：完全個室／無料駐車場あり／メンズ専用　など"
                      className="min-h-[80px] bg-zinc-950 border-zinc-800 text-zinc-100 resize-y"
                    />
                  </div>
                  {user?.email === ADMIN_EMAIL && (
                    <div className="space-y-3 pt-2 border-t border-zinc-800">
                      <Label className="text-sm font-medium text-zinc-200">WordPress 投稿設定（任意）</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                          placeholder="カテゴリID"
                          value={shopInfo.wpCategoryId || ""}
                          onChange={(e) => setShopInfo({ ...shopInfo, wpCategoryId: e.target.value })}
                          className="bg-zinc-950 border-zinc-800 text-zinc-100"
                        />
                        <Input
                          placeholder="タグID"
                          value={shopInfo.wpTagId || ""}
                          onChange={(e) => setShopInfo({ ...shopInfo, wpTagId: e.target.value })}
                          className="bg-zinc-950 border-zinc-800 text-zinc-100"
                        />
                        <Input
                          placeholder="著者ID"
                          value={shopInfo.wpAuthorId || ""}
                          onChange={(e) => setShopInfo({ ...shopInfo, wpAuthorId: e.target.value })}
                          className="bg-zinc-950 border-zinc-800 text-zinc-100"
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    <Label className="text-sm font-medium text-zinc-200">出力する媒体</Label>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shopInfo.outputTargets?.instagram ?? true}
                          onChange={(e) =>
                            setShopInfo({
                              ...shopInfo,
                              outputTargets: { ...shopInfo.outputTargets!, instagram: e.target.checked },
                            })
                          }
                          className="w-4 h-4 rounded accent-amber-500"
                        />
                        Instagram用
                      </label>
                      <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shopInfo.outputTargets?.gbp ?? true}
                          onChange={(e) =>
                            setShopInfo({
                              ...shopInfo,
                              outputTargets: { ...shopInfo.outputTargets!, gbp: e.target.checked },
                            })
                          }
                          className="w-4 h-4 rounded accent-amber-500"
                        />
                        Google Map/GBP用
                      </label>
                      <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shopInfo.outputTargets?.portal ?? true}
                          onChange={(e) =>
                            setShopInfo({
                              ...shopInfo,
                              outputTargets: { ...shopInfo.outputTargets!, portal: e.target.checked },
                            })
                          }
                          className="w-4 h-4 rounded accent-amber-500"
                        />
                        ブログ/ポータル用
                      </label>
                      <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shopInfo.outputTargets?.line ?? true}
                          onChange={(e) =>
                            setShopInfo({
                              ...shopInfo,
                              outputTargets: { ...shopInfo.outputTargets!, line: e.target.checked },
                            })
                          }
                          className="w-4 h-4 rounded accent-amber-500"
                        />
                        LINE用
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-950/80">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                onClick={() => { setShowSettingsOverlay(false); setSettingsScrapeUrl(""); }}
              >
                キャンセル
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
                onClick={handleQuickSaveSettings}
              >
                設定を保存する
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-zinc-950" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 truncate">
              Post Support
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* 管理者のみ「店舗管理」ボタンを表示 */}
            {user?.email === ADMIN_EMAIL && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStoreManager(true)}
                className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 hidden sm:flex"
              >
                <Store className="w-4 h-4 mr-2" />
                店舗管理
              </Button>
            )}
            {isConfigured && user?.email !== ADMIN_EMAIL && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettingsOverlay(true)}
                className="text-zinc-400 hover:text-white hidden sm:flex"
              >
                <Settings className="w-4 h-4 mr-2" />
                設定
              </Button>
            )}
            {isConfigured && user?.email === ADMIN_EMAIL && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettingsOverlay(true)}
                className="text-zinc-400 hover:text-white hidden sm:flex"
              >
                <Settings className="w-4 h-4 mr-2" />
                設定
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout} className="border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800">
              <LogOut className="w-4 h-4 mr-2" />
              ログアウト
            </Button>
          </div>

        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {!isConfigured ? (
          // ステップ形式の初期設定（店舗情報）
          <div className="max-w-xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">初期設定（店舗情報）</h2>
              <p className="text-zinc-400">作成される文章に埋め込むための基本情報を設定してください。</p>
              {/* ステップインジケーター */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <span className={`flex items-center gap-1 text-sm ${setupStep === 1 ? "text-amber-500 font-semibold" : "text-zinc-500"}`}>
                  <span className={`flex w-7 h-7 items-center justify-center rounded-full ${setupStep === 1 ? "bg-amber-500 text-zinc-950" : "bg-zinc-700 text-zinc-400"}`}>1</span>
                  <Globe className="w-4 h-4 hidden sm:inline" />
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
                <span className={`flex items-center gap-1 text-sm ${setupStep === 2 ? "text-amber-500 font-semibold" : "text-zinc-500"}`}>
                  <span className={`flex w-7 h-7 items-center justify-center rounded-full ${setupStep === 2 ? "bg-amber-500 text-zinc-950" : "bg-zinc-700 text-zinc-400"}`}>2</span>
                  <FileText className="w-4 h-4 hidden sm:inline" />
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
                <span className={`flex items-center gap-1 text-sm ${setupStep === 3 ? "text-amber-500 font-semibold" : "text-zinc-500"}`}>
                  <span className={`flex w-7 h-7 items-center justify-center rounded-full ${setupStep === 3 ? "bg-amber-500 text-zinc-950" : "bg-zinc-700 text-zinc-400"}`}>3</span>
                </span>
              </div>
            </div>
            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <form onSubmit={handleSaveShopInfo} className="space-y-6">
                  {/* ========== ステップ1: URL入力 ========== */}
                  {setupStep === 1 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="space-y-3">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Globe className="w-5 h-5 text-amber-500" />
                          お店のホームページのアドレスを入力してください
                        </h3>
                        <p className="text-sm text-zinc-400">お店のトップページやメニュー表のアドレス（URL）を入れると、住所や電話番号などを自動で読み取ります。</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Input
                          value={scrapeUrl}
                          onChange={(e) => setScrapeUrl(e.target.value)}
                          className="bg-zinc-950 border-zinc-700 text-white flex-1"
                          placeholder="https://..."
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            setSetupPath("url");
                            handleScrapeUrl();
                          }}
                          disabled={isScraping || !scrapeUrl.trim().startsWith("http")}
                          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 border-none shrink-0 font-semibold"
                        >
                          {isScraping ? <><Loader2 className="w-4 h-4 animate-spin" /> 抽出中...</> : "抽出して次へ"}
                        </Button>
                      </div>
                      {/* URL抽出後のプレビューと「基本情報を入力して次へ」 */}
                      {scrapedPreview && setupPath === "url" && (
                        <div className="space-y-3 pt-2 border-t border-zinc-800 pt-4">
                          <p className="text-xs text-amber-500 font-medium">✅ 読み取り完了 —この情報をもとに、基本情報や投稿が生成されます。</p>
                          <textarea
                            value={scrapedPreview}
                            onChange={(e) => setScrapedPreview(e.target.value)}
                            className="flex min-h-[120px] max-h-[160px] w-full rounded-md border border-amber-500/30 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-y overflow-y-auto"
                          />
                          <Button
                            type="button"
                            onClick={async () => {
                              await handleExtractInfo(scrapedPreview + "\n" + shopInfo.features + "\n" + (shopInfo.sampleTexts || ""), true);
                              setSetupStep(2);
                            }}
                            disabled={isExtractingInfo}
                            className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
                          >
                            {isExtractingInfo ? <><Loader2 className="w-4 h-4 animate-spin" /> 読み取り中...</> : <><Check className="w-4 h-4" /> この内容で基本情報を入力して次へ</>}
                          </Button>
                        </div>
                      )}
                      {/* ホームページがない場合の逃げ道 */}
                      <div className="pt-4 border-t border-zinc-800">
                        <button
                          type="button"
                          onClick={() => {
                            setSetupPath("manual");
                            setSetupStep(2);
                          }}
                          className="text-sm text-zinc-400 hover:text-amber-500 underline underline-offset-2 transition-colors"
                        >
                          お店のホームページがない場合はこちら
                        </button>
                        <p className="text-xs text-zinc-500 mt-1">手入力で住所や電話番号などを入力して進めます。</p>
                      </div>
                    </div>
                  )}

                  {/* ========== ステップ2: 基本情報 ========== */}
                  {setupStep === 2 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="border-b border-zinc-800 pb-4 mb-2">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <FileText className="w-5 h-5 text-amber-500" />
                          店舗の基本情報
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">
                          {setupPath === "url" ? "自動で入力された内容を確認・修正してください。" : "以下の項目を入力してください。わからない項目は空欄でも進めます。"}
                        </p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-zinc-300">
                        <input type="checkbox" checked={minimalStart} onChange={(e) => setMinimalStart(e.target.checked)} className="rounded accent-amber-500" />
                        最小限で始める（業種・店舗名だけ入力してあとで追記する）
                      </label>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="shopIndustry" className="font-medium">業種 <span className="text-red-500">*</span></Label>
                          <Input id="shopIndustry" required value={shopInfo.industry} onChange={(e) => setShopInfo({ ...shopInfo, industry: e.target.value })} className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-amber-500/50" placeholder="例：美容室、エステサロン、カフェ" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shopName" className="font-medium">店舗名 <span className="text-red-500">*</span></Label>
                          <Input id="shopName" required value={shopInfo.name} onChange={(e) => setShopInfo({ ...shopInfo, name: e.target.value })} className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-amber-500/50" placeholder="例：The Gentry" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shopAddress" className="font-medium">住所 <span className="text-red-500">*</span></Label>
                          <Input id="shopAddress" required value={shopInfo.address} onChange={(e) => setShopInfo({ ...shopInfo, address: e.target.value })} className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-amber-500/50" placeholder="例：長野県長野市〇〇1-2-3" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="shopPhone" className="font-medium">電話番号 {!minimalStart && <span className="text-red-500">*</span>}</Label>
                            <Input id="shopPhone" type="tel" required={!minimalStart} value={shopInfo.phone} onChange={(e) => setShopInfo({ ...shopInfo, phone: e.target.value })} className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-amber-500/50" placeholder="例：026-000-0000" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="shopLine" className="font-medium">LINE/予約URL {!minimalStart && <span className="text-red-500">*</span>}</Label>
                            <Input id="shopLine" type="url" required={!minimalStart} value={shopInfo.lineUrl} onChange={(e) => setShopInfo({ ...shopInfo, lineUrl: e.target.value })} className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-amber-500/50" placeholder="例：https://lin.ee/xxxxx" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="shopBusinessHours" className="font-medium">営業時間 {!minimalStart && <span className="text-red-500">*</span>}</Label>
                            <Input id="shopBusinessHours" required={!minimalStart} value={shopInfo.businessHours} onChange={(e) => setShopInfo({ ...shopInfo, businessHours: e.target.value })} className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-amber-500/50" placeholder="例：10:00〜20:00" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="shopHolidays" className="font-medium">定休日 {!minimalStart && <span className="text-red-500">*</span>}</Label>
                            <Input id="shopHolidays" required={!minimalStart} value={shopInfo.holidays} onChange={(e) => setShopInfo({ ...shopInfo, holidays: e.target.value })} className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-amber-500/50" placeholder="例：毎週火曜・年末年始" />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" className="border-zinc-600 text-zinc-300 hover:bg-zinc-800" onClick={() => setSetupStep(1)}>
                          <ChevronLeft className="w-4 h-4 mr-1" /> 戻る
                        </Button>
                        <Button type="button" className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold flex-1" onClick={() => setSetupStep(3)}>
                          次へ <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ========== ステップ3: オプションと保存 ========== */}
                  {setupStep === 3 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="border-b border-zinc-800 pb-4 mb-2">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Settings className="w-5 h-5 text-amber-500" />
                          オプション設定
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">任意の項目は後から設定画面で変更できます。</p>
                      </div>
                      {/* 文体サンプル・SNS・特記事項（折りたたみ） */}
                      <details className="group bg-zinc-800/20 rounded-xl border border-zinc-800/50 overflow-hidden">
                        <summary className="px-4 py-3 cursor-pointer list-none flex items-center justify-between text-sm text-zinc-300 hover:bg-zinc-800/30">
                          <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> あなたらしさ（文調の学習）・特記事項</span>
                          <span className="text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="px-4 pb-4 space-y-4 border-t border-zinc-800 pt-3">
                          <div className="space-y-2">
                            <Label htmlFor="shopSampleTexts" className="text-sm">
                              今まで書いた文章のサンプル（2〜3投稿分コピペ） <span className="text-red-400 text-xs align-middle">*</span>
                            </Label>
                            <Textarea
                              id="shopSampleTexts"
                              required
                              value={shopInfo.sampleTexts || ""}
                              onChange={(e) => setShopInfo({ ...shopInfo, sampleTexts: e.target.value })}
                              placeholder="例：これまでSNSに投稿していた文章を2〜3件コピペすると、文体を学習します。"
                              className="h-[100px] bg-zinc-950 border-zinc-800 text-zinc-100 resize-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="shopSnsUrl" className="text-sm">SNSのURL（任意）</Label>
                            <Input
                              id="shopSnsUrl"
                              type="url"
                              value={shopInfo.snsUrl || ""}
                              onChange={(e) => setShopInfo({ ...shopInfo, snsUrl: e.target.value })}
                              placeholder="例：https://instagram.com/〇〇"
                              className="bg-zinc-950 border-zinc-800 text-zinc-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="shopFeatures" className="text-sm">その他特記事項（任意）</Label>
                            <textarea id="shopFeatures" value={shopInfo.features} onChange={(e) => setShopInfo({ ...shopInfo, features: e.target.value })} placeholder="例：VIPルームあり、無料駐車場" className="flex min-h-[80px] w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white resize-y" />
                          </div>
                        </div>
                      </details>
                      {/* WordPress（管理者のみ表示） */}
                      {user?.email === ADMIN_EMAIL && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-amber-500 text-sm flex items-center gap-2">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" /></svg>
                            WordPress 投稿設定（任意）
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <Label htmlFor="wpCategoryId" className="text-xs">カテゴリ ID</Label>
                              <Input id="wpCategoryId" value={shopInfo.wpCategoryId || ""} onChange={(e) => setShopInfo({ ...shopInfo, wpCategoryId: e.target.value })} className="bg-zinc-950 border-zinc-800 text-white" placeholder="例：1" />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="wpTagId" className="text-xs">タグ ID</Label>
                              <Input id="wpTagId" value={shopInfo.wpTagId || ""} onChange={(e) => setShopInfo({ ...shopInfo, wpTagId: e.target.value })} className="bg-zinc-950 border-zinc-800 text-white" placeholder="例：5" />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="wpAuthorId" className="text-xs">著者 ID</Label>
                              <Input id="wpAuthorId" value={shopInfo.wpAuthorId || ""} onChange={(e) => setShopInfo({ ...shopInfo, wpAuthorId: e.target.value })} className="bg-zinc-950 border-zinc-800 text-white" placeholder="例：1" />
                            </div>
                          </div>
                        </div>
                      )}
                      {/* 出力媒体 */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-zinc-200 text-sm">出力する媒体</h4>
                        <div className="flex flex-wrap gap-6">
                          <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-zinc-200">
                            <input type="checkbox" checked={shopInfo.outputTargets?.instagram ?? true} onChange={(e) => setShopInfo({ ...shopInfo, outputTargets: { ...shopInfo.outputTargets!, instagram: e.target.checked } })} className="w-4 h-4 rounded accent-amber-500" />
                            Instagram用
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-zinc-200">
                            <input type="checkbox" checked={shopInfo.outputTargets?.gbp ?? true} onChange={(e) => setShopInfo({ ...shopInfo, outputTargets: { ...shopInfo.outputTargets!, gbp: e.target.checked } })} className="w-4 h-4 rounded accent-amber-500" />
                            Google Map/GBP用
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-zinc-200">
                            <input type="checkbox" checked={shopInfo.outputTargets?.portal ?? true} onChange={(e) => setShopInfo({ ...shopInfo, outputTargets: { ...shopInfo.outputTargets!, portal: e.target.checked } })} className="w-4 h-4 rounded accent-amber-500" />
                            ブログ/ポータル用
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-zinc-200">
                            <input type="checkbox" checked={shopInfo.outputTargets?.line ?? true} onChange={(e) => setShopInfo({ ...shopInfo, outputTargets: { ...shopInfo.outputTargets!, line: e.target.checked } })} className="w-4 h-4 rounded accent-amber-500" />
                            LINE用
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-6">
                        <Button type="button" variant="outline" className="border-zinc-600 text-zinc-300 hover:bg-zinc-800" onClick={() => setSetupStep(2)}>
                          <ChevronLeft className="w-4 h-4 mr-1" /> 戻る
                        </Button>
                        <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold">
                          <Check className="w-4 h-4 mr-2 inline" />
                          設定を保存してはじめる
                        </Button>
                      </div>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in duration-500">

            {/* 保存済みデータサマリー */}
            {(shopInfo.referenceUrls.length > 0 || shopInfo.scrapedContent) && (
              <details className="group bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none select-none hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-2 text-sm text-zinc-300 font-medium">
                    <span className="text-amber-500">💾</span>
                    保存済みデータ
                    {shopInfo.referenceUrls.length > 0 && (
                      <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full">URL {shopInfo.referenceUrls.length}件</span>
                    )}
                    {shopInfo.scrapedContent && (
                      <span className="bg-zinc-700 text-zinc-300 text-xs px-2 py-0.5 rounded-full">抽出テキストあり</span>
                    )}
                  </div>
                  <span className="text-zinc-500 text-xs group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-4 pb-4 space-y-3 border-t border-zinc-800 pt-3">
                  {shopInfo.referenceUrls.length > 0 && (
                    <div>
                      <p className="text-xs text-zinc-400 font-medium mb-1">📋 参照URL</p>
                      <div className="flex flex-col gap-1">
                        {shopInfo.referenceUrls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-amber-400 hover:underline truncate">{url}</a>
                        ))}
                      </div>
                    </div>
                  )}
                  {shopInfo.scrapedContent && (
                    <div>
                      <p className="text-xs text-zinc-400 font-medium mb-1">📄 抽出テキスト（AI参照中）</p>
                      <pre className="text-xs text-zinc-400 bg-zinc-950 rounded p-2 max-h-40 overflow-y-auto whitespace-pre-wrap font-sans">{shopInfo.scrapedContent}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* 生成履歴パネル */}
            {generationHistory.length > 0 && (
              <section className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowHistory(v => !v)}
                  className="flex items-center gap-2 w-full text-left text-sm text-zinc-400 hover:text-zinc-200 transition-colors group"
                >
                  <History className="w-4 h-4 text-amber-500/70 group-hover:text-amber-500 transition-colors" />
                  <span className="font-medium">生成履歴</span>
                  <span className="text-xs text-zinc-600 ml-1">（{generationHistory.length}件）</span>
                  <span className={`ml-auto text-zinc-600 transition-transform duration-200 ${showHistory ? "rotate-90" : ""}`}>▶</span>
                </button>

                {showHistory && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    {generationHistory.map((entry) => {
                      // 表示用プレビューテキストを選択（最初に見つかったもの）
                      const previewText =
                        entry.results.instagram ??
                        entry.results.gbp ??
                        entry.results.line ??
                        entry.results.reply ??
                        entry.results.portal ?? "";
                      const dateStr = new Date(entry.created_at).toLocaleString("ja-JP", {
                        month: "numeric", day: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      });
                      return (
                        <div
                          key={entry.id}
                          className="relative group bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 transition-all duration-200"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                              <span className="text-xs text-zinc-500 shrink-0">{dateStr}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5 whitespace-nowrap">
                                {entry.pattern_id}
                              </span>
                              {/* 削除ボタン */}
                              <button
                                type="button"
                                onClick={() => handleDeleteHistory(entry.id)}
                                disabled={deletingHistoryId === entry.id}
                                className="text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50"
                                title="履歴を削除"
                              >
                                {deletingHistoryId === entry.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                          <p className="text-xs font-medium text-zinc-300 mb-1.5">{entry.pattern_title}</p>
                          {previewText && (
                            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-3">
                              {previewText.replace(/<[^>]+>/g, "").slice(0, 80)}...
                            </p>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRestoreHistory(entry)}
                            className="w-full h-7 text-xs text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 rounded-lg"
                          >
                            ↩ 再利用する
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* ===== 管理者向け: 生成対象店舗の選択 ===== */}
            {user?.email === ADMIN_EMAIL && stores.length > 0 && (
              <section className="bg-zinc-900/70 border border-amber-500/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-400">生成対象の店舗を選択</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stores.map((store) => (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => setSelectedStoreId(store.id === selectedStoreId ? null : store.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${selectedStoreId === store.id
                        ? "border-amber-500 bg-amber-500/10 text-amber-400"
                        : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                        }`}
                    >
                      {selectedStoreId === store.id && <Check className="w-3.5 h-3.5" />}
                      {store.name}
                      {store.settings.industry && (
                        <span className="text-xs opacity-60">({store.settings.industry})</span>
                      )}
                    </button>
                  ))}
                </div>
                {selectedStoreId && (
                  <p className="text-xs text-zinc-500">
                    ✅ 選択中: <span className="text-amber-400 font-medium">{stores.find(s => s.id === selectedStoreId)?.name}</span> の店舗情報を使って生成します
                  </p>
                )}
                {!selectedStoreId && (
                  <p className="text-xs text-zinc-500">店舗を選択していない場合は、デフォルトの設定（shops テーブル）を使用します</p>
                )}
              </section>
            )}

            {/* Step 1: Pattern Selection */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 text-sm font-bold">1</span>
                <h2 className="text-xl font-semibold">投稿パターンの選択</h2>
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PATTERNS.map((pattern) => (
                  <Card
                    key={pattern.id}
                    className={`cursor-pointer transition-all duration-200 border-zinc-800 bg-zinc-900/50 hover:border-amber-500/50 hover:bg-zinc-900 ${selectedPattern === pattern.id ? "ring-2 ring-amber-500 border-amber-500 bg-zinc-900 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : ""
                      }`}
                    onClick={() => handlePatternChange(pattern.id)}
                  >
                    <CardHeader className="p-5">
                      <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
                        {selectedPattern === pattern.id && <Check className="w-4 h-4 text-amber-500" />}
                        パターン {pattern.id}
                      </CardTitle>
                      <CardDescription className="text-zinc-400 mt-2 font-medium">
                        {pattern.title}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 text-sm text-zinc-500">
                      {pattern.description}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Step 2: Dynamic Form */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 text-sm font-bold">2</span>
                <h2 className="text-xl font-semibold">
                  {selectedPattern === "G"
                    ? "返信する内容の入力"
                    : selectedPattern === "H"
                      ? "ニュースの選択"
                      : "事実（ファクト）の入力"}
                </h2>
              </div>

              {selectedPattern === "G" ? (
                /* パターンG専用フォーム */
                <Card className="border-zinc-800 bg-zinc-900">
                  <CardContent className="p-6 space-y-6">
                    {/* 1. プラットフォーム選択 */}
                    <div className="space-y-3">
                      <Label className="text-base text-zinc-200">返信するプラットフォームを選択</Label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setReplyPlatform("sns")}
                          className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${replyPlatform === "sns"
                            ? "border-amber-500 bg-amber-500/10 text-amber-400"
                            : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-500"
                            }`}
                        >
                          📱 SNS（Instagram・X 等）
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyPlatform("gbp")}
                          className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${replyPlatform === "gbp"
                            ? "border-amber-500 bg-amber-500/10 text-amber-400"
                            : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-500"
                            }`}
                        >
                          🗺️ Google クチコミ（GBP）
                        </button>
                      </div>
                    </div>

                    {/* 2. もらったコメント */}
                    <div className="space-y-2">
                      <Label htmlFor="receivedComment" className="text-base text-zinc-200">
                        もらったコメント・クチコミ <span className="text-red-400 text-sm">*</span>
                      </Label>
                      <p className="text-xs text-zinc-500">返信したいコメントやクチコミの文章をそのまま貼り付けてください。</p>
                      <Textarea
                        id="receivedComment"
                        value={receivedComment}
                        onChange={(e) => setReceivedComment(e.target.value)}
                        placeholder={replyPlatform === "gbp"
                          ? "例: 初めて利用しました。スタッフの方がとても丁寧で、施術後は体がスッキリしました。また来たいと思います。"
                          : "例: 先日はありがとうございました！おかげで肩がすごく楽になりました😊 また予約します！"}
                        className="h-[120px] bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500 text-zinc-100 placeholder:text-zinc-600 resize-none"
                      />
                    </div>

                    {/* 3. 特記事項 */}
                    <div className="space-y-2">
                      <Label htmlFor="replyNote" className="text-base text-zinc-200">特記事項・返信に含めたい内容（任意）</Label>
                      <p className="text-xs text-zinc-500">返信に加えたい補足情報があれば記入してください。（例: 次回来店時の特典案内、特定のメニューへの誘導など）</p>
                      <Textarea
                        id="replyNote"
                        value={replyNote}
                        onChange={(e) => setReplyNote(e.target.value)}
                        placeholder="例: 来月キャンペーン実施予定なので触れてほしい / 次回予約への誘導を入れてほしい"
                        className="h-[90px] bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500 text-zinc-100 placeholder:text-zinc-600 resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : selectedPattern === "H" ? (
                /* パターンH：ニュース連動フォーム */
                <Card className="border-zinc-800 bg-zinc-900">
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Label className="text-base text-zinc-200 flex items-center gap-2">
                        <Newspaper className="w-4 h-4 text-amber-500" />
                        業種に関連するニュースを選んでください
                      </Label>
                      <p className="text-xs text-zinc-500">
                        Googleニュースから、あなたの業種（{shopInfo.industry || "未設定"}）に関連する最新トピックを取得します。
                        気になるニュースを1つ選ぶと、その話題にお店ならではのコメントを添えた投稿を生成します。
                      </p>
                      <Button
                        type="button"
                        onClick={handleFetchNews}
                        disabled={isLoadingNews || !shopInfo.industry}
                        className="mt-1 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold disabled:opacity-60"
                      >
                        {isLoadingNews ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            ニュースを読み込み中...
                          </>
                        ) : (
                          <>
                            <Newspaper className="w-4 h-4" />
                            ニュース候補を取得する
                          </>
                        )}
                      </Button>
                      {!shopInfo.industry && (
                        <p className="text-xs text-red-400 mt-1">
                          ※ 先に初期設定で「業種」を入力してください。
                        </p>
                      )}
                    </div>

                    {newsItems.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-zinc-800">
                        <p className="text-xs text-zinc-400">下の中から、投稿の題材にしたいニュースを1つ選んでください。</p>
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                          {newsItems.map((news, index) => (
                            <label
                              key={news.link || news.title + index}
                              className={`flex gap-3 p-3 rounded-lg border text-sm cursor-pointer transition-colors ${selectedNewsIndex === index
                                ? "border-amber-500 bg-amber-500/5"
                                : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
                                }`}
                            >
                              <input
                                type="radio"
                                className="mt-1 accent-amber-500"
                                checked={selectedNewsIndex === index}
                                onChange={() => setSelectedNewsIndex(index)}
                              />
                              <div className="space-y-1 flex-1">
                                <p className="font-semibold text-zinc-100 text-sm">{news.title}</p>
                                {news.snippet && (
                                  <p className="text-xs text-zinc-400 line-clamp-3">{news.snippet}</p>
                                )}
                                {news.link && (
                                  <a
                                    href={news.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-amber-400 hover:underline"
                                  >
                                    記事を開く ↗
                                  </a>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                /* 通常パターン（A〜F）フォーム */
                <Card className="border-zinc-800 bg-zinc-900">
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="q1" className="text-base text-zinc-200">{currentPattern.questions.q1}</Label>
                      <Textarea
                        id="q1"
                        value={formData.q1}
                        onChange={(e) => setFormData(prev => ({ ...prev, q1: e.target.value }))}
                        placeholder={currentPattern.questions.ex1}
                        className="h-[80px] bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500 text-zinc-100 placeholder:text-zinc-600 resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="q2" className="text-base text-zinc-200">{currentPattern.questions.q2}</Label>
                      <Textarea
                        id="q2"
                        value={formData.q2}
                        onChange={(e) => setFormData(prev => ({ ...prev, q2: e.target.value }))}
                        placeholder={currentPattern.questions.ex2}
                        className="h-[80px] bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500 text-zinc-100 placeholder:text-zinc-600 resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="q3" className="text-base text-zinc-200">{currentPattern.questions.q3}</Label>
                      <Textarea
                        id="q3"
                        value={formData.q3}
                        onChange={(e) => setFormData(prev => ({ ...prev, q3: e.target.value }))}
                        placeholder={currentPattern.questions.ex3}
                        className="h-[80px] bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500 text-zinc-100 placeholder:text-zinc-600 resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Step 3: Action Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-semibold text-base h-11 px-10 min-w-[260px] rounded-full shadow-md shadow-amber-900/20 transition-all active:scale-95 group flex items-center justify-center gap-3"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-950" />
                    <span>AIがテキストを生成中...</span>
                  </>
                ) : (
                  <>
                    <span>この内容で生成する</span>
                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>

            {/* Step 4: Results */}
            {generatedResults && (
              <section ref={resultsRef} className="space-y-4 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 text-sm font-bold">3</span>
                    <h2 className="text-xl font-semibold text-amber-500">生成完了</h2>
                  </div>
                </div>

                <Tabs defaultValue={
                  selectedPattern === "G" ? "reply" :
                    shopInfo.outputTargets?.instagram ? "instagram" :
                      shopInfo.outputTargets?.gbp ? "gbp" :
                        shopInfo.outputTargets?.portal ? "portal" :
                          shopInfo.outputTargets?.line ? "line" : "instagram"
                } className="w-full">
                  <TabsList className="flex w-full bg-zinc-900 border border-zinc-800 p-1 overflow-x-auto scrollbar-none">
                    {selectedPattern === "G" ? (
                      <TabsTrigger value="reply" className="flex-1 min-w-fit data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-500 whitespace-nowrap">
                        {replyPlatform === "gbp" ? "🗺️ GBP返信" : "📱 SNS返信"}
                      </TabsTrigger>
                    ) : (
                      <>
                        {shopInfo.outputTargets?.instagram !== false && (
                          <TabsTrigger value="instagram" className="flex-1 min-w-fit data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-500 whitespace-nowrap">
                            <span className="hidden sm:inline">Instagram用</span>
                            <span className="sm:hidden">📸 IG</span>
                          </TabsTrigger>
                        )}
                        {shopInfo.outputTargets?.gbp !== false && (
                          <TabsTrigger value="gbp" className="flex-1 min-w-fit data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-500 whitespace-nowrap">
                            <span className="hidden sm:inline">Googleの最新情報用</span>
                            <span className="sm:hidden">🗺️ GBP</span>
                          </TabsTrigger>
                        )}
                        {shopInfo.outputTargets?.portal !== false && (
                          <TabsTrigger value="portal" className="flex-1 min-w-fit data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-500 whitespace-nowrap">
                            <span className="hidden sm:inline">ポータルサイト用</span>
                            <span className="sm:hidden">📝 ブログ</span>
                          </TabsTrigger>
                        )}
                        {shopInfo.outputTargets?.line !== false && (
                          <TabsTrigger value="line" className="flex-1 min-w-fit data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-500 whitespace-nowrap">
                            <span className="hidden sm:inline">💬 LINE用</span>
                            <span className="sm:hidden">💬 LINE</span>
                          </TabsTrigger>
                        )}
                      </>
                    )}
                  </TabsList>

                  {selectedPattern === "G" ? (
                    /* パターンG：返信テキスト表示 */
                    generatedResults.reply && (
                      <TabsContent value="reply">
                        <Card className="border-zinc-800 bg-zinc-900 relative overflow-hidden">
                          <div className="absolute top-4 right-4 z-10">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 h-9"
                              onClick={() => handleCopy(generatedResults.reply as string, "reply")}
                            >
                              {copiedTab === "reply" ? (
                                <><Check className="w-4 h-4 mr-2 text-green-500" /> コピー完了</>
                              ) : (
                                <><Copy className="w-4 h-4 mr-2" /> コピー</>
                              )}
                            </Button>
                          </div>
                          <CardContent className="p-6 pt-16">
                            {/* 元のコメントを表示 */}
                            <div className="mb-4 p-3 bg-zinc-950 rounded-lg border border-zinc-700">
                              <p className="text-xs text-zinc-500 mb-1 font-semibold">📨 受信したコメント</p>
                              <p className="text-sm text-zinc-400 whitespace-pre-wrap">{receivedComment}</p>
                            </div>
                            <p className="text-xs text-amber-500 font-semibold mb-2">✍️ 生成された返信文</p>
                            <div className="whitespace-pre-wrap text-zinc-300 font-medium leading-relaxed">
                              {generatedResults.reply}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )
                  ) : (
                    <>
                      {[
                        { id: "instagram", data: generatedResults.instagram, active: shopInfo.outputTargets?.instagram !== false },
                        { id: "gbp", data: generatedResults.gbp, active: shopInfo.outputTargets?.gbp !== false },
                        { id: "portal", data: generatedResults.portal, active: shopInfo.outputTargets?.portal !== false },
                        { id: "line", data: generatedResults.line, active: shopInfo.outputTargets?.line !== false }
                      ].filter(t => t.active && t.data).map((tab) => (
                        <TabsContent key={tab.id} value={tab.id}>
                          <Card className="border-zinc-800 bg-zinc-900 relative overflow-hidden group">
                            <div className="absolute top-4 right-4 z-10 flex gap-2">
                              {tab.id === "portal" && generatedResults.portalTitle && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700 h-9"
                                    onClick={() => handlePostToWP("draft")}
                                    disabled={isPostingToWP}
                                  >
                                    {isPostingToWP ? (
                                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 送信中</>
                                    ) : (
                                      <>📝 下書き保存</>
                                    )}
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                                    onClick={() => handlePostToWP("publish")}
                                    disabled={isPostingToWP}
                                  >
                                    {isPostingToWP ? (
                                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 送信中</>
                                    ) : (
                                      <><Send className="w-4 h-4 mr-2" /> すぐに公開</>
                                    )}
                                  </Button>
                                </div>
                              )}
                              {/* 編集トグルボタン */}
                              <Button
                                variant="secondary"
                                size="sm"
                                className={`h-9 border ${editingTab === tab.id
                                  ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/40"
                                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700"
                                  }`}
                                onClick={() => setEditingTab(editingTab === tab.id ? null : tab.id)}
                              >
                                {editingTab === tab.id ? (
                                  <><Check className="w-4 h-4 mr-2 text-amber-400" /> 編集完了</>
                                ) : (
                                  <><Pencil className="w-4 h-4 mr-2" /> 編集</>
                                )}
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 h-9"
                                onClick={() => handleCopy(tab.data as string, tab.id)}
                              >
                                {copiedTab === tab.id ? (
                                  <><Check className="w-4 h-4 mr-2 text-green-500" /> コピー完了</>
                                ) : (
                                  <><Copy className="w-4 h-4 mr-2" /> コピー</>
                                )}
                              </Button>
                            </div>
                            <CardContent className="p-6 pt-16">
                              {tab.id === "portal" && generatedResults.portalTitle && (
                                <div className="mb-6 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                                  <p className="text-zinc-400 text-xs mb-1 font-semibold uppercase tracking-wider">生成されたタイトル</p>
                                  <h3 className="text-lg font-bold text-white mb-2">{generatedResults.portalTitle}</h3>
                                  <p className="text-zinc-500 text-xs">※上記のタイトルと下の本文がWordPressに送信されます。</p>
                                </div>
                              )}
                              {/* 画像生成オプションは廃止済みのため、画像プレビューは表示しない */}
                              {/* 本文表示：編集モード or 閲覧モード */}
                              {editingTab === tab.id ? (
                                <textarea
                                  className="w-full min-h-[240px] bg-zinc-950 border border-amber-500/30 rounded-lg p-4 text-zinc-300 text-sm font-medium leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
                                  value={tab.data as string}
                                  onChange={(e) => {
                                    // generatedResults の該当フィールドをリアルタイム更新
                                    setGeneratedResults((prev) =>
                                      prev ? { ...prev, [tab.id]: e.target.value } : prev
                                    );
                                  }}
                                  spellCheck={false}
                                />
                              ) : (
                                <div className="whitespace-pre-wrap text-zinc-300 font-medium leading-relaxed">
                                  {tab.data}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </TabsContent>
                      ))}
                    </>
                  )}
                </Tabs>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
