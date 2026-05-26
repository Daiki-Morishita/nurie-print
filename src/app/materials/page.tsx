import { Suspense } from 'react'
import Link from 'next/link'
import { MaterialCard } from '@/components/materials/MaterialCard'
import { ShuffledGrid } from '@/components/materials/ShuffledGrid'
import { CollapsibleFilters } from '@/components/search/CollapsibleFilters'
import { SearchBar } from '@/components/search/SearchBar'
import { SortSelector } from '@/components/search/SortSelector'
import { filterMaterials, getMaterialsForAudience, type SortKey } from '@/lib/data'
import { loadOverrides } from '@/lib/data-overrides'
import type { Category, Season } from '@/lib/types'
import { NoResultsBanner } from '@/components/search/NoResultsBanner'

interface SearchParams {
  age?: string
  category?: string
  season?: string
  event?: string
  theme?: string
  search?: string
  difficulty?: string
  sort?: string
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  if (params.search) {
    return {
      title: `「${params.search}」の検索結果｜無料ぬりえプリント`,
      description: `「${params.search}」に関する無料ぬりえプリントを検索。保育園・幼稚園で使えるA4印刷対応のぬりえを年齢・難易度別に探せます。`,
      alternates: { canonical: 'https://nurie-print.com/materials' },
      robots: { index: false, follow: true },
    }
  }
  return {
    title: '教材を探す｜無料ぬりえプリント一覧',
    description: '保育園・幼稚園で使える無料ぬりえプリント一覧。動物・恐竜・乗り物など豊富なテーマを年齢・難易度・季節で絞り込んでA4印刷できます。',
    alternates: { canonical: 'https://nurie-print.com/materials' },
  }
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://nurie-print.com' },
    { '@type': 'ListItem', position: 2, name: '教材一覧', item: 'https://nurie-print.com/materials' },
  ],
}

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const overrides = await loadOverrides()
  const sort = (params.sort as SortKey) ?? 'newest'
  const filtered = filterMaterials({
    overrides,
    age: params.age ? Number(params.age) : undefined,
    category: params.category as Category | undefined,
    season: params.season as Season | undefined,
    event: params.event,
    theme: params.theme as Parameters<typeof filterMaterials>[0]['theme'],
    search: params.search,
    difficulty: params.difficulty ? Number(params.difficulty) : undefined,
    sort,
    audience: 'kids',
  })

  const activeCount = [params.age, params.category, params.season, params.event, params.theme, params.search, params.difficulty].filter(Boolean).length
  const totalKidsCount = getMaterialsForAudience('kids').length

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 pb-4 border-b border-border">
        <div className="font-rounded font-bold text-[12px] text-primary mb-1 tracking-[0.1em]">— Materials —</div>
        <h1 className="font-rounded text-[24px] md:text-[30px] font-black">教材を探す</h1>
        {activeCount === 0 && (
          <p className="text-[14px] text-muted-foreground mt-2 leading-relaxed">
            動物・恐竜・乗り物など{totalKidsCount}点以上のぬりえ教材を無料配布。年齢・テーマ・難易度・季節で絞り込めます。
          </p>
        )}
      </div>

      <div className="mb-6">
        <Suspense fallback={<div className="h-10 bg-muted rounded animate-pulse" />}>
          <SearchBar />
        </Suspense>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        <aside className="lg:w-60 shrink-0">
          <Suspense fallback={<div className="animate-pulse h-12 bg-muted rounded" />}>
            <CollapsibleFilters />
          </Suspense>
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[12px] text-muted-foreground">
              {activeCount > 0 ? `${filtered.length} 件が該当` : `全 ${filtered.length} 件`}
            </p>
            <Suspense fallback={<div className="h-9 w-56 bg-muted rounded animate-pulse" />}>
              <SortSelector />
            </Suspense>
          </div>

          {filtered.length === 0 ? (
            params.search ? (
              <NoResultsBanner query={params.search} />
            ) : (
              <div className="text-center py-16 text-muted-foreground bg-white border border-border rounded-lg">
                <p className="font-rounded text-[16px] font-bold text-foreground">該当する教材が見つかりませんでした</p>
                <p className="text-[12px] mt-2">条件を変えて探してみてください</p>
                <Link href="/materials" className="inline-block mt-4 text-[13px] text-primary hover:underline">
                  すべての教材を見る →
                </Link>
              </div>
            )
          ) : sort === 'random' ? (
            <ShuffledGrid items={filtered} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filtered.map(material => (
                <MaterialCard key={material.id} material={material} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
