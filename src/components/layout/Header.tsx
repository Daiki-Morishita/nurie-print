'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X, Search, User, LogOut, Heart, LogIn, UserPlus, ChevronDown } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useFavorites } from '@/components/favorites/FavoritesProvider'
import { THEME_LABELS } from '@/lib/types'
import type { Theme } from '@/lib/types'

type NavItem = { href: string; label: string; isNew?: boolean }

const ADULT_NAV: NavItem[] = [
  { href: '/adult/category/theme/mandala', label: '曼荼羅' },
  { href: '/adult/category/theme/botanical', label: '植物画' },
  { href: '/adult/category/theme/landscape', label: '風景' },
  { href: '/adult/category/theme/pattern', label: '幾何模様' },
  { href: '/adult/category/theme/animals-detail', label: '動物（細密）' },
  { href: '/adult/category/theme/flowers-detail', label: '花（細密）' },
  { href: '/adult/materials', label: 'すべて見る' },
]

const KIDS_AGES: number[] = [2, 3, 4, 5, 6]

// 子どもが好きそうな順（左上ほど人気）。ここに無いテーマは末尾に件数順で続く
const THEME_PRIORITY: string[] = [
  'animals', 'dinosaurs', 'vehicles', 'densha', 'shinkansen', 'sea',
  'insects', 'fruits', 'sweets', 'fairytale', 'yokai', 'park',
  'vegetables', 'flowers', 'sports', 'nature', 'seasonal-events', 'gotochi',
]
// テーマごとの絵文字（ドロップダウンのリッチ化用）
const THEME_EMOJI: Record<string, string> = {
  animals: '🐾', dinosaurs: '🦕', vehicles: '🚒', densha: '🚃', shinkansen: '🚄',
  sea: '🐟', insects: '🐛', fruits: '🍎', sweets: '🍰', fairytale: '📖',
  yokai: '👹', park: '🌳', vegetables: '🥕', flowers: '🌸', sports: '⚽',
  nature: '🌈', 'seasonal-events': '🎏', gotochi: '🗾',
}

type ThemeEntry = { value: string; label: string; count: number; emoji: string }

export function Header({
  kidsCount = 555,
  adultCount = 0,
  kidsThemeCounts = {},
  kidsAgeCounts = {},
}: {
  kidsCount?: number
  adultCount?: number
  kidsThemeCounts?: Record<string, number>
  kidsAgeCounts?: Record<string, number> | Record<number, number>
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const { data: session } = useSession()
  const { count: favCount, limit: favLimit } = useFavorites()
  const pathname = usePathname() ?? ''
  const isAdult = pathname.startsWith('/adult')
  const isAdmin = pathname.startsWith('/admin')
  const searchAction = isAdult ? '/adult/materials' : '/materials'
  const materialCount = isAdult ? adultCount : kidsCount

  const themeEntries: ThemeEntry[] = Object.entries(kidsThemeCounts)
    .filter(([, count]) => count > 0)
    .map(([value, count]) => ({
      value,
      label: THEME_LABELS[value as Theme] ?? value,
      count,
      emoji: THEME_EMOJI[value] ?? '🎨',
    }))
    .sort((a, b) => {
      // 子ども人気順を優先。両方リストにあれば順位、無いものは件数で末尾へ
      const pa = THEME_PRIORITY.indexOf(a.value)
      const pb = THEME_PRIORITY.indexOf(b.value)
      if (pa !== -1 && pb !== -1) return pa - pb
      if (pa !== -1) return -1
      if (pb !== -1) return 1
      return b.count - a.count
    })

  const ageEntries = KIDS_AGES.map(age => ({
    age,
    count: (kidsAgeCounts as Record<string, number>)[String(age)] ?? (kidsAgeCounts as Record<number, number>)[age] ?? 0,
  }))

  if (isAdmin) return null

  return (
    <div className={`print:hidden ${isAdult ? 'adult-section' : ''}`}>
      {/* Audience switcher */}
      <div className={`${isAdult ? 'bg-[#1E2A28]' : 'bg-[#2A2620]'} text-white`}>
        <div className="max-w-[1280px] mx-auto px-3 sm:px-6">
          <div className="flex items-stretch justify-between gap-2 h-12 sm:h-14">
            <div className="flex items-stretch gap-1">
              <Link
                href="/"
                className={`group flex items-center gap-2 px-4 sm:px-6 rounded-t-lg transition-all ${
                  !isAdult
                    ? 'bg-[#FFF8EC] text-[#332C24] -mb-px border-b-2 border-[#FFF8EC]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <CrayonIcon active={!isAdult} />
                <div className="flex flex-col items-start leading-tight py-1">
                  <span className={`text-[10px] tracking-wider ${!isAdult ? 'text-[#E66A2C]' : 'text-white/40'}`}>FOR KIDS</span>
                  <span className={`text-[13px] sm:text-[14px] font-bold ${!isAdult ? 'font-rounded' : ''}`}>こども向け</span>
                </div>
              </Link>
              <Link
                href="/adult"
                className={`group flex items-center gap-2 px-4 sm:px-6 rounded-t-lg transition-all ${
                  isAdult
                    ? 'bg-[#F3EFE6] text-[#1E2A28] -mb-px border-b-2 border-[#F3EFE6]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <BrushIcon active={isAdult} />
                <div className="flex flex-col items-start leading-tight py-1">
                  <span className={`text-[10px] tracking-wider ${isAdult ? 'text-[#2D5043]' : 'text-white/40'}`}>FOR ADULTS</span>
                  <span className={`text-[13px] sm:text-[14px] font-bold ${isAdult ? 'font-mincho' : ''}`}>おとな向け</span>
                </div>
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-1 text-[13px]">
              {session ? (
                <>
                  <Link
                    href="/favorites"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white/85 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Heart className={`w-3.5 h-3.5 ${favCount > 0 ? 'fill-[#E66A2C] text-[#E66A2C]' : ''}`} />
                    <span className="font-medium">お気に入り</span>
                    <span className="text-[11px] text-white/55 ml-0.5">{favCount}/{favLimit}</span>
                  </Link>
                  <Link
                    href="/account"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white/85 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="font-medium">マイページ</span>
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white/85 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="font-medium">ログアウト</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white/85 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span className="font-medium">ログイン</span>
                  </Link>
                  <Link
                    href="/login?tab=register"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors font-medium"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    新規登録
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[220px_1fr_220px] gap-3 md:gap-8 items-center h-16 md:h-20">
            {isAdult ? (
              <Link href="/adult" className="flex items-baseline gap-0 group">
                <span className="font-mincho text-[22px] md:text-[26px] font-black tracking-[0.04em] text-foreground group-hover:text-primary transition-colors">
                  おとなの
                </span>
                <span className="font-mincho text-[22px] md:text-[26px] font-black tracking-[0.04em] text-primary">
                  ぬりえ
                </span>
              </Link>
            ) : (
              <Link href="/" className="flex items-center gap-1.5 md:gap-2 group">
                <span className="flex items-center gap-0.5" aria-hidden>
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#E66A2C]" />
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#4FA7B8]" />
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#E8B838]" />
                </span>
                <span className="font-rounded text-[20px] md:text-[24px] font-black tracking-[0.03em] text-foreground leading-none group-hover:text-primary transition-colors">
                  ぬりえ<span className="text-primary">プリント</span>
                </span>
              </Link>
            )}

            <form action={searchAction} method="get" className={`hidden md:flex border-[2px] border-foreground overflow-hidden bg-card shadow-sm ${isAdult ? 'rounded' : 'rounded-full'}`}>
              <input
                name="search"
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={isAdult ? 'テーマで検索（曼荼羅・薔薇・風景…）' : 'ぬりえを検索（例: きりん、2歳、ひな祭り）'}
                className={`flex-1 py-2.5 text-sm outline-none bg-transparent ${isAdult ? 'px-4' : 'pl-5 pr-3'}`}
              />
              <button type="submit" className={`${isAdult ? 'bg-foreground text-background font-medium' : 'bg-primary text-white font-rounded font-black'} px-6 text-sm hover:opacity-90 transition-all flex items-center gap-1.5`}>
                <Search className="w-3.5 h-3.5" />
                さがす
              </button>
            </form>

            <div className="hidden md:flex items-center justify-end gap-4">
              {session && !isAdult && (
                <Link
                  href="/favorites"
                  className="inline-flex items-center gap-1.5 bg-white border-2 border-primary text-primary px-3.5 py-1.5 rounded-full text-[13px] font-rounded font-black hover:bg-primary hover:text-white transition-colors"
                  aria-label="お気に入り"
                >
                  <Heart className={`w-3.5 h-3.5 ${favCount > 0 ? 'fill-current' : ''}`} />
                  {favCount}/{favLimit}
                </Link>
              )}
              <div className="text-right">
                <div className={`${isAdult ? 'font-mincho' : 'font-rounded'} text-[24px] font-black text-primary leading-none`}>
                  {materialCount}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">点の教材</div>
              </div>
            </div>

            <div className="md:hidden flex items-center gap-1 justify-self-end">
              {session && !isAdult && (
                <Link href="/favorites" aria-label="お気に入り" className="relative p-2 hover:bg-muted rounded transition-colors">
                  <Heart className={`w-5 h-5 ${favCount > 0 ? 'fill-primary text-primary' : ''}`} />
                  {favCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {favCount}
                    </span>
                  )}
                </Link>
              )}
              <Link href="/materials" aria-label="検索" className="p-2 hover:bg-muted rounded transition-colors">
                <Search className="w-5 h-5" />
              </Link>
              <button
                className="p-2 hover:bg-muted rounded transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="メニュー"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Category nav (desktop) */}
        <nav className="hidden md:block border-t border-border bg-background relative">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="flex items-center gap-7 h-10 text-[13px]">
              {isAdult ? (
                ADULT_NAV.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-foreground/80 hover:text-primary transition-colors whitespace-nowrap font-medium flex items-center gap-1.5"
                  >
                    {item.label}
                  </Link>
                ))
              ) : (
                <>
                  <ThemeDropdown themeEntries={themeEntries} />
                  <AgeDropdown ageEntries={ageEntries} />
                  <Link href="/posts" className="text-foreground/80 hover:text-primary transition-colors whitespace-nowrap font-medium flex items-center gap-1.5">
                    今日のいちまい
                    <span className="bg-primary text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-wide">NEW</span>
                  </Link>
                  <Link href="/columns" className="text-foreground/80 hover:text-primary transition-colors whitespace-nowrap font-medium">
                    読みもの
                  </Link>
                  <Link href="/materials" className="text-foreground/80 hover:text-primary transition-colors whitespace-nowrap font-medium">
                    すべての塗り絵
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-4 py-3">
              <form action={searchAction} method="get" className="flex border-[1.5px] border-foreground rounded overflow-hidden bg-card mb-3">
                <input
                  name="search"
                  type="text"
                  placeholder={isAdult ? 'テーマで検索' : 'ぬりえを検索'}
                  className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
                />
                <button type="submit" className="bg-foreground text-background px-4 text-sm font-medium">
                  さがす
                </button>
              </form>
              {isAdult ? (
                <div className="grid grid-cols-2 gap-x-2 gap-y-0">
                  {ADULT_NAV.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="py-2.5 text-sm border-b border-border/50"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  <MobileAccordion title="年齢で探す">
                    <div className="grid grid-cols-3 gap-2 py-2">
                      {ageEntries.map(({ age, count }) => (
                        <Link
                          key={age}
                          href={`/category/age/${age}`}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-between px-3 py-2 text-sm bg-muted rounded hover:bg-primary hover:text-white transition-colors"
                        >
                          <span>{age}歳</span>
                          <span className="text-[11px] opacity-70">{count}</span>
                        </Link>
                      ))}
                    </div>
                  </MobileAccordion>
                  <MobileAccordion title="テーマで探す">
                    <div className="grid grid-cols-2 gap-1.5 py-2">
                      {themeEntries.map(t => (
                        <Link
                          key={t.value}
                          href={`/category/theme/${t.value}`}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-between px-3 py-2 text-sm bg-muted rounded hover:bg-primary hover:text-white transition-colors"
                        >
                          <span className="truncate">{t.label}</span>
                          <span className="text-[11px] opacity-70 ml-2">{t.count}</span>
                        </Link>
                      ))}
                    </div>
                  </MobileAccordion>
                  <Link
                    href="/posts"
                    onClick={() => setMobileOpen(false)}
                    className="py-2.5 text-sm border-b border-border/50 flex items-center gap-1.5"
                  >
                    今日のいちまい
                    <span className="bg-primary text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">NEW</span>
                  </Link>
                  <Link
                    href="/columns"
                    onClick={() => setMobileOpen(false)}
                    className="block py-2.5 text-sm border-b border-border/50"
                  >
                    読みもの
                  </Link>
                  <Link
                    href="/materials"
                    onClick={() => setMobileOpen(false)}
                    className="block py-2.5 text-sm border-b border-border/50"
                  >
                    すべての塗り絵
                  </Link>
                </div>
              )}
              {session ? (
                <Link href="/account" className="mt-3 py-2 text-sm flex items-center gap-1.5" onClick={() => setMobileOpen(false)}>
                  <User className="w-4 h-4" />マイページ
                </Link>
              ) : (
                <Link href="/login" className="block mt-3 py-2 text-sm" onClick={() => setMobileOpen(false)}>
                  ログイン
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  )
}

const AGE_EMOJI: Record<number, string> = { 2: '🐣', 3: '🧒', 4: '🎨', 5: '✏️', 6: '🎒' }

function AgeDropdown({ ageEntries }: { ageEntries: { age: number; count: number }[] }) {
  return (
    <Dropdown label="年齢で探す">
      <div className="p-3 grid grid-cols-3 gap-2 min-w-[340px]">
        {ageEntries.map(({ age, count }) => (
          <Link
            key={age}
            href={`/category/age/${age}`}
            className="group flex flex-col items-center gap-1 px-3 py-3 rounded-xl border border-transparent hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <span className="text-[22px] leading-none group-hover:scale-110 transition-transform">{AGE_EMOJI[age] ?? '🎨'}</span>
            <span className="font-rounded font-black text-[14px] text-foreground">{age}歳</span>
            <span className="text-[11px] text-muted-foreground">{count}点</span>
          </Link>
        ))}
      </div>
    </Dropdown>
  )
}

function ThemeDropdown({ themeEntries }: { themeEntries: ThemeEntry[] }) {
  return (
    <Dropdown label="テーマで探す">
      <div className="p-3 grid grid-cols-3 gap-1.5 min-w-[540px] max-w-[640px] max-h-[64vh] overflow-y-auto">
        {themeEntries.map(t => (
          <Link
            key={t.value}
            href={`/category/theme/${t.value}`}
            className="group flex items-center gap-2.5 px-2.5 py-2 rounded-xl border border-transparent hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <span className="w-9 h-9 shrink-0 rounded-full bg-muted group-hover:bg-white flex items-center justify-center text-[18px] leading-none transition-colors">
              {t.emoji}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-rounded font-bold text-[13px] text-foreground truncate">{t.label}</span>
              <span className="block text-[10px] text-muted-foreground">{t.count}点</span>
            </span>
          </Link>
        ))}
      </div>
    </Dropdown>
  )
}

function Dropdown({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1 text-foreground/80 hover:text-primary transition-colors whitespace-nowrap font-medium"
      >
        {label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-0 bg-white border border-border rounded-lg shadow-lg z-40"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

function MobileAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border/50">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full py-2.5 flex items-center justify-between text-sm font-medium"
      >
        <span>{title}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}

function CrayonIcon({ active }: { active: boolean }) {
  const body = active ? '#E66A2C' : '#9CA3AF'
  const tip = active ? '#332C24' : '#6B7280'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <g transform="rotate(-30 12 12)">
        <rect x="8" y="6" width="8" height="14" rx="1.2" fill={body} />
        <rect x="8" y="10" width="8" height="2" fill="#fff" opacity="0.45" />
        <rect x="8" y="13.5" width="8" height="1" fill="#fff" opacity="0.3" />
        <polygon points="8,6 12,1.5 16,6" fill={tip} />
        <polygon points="11,5 12,3 13,5" fill="#fff" opacity="0.6" />
      </g>
    </svg>
  )
}

function BrushIcon({ active }: { active: boolean }) {
  const handle = active ? '#1E2A28' : '#9CA3AF'
  const bristle = active ? '#2D5043' : '#6B7280'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <g transform="rotate(35 12 12)">
        <rect x="11" y="2" width="2" height="13" rx="0.6" fill={handle} />
        <rect x="10.2" y="14" width="3.6" height="1.8" rx="0.4" fill="#C9A66B" />
        <path d="M 10.2 15.6 Q 12 22 13.8 15.6 Z" fill={bristle} />
        <circle cx="12" cy="21.2" r="0.7" fill={bristle} />
      </g>
    </svg>
  )
}
