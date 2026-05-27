import Link from 'next/link'
import { Building2, ChevronRight, Mail } from 'lucide-react'

export const metadata = {
  title: '運営事業所｜ぬりえプリント',
  description: '無料ぬりえプリント配布サイト「ぬりえプリント」を運営する Special Move（スペシャルムーブ）の事業案内・代表者・所在地・連絡先のご案内。',
  alternates: { canonical: 'https://nurie-print.com/operator' },
}

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Special Move',
  alternateName: 'スペシャルムーブ',
  url: 'https://nurie-print.com',
  founder: { '@type': 'Person', name: '森下 大喜' },
  foundingDate: '2020',
  address: {
    '@type': 'PostalAddress',
    addressLocality: '大阪市西区',
    addressRegion: '大阪府',
    addressCountry: 'JP',
  },
  email: 'contact@nurie-print.com',
  description: '無料ぬりえプリント配布サービス「ぬりえプリント」を運営する個人事業所。',
}

export default function OperatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">ホーム</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">運営事業所</span>
        </nav>

        <div className="font-mincho italic text-[11px] text-primary mb-1 tracking-[0.1em]">— Operator —</div>
        <h1 className="font-mincho text-[28px] sm:text-[36px] font-black mb-6">運営事業所のご案内</h1>

        <section className="prose max-w-none text-foreground leading-relaxed mb-10">
          <p className="text-sm">
            当サイト「ぬりえプリント」は、大阪市を拠点とする個人事業所
            <strong> Special Move（スペシャルムーブ）</strong>
            が運営しています。子どもとおやこの時間を支える教材づくりを目的に、無料でぬりえプリントを配布しています。
          </p>
        </section>

        <h2 className="font-mincho text-[20px] font-bold mb-4 flex items-center gap-2 pb-2 border-b border-border">
          <Building2 className="w-5 h-5 text-primary" />
          事業者情報
        </h2>

        <dl className="grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr] gap-y-3 gap-x-4 text-sm leading-relaxed mb-10">
          <dt className="text-muted-foreground">事業所名</dt>
          <dd>Special Move（スペシャルムーブ）</dd>

          <dt className="text-muted-foreground">代表者</dt>
          <dd>森下 大喜</dd>

          <dt className="text-muted-foreground">所在地</dt>
          <dd>大阪市西区3-6-2</dd>

          <dt className="text-muted-foreground">開業</dt>
          <dd>2020年</dd>

          <dt className="text-muted-foreground">事業内容</dt>
          <dd>幼児向け教材プリントの企画、ウェブメディア運営</dd>

          <dt className="text-muted-foreground">運営サイト</dt>
          <dd>
            <a href="https://nurie-print.com" className="text-primary hover:underline">
              ぬりえプリント（nurie-print.com）
            </a>
          </dd>

          <dt className="text-muted-foreground">連絡先</dt>
          <dd className="flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <a href="mailto:contact@nurie-print.com" className="text-primary hover:underline">
              contact@nurie-print.com
            </a>
          </dd>
        </dl>

        <h2 className="font-mincho text-[20px] font-bold mb-4 flex items-center gap-2 pb-2 border-b border-border">
          <Mail className="w-5 h-5 text-primary" />
          お問い合わせ
        </h2>
        <p className="text-sm leading-relaxed mb-4">
          サービスに関するご意見・ご質問、取材・掲載のご相談、教材の利用に関するお問い合わせは、専用フォームよりお願いいたします。
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-[13px] font-rounded font-black hover:opacity-90 transition-opacity"
          >
            お問い合わせフォーム
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 border border-border px-5 py-2.5 rounded-lg text-[13px] font-medium hover:bg-muted transition-colors"
          >
            サイトの理念について
          </Link>
        </div>
      </div>
    </>
  )
}
