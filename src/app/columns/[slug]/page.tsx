import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Clock, BookOpen, ExternalLink, ArrowRight } from 'lucide-react'
import { getColumnBySlug, getRelatedColumns, columns, type ColumnSection } from '@/lib/columns'
import { getMaterialById } from '@/lib/data'
import { MaterialCard } from '@/components/materials/MaterialCard'

export async function generateStaticParams() {
  return columns.map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const col = getColumnBySlug(slug)
  if (!col) return {}
  return {
    title: col.title,
    description: col.description,
    alternates: { canonical: `https://nurie-print.com/columns/${slug}` },
    openGraph: {
      title: col.title,
      description: col.description,
      type: 'article',
      publishedTime: col.publishedAt,
      modifiedTime: col.updatedAt,
      authors: ['ぬりえプリント編集部'],
      ...(col.heroSrc ? { images: [{ url: col.heroSrc, width: 1200, height: 630, alt: col.heroAlt }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: col.title,
      description: col.description,
      ...(col.heroSrc ? { images: [col.heroSrc] } : {}),
    },
  }
}

const categoryColor: Record<string, string> = {
  '発達・知育': 'bg-green-100 text-green-700',
  '運筆・書き方': 'bg-blue-100 text-blue-700',
  '工作・ハサミ': 'bg-orange-100 text-orange-700',
  '遊び・アイデア': 'bg-purple-100 text-purple-700',
  '季節・行事': 'bg-pink-100 text-pink-700',
  '教育・学習': 'bg-indigo-100 text-indigo-700',
}

function Section({ section }: { section: ColumnSection }) {
  switch (section.type) {
    case 'h2':
      return <h2 className="text-xl font-bold mt-10 mb-4 pb-2 border-b border-border">{section.text}</h2>
    case 'h3':
      return <h3 className="text-lg font-bold mt-6 mb-3">{section.text}</h3>
    case 'p':
      return <p className="text-sm sm:text-base leading-relaxed text-foreground">{section.text}</p>
    case 'list':
      return (
        <ul className="space-y-2">
          {section.items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed">
              <span className="text-primary shrink-0 mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
    case 'ordered':
      return (
        <ol className="space-y-3">
          {section.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed">
              <span className="w-6 h-6 bg-primary text-white text-xs rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold">{i + 1}</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      )
    case 'evidence':
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm leading-relaxed text-blue-900 mb-2">{section.text}</p>
          <p className="text-xs text-blue-600 flex items-center gap-1">
            <ExternalLink className="w-3 h-3 shrink-0" />
            {section.url ? (
              <a href={section.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800">
                {section.source}
              </a>
            ) : (
              section.source
            )}
          </p>
        </div>
      )
    case 'image':
      return (
        <figure className="my-2">
          {section.src ? (
            <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden">
              <Image src={section.src} alt={section.alt} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-full h-48 sm:h-64 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex flex-col items-center justify-center gap-2 border border-border">
              <BookOpen className="w-10 h-10 text-primary/30" />
              <p className="text-xs text-muted-foreground">画像準備中</p>
            </div>
          )}
          {section.caption && (
            <figcaption className="text-xs text-center text-muted-foreground mt-2">{section.caption}</figcaption>
          )}
        </figure>
      )
    case 'callout':
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          {section.label && <p className="text-xs font-bold text-amber-700 mb-1">💡 {section.label}</p>}
          <p className="text-sm leading-relaxed text-amber-900">{section.text}</p>
        </div>
      )
    case 'table':
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted">
                {section.headers.map((h, i) => (
                  <th key={i} className="text-left px-3 py-2 font-semibold text-xs border border-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-muted/40'}>
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-2 border border-border text-xs leading-relaxed">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'materials':
      const mats = section.ids.map(id => getMaterialById(id)).filter(Boolean)
      if (mats.length === 0) return null
      return (
        <div className="bg-white border border-border rounded-xl p-5">
          <h3 className="font-bold text-sm mb-3">{section.label}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {mats.map(m => m && <MaterialCard key={m.id} material={m} />)}
          </div>
        </div>
      )
    default:
      return null
  }
}

export default async function ColumnPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const col = getColumnBySlug(slug)
  if (!col) notFound()

  const related = getRelatedColumns(col, 3)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: col.title,
    description: col.description,
    datePublished: col.publishedAt,
    dateModified: col.updatedAt,
    author: [
      { '@type': 'Organization', name: 'ぬりえプリント編集部', url: 'https://nurie-print.com/operator' },
      { '@type': 'Person', name: '森下 大喜', url: 'https://nurie-print.com/operator' },
    ],
    publisher: {
      '@type': 'Organization',
      name: 'ぬりえプリント',
      url: 'https://nurie-print.com',
      logo: { '@type': 'ImageObject', url: 'https://nurie-print.com/icon.svg' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://nurie-print.com/columns/${col.slug}` },
    inLanguage: 'ja',
    ...(col.heroSrc ? { image: `https://nurie-print.com${col.heroSrc}` } : {}),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://nurie-print.com' },
      { '@type': 'ListItem', position: 2, name: 'コラム', item: 'https://nurie-print.com/columns' },
      { '@type': 'ListItem', position: 3, name: col.title, item: `https://nurie-print.com/columns/${col.slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* パンくず */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 flex-wrap">
          <Link href="/" className="hover:text-foreground">ホーム</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/columns" className="hover:text-foreground">コラム</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground line-clamp-1">{col.title}</span>
        </nav>

        {/* ヘッダー */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${categoryColor[col.category] ?? 'bg-gray-100 text-gray-600'}`}>
              {col.category}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />約{col.readingTime}分で読めます
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold leading-snug mb-3">{col.title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{col.description}</p>

          {/* 著者・日付情報（E-E-A-T 用に可視化） */}
          <div className="mt-4 pt-4 border-t border-border flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
            <Link href="/operator" className="flex items-center gap-2 hover:text-primary transition-colors">
              <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px]">編</span>
              <span>
                <span className="block font-medium text-foreground">ぬりえプリント編集部（運営: Special Move・森下大喜）</span>
                <span className="text-[10px]">保育・幼児教育の専門資料を元に編集</span>
              </span>
            </Link>
            <div className="ml-auto text-[11px]">
              <span>公開 <time dateTime={col.publishedAt}>{col.publishedAt}</time></span>
              {col.updatedAt && col.updatedAt !== col.publishedAt && (
                <span className="ml-2">更新 <time dateTime={col.updatedAt}>{col.updatedAt}</time></span>
              )}
            </div>
          </div>
        </div>

        {/* ヒーロー画像 */}
        <div className="relative w-full h-56 sm:h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 mb-8 flex items-center justify-center">
          {col.heroSrc ? (
            <Image src={col.heroSrc} alt={col.heroAlt} fill className="object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <BookOpen className="w-14 h-14 text-primary/25" />
              <p className="text-xs text-muted-foreground">画像準備中</p>
            </div>
          )}
        </div>

        {/* 本文 */}
        <article className="space-y-5">
          {col.sections.map((section, i) => (
            <Section key={i} section={section} />
          ))}
        </article>

        {/* 素材ページへの強い回遊CTA（コラム末尾） */}
        <div className="mt-12 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-2xl p-6 sm:p-8">
          <div className="font-rounded text-[12px] text-primary mb-2 tracking-[0.1em] font-bold">— Try It —</div>
          <h3 className="font-rounded text-[18px] sm:text-[22px] font-black leading-tight mb-3">
            この記事の内容を、実際の教材で試してみませんか？
          </h3>
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-5">
            年齢・難易度別に2,400点以上のぬりえプリントを無料配布しています。<br />
            会員登録不要・A4 1クリックで印刷できます。
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              href="/materials"
              className="flex items-center justify-between bg-primary text-white px-5 py-3.5 rounded-lg font-rounded font-black text-[14px] hover:opacity-90 transition-opacity"
            >
              <span>🎨 すべての教材を見る</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/category/age/3"
              className="flex items-center justify-between bg-white border-2 border-primary text-primary px-5 py-3.5 rounded-lg font-rounded font-black text-[14px] hover:bg-primary/5 transition-colors"
            >
              <span>👶 年齢別に探す</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 関連コラム */}
        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="text-lg font-bold mb-4">関連コラム</h2>
            <div className="grid gap-4">
              {related.map(r => (
                <Link key={r.slug} href={`/columns/${r.slug}`}
                  className="flex gap-4 bg-white border border-border rounded-xl p-4 hover:border-primary/40 transition-all">
                  <div className="w-20 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg shrink-0 overflow-hidden relative flex items-center justify-center">
                    {r.heroSrc
                      ? <Image src={r.heroSrc} alt={r.heroAlt} fill className="object-cover" />
                      : <BookOpen className="w-6 h-6 text-primary/30" />
                    }
                  </div>
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor[r.category] ?? 'bg-gray-100 text-gray-600'}`}>
                      {r.category}
                    </span>
                    <p className="font-semibold text-sm mt-1 line-clamp-2">{r.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href="/columns" className="text-sm text-primary hover:underline flex items-center justify-center gap-1">
            <BookOpen className="w-4 h-4" />コラム一覧に戻る
          </Link>
        </div>
      </div>
    </>
  )
}
