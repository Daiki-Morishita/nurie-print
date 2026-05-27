import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { filterMaterials, type SortKey } from '@/lib/data'
import { loadOverrides } from '@/lib/data-overrides'
import type { Theme } from '@/lib/types'

export const metadata = {
  title: '塗り絵を探す｜おとなのぬりえ',
  description: '大人・シニア向けの本格塗り絵プリント一覧。曼荼羅・植物画・風景・幾何模様などのテーマで絞り込めます。',
  alternates: { canonical: 'https://nurie-print.com/adult/materials' },
  robots: { index: false, follow: true },
}

export default async function AdultMaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; theme?: string; sort?: string }>
}) {
  const params = await searchParams
  const overrides = await loadOverrides()
  const sort = (params.sort as SortKey) ?? 'newest'
  const filtered = filterMaterials({
    search: params.search,
    theme: params.theme as Theme | undefined,
    sort,
    audience: 'adult',
    overrides,
  })

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10">
      <nav className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-6">
        <Link href="/adult" className="hover:text-primary">おとなのぬりえ</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">塗り絵を探す</span>
      </nav>

      <div className="mb-6 pb-4 border-b border-border">
        <div className="font-mincho italic text-[11px] text-primary mb-1 tracking-[0.1em]">— Catalogue —</div>
        <h1 className="font-mincho text-[28px] md:text-[36px] font-black">塗り絵を探す</h1>
        <p className="text-[13px] text-muted-foreground mt-2">
          {filtered.length > 0
            ? `現在 ${filtered.length} 点の塗り絵を掲載しています。`
            : '新着教材を順次公開予定です。下記からテーマ別に先行リクエストをいただけます。'}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-10 text-center">
          <div className="font-mincho text-[18px] font-bold mb-3">準備中です</div>
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
            おとなのぬりえセクションは現在制作中です。<br />
            お問い合わせフォームから「描いてほしいテーマ」をお寄せください。
          </p>
          <Link href="/contact" className="inline-block bg-foreground text-background px-7 py-3 rounded text-[13px] hover:bg-primary transition-colors">
            リクエストを送る
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(m => (
            <Link
              key={m.id}
              href={`/adult/materials/${m.id}`}
              className="group bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition-all"
            >
              <div className="aspect-[1.414/1] bg-background flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.imageUrl} alt={m.title} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" />
              </div>
              <div className="p-3.5">
                <h3 className="font-mincho text-[14px] font-bold leading-snug mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                  {m.title}
                </h3>
                <p className="text-[11px] text-muted-foreground italic line-clamp-2 leading-relaxed">
                  &ldquo;{m.description}&rdquo;
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
