# Pinterest運用 — M2（単純作業担当）引き継ぎ

> このファイルはM2セッション向け作業指示書。戦略・レビューは別セッション（メイン）が担当する。
> 不明点・判断が要ることはメインに投げる。あなたは「決まった手順の実行」に専念。

---

## 役割分担

| 担当 | 内容 |
|---|---|
| **メイン（戦略・レビュー係）** | ピン構成の決定・コピーの最終判断・デザインレビュー・どのPostをピン化するか選定 |
| **M2（あなた＝単純作業）** | ピン画像の量産・`pin_queue.json` 追記・git commit |

投稿そのものは **cronが毎朝10時に全自動**。M2もメインも手動投稿はしない。

---

## 絶対に守る境界

1. **手動で公開しない**（`post_pinterest.py` を `--once`/`--max` で直接叩かない）。投稿はcron任せ。テストは必ず `--dry-run`。
2. **新規アカウントなので1日2枚まで**（cronが制御済み。キューに積みすぎてもcronが1日2枚に絞る）。
3. **著作権キャラ（ポケモン等IP）の塗り絵写真はピン化しない**（過去にIP素材を全削除した経緯あり）。
4. **子のプライバシー**：顔・名前・園名・地域が写った写真は使わない。年齢表記（「3歳」）のみOK。手元・完成品・後ろ姿はOK。
5. `pin_queue.json` は **新規エントリを `posted_at: null` で末尾追記**。既存エントリの `posted_at` は絶対に書き換えない（重複投稿になる）。
6. 別PC運用のため **git は pull --rebase してから commit**。push は自動cron（0時/12時）に任せる。

---

## 既存の仕組み（変更不要・理解だけ）

- `scripts/post_pinterest.py` … Playwright CDPでPinterest投稿（メインが実装・検証済み）
- `scripts/run_pinterest_daily.sh` … cronラッパー（CDP Chrome起動保証→未投稿を最大2枚）
- cron … 毎朝10時に上記を実行
- `scripts/pin_queue.json` … 投稿キュー（あなたが追記する対象）
- `scripts/pin_assets/*.jpg` … ピン画像（あなたが量産する対象）

---

## M2の作業フロー（ピン1本＝この手順）

### 1. 素材を取得
- Post写真: サイト `https://nurie-print.com/posts` または Supabase `post-images` バケット
- 白紙線画（Before用）: Supabase `materials` バケット（該当テーマの `-illust.png`）
- ダウンロード→ `/tmp` に置く→ webpはPNG変換: `sips -s format png in.webp --out out.png`

### 2. ピンHTMLを作る
**`scripts/pin_templates/pinA.html` / `pinB.html` / `pinC.html`** を雛形にする。コピーして画像・コピーを差し替える（各HTML冒頭に使い方コメントあり・★が差し替え箇所）。3パターンから選ぶ:

| パターン | 雛形 | 使いどころ |
|---|---|---|
| 単体記録 | pinA.html | 完成写真1枚。安定供給 |
| Before/After | pinB.html | 白紙→完成。**保存率最強**。最優先 |
| 悩み解決ストーリー | pinC.html | 情緒エピソードがあるPost |

### 3. スクショ→JPG化
```bash
node scripts/pin_templates/shoot.mjs mypin.html mypin.png   # HTML→1000x1500 PNG
sips -Z 1500 -s format jpeg -s formatOptions 88 mypin.png --out scripts/pin_assets/mypin.jpg
```

### 4. pin_queue.json に追記
```json
{
  "image": "pin_assets/pinXX.jpg",
  "board": "<下のボード一覧から完全一致で>",
  "title": "<SEO規格に従う>",
  "description": "<SEO規格に従う>",
  "link": "https://nurie-print.com/posts",
  "posted_at": null
}
```

### 5. commit してメインにレビュー依頼
```bash
git pull --rebase origin main
git add scripts/pin_assets/ scripts/pin_queue.json
git commit -m "feat(pinterest): ピン追加 <テーマ>"
```
→ メインに「○枚追加した、内容これ」と報告。OKが出れば翌朝cronが投稿。

---

## ボード一覧（`board` は完全一致必須）

- `2歳のぬりえ`
- `3歳のぬりえ`
- `雨の日のおうち時間`
- `夏のぬりえ（七夕・夏祭り）`
- `親子で塗ってみた`

---

## ピンデザイン規格

- サイズ: **1000×1500（2:3）**
- ブランドカラー: オレンジ`#E66A2C` / teal`#4FA7B8` / イエロー`#E8B838` / ローズ`#C25A6E` / グリーン`#7AA875` / 背景クリーム`#FFF8EC`
- フォント: `Hiragino Maru Gothic ProN`
- フッターに3色ドット＋`nurie-print.com`
- 文字は大きく（モバイル80%）。タイトル50px以上
- AI修正画像ラベルはOFF（実写真のため）

---

## SEOコピー規格

**タイトル**（100字以内・前方にキーワード・`｜`区切り）
- 例: `3歳が本気で塗った新幹線ぬりえ｜無料で印刷`
- 必ず含める: 年齢 or テーマ名 ＋「ぬりえ」＋「無料」

**説明**（実体験エピソード → 機能 → ハッシュタグ5個）
- 機能ワード: 無料 / A4 / 登録なし / 年齢別3,200点
- ハッシュタグ例: `#無料ぬりえ #おうち遊び #幼児教育 #知育` ＋テーマ別（`#新幹線` `#節分` 等）

---

## 困ったら

- ピンが投稿されない/フィールド未入力 → `python3 scripts/inspect_pin_dom.py` でセレクタ調査 → メインに報告
- デザインの良し悪し・コピーの判断 → **メインに投げる**（あなたは判断しない）
- 詳細手順は `docs/manual.md` の「Pinterest 自動投稿」章
