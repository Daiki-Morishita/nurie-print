/**
 * GA4 イベント送信ヘルパー。
 * gtag が未ロード/未定義の場合は黙ってスキップする（ブロッカー耐性）。
 */

type GtagArgs = unknown[]

declare global {
  interface Window {
    gtag?: (...args: GtagArgs) => void
    dataLayer?: GtagArgs[]
  }
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
}
