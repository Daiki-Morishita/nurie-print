import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, ChevronLeft, Clock, Printer } from 'lucide-react'
import { getMaterialById, materials, getMaterialsForAudience } from '@/lib/data'
import { loadOverrides } from '@/lib/data-overrides'
import { THEME_LABELS } from '@/lib/types'
import { PrintButton } from '@/components/materials/PrintButton'
import { SaveButton } from '@/components/materials/SaveButton'
import { FavoriteButton } from '@/components/favorites/FavoriteButton'

export const revalidate = 30

export async function generateStaticParams() {
  return getMaterialsForAudience('adult').map(m => ({ id: m.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const material = getMaterialById(id)
  if (!material) return {}
  return {
    title: `${material.title}｜おとなのぬりえ無料プリント`,
    description: `${material.description} A4横長で印刷できる本格塗り絵。`,
    alternates: { canonical: `https://nurie-print.com/adult/materials/${id}` },
    openGraph: {
      title: material.title,
      description: material.description,
      type: 'article',
      ...(material.imageUrl ? { images: [{ url: material.imageUrl, alt: material.title }] } : {}),
    },
  }
}

export default async function AdultMaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const overrides = await loadOverrides()
  const material = getMaterialById(id, overrides)
  if (!material || material.audience !== 'adult') notFound()

  const adultMaterials = getMaterialsForAudience('adult', overrides)
  const idx = adultMaterials.findIndex(m => m.id === id)
  const prevMaterial = idx > 0 ? adultMaterials[idx - 1] : null
  const nextMaterial = idx >= 0 && idx < adultMaterials.length - 1 ? adultMaterials[idx + 1] : null
  const related = adultMaterials
    .filter(m => m.id !== material.id && (m.theme === material.theme))
    .slice(0, 4)

  const printImageUrl = material.imageUrl
    ? material.imageUrl.endsWith('.svg')
      ? material.imageUrl
      : `/api/print-image/${material.id}`
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: material.title,
    description: material.description,
    inLanguage: 'ja',
    isAccessibleForFree: true,
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    publisher: {
      '@type': 'Organization',
      name: 'おとなのぬりえ',
      url: 'https://nurie-print.com/adult',
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://nurie-print.com/adult/materials/${material.id}` },
    ...(material.imageUrl ? { image: material.imageUrl } : {}),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ===== 印刷専用エリア ===== */}
      <style>{`
        @page { size: A4 landscape; margin: 0; }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: economy !important;
            print-color-adjust: economy !important;
            color-scheme: light only;
          }
          html, body, .print-area, .print-area * {
            filter: grayscale(100%) !important;
            -webkit-filter: grayscale(100%) !important;
          }
          .print-area, .print-area * {
            border: 0 !important;
            outline: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
      <div className="hidden print:block print-area" style={{ position: 'relative', width: '297mm', height: '210mm', boxSizing: 'border-box', overflow: 'hidden', background: 'white' }}>
        {printImageUrl && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={printImageUrl} alt={material.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
          </div>
        )}
        <div style={{ position: 'absolute', right: '6mm', bottom: '4mm', fontSize: '8pt', color: '#999', display: 'flex', gap: '0.4em' }}>
          <span>{material.title}</span>
          <span style={{ color: '#ccc' }}>｜</span>
          <span>おとなのぬりえ</span>
        </div>
      </div>

      {/* ===== 通常表示 ===== */}
      <div className="print:hidden max-w-[1280px] mx-auto px-4 sm:px-6 py-8">
        <nav className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-6">
          <Link href="/adult" className="hover:text-primary transition-colors">おとなのぬりえ</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/adult/materials" className="hover:text-primary transition-colors">塗り絵を探す</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground line-clamp-1">{material.title}</span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          <div>
            {/* プレビュー */}
            <div className="bg-white border border-border rounded-sm overflow-hidden mb-6 relative flex items-center justify-center aspect-[1.414/1] shadow-md">
              {prevMaterial && (
                <Link
                  href={`/adult/materials/${prevMaterial.id}`}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 hover:bg-white border border-border rounded-full shadow-md flex items-center justify-center text-foreground hover:text-primary transition-all"
                  title={`前: ${prevMaterial.title}`}
                  aria-label="前の塗り絵"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </Link>
              )}
              {nextMaterial && (
                <Link
                  href={`/adult/materials/${nextMaterial.id}`}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 hover:bg-white border border-border rounded-full shadow-md flex items-center justify-center text-foreground hover:text-primary transition-all"
                  title={`次: ${nextMaterial.title}`}
                  aria-label="次の塗り絵"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </Link>
              )}
              {material.imageUrl && (
                <Image
                  src={material.imageUrl}
                  alt={material.title}
                  width={840}
                  height={594}
                  className="w-full h-full object-contain p-4 sm:p-8"
                  unoptimized
                />
              )}
              <div className="absolute bottom-3 right-3 text-[10px] text-muted-foreground bg-white/90 backdrop-blur px-2 py-0.5 rounded border border-border">
                A4 横長
              </div>
            </div>

            {/* タイトル */}
            <div className="font-mincho text-[11px] text-primary mb-1 tracking-[0.2em]">— Plate —</div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <h1 className="font-mincho text-[26px] sm:text-[32px] font-black leading-[1.3]">{material.title}</h1>
              <FavoriteButton materialId={material.id} size="lg" variant="inline" className="shrink-0 mt-1" />
            </div>
            <p className="text-[14px] text-foreground/85 mb-5 leading-relaxed pl-4 border-l-[3px] border-primary">{material.description}</p>

            {/* モバイル: 印刷・保存 */}
            <div className="lg:hidden mb-6 bg-white border border-border rounded-lg p-4 space-y-2.5">
              <PrintButton materialTitle={material.title} />
              <SaveButton materialTitle={material.title} imageUrl={material.imageUrl} />
              <p className="text-[11px] text-muted-foreground text-center pt-1">
                A4横長・モノクロ印刷に最適化されています
              </p>
            </div>

            {/* タグ */}
            <div className="flex flex-wrap gap-2 mb-8">
              {material.theme && THEME_LABELS[material.theme] && (
                <Link
                  href={`/adult/category/theme/${material.theme}`}
                  className="inline-flex items-center text-[12px] bg-white border border-border hover:border-primary hover:text-primary px-3 py-1.5 rounded-full transition-colors"
                >
                  {THEME_LABELS[material.theme]}
                </Link>
              )}
              {material.tags.map(tag => (
                <Link
                  key={tag}
                  href={`/adult/materials?search=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center text-[12px] bg-muted hover:bg-primary hover:text-white px-3 py-1.5 rounded-full transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>

            {/* この一枚について */}
            <div className="bg-white border border-border rounded-lg p-5 mb-4 leading-relaxed text-[14px] space-y-3">
              <h2 className="font-mincho text-[18px] font-bold mb-1 pb-2 border-b border-border">この一枚について</h2>
              <p>
                「{material.title}」は、{material.theme && THEME_LABELS[material.theme]}テーマの大人向け塗り絵です。
                細密な線画は、塗り進めるほどに集中力が深まり、瞑想的な時間を与えてくれます。
              </p>
              <p>
                色鉛筆や水彩、マーカーなどお好みの画材で。1ページ {material.duration} 分前後を目安に、急がずゆっくりと塗り進めてください。
              </p>
            </div>
          </div>

          {/* サイドバー */}
          <div className="hidden lg:block space-y-4">
            <div className="bg-white border border-border rounded-lg p-5 sticky top-32">
              <h2 className="font-mincho text-[15px] font-bold mb-4 flex items-center gap-2 pb-2 border-b border-border">
                <Printer className="w-4 h-4 text-primary" />
                印刷・保存
              </h2>
              <div className="space-y-2.5">
                <PrintButton materialTitle={material.title} />
                <SaveButton materialTitle={material.title} imageUrl={material.imageUrl} />
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                A4横長・モノクロ印刷に最適化されています
              </p>
              <dl className="mt-5 pt-4 border-t border-border space-y-2.5 text-[12px]">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">テーマ</dt>
                  <dd className="font-medium">{material.theme && THEME_LABELS[material.theme]}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />目安時間</dt>
                  <dd className="font-medium">約{material.duration}分</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">難易度</dt>
                  <dd className="font-medium">{'★'.repeat(material.difficulty)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* 関連塗り絵 */}
        {related.length > 0 && (
          <div className="mt-14 pt-8 border-t border-border">
            <div className="font-mincho text-[11px] text-primary mb-1 tracking-[0.2em]">— Related —</div>
            <h2 className="font-mincho text-[20px] font-bold mb-5">同じテーマの塗り絵</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
              {related.map(m => (
                <Link
                  key={m.id}
                  href={`/adult/materials/${m.id}`}
                  className="group bg-white border border-border rounded-sm overflow-hidden hover:border-primary transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="aspect-[1.414/1] bg-background overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.imageUrl} alt={m.title} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="px-3 py-2.5 border-t border-border/60">
                    <h3 className="font-mincho text-[13px] font-bold leading-snug line-clamp-1 group-hover:text-primary transition-colors">{m.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
