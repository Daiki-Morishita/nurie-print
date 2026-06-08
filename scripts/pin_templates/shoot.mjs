// ピンHTML → 1000x1500 PNG レンダラ（パス非依存・別PCでも動く）
// 使い方: node scripts/pin_templates/shoot.mjs <input.html> [output.png]
import { createRequire } from 'module'
import path from 'path'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright-core')

const [, , htmlArg, outArg] = process.argv
if (!htmlArg) {
  console.error('usage: node shoot.mjs <input.html> [output.png]')
  process.exit(1)
}
const htmlPath = path.resolve(htmlArg)
const outPath = path.resolve(outArg || htmlArg.replace(/\.html$/, '.png'))

const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1000, height: 1500 }, deviceScaleFactor: 2 })
await p.goto('file://' + htmlPath)
await p.waitForTimeout(600)
await p.screenshot({ path: outPath })
await b.close()
console.log('saved', outPath)
