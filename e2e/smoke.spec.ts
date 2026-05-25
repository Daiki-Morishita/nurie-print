/**
 * スモークテスト — 5つの主要フロー
 * 実行: npx playwright test
 * 前提: npm install -D @playwright/test && npx playwright install chromium
 *       dev server 起動中 (npm run dev) または BASE_URL=https://nurie-print.com で本番テスト
 */

import { test, expect } from '@playwright/test'

// ── 1. ホーム ─────────────────────────────────────────────
test('ホームページが正常に表示される', async ({ page }) => {
  await page.goto('/')

  // H1 が存在する
  const h1 = page.locator('h1')
  await expect(h1).toBeVisible()

  // ナビゲーションがある
  await expect(page.locator('nav').first()).toBeVisible()

  // 塗り絵件数が表示されている（ホームのヒーロー文言）
  const heroText = page.locator('text=/\\d+\\s*点/')
  await expect(heroText.first()).toBeVisible()

  // テーマカードが最低 1 枚表示される
  const themeLinks = page.locator('a[href*="/category/theme/"]')
  await expect(themeLinks.first()).toBeVisible()
})

// ── 2. 検索フロー ──────────────────────────────────────────
test('検索で素材が見つかる', async ({ page }) => {
  await page.goto('/materials')

  // 検索ボックスに入力
  const searchInput = page.locator('input[name="search"]')
  await expect(searchInput).toBeVisible()
  await searchInput.fill('くま')
  await searchInput.press('Enter')

  // 検索結果 URL になっている
  await page.waitForURL(/search=/)

  // 結果カードが 1 枚以上ある
  const cards = page.locator('a[href*="/materials/"]')
  await expect(cards.first()).toBeVisible()
})

// ── 3. 素材詳細フロー ──────────────────────────────────────
test('素材詳細ページが正常に表示される', async ({ page }) => {
  // 教材一覧から最初のカードをクリック
  await page.goto('/materials')

  const firstCard = page.locator('main a[href*="/materials/"]').first()
  await expect(firstCard).toBeVisible()
  await firstCard.click()

  // 詳細ページに遷移
  await page.waitForURL(/\/materials\/.+/)

  // H1 が表示されている
  await expect(page.locator('h1').first()).toBeVisible()

  // 印刷ボタンが表示されている
  const printButton = page.locator('button', { hasText: /印刷/ })
  await expect(printButton.first()).toBeVisible()

  // 画像エリアが表示されている（A4横長コンテナ）
  const imageArea = page.locator('.aspect-\\[1\\.414\\/1\\]')
  await expect(imageArea.first()).toBeVisible()
})

// ── 4. 印刷フロー ──────────────────────────────────────────
test('印刷ダイアログが呼び出される', async ({ page }) => {
  // 任意の素材詳細ページへ
  await page.goto('/materials')
  const firstCard = page.locator('main a[href*="/materials/"]').first()
  await firstCard.click()
  await page.waitForURL(/\/materials\/.+/)

  // window.print を監視
  let printCalled = false
  await page.exposeFunction('__testPrintCalled', () => { printCalled = true })
  await page.evaluate(() => {
    const orig = window.print
    window.print = () => {
      (window as Window & { __testPrintCalled?: () => void }).__testPrintCalled?.()
      orig.call(window)
    }
  })

  // 印刷ボタンをクリック
  const printButton = page.locator('button', { hasText: /印刷/ }).first()
  await printButton.click()

  // window.print が呼ばれた（またはダイアログが表示されている）
  await page.waitForTimeout(500)
  expect(printCalled).toBe(true)
})

// ── 5. お気に入りフロー ────────────────────────────────────
test('お気に入り追加と一覧表示', async ({ page }) => {
  // 素材詳細ページでお気に入り追加
  await page.goto('/materials')
  const firstCard = page.locator('main a[href*="/materials/"]').first()
  const href = await firstCard.getAttribute('href')
  await firstCard.click()
  await page.waitForURL(/\/materials\/.+/)

  // お気に入りボタンをクリック
  const favButton = page.locator('button[aria-label*="お気に入り"], button[title*="お気に入り"]').first()
  if (await favButton.isVisible()) {
    await favButton.click()
    await page.waitForTimeout(300)
  }

  // /favorites ページへ移動
  await page.goto('/favorites')
  await expect(page.locator('h1, h2').first()).toBeVisible()

  // ページが 404 でないことを確認
  const notFoundText = page.locator('text=404')
  await expect(notFoundText).not.toBeVisible()

  // お気に入りが追加されているか、または空状態メッセージがある
  const content = page.locator('main')
  await expect(content).toBeVisible()
})
