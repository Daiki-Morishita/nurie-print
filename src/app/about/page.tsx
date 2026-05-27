import Link from 'next/link'
import { Printer, Heart, Users, Sparkles, ChevronRight, BookOpen, Shield } from 'lucide-react'

export const metadata = {
  title: 'ぬりえプリントについて',
  description: '保育士・幼稚園教諭・ご家庭で使える無料の幼児向け教材プリント配布サイト「ぬりえプリント」の運営理念とサービス内容のご紹介。',
  alternates: { canonical: 'https://nurie-print.com/about' },
}

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ぬりえプリント',
  url: 'https://nurie-print.com',
  logo: { '@type': 'ImageObject', url: 'https://nurie-print.com/icon.svg' },
  description: '保育士・幼稚園教諭・ご家庭で使える無料の幼児向け教材プリント配布サービス。',
  contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', url: 'https://nurie-print.com/contact' },
  sameAs: [],
}

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">ホーム</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">このサイトについて</span>
      </nav>

      <div className="font-mincho italic text-[11px] text-primary mb-1 tracking-[0.1em]">— About —</div>
      <h1 className="font-mincho text-[28px] sm:text-[36px] font-black mb-6">ぬりえプリントについて</h1>

      <section className="prose max-w-none text-foreground leading-relaxed space-y-4 mb-10">
        <p>
          「ぬりえプリント」は、保育士・幼稚園教諭の先生方、そしてご家庭でお子様と過ごす保護者の方々のために、
          <strong>すぐに印刷して使える幼児向け教材プリント</strong>を無料で配布するサービスです。
        </p>
        <p>
          現場で「明日の活動にちょうどいい教材が欲しい」「子どもが集中できるぬりえを探したい」と思ったとき、
          年齢・季節・行事・難易度などの条件でサッと絞り込み、A4で1クリック印刷できる──
          そんな <strong>「現場で本当に使いやすいUI」</strong> を目指して作っています。
        </p>
      </section>

      <h2 className="font-mincho text-[20px] font-bold mb-4 flex items-center gap-2 pb-2 border-b border-border">
        <Sparkles className="w-5 h-5 text-primary" />
        サービスの特徴
      </h2>
      <ul className="space-y-3 mb-10 text-sm leading-relaxed">
        <li className="flex gap-2"><span className="text-primary">•</span>
          <span><strong>完全無料</strong>：会員登録不要・ダウンロードや印刷に制限はありません。</span></li>
        <li className="flex gap-2"><span className="text-primary">•</span>
          <span><strong>A4・白黒印刷に最適化</strong>：園や家庭にある一般的なプリンタでそのまま使えます。</span></li>
        <li className="flex gap-2"><span className="text-primary">•</span>
          <span><strong>年齢別の難易度設計</strong>：2〜6歳までの発達段階に応じて4段階（simple／easy／normal／rich）で構成。</span></li>
        <li className="flex gap-2"><span className="text-primary">•</span>
          <span><strong>豊富なテーマ</strong>：動物・恐竜・乗り物・海の生き物など多様なぬりえテーマを用意。季節に合わせた教材も充実。</span></li>
        <li className="flex gap-2"><span className="text-primary">•</span>
          <span><strong>活動アイデア付き</strong>：各教材に「保育・家庭での活用例」を添えています。</span></li>
      </ul>

      <h2 className="font-mincho text-[20px] font-bold mb-4 flex items-center gap-2 pb-2 border-b border-border">
        <Heart className="w-5 h-5 text-primary" />
        運営理念
      </h2>
      <p className="text-sm leading-relaxed mb-10">
        子どもにとっての「描く・塗る・なぞる」体験は、手先の発達・集中力・創造性を育てる大切な時間です。
        私たちは、その時間を支える先生・保護者の方々が「教材探し」に時間を奪われないよう、
        質の高い素材を、必要なときにすぐ取り出せる形で提供することを目指しています。
      </p>

      <h2 className="font-mincho text-[20px] font-bold mb-4 flex items-center gap-2 pb-2 border-b border-border">
        <Users className="w-5 h-5 text-primary" />
        想定利用シーン
      </h2>
      <ul className="space-y-2 mb-10 text-sm leading-relaxed">
        <li className="flex gap-2"><span className="text-primary">•</span>保育園・幼稚園での自由遊び・設定保育の教材として</li>
        <li className="flex gap-2"><span className="text-primary">•</span>季節行事（七夕・ハロウィン・クリスマス等）の制作活動の素材として</li>
        <li className="flex gap-2"><span className="text-primary">•</span>ご家庭での雨の日のおうち遊びに</li>
        <li className="flex gap-2"><span className="text-primary">•</span>祖父母宅・帰省先での孫との時間に</li>
        <li className="flex gap-2"><span className="text-primary">•</span>児童館・学童・子育て支援センター等での配布物として</li>
      </ul>

      <h2 className="font-mincho text-[20px] font-bold mb-4 flex items-center gap-2 pb-2 border-b border-border">
        <BookOpen className="w-5 h-5 text-primary" />
        コンテンツの作成方針
      </h2>
      <div className="mb-10 text-sm leading-relaxed space-y-3">
        <p>
          掲載するコラム記事と教材は、文部科学省「幼稚園教育要領」、厚生労働省「保育所保育指針」など、公的機関が公開する保育・幼児教育のガイドラインを基準に作成しています。発達心理学・教育心理学の確立された研究成果も参照しており、引用する際は出典を明記しています。
        </p>
        <p>
          また、実際に保育・幼児教育に携わる方々の知見を参考にしながら、現場で本当に役立つ視点を取り入れるよう努めています。詳しくは
          <Link href="/editorial-policy" className="text-primary underline mx-1">編集方針</Link>
          をご覧ください。
        </p>
        <p className="bg-muted/50 border border-border rounded p-3 text-[13px]">
          <strong>イラストの制作プロセスについて：</strong> 当サイトのぬりえ素材は、画像生成AIツールを活用して制作した線画を、編集部が品質・対象年齢適合性・安全性の観点から確認・選別したうえで掲載しています。問題のある画像（線が薄い・対象が不明瞭・年齢に合わない等）は非公開とし、必要に応じて再制作しています。AI生成にあたっては既存の特定作品・キャラクターの模倣は意図しておらず、万一類似の指摘があった場合はお問い合わせ窓口より対応いたします。
        </p>
      </div>

      <h2 className="font-mincho text-[20px] font-bold mb-4 flex items-center gap-2 pb-2 border-b border-border">
        <Shield className="w-5 h-5 text-primary" />
        運営者情報
      </h2>
      <div className="mb-10 text-sm leading-relaxed space-y-3">
        <p>
          ぬりえプリントは、保育士・幼稚園教諭の先生方、ご家庭で幼児と関わる方々に向けて教材プリントとコラム記事を配信する個人運営サイトです。営利目的の販売活動は行っておらず、運営費は本サイトに掲載される広告収入によってまかなっています。
        </p>
        <p>
          サイトの内容についてのご質問・ご指摘・教材リクエストは、
          <Link href="/contact" className="text-primary underline mx-1">お問い合わせフォーム</Link>
          よりお気軽にご連絡ください。
        </p>
      </div>

      <h2 className="font-mincho text-[20px] font-bold mb-4 flex items-center gap-2 pb-2 border-b border-border">
        <Printer className="w-5 h-5 text-primary" />
        利用について
      </h2>
      <ul className="space-y-2 mb-10 text-sm leading-relaxed">
        <li className="flex gap-2"><span className="text-primary">•</span>教材は保育・教育・家庭利用に限り無料でご使用いただけます。</li>
        <li className="flex gap-2"><span className="text-primary">•</span>商用での再配布・販売、画像の二次配布は禁止です。</li>
        <li className="flex gap-2"><span className="text-primary">•</span>ライセンスは CC BY-NC 4.0（非商用）に準じます。</li>
      </ul>

      <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/materials" className="block bg-primary text-white text-center px-4 py-3 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          教材一覧
        </Link>
        <Link href="/editorial-policy" className="block bg-white border border-border text-center px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
          編集方針
        </Link>
        <Link href="/terms" className="block bg-white border border-border text-center px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
          利用規約
        </Link>
        <Link href="/contact" className="block bg-white border border-border text-center px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
          お問い合わせ
        </Link>
      </div>
    </div>
    </>
  )
}
