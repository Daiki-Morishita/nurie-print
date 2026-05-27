'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Footer({ materialCount = 555 }: { materialCount?: number }) {
  const currentYear = new Date().getFullYear()
  const pathname = usePathname() ?? ''
  const isAdult = pathname.startsWith('/adult')
  const brandFont = isAdult ? 'font-mincho' : 'font-rounded'

  return (
    <footer className={`border-t border-border mt-20 ${isAdult ? 'adult-section bg-[#F3EFE6]' : 'bg-white'}`}>
      {/* Editorial mark */}
      <div className="max-w-[1280px] mx-auto px-6 pt-16 pb-12">
        <div className="text-center mb-12">
          <div className="font-mincho text-[12px] text-muted-foreground tracking-[0.2em] mb-2">
            {isAdult ? '— A QUIET HOUR —' : '— EDITORIAL —'}
          </div>
          <p className={`${isAdult ? 'font-mincho' : 'font-rounded'} text-[18px] text-foreground leading-loose max-w-xl mx-auto`}>
            {isAdult ? (
              <>一筆ずつ、色を選ぶ。<br />それは、自分の機嫌をとる時間。</>
            ) : (
              <>塗り絵は、ただの暇つぶしじゃない。<br />子どもが、はじめて自分で「色」を選ぶ時間。</>
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pt-8 border-t border-border">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            {isAdult ? (
              <div className="font-mincho text-[22px] font-black tracking-[0.04em] mb-4">
                おとなの<span className="text-primary">ぬりえ</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center gap-0.5" aria-hidden>
                  <span className="w-2 h-2 rounded-full bg-[#E66A2C]" />
                  <span className="w-2 h-2 rounded-full bg-[#4FA7B8]" />
                  <span className="w-2 h-2 rounded-full bg-[#E8B838]" />
                </span>
                <span className={`${brandFont} text-[22px] font-black tracking-[0.03em]`}>
                  ぬりえ<span className="text-primary">プリント</span>
                </span>
              </div>
            )}
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
              おやこの時間にぴったりのぬりえを、<br className="hidden md:inline" />
              年齢・テーマで簡単に見つけて印刷できる<br className="hidden md:inline" />
              無料配布サービス。{materialCount} 点を会員登録なしで提供しています。
            </p>
            <div className="text-[11px] text-muted-foreground space-y-1">
              <p>運営：ぬりえプリント編集部</p>
              <p>更新頻度：毎日</p>
            </div>
          </div>

          {/* Themes */}
          <div>
            <h3 className="font-rounded text-[13px] font-black mb-3 pb-2 border-b border-border">テーマ</h3>
            <ul className="space-y-2 text-[12px] text-muted-foreground">
              <li><Link href="/category/theme/animals" className="hover:text-primary transition-colors">動物のぬりえ</Link></li>
              <li><Link href="/category/theme/dinosaurs" className="hover:text-primary transition-colors">恐竜のぬりえ</Link></li>
              <li><Link href="/category/theme/vehicles" className="hover:text-primary transition-colors">乗り物のぬりえ</Link></li>
              <li><Link href="/category/theme/sea" className="hover:text-primary transition-colors">海の生き物</Link></li>
              <li><Link href="/category/theme/insects" className="hover:text-primary transition-colors">虫のぬりえ</Link></li>
              <li><Link href="/category/theme/fruits" className="hover:text-primary transition-colors">食べ物のぬりえ</Link></li>
              <li><Link href="/maze" className="hover:text-primary transition-colors">めいろプリント</Link></li>
            </ul>
          </div>

          {/* Age */}
          <div>
            <h3 className="font-rounded text-[13px] font-black mb-3 pb-2 border-b border-border">年齢</h3>
            <ul className="space-y-2 text-[12px] text-muted-foreground">
              <li><Link href="/category/age/2" className="hover:text-primary transition-colors">2歳のぬりえ</Link></li>
              <li><Link href="/category/age/3" className="hover:text-primary transition-colors">3歳のぬりえ</Link></li>
              <li><Link href="/category/age/4" className="hover:text-primary transition-colors">4歳のぬりえ</Link></li>
              <li><Link href="/category/age/5" className="hover:text-primary transition-colors">5歳のぬりえ</Link></li>
              <li><Link href="/category/age/6" className="hover:text-primary transition-colors">6歳のぬりえ</Link></li>
            </ul>
          </div>

          {/* Editorial */}
          <div>
            <h3 className="font-rounded text-[13px] font-black mb-3 pb-2 border-b border-border">読みもの</h3>
            <ul className="space-y-2 text-[12px] text-muted-foreground">
              <li><Link href="/columns/benefits-of-coloring-for-kids" className="hover:text-primary transition-colors">ぬりえの発達効果</Link></li>
              <li><Link href="/columns/coloring-for-2-year-olds" className="hover:text-primary transition-colors">2歳からのぬりえ</Link></li>
              <li><Link href="/columns" className="hover:text-primary transition-colors">すべての記事</Link></li>
              <li className="pt-2"><Link href="/faq" className="hover:text-primary transition-colors">よくある質問</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">お問い合わせ</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-border">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] text-muted-foreground mb-4">
            <Link href="/about" className="hover:text-primary transition-colors">このサイトについて</Link>
            <Link href="/operator" className="hover:text-primary transition-colors">運営事業所</Link>
            <Link href="/editorial-policy" className="hover:text-primary transition-colors">編集方針</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">利用規約</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">プライバシーポリシー</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">お問い合わせ</Link>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] text-muted-foreground">
            <p>© {currentYear} ぬりえプリント編集部</p>
            <p>教材はご家庭・教育目的での使用に限り無料です</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
