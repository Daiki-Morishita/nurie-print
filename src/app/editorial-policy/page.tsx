import Link from 'next/link'
import { ChevronRight, BookOpen, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react'

export const metadata = {
  title: '編集方針｜ぬりえプリント',
  description: 'ぬりえプリントの編集方針・コンテンツ作成基準・情報の更新頻度について。公的機関の資料や専門書に基づき、保育現場の知見を参考にコンテンツを作成しています。',
  alternates: { canonical: 'https://nurie-print.com/editorial-policy' },
}

export default function EditorialPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">ホーム</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">編集方針</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-2">
        <BookOpen className="w-7 h-7 text-primary" />
        編集方針
      </h1>

      <p className="text-sm leading-relaxed mb-10">
        ぬりえプリントでは、保育士・幼稚園教諭の先生方、保護者の方々に安心して使っていただけるよう、教材とコラム記事の作成にあたって以下の方針を定めています。掲載する情報の質と信頼性を維持するために、当サイトが守っている基準を公開します。
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          情報源の選定基準
        </h2>
        <p className="text-sm leading-relaxed mb-3">
          コラム記事や教材に付随する解説文を作成する際は、以下の情報源を優先的に参照しています。
        </p>
        <ul className="space-y-2 text-sm leading-relaxed list-disc pl-5">
          <li>
            <strong>公的機関の資料</strong>：文部科学省「幼稚園教育要領」、厚生労働省「保育所保育指針」など、国が定める幼児教育・保育のガイドライン
          </li>
          <li>
            <strong>学術的に確立された研究</strong>：発達心理学・教育心理学の主要文献（Bandura, Csikszentmihalyi など）
          </li>
          <li>
            <strong>専門団体の知見</strong>：日本作業療法士協会、日本小児科学会等の公開資料
          </li>
          <li>
            <strong>保育現場の実践知</strong>：実際に保育・幼児教育に携わる方々の声を参考に、現場で役立つ視点を取り入れています
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          コラム記事の作成プロセス
        </h2>
        <ol className="space-y-3 text-sm leading-relaxed list-decimal pl-5">
          <li>
            <strong>テーマの選定</strong>：保育・幼児教育の現場でよく相談される話題、保護者の関心が高いトピックを優先します
          </li>
          <li>
            <strong>情報の確認</strong>：公的機関のガイドラインや学術文献を確認し、引用する場合は出典を明記します
          </li>
          <li>
            <strong>記事の執筆</strong>：保育・教育の現場で実際に役立つ視点を意識して書きます。一般論にとどまらず、具体的な活用シーンを示すようにしています
          </li>
          <li>
            <strong>表記・読みやすさのチェック</strong>：専門用語には注釈をつけ、保護者の方にも理解しやすい言葉づかいを心がけます
          </li>
          <li>
            <strong>定期的な見直し</strong>：法令やガイドラインの改訂、新しい知見が出た場合は記事を更新します
          </li>
        </ol>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-primary" />
          更新頻度
        </h2>
        <ul className="space-y-2 text-sm leading-relaxed list-disc pl-5">
          <li>新規教材は、季節やニーズに合わせて随時追加しています</li>
          <li>コラム記事は、ガイドライン改訂などの大きな変化があった際に内容を見直します</li>
          <li>公開済み記事の更新日は、各記事の冒頭に明記しています</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          イラスト素材の制作プロセス（AI活用の透明性）
        </h2>
        <div className="text-sm leading-relaxed space-y-3">
          <p>
            当サイトのぬりえ素材（線画）は、<strong>画像生成AIツールを活用して制作</strong>しています。具体的には、各素材に対して年齢・場面・構図を指定したプロンプトを設計し、生成された結果から品質基準を満たすものを編集部が選別して掲載しています。
          </p>
          <p>
            <strong>品質チェック項目：</strong>
          </p>
          <ul className="space-y-1 list-disc pl-5">
            <li>線の太さ・濃さがぬりえとして適切か</li>
            <li>対象年齢の発達段階に合った難易度か</li>
            <li>背景・小道具が「塗る部分」として適切に区切られているか</li>
            <li>不適切な要素（怖い・不快・差別的表現）を含まないか</li>
            <li>既存の特定キャラクター・有名作品の模倣になっていないか</li>
          </ul>
          <p>
            問題のある素材は <code className="bg-muted px-1 rounded text-[12px]">imageStatus: &apos;needs_revision&apos;</code> に分類して非公開とし、必要に応じて再制作しています。
          </p>
          <p>
            <strong>著作権・類似性に関するご指摘：</strong> 万一、既存作品・キャラクターと類似してしまった場合は、
            <Link href="/contact" className="text-primary underline mx-1">お問い合わせフォーム</Link>
            よりご一報ください。確認の上、速やかに該当素材を非公開化または差し替えします。
          </p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" />
          限界と免責
        </h2>
        <p className="text-sm leading-relaxed mb-3">
          当サイトのコラム記事は、一般的な保育・幼児教育に関する情報を提供することを目的としています。以下の点にご留意ください。
        </p>
        <ul className="space-y-2 text-sm leading-relaxed list-disc pl-5">
          <li>記事の内容は医療・心理等の専門的助言を代替するものではありません</li>
          <li>お子さまの発達には個人差があり、記事内の年齢目安はあくまで参考値です</li>
          <li>発達面で気になる点がある場合は、小児科医・保育士・専門機関にご相談ください</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3">誤りのご指摘・改善のご提案</h2>
        <p className="text-sm leading-relaxed">
          掲載内容に誤りや表現の不適切な部分を見つけられた場合は、ぜひ
          <Link href="/contact" className="text-primary underline mx-1">お問い合わせフォーム</Link>
          よりお知らせください。確認の上、速やかに修正・更新を行います。
        </p>
      </section>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/about" className="block bg-white border border-border text-center px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted transition-colors">
          このサイトについて
        </Link>
        <Link href="/terms" className="block bg-white border border-border text-center px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted transition-colors">
          利用規約
        </Link>
        <Link href="/contact" className="block bg-white border border-border text-center px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted transition-colors">
          お問い合わせ
        </Link>
      </div>
    </div>
  )
}
