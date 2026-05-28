import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Clock, Users, Lightbulb, Printer, ChevronRight, ChevronLeft } from 'lucide-react'
import { getMaterialById, getRelatedMaterials, materials } from '@/lib/data'
import { loadOverrides } from '@/lib/data-overrides'
import { CATEGORY_LABELS, DIFFICULTY_LABELS, SEASON_LABELS, EVENT_LABELS, THEME_LABELS } from '@/lib/types'
import { THEME_INSIGHT, DIFFICULTY_TIPS } from '@/lib/theme-insights'
import { MaterialCard, DifficultyBadge } from '@/components/materials/MaterialCard'
import { PrintButton } from '@/components/materials/PrintButton'
import { SaveButton } from '@/components/materials/SaveButton'
import { FavoriteButton } from '@/components/favorites/FavoriteButton'
import { AdBanner } from '@/components/ads/AdBanner'
import { RelatedPosts } from '@/components/materials/RelatedPosts'
import { getPublishedPostsForMaterial } from '@/lib/posts'

export async function generateStaticParams() {
  return materials.map(m => ({ id: m.id }))
}

// ISR: ステータス変更を 30 秒以内に反映
export const revalidate = 30

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const material = getMaterialById(id)
  if (!material) return {}
  const ageLabel = material.ageMin === material.ageMax
    ? `${material.ageMin}歳`
    : `${material.ageMin}〜${material.ageMax}歳`
  const seoDesc = `${material.description}${material.ageMin ? `${ageLabel}向け、A4印刷対応の無料ぬりえプリントです。` : ''}`
  return {
    title: `${material.title}｜${ageLabel}向け無料プリント`,
    description: seoDesc,
    alternates: { canonical: `https://nurie-print.com/materials/${id}` },
    // featured 素材のみインデックス対象（200字以上の独自解説文を備えた人気上位50件）
    // それ以外は AdSense審査・scaled content 対策で一時noindex
    robots: material.featured
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title: material.title,
      description: seoDesc,
      type: 'article',
      publishedTime: material.createdAt,
      authors: ['ぬりえプリント編集部'],
      ...(material.imageUrl ? { images: [{ url: material.imageUrl, width: 1200, height: 848, alt: material.title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: material.title,
      description: seoDesc,
      ...(material.imageUrl ? { images: [material.imageUrl] } : {}),
    },
  }
}

const categoryEmoji: Record<string, string> = {
  coloring: '🖍️', hiragana: 'あ', numbers: '1', drawing: '✏️',
  maze: '🗺', dotconnect: '⚫', craft: '🎨', scissors: '✂️',
}
const themeEmoji: Record<string, string> = {
  animals: '🐾', dinosaurs: '🦕', vehicles: '🚒', trains: '🚃',
  food: '🍎', sea: '🐟', flowers: '🌸', insects: '🐛', characters: '⭐', park: '🌳',
}

export default async function MaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const overrides = await loadOverrides()
  const material = getMaterialById(id, overrides)
  if (!material) notFound()

  const idx = materials.findIndex(m => m.id === id)
  const prevMaterial = idx > 0 ? materials[idx - 1] : null
  const nextMaterial = idx >= 0 && idx < materials.length - 1 ? materials[idx + 1] : null

  const related = getRelatedMaterials(material, 4, overrides)
  const relatedPosts = await getPublishedPostsForMaterial(material.id, 5)
  const ageLabel = material.ageMin === material.ageMax
    ? `${material.ageMin}歳`
    : `${material.ageMin}〜${material.ageMax}歳`

  const hasImage = !!material.imageUrl
  // 印刷用: API経由で長辺3500pxにアップスケールした画像を使う
  const printImageUrl = material.imageUrl
    ? material.imageUrl.endsWith('.svg')
      ? material.imageUrl                    // SVGはそのまま（解像度非依存）
      : `/api/print-image/${material.id}`    // JPG/PNG → 高解像度API
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: material.title,
    description: material.description,
    educationalLevel: ageLabel,
    educationalUse: 'practice',
    inLanguage: 'ja',
    isAccessibleForFree: true,
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    publisher: {
      '@type': 'Organization',
      name: 'ぬりえプリント',
      url: 'https://nurie-print.com',
      logo: { '@type': 'ImageObject', url: 'https://nurie-print.com/icon.svg' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://nurie-print.com/materials/${material.id}` },
    ...(material.imageUrl ? { image: material.imageUrl.startsWith('http') ? material.imageUrl : `https://nurie-print.com${material.imageUrl}` } : {}),
  }


  // パンくず: ホーム > 教材一覧 > [テーマ] > 素材名
  const themeLabel = material.theme ? THEME_LABELS[material.theme] : null
  const themeUrl = material.theme ? `https://nurie-print.com/category/theme/${material.theme}` : null
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://nurie-print.com' },
      { '@type': 'ListItem', position: 2, name: '教材一覧', item: 'https://nurie-print.com/materials' },
      ...(themeLabel && themeUrl ? [{ '@type': 'ListItem', position: 3, name: themeLabel, item: themeUrl }] : []),
      { '@type': 'ListItem', position: themeLabel ? 4 : 3, name: material.title, item: `https://nurie-print.com/materials/${material.id}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {/* ===== 印刷専用エリア（画面では非表示・横A4・画像のみ・モノクロ） ===== */}
      <style>{`
        @page { size: A4 landscape; margin: 0; }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: economy !important;
            print-color-adjust: economy !important;
            color-adjust: economy !important;
            color-scheme: light only;
            forced-color-adjust: economy;
          }
          html, body, .print-area, .print-area * {
            filter: grayscale(100%) !important;
            -webkit-filter: grayscale(100%) !important;
          }
          .print-area,
          .print-area * {
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
            <img
              src={printImageUrl}
              alt={material.title}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
            />
          </div>
        )}
        {/* 右下ブランディング — 背景なし・小さく */}
        <div style={{
          position: 'absolute',
          right: '6mm',
          bottom: '4mm',
          fontSize: '8pt',
          color: '#999',
          letterSpacing: '0.05em',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4em',
        }}>
          <span>{material.title}</span>
          <span style={{ color: '#ccc' }}>｜</span>
          <span>ぬりえプリント</span>
        </div>
      </div>

      {/* ===== 通常表示エリア ===== */}
      <div className="print:hidden max-w-[1280px] mx-auto px-4 sm:px-6 py-8">
        {/* パンくず */}
        <nav className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-6 flex-wrap">
          <Link href="/" className="hover:text-primary transition-colors">ホーム</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/materials" className="hover:text-primary transition-colors">教材一覧</Link>
          {themeLabel && material.theme && (
            <>
              <ChevronRight className="w-3 h-3" />
              <Link href={`/category/theme/${material.theme}`} className="hover:text-primary transition-colors">{themeLabel}</Link>
            </>
          )}
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground line-clamp-1">{material.title}</span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          {/* メインコンテンツ */}
          <div>
            {/* 教材プレビュー — A4横長比率（1.414:1）で印刷イメージを伝える */}
            <div className="bg-white border border-border rounded-lg overflow-hidden mb-6 relative flex items-center justify-center aspect-[1.414/1] max-w-3xl mx-auto">
              {prevMaterial && (
                <Link
                  href={`/materials/${prevMaterial.id}`}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 hover:bg-white border border-border rounded-full shadow-md flex items-center justify-center text-foreground hover:text-primary transition-all"
                  title={`前: ${prevMaterial.title}`}
                  aria-label="前の教材"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </Link>
              )}
              {nextMaterial && (
                <Link
                  href={`/materials/${nextMaterial.id}`}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 hover:bg-white border border-border rounded-full shadow-md flex items-center justify-center text-foreground hover:text-primary transition-all"
                  title={`次: ${nextMaterial.title}`}
                  aria-label="次の教材"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </Link>
              )}
              {hasImage ? (
                <Image
                  src={material.imageUrl}
                  alt={material.title}
                  width={840}
                  height={594}
                  className="w-full h-full object-contain p-4 sm:p-8"
                  unoptimized
                />
              ) : (
                <div className="text-8xl py-12 select-none">
                  {material.theme ? (themeEmoji[material.theme] ?? categoryEmoji[material.category] ?? '🖨') : (categoryEmoji[material.category] ?? '🖨')}
                </div>
              )}
              <div className="absolute top-3 left-3 flex gap-2 flex-wrap items-center">
                <DifficultyBadge level={material.difficulty} />
                <span className="text-xs px-2.5 py-1 rounded-full bg-white border border-border font-medium">
                  {CATEGORY_LABELS[material.category]}
                </span>
              </div>
              {/* A4横長 印刷サイズ表示 */}
              <div className="absolute bottom-3 right-3 text-[10px] text-muted-foreground bg-white/90 backdrop-blur px-2 py-0.5 rounded border border-border">
                A4 横長
              </div>
              {/* お気に入り（画像右上にオーバーレイ） */}
              <FavoriteButton materialId={material.id} size="lg" variant="overlay" />
            </div>

            {/* タイトル */}
            <div className="font-rounded font-bold text-[12px] text-primary mb-1 tracking-[0.1em]">— Material —</div>
            <div className="mb-3">
              <h1 className="font-rounded text-[26px] sm:text-[32px] font-black leading-[1.3]">{material.title}</h1>
            </div>
            <p className="text-[14px] text-foreground/85 mb-4 leading-relaxed pl-4 border-l-[3px] border-primary">{material.description}</p>

            {/* モバイル専用: 画像直下に印刷・保存ボタン */}
            <div className="lg:hidden mb-6 bg-white border border-border rounded-lg p-4 space-y-2.5">
              <PrintButton materialTitle={material.title} materialId={material.id} />
              <SaveButton materialTitle={material.title} imageUrl={material.imageUrl} materialId={material.id} />
              <p className="text-[11px] text-muted-foreground text-center pt-1">
                A4横長・白黒印刷に最適化されています
              </p>
            </div>

            {/* タグ — クリックで検索 */}
            <div className="flex flex-wrap gap-2 mb-6">
              {material.tags.map(tag => (
                <Link
                  key={tag}
                  href={`/materials?search=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center text-[12px] bg-muted hover:bg-primary hover:text-white px-3 py-1.5 rounded-full transition-colors"
                >
                  #{tag}
                </Link>
              ))}
              {material.season && (
                <Link
                  href={`/category/season/${material.season}`}
                  className="inline-flex items-center text-[12px] bg-white border border-border hover:border-primary hover:text-primary px-3 py-1.5 rounded-full transition-colors"
                >
                  {SEASON_LABELS[material.season]}
                </Link>
              )}
              {material.event && (
                <Link
                  href={`/materials?event=${material.event}`}
                  className="inline-flex items-center text-[12px] bg-white border border-border hover:border-primary hover:text-primary px-3 py-1.5 rounded-full transition-colors"
                >
                  {EVENT_LABELS[material.event]}
                </Link>
              )}
            </div>

            {/* 解説テキスト — 冒頭は素材固有の説明文（seoDescription 優先、無ければ description）でユニーク性を確保 */}
            <div className="bg-white border border-border rounded-lg p-5 mb-4 leading-relaxed text-[14px] space-y-3">
              <h2 className="font-rounded text-[18px] font-bold mb-1 pb-2 border-b border-border">この教材について</h2>
              <p className="text-[15px] text-foreground font-medium leading-relaxed whitespace-pre-line">
                {material.seoDescription || material.description}
              </p>
              <p className="text-muted-foreground">
                {ageLabel}のお子さま向け、{DIFFICULTY_LABELS[material.difficulty]}難易度・所要時間の目安は約{material.duration}分。
                A4横長・白黒印刷に最適化されており、家庭用プリンタでそのまま印刷してすぐご利用いただけます。
                {material.tools.length > 0 && (
                  <>使用する道具は{material.tools.join('、')}など、身近なもので取り組めます。</>
                )}
              </p>
              {material.about?.featureDescription && (
                <>
                  <h3 className="font-rounded text-[14px] font-bold pt-2">この絵の特徴</h3>
                  <p>{material.about.featureDescription}</p>
                </>
              )}
              {material.about?.colorIdeas && (
                <>
                  <h3 className="font-rounded text-[14px] font-bold pt-2">色のアイデア</h3>
                  <p>{material.about.colorIdeas}</p>
                </>
              )}
              {material.about?.coloringTips && (
                <>
                  <h3 className="font-rounded text-[14px] font-bold pt-2">塗り方のワンポイント</h3>
                  <p>{material.about.coloringTips}</p>
                </>
              )}
              {material.theme && THEME_INSIGHT[material.theme] && (
                <>
                  <h3 className="font-rounded text-[14px] font-bold pt-2">「{THEME_LABELS[material.theme]}」テーマで育てる力</h3>
                  <p>{THEME_INSIGHT[material.theme]}</p>
                </>
              )}
              <h3 className="font-rounded text-[14px] font-bold pt-2">{DIFFICULTY_LABELS[material.difficulty]}（{ageLabel}）の塗り方ガイド</h3>
              <p>{DIFFICULTY_TIPS[material.difficulty]}</p>
              <h3 className="font-rounded text-[14px] font-bold pt-2">おうちでの楽しみ方</h3>
              <p>
                完成したぬりえは、お部屋に飾ったり、季節のカード作りに活用したり、
                お子さまの成長記録としてアルバムに残すのもおすすめです。
                同じ題材でも年齢や難易度を変えて繰り返し楽しめるので、お気に入りの一枚を見つけてみてください。
              </p>
            </div>

            {/* 活動提案 */}
            <div className="bg-white border border-border rounded-lg p-4">
              <h2 className="font-rounded text-[14px] font-bold flex items-center gap-2 mb-3 pb-2 border-b border-border">
                <Lightbulb className="w-4 h-4 text-primary" />
                活動のアイデア
              </h2>
              <ul className="space-y-2">
                {material.activityIdeas.map((idea, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-accent font-bold shrink-0">•</span>
                    {idea}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* サイドバー */}
          <div className="space-y-4">
            {/* 印刷・保存ボタン */}
            <div className="bg-white border border-border rounded-lg p-5">
              <h2 className="font-rounded text-[15px] font-bold mb-4 flex items-center gap-2 pb-2 border-b border-border">
                <Printer className="w-4 h-4 text-primary" />
                印刷・保存
              </h2>
              <div className="space-y-2.5">
                <PrintButton materialTitle={material.title} materialId={material.id} />
                <SaveButton materialTitle={material.title} imageUrl={material.imageUrl} materialId={material.id} />
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                A4横長・白黒印刷に最適化されています
              </p>
            </div>

            {/* 教材情報 */}
            <div className="bg-white border border-border rounded-lg p-5">
              <h2 className="font-rounded text-[14px] font-bold mb-4 pb-2 border-b border-border">教材情報</h2>
              <dl className="space-y-3">
                <InfoRow icon={<Users className="w-4 h-4" />} label="対象年齢" value={ageLabel} />
                <InfoRow icon={<Clock className="w-4 h-4" />} label="目安時間" value={`約${material.duration}分`} />
                <InfoRow
                  icon={<span className="w-4 h-4 flex items-center justify-center text-xs font-bold">難</span>}
                  label="難易度"
                  value={DIFFICULTY_LABELS[material.difficulty]}
                />
              </dl>
            </div>

            <Link
              href="/materials"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              教材一覧に戻る
            </Link>
          </div>
        </div>

        {/* この塗り絵を使った記事への逆リンク (0件なら自動非表示) */}
        <RelatedPosts posts={relatedPosts} materialTitle={material.title} />

        {/* 広告 */}
        <AdBanner
          slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT ?? ''}
          className="mt-8 print:hidden"
        />

        {/* 関連教材 */}
        {related.length > 0 && (
          <div className="mt-14 pt-8 border-t border-border">
            <div className="font-rounded font-bold text-[11px] text-primary mb-1 tracking-[0.1em]">— Related —</div>
            <h2 className="font-rounded text-[20px] font-bold mb-5">関連する教材</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
              {related.map(m => (
                <MaterialCard key={m.id} material={m} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  )
}
