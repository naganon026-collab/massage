"use client";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold">Logic Post 利用規約</h1>
          <p className="text-sm text-zinc-400">
            この利用規約（以下「本規約」といいます。）は、Logic Post（以下「本サービス」といいます。）の提供条件および本サービスの利用に関する当社と利用者との間の権利義務関係を定めるものです。本サービスを利用される前に、本規約をよくお読みください。
          </p>
        </header>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">第1条（適用）</h2>
          <p>1. 本規約は、本サービスの提供および利用に関する当社と利用者との一切の関係に適用されます。</p>
          <p>2. 当社が本サービス上で随時掲載するガイドライン等は、本規約の一部を構成するものとします。</p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">第2条（定義）</h2>
          <p>本規約において、次の各号の用語は、各号に定める意味を有するものとします。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>「当社」とは、本サービスを運営する者をいいます。</li>
            <li>「利用者」とは、本サービスに登録し、これを利用する全ての事業者およびその担当者をいいます。</li>
            <li>「登録情報」とは、利用者が本サービスに登録した店舗情報、連絡先情報、その他一切の情報をいいます。</li>
            <li>「生成コンテンツ」とは、本サービスを通じてAIにより生成された文章、画像などのコンテンツをいいます。</li>
          </ul>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">第3条（利用登録）</h2>
          <p>1. 利用希望者は、本規約に同意の上、当社所定の方法により本サービスの利用登録を申請するものとします。</p>
          <p>2. 当社は、次の各号のいずれかに該当する場合、登録申請を承諾しないことがあります。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>虚偽の情報を提供した場合</li>
            <li>過去に本規約に違反した者である場合</li>
            <li>その他、当社が不適切と判断した場合</li>
          </ul>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">第4条（アカウント管理）</h2>
          <p>1. 利用者は、自己の責任において、本サービスに関するアカウントおよびパスワードを適切に管理・保管するものとします。</p>
          <p>2. アカウントの不正利用等により生じた損害について、当社は一切の責任を負いません。</p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">第5条（本サービスの内容）</h2>
          <p>1. 本サービスは、店舗情報等をもとに、AIを用いてSNS投稿文や記事案等のテキストを生成するサービスです。</p>
          <p>2. 生成コンテンツはあくまで「案」であり、最終的な内容の確認・修正・公開は利用者自身の責任で行うものとします。</p>
          <p>3. 本サービスは、外部サービス（例：Google、Supabase など）を利用して提供されることがあります。</p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">第6条（禁止事項）</h2>
          <p>利用者は、本サービスの利用に際して、以下の行為をしてはなりません。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>法令または公序良俗に違反する行為</li>
            <li>他者の権利を侵害する行為（著作権、商標権、肖像権、プライバシー権等）</li>
            <li>虚偽又は誤解を招く情報の発信</li>
            <li>不正アクセス、システムへの攻撃、過度なリクエスト送信等、本サービスの運営を妨げる行為</li>
            <li>本サービスを第三者に再販・再提供する行為</li>
            <li>反社会的勢力等への利用許諾、またはそれらを助長する行為</li>
            <li>その他、当社が不適切と判断する行為</li>
          </ul>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">第7条（知的財産権）</h2>
          <p>1. 本サービスおよび本サービスに関するプログラム・デザイン等に関する知的財産権は、当社または正当な権利者に帰属します。</p>
          <p>2. 生成コンテンツに対する権利帰属について特段の定めがある場合を除き、利用者は自らの責任と費用において利用・編集・公開できるものとします。ただし、第三者の権利侵害がないことは利用者が保証するものとします。</p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">第8条（サービスの変更・中止）</h2>
          <p>1. 当社は、事前の通知なく、本サービスの内容の全部または一部を変更・中止することができます。</p>
          <p>2. 当社は、本サービスの変更・中止により利用者に生じた損害について、一切の責任を負いません。</p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">第9条（免責）</h2>
          <p>1. 当社は、生成コンテンツの正確性、有用性、完全性、最新性、適法性等について、いかなる保証も行いません。</p>
          <p>2. 利用者は、生成コンテンツの内容を確認・判断の上、自らの責任で利用するものとし、生成コンテンツに起因して生じた一切の結果について当社は責任を負いません。</p>
          <p>3. 本サービスの利用または利用不能により利用者に生じた損害について、当社の故意または重過失がない限り、当社の責任は負いかねます。</p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">第10条（利用停止・登録抹消）</h2>
          <p>当社は、利用者が本規約に違反した場合、事前の通知なく当該利用者のアカウントを停止・抹消することができます。</p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">第11条（規約の変更）</h2>
          <p>当社は、必要と判断した場合、本規約を変更することができます。変更後の規約は、本サービス上に掲載された時点から効力を生じるものとします。</p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">第12条（準拠法・管轄）</h2>
          <p>1. 本規約は、日本法に準拠して解釈されます。</p>
          <p>2. 本サービスに関して紛争が生じた場合、当社の所在地を管轄する日本の裁判所を第一審の専属的合意管轄裁判所とします。</p>
        </section>

        <p className="text-xs text-zinc-500">※本ページの内容は予告なく変更される場合があります。</p>
      </div>
    </main>
  );
}

