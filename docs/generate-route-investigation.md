# 生成結果が汎用的になる原因の調査結果

## ① shopFeatures と shopScrapedContent のシステムプロンプトへの渡し方

### 結論：**正しく渡されている**

- **取得箇所**（`src/app/api/generate/route.ts` 181〜190行付近）  
  - `shopFeatures` = `shopInfo?.features || ""`  
  - `shopScrapedContent` = `shopInfo?.scrapedContent || ""`  
  リクエストの `shopInfo` からそのまま取り出している。

- **システムプロンプトでの使用箇所**（同ファイル 301〜307行付近）  
  - 「店舗の独自情報・強み・想い」として、`shopFeatures` と `shopScrapedContent` の両方が組み込まれている。

### 注意点（汎用化しやすくなる要因）

- `shopFeatures` が空のとき、プロンプトには **「特になし」** という文字列が入る（305行目）。
- `shopScrapedContent` が空のときは、**【WEBサイトから抽出した参考情報】** のブロック自体が出力されない（307行目は条件付き）。
- その直後（309行目）で、**「髪質改善」「トレンドカラー」「丁寧なカウンセリング」を強みとして織り込む**と固定で指示している。  
→ 店舗固有情報が空だと、「特になし」＋この3つが強く効き、結果が汎用的になりやすい。

---

## ② 店舗固有情報を使っているシステムプロンプトのコード（そのまま）

以下が、店舗固有情報を参照している部分のコードです。

```typescript
// 181〜195行付近：変数取り出し
const shopName = shopInfo?.name || "お店";
const shopAddress = shopInfo?.address || "長野市";
const shopIndustry = shopInfo?.industry || "サロン";
const shopPhone = shopInfo?.phone || "";
const shopLineUrl = shopInfo?.lineUrl || "";
const shopBusinessHours = shopInfo?.businessHours || "記載なし";
const shopHolidays = shopInfo?.holidays || "記載なし";
const shopFeatures = shopInfo?.features || "";
const shopSnsUrl = shopInfo?.snsUrl || "";
const shopSampleTexts = shopInfo?.sampleTexts || "";
const shopScrapedContent = shopInfo?.scrapedContent || "";
// ... short系省略
```

```typescript
// 291〜310行付近：システムプロンプト本文
const systemPrompt = `# あなたの役割
あなたは美容業界専門のSNSマーケティングコンサルタントです。
${shopAddress}の${shopIndustry}「${shopName}」を担当し、特に20〜30代女性をターゲットにした「集客につながる美容院投稿」を作成します。

店舗の基本情報：【営業時間: ${shopBusinessHours}】【定休日: ${shopHolidays}】

【制作日時・コンテキスト】
今回の投稿は「${dateContextJa}」を想定して執筆してください。
（中略）${weatherInstruction}

【店舗の独自情報・強み・想い（学習データ）】
以下の店舗の独自性やこだわり、参考WEBサイトの情報を、わざとらしくならないよう自然に文章のエッセンスとして組み込んでください。（※情報がない場合は無視してよい）

${shopFeatures || "特になし"}

${shopScrapedContent ? `【WEBサイトから抽出した参考情報】\n${shopScrapedContent}` : ""}

同時に、どの投稿でも「髪質改善」「トレンドカラー」「丁寧なカウンセリング」を、このサロンの強みとして不自然にならない範囲で自然に織り込んでください。

${toneInstruction}
${shortInstruction}
...
`;
```

このほか、媒体別の `jsonFormatGuide` やパターンF用の `userPrompt` 内で、  
`shopName` / `shopAddress` / `shopLineUrl` / `shopPhone` / `shopBusinessHours` / `shopHolidays` などが使われています。  
`shopFeatures` はパターンFの userPrompt（396行付近）でも `shopFeatures || "髪質改善・トレンドカラー・丁寧なカウンセリング"` としてフォールバックで参照されています。

---

## ③ 「目的を決める」セクションがパターン選択・生成ロジックに与える影響

### 結論：**API のパターン選択や生成ロジックには一切影響していない**

- **目的を決める**は `page.tsx` の **①目的を決める**（`selectedPatternCategory`）で、表示用の「カテゴリ」を選ぶだけ。
- **②投稿パターンの選択**で、そのカテゴリに属する `PATTERNS` だけをフィルタして表示している（`PATTERN_CATEGORIES` と `getPatternCategoryId(selectedPattern)`）。
- 生成 API に送っているのは **選択されたパターン** の `patternId` と `patternTitle` のみ（`useContentGenerator.ts` の `normalBody` / `requestBody`）。  
  **目的（カテゴリ）そのものはリクエストに含まれていない。**

したがって、  
- パターン選択のロジック（どのパターンが選ばれうるか）は UI のフィルタのみ。  
- 生成ロジック（`generate/route.ts`）は「目的」を見ておらず、**パターンIDとその他リクエストパラメータだけ**で動いている。

---

## ④ generate/route.ts に渡されるリクエストボディの型と実際のパラメータ

### 型定義（Zod スキーマ：64〜106行）

```typescript
const generateSchema = z.object({
    patternTitle: z.string().optional(),
    patternId: z.string().optional(),
    useWeather: z.boolean().optional(),
    additionalContext: z.string().optional(),
    q1: z.string().optional(),
    q2: z.string().optional(),
    q3: z.string().optional(),
    generatedAt: z.string().optional(),
    imageData: z.object({
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
        data: z.string(), // base64
    }).optional(),
    shopInfo: z.object({
        name: z.string().optional(),
        address: z.string().optional(),
        industry: z.string().optional(),
        phone: z.string().optional(),
        lineUrl: z.string().optional(),
        businessHours: z.string().optional(),
        holidays: z.string().optional(),
        features: z.string().optional(),           // ← その他特記事項（shopFeatures）
        snsUrl: z.string().optional(),
        sampleTexts: z.string().optional(),
        scrapedContent: z.string().optional(),    // ← URLスクレイピング内容（shopScrapedContent）
        shortTargetDuration: z.number().optional(),
        shortPlatform: z.string().optional(),
        shortSampleScript: z.string().optional(),
        shortMemo: z.string().optional(),
        shortHookType: z.string().optional(),
    }).optional(),
    news: z.object({
        title: z.string().optional(),
        snippet: z.string().optional(),
        link: z.string().optional(),
    }).optional().nullable(),
    outputTargets: z.object({
        instagram: z.boolean().optional(),
        gbp: z.boolean().optional(),
        portal: z.boolean().optional(),
        line: z.boolean().optional(),
        short: z.boolean().optional(),
    }).optional().default({ instagram: true, gbp: true, portal: true, line: false, short: false })
});
```

### 実際に POST で受け取っているパラメータ（153行で destructure）

- `patternTitle` … パターン名
- `patternId` … パターンID（A/B/C/D/E/F/G/H/I）
- `useWeather` … 天気を使うか
- `additionalContext` … パターン別の追加情報（JSON文字列）
- `q1`, `q2`, `q3` … フォームの3問
- `generatedAt` … 生成日時（ISO文字列）
- `imageData` … 画像アップロード時（mimeType + base64 data）
- `shopInfo` … 上記スキーマのオブジェクト（name, address, industry, phone, lineUrl, businessHours, holidays, **features**, snsUrl, sampleTexts, **scrapedContent**, short系）
- `news` … ニュース連携時（title, snippet, link）
- `outputTargets` … 出力媒体（instagram, gbp, portal, line, short）

クライアント（`useContentGenerator.ts`）は、通常時は `normalBody` として  
`patternTitle`, `useWeather`, `q1`, `q2`, `q3`, `shopInfo: activeShopInfo`, `outputTargets`, `generatedAt` を送り、  
パターンによって `patternId` と `additionalContext` を付与しています。  
`shopInfo` は `ShopInfo` 型のオブジェクトをそのまま送っているため、**features / scrapedContent がフロントの状態に入っていれば、そのまま API に渡っている**。

---

## まとめ：汎用化しやすい要因

1. **店舗の「その他特記事項」や「スクレイピング内容」が空**  
   → プロンプトが「特になし」＋「髪質改善・トレンドカラー・丁寧なカウンセリング」に寄り、同じような文章になりやすい。

2. **toneInstruction のデフォルト例が整体・肩こり**  
   → サンプルテキスト未設定時、その例のトーンに引きずられる可能性がある。

3. **「目的を決める」は原因ではない**  
   → あくまで表示用カテゴリで、API には送っておらず、生成ロジックには影響していない。

改善するなら、  
- 初期設定や店舗設定で **features / scrapedContent** を必ず入力・保存し、  
- 空のときは「特になし」ではなく「店舗名・住所・業種のみで書く」など、汎用フレーズに頼らない指示に変える、  
といった対応が有効です。
