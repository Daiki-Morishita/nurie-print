import type { Metadata } from 'next'
import Script from 'next/script'
import { Noto_Sans_JP, Zen_Old_Mincho, M_PLUS_Rounded_1c } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Providers } from '@/components/Providers'
import { getMaterialsForAudience } from '@/lib/data'

const GA_ID = 'G-DZ7JFS2RS3'

// font preload は全部 false: 日本語グリフを使ってないのに 200+ファイル preload してた問題対策
const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  preload: false,
  variable: '--font-noto-sans-jp',
})

const zenOldMincho = Zen_Old_Mincho({
  subsets: ['latin'],
  weight: ['700', '900'],
  display: 'swap',
  preload: false,
  variable: '--font-zen-mincho',
})

const mPlusRounded = M_PLUS_Rounded_1c({
  subsets: ['latin'],
  weight: ['700', '900'],
  display: 'swap',
  preload: false,
  variable: '--font-mplus-rounded',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://nurie-print.com'),
  title: {
    default: 'ぬりえプリント | 保育士のための無料教材プリント',
    template: '%s | ぬりえプリント',
  },
  description: '保育園・幼稚園の先生向け無料ぬりえプリント配布サイト。動物・恐竜・乗り物など年齢別・テーマ別・季節別に検索でき、すぐに印刷して使えます。',
  keywords: ['ぬりえ', '塗り絵', '保育園', '幼稚園', '無料プリント', '保育士', '教材', '幼児'],
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://nurie-print.com',
    siteName: 'ぬりえプリント',
    title: 'ぬりえプリント | 保育士のための無料教材プリント',
    description: '保育園・幼稚園の先生向け無料ぬりえプリント配布サイト。動物・恐竜・乗り物など豊富なテーマをすぐ印刷できます。',
    images: [{ url: '/og-image.svg', width: 1200, height: 630, alt: 'ぬりえプリント' }],
  },
  robots: { index: true, follow: true },
  twitter: {
    card: 'summary_large_image',
    site: '@nurie_print',
    title: 'ぬりえプリント | 保育士のための無料教材プリント',
    description: '保育園・幼稚園の先生向け無料ぬりえプリント配布サイト。動物・恐竜・乗り物など豊富なテーマをすぐ印刷できます。',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} ${zenOldMincho.variable} ${mPlusRounded.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background font-[var(--font-noto-sans-jp),sans-serif]">
        {/* Google Analytics 4 */}
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
        {/* Google AdSense — 広告ユニットスロットが設定されているときだけロード（中間状態を避ける）。
            審査通過 + ad unit作成 → NEXT_PUBLIC_ADSENSE_ENABLED=1 をVercel env varsに設定 */}
        {process.env.NEXT_PUBLIC_ADSENSE_ENABLED === '1' && (
          <Script
            id="adsense"
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4355731853778451"
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}
        {/* Microsoft Clarity — lazyOnload で INP負荷を抑える */}
        <Script id="ms-clarity" strategy="lazyOnload">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "wuyjgxh5hx");
          `}
        </Script>
        <Providers>
          <Header kidsCount={getMaterialsForAudience('kids').length} adultCount={getMaterialsForAudience('adult').length} />
          <main className="flex-1">{children}</main>
          <Footer materialCount={getMaterialsForAudience('kids').length} />
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  )
}
