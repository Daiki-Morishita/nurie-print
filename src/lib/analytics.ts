/**
 * GA4 イベント送信ヘルパー。
 * gtag が未ロード/未定義の場合は黙ってスキップする（ブロッカー耐性）。
 */

type GtagArgs = unknown[]
type PintrkArgs = unknown[]

declare global {
  interface Window {
    gtag?: (...args: GtagArgs) => void
    dataLayer?: GtagArgs[]
    pintrk?: (...args: PintrkArgs) => void
  }
}

// GA4のカスタムイベント名 → Pinterest標準イベント名のマップ。
// 該当なしのイベントはPinterestには送らない（customに丸投げしない）。
const PINTEREST_EVENT_MAP: Record<string, string> = {
  print_click: 'lead',
  search: 'search',
  signup: 'signup',
}

export function trackEvent(
  name: string,
  params: Record<string, string | number | boolean | undefined> = {}
) {
  if (typeof window === 'undefined') return
  try {
    window.gtag?.('event', name, params)
  } catch {
    // noop
  }
  const pinEvent = PINTEREST_EVENT_MAP[name]
  if (pinEvent) {
    try {
      window.pintrk?.('track', pinEvent, params)
    } catch {
      // noop
    }
  }
}
