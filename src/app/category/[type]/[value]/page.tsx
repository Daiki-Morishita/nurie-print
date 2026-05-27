import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { MaterialCard } from '@/components/materials/MaterialCard'
import { ShuffledGrid } from '@/components/materials/ShuffledGrid'
import { SortSelector } from '@/components/search/SortSelector'
import { filterMaterials, type SortKey } from '@/lib/data'
import { loadOverrides } from '@/lib/data-overrides'
import { CATEGORY_LABELS, SEASON_LABELS, EVENT_LABELS, THEME_LABELS } from '@/lib/types'
import type { Category, Season, Theme } from '@/lib/types'
import { AdBanner } from '@/components/ads/AdBanner'
import { Pagination } from '@/components/search/Pagination'

const PAGE_SIZE = 48

type CategoryType = 'age' | 'type' | 'season' | 'event' | 'theme'

// ISR: ステータス変更反映
export const revalidate = 30

export function generateStaticParams() {
  const params = [
    ...[2, 3, 4, 5, 6].map(age => ({ type: 'age', value: String(age) })),
    { type: 'type', value: 'coloring' },
    ...['animals', 'dinosaurs', 'vehicles', 'trains', 'densha', 'sea', 'park', 'insects', 'fruits', 'vegetables', 'sports', 'yokai', 'flowers', 'gotochi'].map(t => ({ type: 'theme', value: t })),
    ...['spring', 'summer', 'autumn', 'winter'].map(s => ({ type: 'season', value: s })),
  ]
  return params
}

function getPageInfo(type: string, value: string): { title: string; description: string } {
  switch (type) {
    case 'age':
      return {
        title: `${value}歳向け無料プリント教材`,
        description: `${value}歳の子どもに合った難易度の無料ぬりえプリント一覧。動物・恐竜・乗り物など豊富なテーマをA4印刷してすぐ使えます。`,
      }
    case 'type': {
      const label = CATEGORY_LABELS[value as Category] ?? value
      return {
        title: `${label}プリント｜無料印刷`,
        description: `保育園・幼稚園・ご家庭で使える${label}の無料プリント一覧。年齢・難易度別に探せて、すぐに印刷できます。`,
      }
    }
    case 'season': {
      const label = SEASON_LABELS[value as Season] ?? value
      return {
        title: `${label}の教材プリント｜無料印刷`,
        description: `${label}の季節にぴったりな無料プリント教材一覧。ぬりえ・工作・製作など、保育現場やご家庭で使えます。`,
      }
    }
    case 'event': {
      const label = EVENT_LABELS[value] ?? value
      return {
        title: `${label}の教材プリント｜無料印刷`,
        description: `${label}で使える無料プリント教材一覧。保育園・幼稚園の行事に合わせて選べるぬりえ・工作素材が揃っています。`,
      }
    }
    case 'theme': {
      const label = THEME_LABELS[value as Theme] ?? value
      return {
        title: `${label}のぬりえプリント｜無料印刷`,
        description: `${label}をテーマにした無料ぬりえプリント一覧。保育園・幼稚園・ご家庭でA4印刷してすぐ使えます。難易度別・年齢別に選べます。`,
      }
    }
    default:
      return { title: '教材一覧', description: '保育園・幼稚園向け無料プリント教材を探せます。' }
  }
}

export async function generateMetadata({ params }: { params: Promise<{ type: string; value: string }> }): Promise<import('next').Metadata> {
  const { type, value } = await params
  const { title, description } = getPageInfo(type, value)
  // AdSense審査中: カテゴリページは薄いコンテンツ判定回避のため一時noindex
  return {
    title,
    description,
    alternates: { canonical: `https://nurie-print.com/category/${type}/${value}` },
    robots: { index: false, follow: true },
  }
}

const BASE_URL = 'https://nurie-print.com'

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: CategoryType; value: string }>
  searchParams: Promise<{ sort?: string; page?: string }>
}) {
  const { type, value } = await params
  const sp = await searchParams
  const sort = (sp.sort as SortKey) ?? 'newest'

  const filterParams: Record<string, string | number> = {}
  if (type === 'age') filterParams.age = Number(value)
  else if (type === 'type') filterParams.category = value
  else if (type === 'season') filterParams.season = value
  else if (type === 'event') filterParams.event = value
  else if (type === 'theme') filterParams.theme = value
  else notFound()

  const overrides = await loadOverrides()
  const filtered = filterMaterials({ ...filterParams, overrides, sort } as Parameters<typeof filterMaterials>[0])
  const { title, description } = getPageInfo(type, value)
  const pageUrl = `${BASE_URL}/category/${type}/${value}`

  // ページネーション
  const totalCount = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const currentPage = Math.min(Math.max(1, parseInt(sp.page ?? '1', 10) || 1), totalPages)
  const paginatedItems = sort === 'random'
    ? filtered
    : filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: '教材一覧', item: `${BASE_URL}/materials` },
      { '@type': 'ListItem', position: 3, name: title, item: pageUrl },
    ],
  }

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: pageUrl,
    numberOfItems: filtered.length,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* パンくず */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">ホーム</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/materials" className="hover:text-foreground transition-colors">教材一覧</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">{title}</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{filtered.length}件の教材</p>
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-[12px] text-muted-foreground">並び替え</p>
        <Suspense fallback={<div className="h-9 w-56 bg-muted rounded animate-pulse" />}>
          <SortSelector showFavorites={false} />
        </Suspense>
      </div>

      <AdBanner
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT ?? ''}
        className="mb-6"
      />

      {totalCount === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-4xl mb-3">📭</div>
          <p className="font-medium">この条件の教材は準備中です</p>
          <Link href="/materials" className="inline-block mt-4 text-sm text-primary hover:underline">
            すべての教材を見る
          </Link>
        </div>
      ) : sort === 'random' ? (
        <ShuffledGrid items={paginatedItems} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedItems.map(material => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={`/category/${type}/${value}`}
            searchParams={sp as Record<string, string | undefined>}
            totalCount={totalCount}
          />
        </>
      )}
    </div>
    </>
  )
}
