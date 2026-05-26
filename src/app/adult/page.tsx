import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getMaterialsForAudience, getPopularMaterials } from '@/lib/data'
import { loadOverrides } from '@/lib/data-overrides'
import { THEME_LABELS, ADULT_THEMES } from '@/lib/types'
import { AdultPopularGrid } from './AdultPopularGrid'

export const metadata = {
  title: 'おとなのぬりえ｜本格・写実の塗り絵を無料配布',
  description: '大人・シニアのための本格塗り絵プリント。曼荼羅・植物画・風景・幾何模様など、心を整える時間にぴったりの線画を無料でA4印刷できます。',
  alternates: { canonical: 'https://nurie-print.com/adult' },
}

export const revalidate = 30

const adultMaterials = getMaterialsForAudience('adult')
const totalAdult = adultMaterials.length

// 用意済みのテーマ別件数を表示するためのマップ
const ADULT_THEME_SHOWCASE: { theme: typeof ADULT_THEMES[number]; description: string }[] = [
  { theme: 'mandala', description: '幾何学的な対称性と細密さ。瞑想的な時間に。' },
  { theme: 'botanical', description: '植物学画調の精密な線画。葉脈や花弁を丁寧に。' },
  { theme: 'landscape', description: '風景の細密線画。遠近感を色で表現します。' },
  { theme: 'pattern', description: 'リズムのある幾何模様。配色の練習にも最適。' },
  { theme: 'animals-detail', description: '動物の毛並みや表情まで描き込んだ細密画。' },
  { theme: 'flowers-detail', description: '花弁一枚一枚の質感を活かす細密構図。' },
  { theme: 'cityscape', description: 'パリ・京都など都市の街並みを線画で。' },
]

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'おとなのぬりえ',
  url: 'https://nurie-print.com/adult',
  description: '大人・シニア向けの本格塗り絵プリント無料配布。曼荼羅・植物・風景。',
}

// Pick today's featured material (deterministic by day-of-year)
function getTodaysAdultFeature() {
  const pool = adultMaterials.filter(m => m.imageUrl && (m.difficulty ?? 0) >= 3)
  if (pool.length === 0) return adultMaterials.find(m => m.imageUrl) ?? null
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000)
  return pool[dayOfYear % pool.length]
}

export default async function AdultHomePage() {
  const overrides = await loadOverrides()
  // タイトル重複排除のため広めに取得（クライアント側でシャッフル+ユニーク化）
  const popular = getPopularMaterials(60, 'adult', overrides).filter(m => m.imageUrl)
  const feature = getTodaysAdultFeature()

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />

      {/* Section switcher banner */}
      <div className="bg-foreground text-background text-[11px] py-2 text-center">
        いまご覧のセクション：<strong className="font-bold">おとなのぬりえ</strong>
        <Link href="/" className="underline hover:text-accent ml-2">こども向けはこちら →</Link>
      </div>

      {/* ===== HERO — magazine-style with single featured image ===== */}
      <section className="pt-12 md:pt-20 pb-10 md:pb-16 relative overflow-hidden">
        {/* Subtle decorative background — light wash with botanical SVG hints */}
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <svg className="absolute -left-20 top-10 w-[280px] h-[280px] opacity-[0.06]" viewBox="-150 -150 300 300" aria-hidden>
            <g stroke="#2D5043" strokeWidth="0.8" fill="none">
              <circle r="140" />
              <circle r="110" />
              <circle r="80" />
              <circle r="50" />
              {Array.from({ length: 24 }, (_, i) => i * 15).map((deg) => (
                <line key={deg} x1="0" y1="0" x2={140 * Math.cos((deg * Math.PI) / 180)} y2={140 * Math.sin((deg * Math.PI) / 180)} />
              ))}
            </g>
          </svg>
          <svg className="absolute -right-32 bottom-0 w-[360px] h-[360px] opacity-[0.05]" viewBox="-150 -150 300 300" aria-hidden>
            <g stroke="#2D5043" strokeWidth="0.8" fill="none">
              <circle r="140" />
              <circle r="100" />
              <circle r="60" />
              {Array.from({ length: 16 }, (_, i) => i * 22.5).map((deg) => (
                <line key={deg} x1="0" y1="0" x2={140 * Math.cos((deg * Math.PI) / 180)} y2={140 * Math.sin((deg * Math.PI) / 180)} />
              ))}
            </g>
          </svg>
        </div>

        <div className="max-w-[1200px] mx-auto px-6 relative">
          <div className="grid md:grid-cols-[1fr_1fr] gap-10 md:gap-16 items-center">
            {/* Text column */}
            <div className="md:pl-4">
              <div className="font-mincho text-[12px] text-primary tracking-[0.3em] mb-5">
                — A QUIET HOUR —
              </div>
              <h1 className="font-mincho text-[34px] md:text-[56px] font-black leading-[1.3] tracking-[0.03em] mb-5 text-foreground">
                一日の終わりに、<br />
                <span className="text-primary">一枚だけ。</span>
              </h1>
              <p className="text-[14px] md:text-[15px] text-muted-foreground mb-7 leading-loose">
                曼荼羅・植物画・風景・幾何模様。<br />
                心を整えるための本格的な線画を、{totalAdult > 0 ? `${totalAdult} 点` : 'これから順次'}無料配布します。
              </p>

              {/* Search bar */}
              <form action="/adult/materials" method="get" className="flex border-2 border-foreground rounded overflow-hidden bg-white shadow-md max-w-md">
                <input
                  name="search"
                  type="text"
                  placeholder="テーマで検索（曼荼羅・薔薇・風景…）"
                  className="flex-1 px-5 py-3.5 text-[15px] outline-none bg-transparent"
                />
                <button type="submit" className="bg-foreground text-white px-7 text-[14px] font-medium hover:bg-primary transition-colors">
                  さがす
                </button>
              </form>
            </div>

            {/* Featured image column — magazine-style card */}
            {feature && (
              <div className="relative">
                <Link href={`/adult/materials/${feature.id}`} className="group block">
                  <div className="font-mincho text-[11px] text-primary tracking-[0.2em] mb-3 text-right">
                    — TODAY&apos;S PICK —
                  </div>
                  <div className="bg-white border border-foreground/10 shadow-2xl rounded-sm overflow-hidden relative">
                    <div className="aspect-[1.414/1] bg-white overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={feature.imageUrl}
                        alt={feature.title}
                        className="w-full h-full object-contain p-4 group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    </div>
                    <div className="px-5 py-4 border-t border-foreground/10 bg-gradient-to-b from-white to-[#F8F4EB] flex items-baseline justify-between">
                      <div>
                        <div className="font-mincho text-[12px] text-muted-foreground tracking-[0.15em] mb-0.5">
                          No. {String(adultMaterials.indexOf(feature) + 1).padStart(3, '0')}
                        </div>
                        <h2 className="font-mincho text-[17px] md:text-[20px] font-bold text-foreground group-hover:text-primary transition-colors">
                          {feature.title}
                        </h2>
                      </div>
                      <span className="text-[12px] text-primary group-hover:underline shrink-0 ml-3 font-mincho">
                        塗ってみる →
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== IMMEDIATE GRID — actual coloring images right below hero ===== */}
      {popular.length > 0 && (
        <section className="pb-12">
          <div className="max-w-[1280px] mx-auto px-6">
            <AdultPopularGrid items={popular} take={8} />
            <div className="text-center mt-8">
              <Link
                href="/adult/materials"
                className="inline-flex items-center gap-2 bg-foreground text-white px-7 py-3 rounded text-[14px] font-mincho font-bold hover:bg-primary transition-colors"
              >
                すべての塗り絵を見る（{totalAdult}点）<ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== THEMES (showcase) ===== */}
      <section className="py-12 border-t border-border">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="mb-8 pb-3 border-b border-foreground/15">
            <div className="font-mincho italic text-[11px] text-primary mb-1 tracking-[0.1em]">— Themes —</div>
            <h2 className="font-mincho text-[24px] md:text-[28px] font-bold">テーマ一覧</h2>
            <p className="text-[12px] text-muted-foreground mt-2">心の状態や、その日の気分にあわせて選んでください。</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {ADULT_THEME_SHOWCASE.map(({ theme, description }, idx) => {
              const samples = adultMaterials.filter(m => m.theme === theme && m.imageUrl)
              const sample = samples[0]
              const count = samples.length
              return (
                <Link
                  key={theme}
                  href={`/adult/category/theme/${theme}`}
                  className="group bg-card border border-border rounded-sm overflow-hidden hover:border-primary transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="aspect-[1.414/1] bg-background overflow-hidden relative">
                    {sample ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sample.imageUrl} alt={`${THEME_LABELS[theme]}のぬりえ`} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 font-mincho text-[12px] tracking-[0.2em]">
                        準備中
                      </div>
                    )}
                    <span className="absolute top-2 left-2 font-mincho text-[18px] text-primary font-black leading-none bg-white/95 backdrop-blur px-2 py-1 rounded">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-baseline justify-between gap-3 mb-1.5">
                      <h3 className="font-mincho text-[17px] font-bold group-hover:text-primary transition-colors">
                        {THEME_LABELS[theme]}
                      </h3>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {count > 0 ? `${count}点` : '準備中'}
                      </span>
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">{description}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== EDITORIAL QUOTE ===== */}
      <section className="py-20 md:py-28 bg-card border-y border-border">
        <div className="max-w-[760px] mx-auto px-6 text-center">
          <div className="text-primary text-[14px] mb-8">✶</div>
          <p className="font-mincho text-[18px] md:text-[22px] leading-[2.4] text-foreground">
            一筆ずつ、色を選ぶ。<br />
            それは、自分の機嫌をとる時間。<br />
            線の中だけで、世界が完結する贅沢。
          </p>
          <div className="text-primary text-[14px] mt-8">✶</div>
          <div className="text-[11px] text-muted-foreground mt-5 tracking-[0.2em]">
            — おとなのぬりえ 編集部 —
          </div>
        </div>
      </section>

      {/* ===== USE CASES ===== */}
      <section className="py-12 border-t border-border">
        <div className="max-w-[860px] mx-auto px-6">
          <div className="mb-8 pb-3 border-b border-foreground/15">
            <div className="font-mincho italic text-[11px] text-primary mb-1 tracking-[0.1em]">— Use Cases —</div>
            <h2 className="font-mincho text-[24px] md:text-[28px] font-bold">こんな時間に</h2>
          </div>
          <div className="space-y-4">
            {[
              { title: '一日の終わりに', desc: '画面から離れて、線の中だけで完結する時間。スマホを置き、深呼吸ひとつ分の余白を作る習慣に。' },
              { title: 'コーヒーと一緒に', desc: '15〜30分で1ページ。お茶を淹れて、机に向かう前の静かな儀式として。' },
              { title: 'シニアの脳活・リハビリに', desc: '手指の細やかな動きと配色の判断が、認知機能の維持を支えます。介護施設・地域サロンでもご活用ください。' },
              { title: '不眠・心が落ち着かない夜に', desc: '反復的な細密塗りは瞑想に近い効果を持つとされています。眠る前の30分に。' },
            ].map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-5 flex gap-5">
                <div className="font-mincho text-[18px] text-primary font-black leading-none pt-1 shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <h3 className="font-mincho text-[16px] font-bold mb-2">{item.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom cross-link to kids */}
      <section className="py-12 border-t border-border text-center">
        <div className="max-w-[760px] mx-auto px-6">
          <Link href="/" className="text-[13px] text-muted-foreground underline hover:text-primary">
            こども向けのぬりえはこちら →
          </Link>
        </div>
      </section>
    </>
  )
}
