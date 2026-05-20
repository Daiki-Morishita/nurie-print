'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X, Search, User, LogOut, Heart, LogIn, UserPlus } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useFavorites } from '@/components/favorites/FavoritesProvider'

type NavItem = { href: string; label: string; isNew?: boolean }

const KIDS_NAV: NavItem[] = [
  { href: '/category/theme/animals', label: '動物' },
  { href: '/category/theme/dinosaurs', label: '恐竜' },
  { href: '/category/theme/vehicles', label: '乗り物' },
  { href: '/category/theme/sea', label: '海' },
  { href: '/category/theme/insects', label: '虫', isNew: true },
  { href: '/category/theme/fruits', label: '食べ物', isNew: true },
  { href: '/category/age/3', label: '年齢で探す' },
  { href: '/materials?difficulty=1', label: '難易度で探す' },
  { href: '/columns', label: '読みもの' },
  { href: '/faq', label: 'FAQ' },
]

const ADULT_NAV: NavItem[] = [
  { href: '/adult/category/theme/mandala', label: '曼荼羅' },
  { href: '/adult/category/theme/botanical', label: '植物画' },
  { href: '/adult/category/theme/landscape', label: '風景' },
  { href: '/adult/category/theme/pattern', label: '幾何模様' },
  { href: '/adult/category/theme/animals-detail', label: '動物（細密）' },
  { href: '/adult/category/theme/flowers-detail', label: '花（細密）' },
  { href: '/adult/materials', label: 'すべて見る' },
]

export function Header({ materialCount = 555 }: { materialCount?: number }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const { data: session } = useSession()
  const { count: favCount, limit: favLimit } = useFavorites()
  const pathname = usePathname() ?? ''
  const isAdult = pathname.startsWith('/adult')
  const isAdmin = pathname.startsWith('/admin')
  const nav = isAdult ? ADULT_NAV : KIDS_NAV
  const searchAction = isAdult ? '/adult/materials' : '/materials'

  // 管理画面ではグローバルヘッダーを表示しない（操作エリアの固定を妨げるため）
  if (isAdmin) return null

  return (
    <div className={`print:hidden ${isAdult ? 'adult-section' : ''}`}>
      {/* Audience switcher — prominent tab bar */}
      <div className={`${isAdult ? 'bg-[#1E2A28]' : 'bg-[#2A2620]'} text-white`}>
        <div className="max-w-[1280px] mx-auto px-3 sm:px-6">
          <div className="flex items-stretch justify-between gap-2 h-12 sm:h-14">
            {/* Audience tabs */}
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

            {/* Utility links (desktop) */}
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
            {/* Logo */}
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

            {/* Search bar (desktop) */}
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

            {/* Meta count (desktop): favorites for logged-in, material count otherwise */}
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
                  {isAdult ? '近日' : materialCount}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">{isAdult ? '公開予定' : '点の教材'}</div>
              </div>
            </div>

            {/* Mobile actions */}
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
        <nav className="hidden md:block border-t border-border bg-background">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="flex items-center gap-7 h-10 text-[13px] overflow-x-auto">
              {nav.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-foreground/80 hover:text-primary transition-colors whitespace-nowrap font-medium flex items-center gap-1.5"
                >
                  {item.label}
                  {item.isNew && (
                    <span className="bg-primary text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-wide">NEW</span>
                  )}
                </Link>
              ))}
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
              <div className="grid grid-cols-2 gap-x-2 gap-y-0">
                {nav.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="py-2.5 text-sm border-b border-border/50 flex items-center gap-1.5"
                  >
                    {item.label}
                    {item.isNew && <span className="bg-primary text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">NEW</span>}
                  </Link>
                ))}
              </div>
              {session ? (
                <Link href="/account" className="block mt-3 py-2 text-sm flex items-center gap-1.5" onClick={() => setMobileOpen(false)}>
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

// Crayon icon — tilted with point and label band
function CrayonIcon({ active }: { active: boolean }) {
  const body = active ? '#E66A2C' : '#9CA3AF'
  const tip = active ? '#332C24' : '#6B7280'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <g transform="rotate(-30 12 12)">
        {/* body */}
        <rect x="8" y="6" width="8" height="14" rx="1.2" fill={body} />
        {/* paper label band */}
        <rect x="8" y="10" width="8" height="2" fill="#fff" opacity="0.45" />
        <rect x="8" y="13.5" width="8" height="1" fill="#fff" opacity="0.3" />
        {/* tip */}
        <polygon points="8,6 12,1.5 16,6" fill={tip} />
        {/* tip highlight */}
        <polygon points="11,5 12,3 13,5" fill="#fff" opacity="0.6" />
      </g>
    </svg>
  )
}

// Brush icon — fountain pen / sumi brush silhouette
function BrushIcon({ active }: { active: boolean }) {
  const handle = active ? '#1E2A28' : '#9CA3AF'
  const bristle = active ? '#2D5043' : '#6B7280'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <g transform="rotate(35 12 12)">
        {/* handle */}
        <rect x="11" y="2" width="2" height="13" rx="0.6" fill={handle} />
        {/* ferrule */}
        <rect x="10.2" y="14" width="3.6" height="1.8" rx="0.4" fill="#C9A66B" />
        {/* bristle tuft */}
        <path d="M 10.2 15.6 Q 12 22 13.8 15.6 Z" fill={bristle} />
        {/* ink tip */}
        <circle cx="12" cy="21.2" r="0.7" fill={bristle} />
      </g>
    </svg>
  )
}
