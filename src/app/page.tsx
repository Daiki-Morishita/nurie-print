import Link from 'next/link'
import { ArrowRight, ChevronRight, Clock } from 'lucide-react'
import { MaterialCard, DifficultyBadge } from '@/components/materials/MaterialCard'
import { FeaturedPick, type FeaturedItem } from '@/components/home/FeaturedPick'
import type { Difficulty } from '@/lib/types'
import { materials, getPopularMaterials, getMaterialById, filterMaterials, getMaterialsForAudience } from '@/lib/data'
import { loadOverrides } from '@/lib/data-overrides'
import { columns } from '@/lib/columns'

export const metadata = {
  alternates: { canonical: 'https://nurie-print.com' },
}

// ISR: 管理画面のステータス変更を反映
export const revalidate = 30

const kidsMaterials = getMaterialsForAudience('kids')
const totalMaterials = kidsMaterials.length

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'ぬりえプリント',
  url: 'https://nurie-print.com',
  description: `おやこで楽しむ無料ぬりえプリント。${totalMaterials}点以上を、登録なしですぐ印刷できます。`,
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://nurie-print.com/materials?search={search_term_string}' },
    'query-input': 'required name=search_term_string',
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ぬりえプリント編集部',
  url: 'https://nurie-print.com',
  logo: { '@type': 'ImageObject', url: 'https://nurie-print.com/icon.svg', width: 512, height: 512 },
  description: 'おやこで楽しむ無料ぬりえプリント配布サービス',
}

// Featured pool — テーマ分散させて多様化、サーバーシャッフル。クライアント側で更にローテート
function getFeaturedPool(overrides: Awaited<ReturnType<typeof loadOverrides>>): FeaturedItem[] {
  const eligible = kidsMaterials.filter(m => (m.difficulty ?? 0) >= 2 && m.imageUrl)
  const visible = eligible.filter(m => {
    const status = overrides.get(m.id)?.imageStatus ?? m.imageStatus
    return status !== 'needs_revision'
  })
  // テーマごとにグループ化 → 各テーマから最大5件 → 全部結合してシャッフル
  const byTheme = new Map<string, typeof visible>()
  for (const m of visible) {
    const key = m.theme ?? 'other'
    if (!byTheme.has(key)) byTheme.set(key, [])
    byTheme.get(key)!.push(m)
  }
  const pool: typeof visible = []
  for (const items of byTheme.values()) {
    // テーマ内でランダムに 5 件
    const arr = [...items]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    pool.push(...arr.slice(0, 5))
  }
  // 全体シャッフル
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, 60).map(m => ({
    id: m.id,
    index: materials.indexOf(m),
    title: m.title,
    description: m.description,
    imageUrl: m.imageUrl,
    ageMin: m.ageMin,
    ageMax: m.ageMax,
    difficulty: m.difficulty,
    duration: m.duration,
  }))
}

// Theme summary with representative material
const THEMES = [
  { key: 'animals',    label: '動物',     emoji: '🐾', color: '#E66A2C', sample: 'giraffe-easy-1',         href: '/category/theme/animals' },
  { key: 'dinosaurs',  label: '恐竜',     emoji: '🦕', color: '#7AA875', sample: 'tyrannosaurus-easy-1',   href: '/category/theme/dinosaurs' },
  { key: 'vehicles',   label: '乗り物',   emoji: '🚒', color: '#C25A6E', sample: 'fire-truck-easy',        href: '/category/theme/vehicles' },
  { key: 'sea',        label: '海',       emoji: '🐟', color: '#4FA7B8', sample: 'dolphin-easy',           href: '/category/theme/sea' },
  { key: 'insects',    label: '虫',       emoji: '🐛', color: '#7AA875', sample: 'butterfly-easy-1',       href: '/category/theme/insects' },
  { key: 'fruits',     label: 'くだもの', emoji: '🍎', color: '#E8B838', sample: 'apple-easy-1',           href: '/category/theme/fruits' },
  { key: 'vegetables', label: 'やさい',   emoji: '🥕', color: '#E8B838', sample: 'carrot-normal-1',        href: '/category/theme/vegetables' },
  { key: 'sports',     label: 'スポーツ', emoji: '⚽', color: '#4FA7B8', sample: 'soccer-easy-1',          href: '/category/theme/sports' },
  { key: 'yokai',      label: '妖怪',     emoji: '👹', color: '#C25A6E', sample: 'oni-normal-1',           href: '/category/theme/yokai' },
  { key: 'flowers',    label: '花',       emoji: '🌸', color: '#C25A6E', sample: 'sakura-normal-1',        href: '/category/theme/flowers' },
  { key: 'gotochi',    label: 'ご当地',   emoji: '🗾', color: '#E66A2C', sample: 'hokkaido-bear-normal-1', href: '/category/theme/gotochi' },
] as const

function getThemeSample(themeKey: string, sampleId: string) {
  const sample = getMaterialById(sampleId)
  if (sample?.imageUrl) return sample
  return filterMaterials({ theme: themeKey as Parameters<typeof filterMaterials>[0]['theme'] })
    .find(m => m.imageUrl)
}

const FAQS = [
  {
    q: 'ぬりえはすべて無料ですか？',
    a: `はい、現在公開している ${totalMaterials} 点すべて完全無料です。会員登録不要、商用利用以外は自由にお使いいただけます。`,
  },
  {
    q: '何歳から使えますか？',
    a: '2歳から6歳まで対応。年齢別ページから、お子さまに合った難易度のぬりえを選べます。',
  },
  {
    q: '印刷サイズは何ですか？',
    a: 'すべて A4 横長で最適化されています。家庭用プリンタ・園のコピー機どちらでも印刷可能です。',
  },
  {
    q: '園や教室で使ってもいいですか？',
    a: 'ご家庭はもちろん、保育園・幼稚園・教室での利用も自由です。販売・再配布のみご遠慮ください。',
  },
  {
    q: 'どのくらいの頻度で更新していますか？',
    a: '毎日新しい教材を追加しています。今月だけで 30 点以上の新作が公開予定です。',
  },
]

// FAQページ用JSON-LDは /faq 側にのみ出力する（重複排除）。
// ホームではFAQセクションのHTMLは残すが、structured dataは出さない。

export default async function HomePage() {
  const overrides = await loadOverrides()
  const popular = getPopularMaterials(12, 'kids', overrides)
  const featuredPool = getFeaturedPool(overrides)
  const featuredColumn = columns[0]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />

      {/* ===== HERO ===== */}
      <section className="pt-12 md:pt-20 pb-10 text-center relative overflow-hidden">
        {/* Decorative background: crayons + dots + scribbles */}
        <KidsHeroDecor />

        <div className="max-w-[1280px] mx-auto px-6 relative">
          <div className="font-rounded text-[12px] md:text-[13px] text-primary tracking-[0.25em] mb-4 font-bold inline-flex items-center gap-2">
            <span className="text-base">🖍️</span>
            今日のおうち時間に
            <span className="text-base">🖍️</span>
          </div>
          <h1 className="font-rounded text-[34px] md:text-[58px] font-black leading-[1.35] tracking-[0.02em] mb-6">
            おやこの一枚を、<br className="md:hidden" />
            <span className="text-primary">無料で</span>。
          </h1>
          <p className="text-[15px] md:text-[16px] text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            年齢に合う {totalMaterials} 点のぬりえを、登録なしですぐ印刷。<br className="md:hidden" />
            動物・恐竜・乗り物・童話… テーマで簡単に探せます。
          </p>

          {/* Big search — pop pill */}
          <form action="/materials" method="get" className="max-w-2xl mx-auto mb-6 flex border-[2.5px] border-foreground rounded-full overflow-hidden bg-white shadow-lg">
            <input
              name="search"
              type="text"
              placeholder="ぬりえを検索（例: きりん、2歳、ひな祭り）"
              className="flex-1 pl-6 md:pl-8 pr-4 py-4 md:py-[18px] text-[15px] md:text-[16px] outline-none bg-transparent"
            />
            <button type="submit" className="bg-primary text-white px-6 md:px-9 text-[14px] md:text-[15px] font-rounded font-black hover:bg-[#d05a23] transition-colors flex items-center gap-1.5">
              <span>🔍</span>さがす
            </button>
          </form>

          {/* Tag suggestions — cute pill chips */}
          <div className="max-w-2xl mx-auto">
            <div className="text-[12px] text-muted-foreground mb-3 font-medium">よく検索されています</div>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { label: 'きりん', emoji: '🦒', q: 'きりん', color: '#E8B838' },
                { label: 'しんかんせん', emoji: '🚄', q: '新幹線', color: '#4FA7B8' },
                { label: '迷路', emoji: '🧭', href: '/maze', color: '#7AA875' },
                { label: '2歳児向け', emoji: '👶', q: '?age=2', isFilter: true, color: '#E66A2C' },
                { label: 'ティラノ', emoji: '🦖', q: 'ティラノ', color: '#7AA875' },
              ].map((t, i) => (
                <Link
                  key={i}
                  href={t.href ?? (t.isFilter ? `/materials${t.q}` : `/materials?search=${encodeURIComponent(t.q ?? '')}`)}
                  className="inline-flex items-center gap-1.5 bg-white border-2 px-3 py-1.5 rounded-full text-[12px] font-bold hover:-translate-y-0.5 transition-all shadow-sm"
                  style={{ borderColor: t.color, color: t.color }}
                >
                  <span>{t.emoji}</span>{t.label}
                </Link>
              ))}
            </div>

            {/* All materials button */}
            <div className="mt-7">
              <Link
                href="/materials"
                className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3 rounded-full text-[14px] font-rounded font-black hover:opacity-90 transition-all shadow-md"
              >
                <span>🎨</span>すべてのぬりえを見る（{totalMaterials}点）
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURED PICK (random fade) ===== */}
      <FeaturedPick items={featuredPool} intervalMs={7000} />

      {/* ===== DIFFICULTY (moved up — quick filter) ===== */}
      <section className="py-12 border-t border-border bg-background">
        <div className="max-w-[1280px] mx-auto px-6">
          <SectionHead
            kicker="No. 01"
            title="むずかしさで探す"
            subtitle="お子さまの発達段階に合わせて選べる4段階"
            emoji="⭐"
          />
          <div className="grid md:grid-cols-2 gap-3 md:gap-4">
            {([
              { diff: 1, label: 'かんたん', age: '2歳〜', desc: 'シンプルで大きな線画。はじめてのぬりえに。' },
              { diff: 2, label: 'やさしい', age: '3歳〜', desc: '親しみやすいシーンつき。背景もシンプル。' },
              { diff: 3, label: 'ふつう',   age: '4歳〜', desc: '親子や複数体の構成。発展的に取り組める。' },
              { diff: 4, label: 'わくわく', age: '5歳〜', desc: 'にぎやかな背景・細かな描写。集中して塗れる。' },
            ] as { diff: Difficulty; label: string; age: string; desc: string }[]).map(({ diff, label, age, desc }) => (
              <Link
                key={diff}
                href={`/materials?difficulty=${diff}`}
                className="bg-white border border-border rounded-lg p-5 hover:border-primary transition-all flex items-start gap-4 hover:-translate-y-0.5"
              >
                <div className="font-rounded text-primary text-[26px] font-black leading-none pt-1 shrink-0 w-8">
                  0{diff}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-rounded text-[17px] font-black">{label}</span>
                    <DifficultyBadge level={diff} />
                    <span className="text-[12px] text-muted-foreground">{age}</span>
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== POPULAR MATERIALS ===== */}
      <section className="py-12 border-t border-border">
        <div className="max-w-[1280px] mx-auto px-6">
          <SectionHead
            kicker="No. 02"
            title="人気のぬりえ"
            count={`トップ ${popular.length}`}
            href="/materials?sort=popular"
            subtitle="過去30日でよく印刷されている教材"
            emoji="🌟"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {popular.map(material => (
              <CompactCard key={material.id} material={material} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== THEMES ===== */}
      <section className="py-12 border-t border-border bg-background">
        <div className="max-w-[1280px] mx-auto px-6">
          <SectionHead
            kicker="No. 03"
            title="テーマで探す"
            count={`全${THEMES.length}カテゴリ`}
            subtitle="お子さま・園児が好きなテーマからお選びください"
            emoji="🎨"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {THEMES.map(theme => {
              const sample = getThemeSample(theme.key, theme.sample)
              const count = filterMaterials({ theme: theme.key as Parameters<typeof filterMaterials>[0]['theme'], audience: 'kids' }).length
              return (
                <Link
                  key={theme.key}
                  href={theme.href}
                  className="group bg-white border-2 rounded-2xl overflow-hidden hover:-translate-y-1 transition-all relative shadow-sm hover:shadow-md"
                  style={{ borderColor: theme.color }}
                >
                  {/* Emoji corner badge */}
                  <div className="absolute top-2 left-2 z-10 w-9 h-9 rounded-full flex items-center justify-center text-[20px] shadow-sm border-2 border-white" style={{ background: theme.color }}>
                    {theme.emoji}
                  </div>
                  <div className="aspect-[1.414/1] bg-background flex items-center justify-center overflow-hidden">
                    {sample?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sample.imageUrl} alt={`${theme.label}のぬりえ`} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" />
                    ) : null}
                  </div>
                  <div className="p-3 text-center">
                    <div className="font-rounded text-[16px] font-black mb-0.5" style={{ color: theme.color }}>{theme.label}</div>
                    <div className="text-[12px] text-muted-foreground font-medium">{count}点</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== EDITORIAL QUOTE ===== */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-white to-[#FFF3E0]/40 border-y border-border">
        <div className="max-w-[860px] mx-auto px-6 text-center">
          <div className="flex justify-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#E66A2C]" />
            <span className="w-2 h-2 rounded-full bg-[#4FA7B8]" />
            <span className="w-2 h-2 rounded-full bg-[#E8B838]" />
            <span className="w-2 h-2 rounded-full bg-[#C25A6E]" />
            <span className="w-2 h-2 rounded-full bg-[#7AA875]" />
          </div>
          <p className="font-rounded text-[18px] md:text-[22px] leading-[2] text-foreground font-medium">
            塗り絵は、ただの暇つぶしじゃない。<br />
            子どもが、はじめて自分で「色」を選ぶ時間。<br />
            その時間に、ふさわしい紙を届けたい。
          </p>
          <div className="text-[11px] text-muted-foreground mt-6 tracking-[0.15em]">
            — ぬりえプリント編集部 —
          </div>
        </div>
      </section>

      {/* ===== PILLAR GUIDE ===== */}
      <section className="py-12 border-t border-border">
        <div className="max-w-[1280px] mx-auto px-6">
          <SectionHead
            kicker="No. 04"
            title="読みもの"
            count="ぬりえ完全ガイド"
            href="/columns"
            subtitle="子どもの育ちを支える知識を編集部が整理"
            emoji="📖"
          />
          <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
            <Link
              href={`/columns/${featuredColumn.slug}`}
              className="bg-white border border-border rounded-lg p-6 md:p-8 hover:border-primary transition-all"
            >
              <div className="flex items-center gap-3 mb-3 text-[11px] text-muted-foreground">
                <span className="bg-primary text-white px-2 py-0.5 rounded font-medium">特集</span>
                <span>{featuredColumn.category}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />約{featuredColumn.readingTime}分</span>
              </div>
              <h3 className="font-rounded text-[20px] md:text-[24px] font-black leading-[1.4] mb-3">
                {featuredColumn.title}
              </h3>
              <p className="text-[15px] text-muted-foreground leading-relaxed mb-4">
                {featuredColumn.description}
              </p>
              <span className="text-[14px] text-primary font-medium flex items-center gap-1">
                続きを読む <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
            <aside className="bg-white border border-border rounded-lg p-5">
              <h3 className="font-rounded text-[14px] font-bold mb-3 pb-2 border-b-2 border-primary">
                関連ガイド
              </h3>
              <ul className="space-y-0">
                {columns.slice(1, 9).map(col => (
                  <li key={col.slug} className="border-b border-dashed border-border last:border-0">
                    <Link
                      href={`/columns/${col.slug}`}
                      className="block py-2.5 text-[13px] text-foreground hover:text-primary transition-colors leading-snug"
                    >
                      {col.title.split('【')[0]}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-12 border-t border-border bg-background">
        <div className="max-w-[860px] mx-auto px-6">
          <SectionHead
            kicker="No. 05"
            title="よくある質問"
            subtitle="お問い合わせの多い質問にお答えします"
            emoji="💬"
          />
          <div className="bg-white border border-border rounded-lg">
            {FAQS.map((faq, i) => (
              <div key={i} className={`p-5 md:p-6 ${i < FAQS.length - 1 ? 'border-b border-border' : ''}`}>
                <div className="font-rounded text-[15px] md:text-[17px] font-black mb-2 flex gap-2">
                  <span className="text-primary shrink-0">Q.</span>
                  <span>{faq.q}</span>
                </div>
                <div className="text-[14px] md:text-[15px] text-muted-foreground leading-relaxed flex gap-2 pl-0 md:pl-1">
                  <span className="text-primary font-bold shrink-0">A.</span>
                  <span>{faq.a}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/faq" className="text-[13px] text-accent hover:text-primary transition-colors border-b border-dotted">
              すべての質問を見る →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 md:py-20 border-t border-border bg-gradient-to-b from-background to-[#FFF3E0]/60">
        <div className="max-w-[860px] mx-auto px-6 text-center">
          <div className="font-rounded text-[12px] text-primary tracking-[0.2em] mb-4 font-black inline-flex items-center gap-2">
            <span>💌</span>INVITATION<span>💌</span>
          </div>
          <h2 className="font-rounded text-[28px] md:text-[38px] font-black leading-[1.4] mb-4">
            おやこの時間を、<br />
            すこし、ゆたかに。
          </h2>
          <p className="text-[15px] text-muted-foreground mb-8 leading-relaxed">
            雨の日も、休みの日も、ふと手持ちぶさたな夜も。<br />
            すぐ使えるぬりえが、ここにあります。
          </p>
          <Link
            href="/materials"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-full text-[14px] font-rounded font-black hover:-translate-y-0.5 transition-all shadow-md"
          >
            <span>🎨</span>ぜんぶの教材を見る
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ===== ADULT SECTION CROSS-LINK ===== */}
      <section className="py-12 md:py-16 bg-[#1f1f1f] text-white">
        <div className="max-w-[860px] mx-auto px-6 grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <div className="font-rounded text-[11px] text-white/60 tracking-[0.25em] mb-2">
              — For Adults —
            </div>
            <h3 className="font-rounded text-[20px] md:text-[26px] font-bold mb-2 tracking-[0.02em]">
              おとな・シニア向けの塗り絵もあります。
            </h3>
            <p className="text-[14px] text-white/70 leading-relaxed">
              曼荼羅・植物画・風景・幾何模様。<br className="md:hidden" />
              心を整える、もう一つのぬりえプリント。
            </p>
          </div>
          <Link
            href="/adult"
            className="inline-flex items-center gap-2 bg-white text-[#1f1f1f] px-7 py-3 rounded text-[13px] font-medium hover:bg-white/90 transition-colors whitespace-nowrap"
          >
            おとなのぬりえへ
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  )
}

function SectionHead({
  kicker,
  title,
  count,
  href,
  subtitle,
  emoji,
}: {
  kicker?: string
  title: string
  count?: string
  href?: string
  subtitle?: string
  emoji?: string
}) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex items-end justify-between border-b-2 border-primary/15 pb-3">
        <div>
          {kicker && (
            <div className="font-rounded font-bold text-[11px] text-primary mb-1 tracking-[0.1em]">
              {kicker}
            </div>
          )}
          <div className="flex items-baseline gap-2.5">
            {emoji && <span className="text-[22px] md:text-[26px] leading-none">{emoji}</span>}
            <h2 className="font-rounded text-[22px] md:text-[28px] font-black">{title}</h2>
            {count && <span className="text-[11px] text-primary font-bold ml-1">{count}</span>}
          </div>
        </div>
        {href && (
          <Link href={href} className="text-[12px] text-accent hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap font-medium">
            すべて見る<ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      {subtitle && <p className="text-[14px] text-muted-foreground mt-2 leading-relaxed">{subtitle}</p>}
    </div>
  )
}

function KidsHeroDecor() {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      {/* Subtle paper texture base via gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFF1D6]/40 via-[#FFF8EC] to-[#FFF8EC]" />

      {/* Decorative SVG: crayons, dots, swirls */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1280 600"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Crayon 1 — left */}
        <g transform="translate(80,120) rotate(-22)">
          <rect x="0" y="0" width="14" height="80" rx="2" fill="#E66A2C" />
          <polygon points="0,0 7,-12 14,0" fill="#E66A2C" />
          <rect x="2" y="60" width="10" height="3" fill="#fff" opacity="0.4" />
        </g>
        {/* Crayon 2 — right */}
        <g transform="translate(1170,80) rotate(18)">
          <rect x="0" y="0" width="14" height="80" rx="2" fill="#4FA7B8" />
          <polygon points="0,0 7,-12 14,0" fill="#4FA7B8" />
          <rect x="2" y="60" width="10" height="3" fill="#fff" opacity="0.4" />
        </g>
        {/* Crayon 3 — bottom left */}
        <g transform="translate(120,440) rotate(35)">
          <rect x="0" y="0" width="14" height="80" rx="2" fill="#E8B838" />
          <polygon points="0,0 7,-12 14,0" fill="#E8B838" />
          <rect x="2" y="60" width="10" height="3" fill="#fff" opacity="0.4" />
        </g>
        {/* Crayon 4 — bottom right */}
        <g transform="translate(1130,440) rotate(-25)">
          <rect x="0" y="0" width="14" height="80" rx="2" fill="#C25A6E" />
          <polygon points="0,0 7,-12 14,0" fill="#C25A6E" />
          <rect x="2" y="60" width="10" height="3" fill="#fff" opacity="0.4" />
        </g>

        {/* Color drops */}
        <circle cx="220" cy="80"   r="6"   fill="#E66A2C" opacity="0.6" />
        <circle cx="1050" cy="200" r="9"   fill="#4FA7B8" opacity="0.5" />
        <circle cx="180" cy="320"  r="5"   fill="#E8B838" opacity="0.6" />
        <circle cx="1080" cy="400" r="7"   fill="#C25A6E" opacity="0.5" />
        <circle cx="320" cy="520"  r="6"   fill="#7AA875" opacity="0.55" />
        <circle cx="960" cy="520"  r="5"   fill="#E66A2C" opacity="0.5" />
        <circle cx="60"  cy="240"  r="4"   fill="#4FA7B8" opacity="0.5" />
        <circle cx="1220" cy="280" r="4"   fill="#E8B838" opacity="0.55" />

        {/* Scribbles (hand-drawn swirls) */}
        <path d="M 250 150 Q 280 140 300 160 T 340 150" stroke="#E66A2C" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.35" />
        <path d="M 940 130 Q 970 120 990 140 T 1030 130" stroke="#4FA7B8" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.35" />
        <path d="M 300 470 Q 320 460 340 470 T 380 460" stroke="#C25A6E" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.3" />

        {/* Stars */}
        <g transform="translate(380,90)">
          <path d="M 0 -10 L 3 -3 L 10 -3 L 4 2 L 6 9 L 0 5 L -6 9 L -4 2 L -10 -3 L -3 -3 Z" fill="#E8B838" opacity="0.7" />
        </g>
        <g transform="translate(900,500) scale(0.8)">
          <path d="M 0 -10 L 3 -3 L 10 -3 L 4 2 L 6 9 L 0 5 L -6 9 L -4 2 L -10 -3 L -3 -3 Z" fill="#E66A2C" opacity="0.55" />
        </g>
        <g transform="translate(1000,90) scale(0.7)">
          <path d="M 0 -10 L 3 -3 L 10 -3 L 4 2 L 6 9 L 0 5 L -6 9 L -4 2 L -10 -3 L -3 -3 Z" fill="#4FA7B8" opacity="0.6" />
        </g>

        {/* Hearts */}
        <path d="M 480 540 c -4 -8 -16 -8 -16 2 c 0 8 16 18 16 18 s 16 -10 16 -18 c 0 -10 -12 -10 -16 -2 z" fill="#C25A6E" opacity="0.45" />
        <path d="M 800 60 c -4 -8 -16 -8 -16 2 c 0 8 16 18 16 18 s 16 -10 16 -18 c 0 -10 -12 -10 -16 -2 z" fill="#E66A2C" opacity="0.4" />
      </svg>
    </div>
  )
}

function CompactCard({ material }: { material: ReturnType<typeof getPopularMaterials>[number] }) {
  return (
    <Link
      href={`/materials/${material.id}`}
      className="group bg-white border border-border rounded-lg overflow-hidden hover:border-primary transition-all hover:-translate-y-0.5"
    >
      <div className="aspect-[1.414/1] bg-background flex items-center justify-center overflow-hidden">
        {material.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={material.imageUrl} alt={material.title} className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform" />
        ) : null}
      </div>
      <div className="p-2.5">
        <h3 className="font-rounded text-[13px] font-black mb-1 line-clamp-1">
          {material.title.split('（')[0]}
        </h3>
        <div className="text-[12px] text-muted-foreground flex gap-1.5 items-center">
          {material.ageMin && <span>{material.ageMin}-{material.ageMax}歳</span>}
          {material.difficulty && <span className="text-primary/70">·</span>}
          {material.difficulty && <span>難{material.difficulty}</span>}
        </div>
        {material.description && (
          <div className="text-[12px] text-primary mt-1.5 pt-1.5 border-t border-border/60 line-clamp-1">
            {material.description.slice(0, 28).replace(/[。、]+$/, '')}
          </div>
        )}
      </div>
    </Link>
  )
}
