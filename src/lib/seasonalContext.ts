export type SeasonalEvent = {
  month: number;
  emoji: string;
  events: string[];
  hairNeeds: string[];
  urgencyPhrase: string;
};

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    month: 1,
    emoji: "⛄",
    events: ["成人式", "お正月明け", "新年のスタート"],
    hairNeeds: ["振袖アレンジ", "新年のイメチェン", "乾燥ダメージケア"],
    urgencyPhrase: "新年最初のヘアスタイルで一年を好スタートに",
  },
  {
    month: 2,
    emoji: "🌸",
    events: ["バレンタイン", "春の準備", "花粉シーズン直前"],
    hairNeeds: ["デートヘア", "明るめカラー", "春に向けたイメチェン"],
    urgencyPhrase: "春本番前の今がカラーを変える絶好のタイミング",
  },
  {
    month: 3,
    emoji: "🌸",
    events: ["卒業式", "異動・転勤", "新生活準備", "春分"],
    hairNeeds: ["髪質改善", "イメチェン", "春カラー", "花粉・乾燥ケア"],
    urgencyPhrase: "新生活が始まる前に、髪から自分をリセットする",
  },
  {
    month: 4,
    emoji: "🌸",
    events: ["入学式", "新社会人", "花粉ピーク", "お花見"],
    hairNeeds: ["フレッシュスタイル", "湿気・花粉対策", "明るいカラー"],
    urgencyPhrase: "新しいステージに合わせて髪も新しくスタート",
  },
  {
    month: 5,
    emoji: "🍃",
    events: ["GW", "母の日", "初夏の始まり"],
    hairNeeds: ["お出かけヘア", "紫外線ダメージ予防", "さっぱりスタイル"],
    urgencyPhrase: "GW前に仕上げて、おでかけシーズンを全力で楽しむ",
  },
  {
    month: 6,
    emoji: "☔",
    events: ["梅雨入り", "ジューンブライド", "夏の準備"],
    hairNeeds: ["くせ毛・広がり対策", "湿気ケア", "縮毛矯正・髪質改善"],
    urgencyPhrase: "梅雨の広がりに悩む前に、今すぐ対策を",
  },
  {
    month: 7,
    emoji: "☀️",
    events: ["夏休み", "海・プール", "七夕"],
    hairNeeds: ["紫外線ダメージケア", "明るいカラー", "汗・湿気対策"],
    urgencyPhrase: "夏本番前に、紫外線に負けない強い髪を作っておく",
  },
  {
    month: 8,
    emoji: "🌻",
    events: ["お盆", "夏フェス", "夏の終わり"],
    hairNeeds: ["カラーリペア", "夏ダメージ補修", "秋への準備"],
    urgencyPhrase: "夏のダメージを今のうちにリセットして秋に備える",
  },
  {
    month: 9,
    emoji: "🍂",
    events: ["秋の始まり", "運動会", "お月見"],
    hairNeeds: ["秋カラー", "夏ダメージ補修", "乾燥ケアの開始"],
    urgencyPhrase: "秋カラーに変えるなら、今が一番きれいに仕上がる季節",
  },
  {
    month: 10,
    emoji: "🍁",
    events: ["ハロウィン", "秋本番", "紅葉シーズン"],
    hairNeeds: ["暗めカラー", "艶髪トリートメント", "冬の乾燥対策準備"],
    urgencyPhrase: "秋の深まりとともに、髪も艶やかに仕上げる季節",
  },
  {
    month: 11,
    emoji: "🍂",
    events: ["七五三", "年末準備開始", "お歳暮シーズン"],
    hairNeeds: ["お呼ばれヘア", "年末に向けた集中トリートメント"],
    urgencyPhrase: "年末の大切なイベントに向けて、今から髪を整えておく",
  },
  {
    month: 12,
    emoji: "🎄",
    events: ["クリスマス", "忘年会", "年末年始"],
    hairNeeds: ["パーティヘア", "年越し前のフルケア", "来年への準備"],
    urgencyPhrase: "一年の締めくくりに、最高の髪で年を越す",
  },
];

export function getSeasonalContext(): {
  text: string;
  emoji: string;
  month: number;
  timing: string;
  weekday: string;
} {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][now.getDay()];
  const timing = day <= 10 ? "上旬" : day <= 20 ? "中旬" : "下旬";
  const seasonal = SEASONAL_EVENTS.find((e) => e.month === month)!;

  const text = `現在の日付・時期：${month}月${timing}（${weekday}曜日）
今月のイベント・季節感：${seasonal.events.join("・")}
この時期の髪のお悩みトレンド：${seasonal.hairNeeds.join("・")}
今すぐ来店する理由づけ：${seasonal.urgencyPhrase}
推奨季節ハッシュタグ：#${month}月ヘア #${seasonal.events[0]}ヘア`;

  return {
    text,
    emoji: seasonal.emoji,
    month,
    timing,
    weekday,
  };
}
