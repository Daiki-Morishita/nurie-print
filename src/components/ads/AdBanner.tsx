'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

const PUB_ID = 'ca-pub-4355731853778451'

interface AdBannerProps {
  slot: string
  format?: 'auto' | 'horizontal' | 'rectangle'
  className?: string
}

/**
 * AdSense インコンテンツ広告ユニット
 *
 * slot: AdSenseダッシュボードで取得した data-ad-slot 値（10桁数字）
 * NEXT_PUBLIC_ADSENSE_SLOT_CONTENT などの環境変数で外部から渡すこと
 *
 * 使用例:
 *   <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT ?? ''} />
 *
 * 承認前・slot未設定時は何も表示しない（レイアウトへの影響なし）
 */
export function AdBanner({ slot, format = 'auto', className }: AdBannerProps) {
  const ref = useRef<HTMLModElement>(null)

  useEffect(() => {
    if (!slot) return
    try {
      window.adsbygoogle = window.adsbygoogle || []
      window.adsbygoogle.push({})
    } catch {
      // AdSense未ロード時は無視
    }
  }, [slot])

  if (!slot) return null

  return (
    <div className={className}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={PUB_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
