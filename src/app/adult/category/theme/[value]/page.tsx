import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { filterMaterials } from '@/lib/data'
import { loadOverrides } from '@/lib/data-overrides'
import { THEME_LABELS, ADULT_THEMES } from '@/lib/types'
import type { Theme } from '@/lib/types'

const ADULT_THEME_DESCRIPTIONS: Record<string, string> = {
  mandala:             '幾何学的な対称性と細密さ。塗り絵を瞑想的な時間に変えるテーマです。',
  botanical:           '植物学画調の精密な線画。葉脈や花弁を丁寧に塗り分けます。',
  landscape:           '風景の細密線画。遠近感を色で表現します。',
  pattern:             'リズムのある幾何模様。配色の練習にも最適です。',
  'animals-detail':    '動物の毛並みや表情まで描き込んだ細密画。',
  'flowers-detail':    '花弁一枚一枚の質感を活かす細密構図。',
  cityscape:           'パリ・京都など、都市の街並みを線画で。',
}

export const revalidate = 30

export function generateStaticParams() {
  return ADULT_THEMES.map(t => ({ value: t }))
}

export async function generateMetadata({ params }: { params: Promise<{ value: string }> }) {
  const { value } = await params
  const label = THEME_LABELS[value as Theme] ?? value
  return {
    title: `${label}の塗り絵｜おとなのぬりえ`,
    description: `大人・シニア向けの${label}の塗り絵プリント一覧。心を整えるための本格的な線画を無料配布しています。`,
    alternates: { canonical: `https://nurie-print.com/adult/category/theme/${value}` },
    robots: { index: false, follow: true },
  }
}

export default async function AdultThemePage({ params }: { params: Promise<{ value: string }> }) {
  const { value } = await params
  const theme = value as Theme
  if (!ADULT_THEMES.includes(theme)) notFound()

  const overrides = await loadOverrides()
  const filtered = filterMaterials({ theme, audience: 'adult', overrides })
  const label = THEME_LABELS[theme]
  const description = ADULT_THEME_DESCRIPTIONS[value] ?? ''

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'おとなのぬりえ', item: 'https://nurie-print.com/adult' },
      { '@type': 'ListItem', position: 2, name: label, item: `https://nurie-print.com/adult/category/theme/${value}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10">
        <nav className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-6">
          <Link href="/adult" className="hover:text-primary">おとなのぬりえ</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{label}</span>
        </nav>

        <div className="mb-8 pb-4 border-b border-border">
          <div className="font-mincho italic text-[11px] text-primary mb-1 tracking-[0.1em]">— Theme —</div>
          <h1 className="font-mincho text-[28px] md:text-[36px] font-black">{label}</h1>
          {description && (
            <p className="text-[13px] text-muted-foreground mt-3 leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
          <div className="text-[11px] text-muted-foreground mt-3">
            {filtered.length > 0 ? `${filtered.length} 点掲載中` : '準備中'}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-10 text-center">
            <div className="font-mincho text-[18px] font-bold mb-3">準備中です</div>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
              「{label}」の塗り絵は、近日公開予定です。<br />
              ご希望の構図やリクエストがあれば、お問い合わせよりお寄せください。
            </p>
            <Link href="/contact" className="inline-block bg-foreground text-background px-7 py-3 rounded text-[13px] hover:bg-primary transition-colors">
              リクエストを送る
            </Link>
            <div className="mt-6 pt-6 border-t border-border">
              <Link href="/adult" className="text-[12px] text-accent hover:text-primary">
                ← 他のテーマを見る
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
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
                  <h2 className="font-mincho text-[14px] font-bold leading-snug mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                    {m.title}
                  </h2>
                  <p className="text-[11px] text-muted-foreground italic line-clamp-2 leading-relaxed">
                    &ldquo;{m.description}&rdquo;
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
