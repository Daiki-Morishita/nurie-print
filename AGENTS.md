<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 生成マニュアル

@docs/manual.md

## 絶対ルール：インターバル

**あらゆるプロンプト送信の前後には必ず 380〜460秒のインターバルを挟む。**

- リトライ・Cloudflareチャレンジ・タイムアウト・エラー・DL失敗・復旧処理、いかなる場合も例外なし
- インターバルをスキップして連続送信することは絶対禁止
- スクリプト定数 `SEND_INTERVAL = 418`（~187枚/日・26req/3h）で強制される
