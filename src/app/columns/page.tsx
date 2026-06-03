import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Clock, BookOpen } from 'lucide-react'
import { columns } from '@/lib/columns'

export const metadata = {
  title: 'コラム｜おやこの知育・ぬりえの知識とアイデア',
  description: 'ぬりえの発達効果・年齢別ぬりえ選び・季節のおうち遊び・外遊びの効果など、子育て中のご家庭に役立つ知育コラム36本を掲載。',
  alternates: { canonical: 'https://nurie-print.com/columns' },
}

const categoryColor: Record<string, string> = {
  '発達・知育': 'bg-green-100 text-green-700',
  '運筆・書き方': 'bg-blue-100 text-blue-700',
  '工作・ハサミ': 'bg-orange-100 text-orange-700',
  '遊び・アイデア': 'bg-purple-100 text-purple-700',
  '季節・行事': 'bg-pink-100 text-pink-700',
  '教育・学習': 'bg-indigo-100 text-indigo-700',
}

const BASE_URL = 'https://nurie-print.com'

function buildItemListJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'おやこの知育コラム一覧',
    url: `${BASE_URL}/columns`,
    numberOfItems: columns.length,
    itemListElement: columns.map((col, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: col.title,
      url: `${BASE_URL}/columns/${col.slug}`,
    })),
  }
}

export default function ColumnsPage() {
  const jsonLd = buildItemListJsonLd()
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">ホーム</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">コラム</span>
      </nav>

      <div className="mb-8 pb-4 border-b border-border">
        <div className="font-rounded font-bold text-[11px] text-primary mb-1 tracking-[0.1em]">— Editorial —</div>
        <h1 className="font-rounded text-[28px] sm:text-[36px] font-black mb-2">
          読みもの
        </h1>
        <p className="text-muted-foreground text-[14px] leading-relaxed">
          ぬりえの効果・発達段階別の教材選び・運筆・工作など、おうちの子育てに役立つ知識を編集部が解説します。
        </p>
      </div>

      <div className="grid gap-6">
        {columns.map(col => (
          <Link
            key={col.slug}
            href={`/columns/${col.slug}`}
            className="group bg-white border border-border rounded-lg overflow-hidden hover:border-primary hover:-translate-y-0.5 transition-all flex flex-col sm:flex-row"
          >
            {/* サムネイル */}
            <div className="sm:w-52 h-44 sm:h-auto bg-background shrink-0 flex items-center justify-center relative">
              {col.heroSrc ? (
                <Image src={col.heroSrc} alt={col.heroAlt} fill className="object-cover" />
              ) : (
                <BookOpen className="w-12 h-12 text-primary/30" />
              )}
            </div>
            {/* テキスト */}
            <div className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor[col.category] ?? 'bg-gray-100 text-gray-600'}`}>
                    {col.category}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />約{col.readingTime}分
                  </span>
                </div>
                <h2 className="font-rounded font-bold text-[16px] leading-snug mb-2 group-hover:text-primary transition-colors">
                  {col.title}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {col.description}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{col.publishedAt}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
    </>
  )
}
