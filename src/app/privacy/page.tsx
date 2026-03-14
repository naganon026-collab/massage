"use client";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold">Logic Post プライバシーポリシー</h1>
          <p className="text-sm text-zinc-400">
            本プライバシーポリシー（以下「本ポリシー」といいます。）は、Logic Post（以下「本サービス」といいます。）において、利用者の情報がどのように取得・利用・保管されるかを定めるものです。
          </p>
        </header>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">第1条（取得する情報）</h2>
          <p>当社は、本サービスの提供にあたり、主に以下の情報を取得します。</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              アカウント情報
              <ul className="list-disc pl-5 space-y-1">
                <li>氏名または表示名</li>
                <li>メールアドレス（Googleログインにより取得）</li>
              </ul>
            </li>
            <li>
              店舗情報・設定情報
              <ul className="list-disc pl-5 space-y-1">
                <li>店舗名、住所、電話番号、営業時間、定休日、業種、WebサイトURL 等</li>
                <li>SNS用の文章サンプル、店舗の特徴・強み 等</li>
              </ul>
            </li>
            <li>
              利用履歴情報
              <ul className="list-disc pl-5 space-y-1">
                <li>生成リクエストの内容（選択したパターン、入力した設問の回答等）</li>
                <li>生成されたテキスト（SNS投稿文、ブログ記事案、ショート動画台本 等）</li>
                <li>生成日時、回数に関する情報</li>
              </ul>
            </li>
            <li>
              技術情報
              <ul className="list-disc pl-5 space-y-1">
                <li>ブラウザ情報、IPアドレス、クッキー情報、アクセス日時 等</li>
              </ul>
            </li>
            <li>
              画像アップロード機能利用時
              <ul className="list-disc pl-5 space-y-1">
                <li>利用者がアップロードした画像データ（AI生成のため一時的に処理）</li>
              </ul>
            </li>
          </ol>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">第2条（利用目的）</h2>
          <p>当社は、取得した情報を、以下の目的のために利用します。</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>本サービスの提供・運営のため</li>
            <li>利用者ごとの店舗設定に基づく、AI生成結果の最適化のため</li>
            <li>生成履歴の表示・再利用機能の提供のため</li>
            <li>本サービスの品質向上・改善、新機能の開発のため（統計情報としての分析等）</li>
            <li>不正利用の防止・セキュリティ対策のため</li>
            <li>お問い合わせへの対応のため</li>
            <li>利用規約違反への対応、トラブル発生時の調査のため</li>
            <li>法令または行政機関・司法機関からの要請への対応のため</li>
          </ol>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">第3条（第三者提供）</h2>
          <p>当社は、次の場合を除き、取得した個人情報を第三者に提供しません。</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>利用者の同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>人の生命・身体・財産の保護のために必要であり、本人の同意を得ることが困難な場合</li>
            <li>
              業務委託先に対して、本サービス運営に必要な範囲で情報を提供する場合
              <br />
              （例：Supabase、Google、AI API 提供事業者、メール送信サービス 等）
            </li>
          </ol>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">第4条（外部サービスの利用）</h2>
          <p>
            当社は、本サービスの提供のために、Supabase、Google Cloud 等の外部クラウドサービスおよびAIサービスを利用しています。これらのサービス提供者は、当社との契約に基づき、本サービスの運用に必要な範囲でのみ情報を取り扱います。
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">第5条（クッキー等の利用）</h2>
          <p>
            本サービスは、ログイン状態の維持や利用状況の把握のために、クッキー等の技術を利用する場合があります。ブラウザ設定によりクッキーを無効化できますが、本サービスの一部機能が利用できなくなる場合があります。
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">第6条（安全管理措置）</h2>
          <p>1. 当社は、個人情報への不正アクセス、紛失、漏えい等を防止するため、適切な安全管理措置を講じます。</p>
          <p>2. アクセス制御（行レベルセキュリティ等）により、利用者同士が互いのデータを閲覧できないようにしています。</p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">第7条（保管期間）</h2>
          <p>
            生成履歴や店舗情報等は、利用者がアカウントを保持している期間中は保存されます。利用者から削除の依頼があった場合や、一定期間利用がない場合には、当社の判断により削除することがあります。
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">第8条（利用者の権利）</h2>
          <p>
            利用者は、当社が保有する自己の個人情報について、開示・訂正・削除等を求めることができます。具体的な手続きについては、お問い合わせ窓口までご連絡ください。
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">第9条（未成年者の利用）</h2>
          <p>
            本サービスは、主として事業者向けサービスであり、原則として未成年者の利用を想定していません。やむを得ず未成年者が利用する場合は、保護者の同意を得た上でご利用ください。
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">第10条（本ポリシーの変更）</h2>
          <p>当社は、必要に応じて本ポリシーを変更することがあります。重要な変更がある場合は、本サービス上での通知その他適切な方法によりお知らせします。</p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">第11条（お問い合わせ窓口）</h2>
          <p className="text-sm text-zinc-300">
            本サービスに関するプライバシーの取り扱いに関するお問い合わせは、以下の窓口までご連絡ください。
          </p>
          <div className="border border-zinc-800 rounded-lg p-4 text-sm space-y-1">
            <p>事業者名：＿＿＿＿＿＿＿＿＿＿＿</p>
            <p>メールアドレス：＿＿＿＿＿＿＿＿＿＿＿</p>
          </div>
        </section>

        <p className="text-xs text-zinc-500">※本ページの内容は予告なく変更される場合があります。</p>
      </div>
    </main>
  );
}

