# ぬりえプリント 生成マニュアル

> **このファイルが唯一の正。** 別PCでも `git pull` するだけで最新ルールを参照できる。
> ルールを変更したら必ずここを更新してコミットすること。

---

## 環境セットアップ（初回のみ）

```bash
git clone https://github.com/Daiki-Morishita/nurie-print.git
cd hoiku-print
pip install playwright supabase pillow numpy
playwright install chromium

export SUPABASE_URL=https://hdhogsjmdowevijxooiq.supabase.co
export SUPABASE_SECRET_KEY=<サービスロールキー>
# または .env.local に記載（スクリプトが自動読み込み）
```

---

## ChromeをCDPモードで起動（毎回必要）

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/.chatgpt-chrome-profile"
```

- 初回のみ: 起動したChromeで https://chatgpt.com にログイン
- 2回目以降: プロファイルが保存されているので自動でログイン済み状態
- Chromeはスクリプト実行中ずっと起動したままにする

---

## 実行コマンド

```bash
# 全アイテムを24h分散で150枚/日ペースで生成
python3 scripts/generate_chatgpt.py --type vegetables --all --daily 150

# 単体アイテム（テスト用）
python3 scripts/generate_chatgpt.py --type vegetables --item carrot --variant 1
```

### テーマ一覧

| type | 内容 |
|---|---|
| `park` | 公園・遊具 |
| `dinosaurs` | 恐竜 |
| `fruits` | くだもの |
| `vegetables` | 野菜 |
| `insects` | 昆虫 |
| `sports` | スポーツ |
| `yokai` | 妖怪 |

---

## ChatGPTアカウント割り当て

複数アカウントでレート制限を分散。**PCごとにアカウントを固定。**

| PC | アカウント |
|---|---|
| メインPC（Daiki） | Morishita Daiki |
| サブPC（Akane） | Morishita Akane |

同じテーマを2アカウントで同時生成してOK（ファイルIDが被らなければ競合しない）。

---

## スクリプトが自動でやること

1. ChatGPTにプロンプトを送信（ユニットごとに新規チャット）
2. 画像生成完了 or エラーを検知（最大4分待機）
3. `tmp_materials/{file_id}-illust.png` に一時保存
4. 背景を純白 #FFFFFF に補正（PIL処理・threshold=235）
5. Supabase Storageにアップロード
6. ChatGPTのチャットを削除
7. `src/lib/data.ts` にエントリを追記
8. `git commit`（pushは`--all`完了時に1回のみ）

---

## Vercelデプロイ管理

- Hobby プラン: **100デプロイ/日**（main への push 1回 = 1デプロイ）
- `--all` 中は `git commit` のみ、全テーマ完了後に `git push` を1回
- 単体実行時（`--item`）は完了後すぐpush

---

## キューモード（複数テーマの連続実行）

### 基本の使い方

```bash
# theme_queue.txt にテーマを並べて連続実行
python3 scripts/generate_chatgpt.py --queue --daily 150 --cdp http://localhost:9222
```

`scripts/theme_queue.txt` にテーマ名を1行1つで記載する。スクリプトが上から順に処理し、全完了後に `git push` を1回実行する。

```
sports
yokai
insects
```

### テーマの追加（実行中でも可）

実行中にファイルの末尾に追記するだけでOK。スクリプトは次のテーマに進む前にファイルを再読み込みするため、自然に移行する。

```bash
echo "newtheme" >> scripts/theme_queue.txt
```

### 仕組みと注意点

- **queue_pop()** がスクリプト起動時にファイルの先頭テーマを取り出し、ファイルから削除してから処理を開始する
- **そのため、スクリプトを強制終了したときキューから消えたテーマは手動で復元が必要**

```bash
# 再起動前に必ずキューを確認・復元
cat scripts/theme_queue.txt
# 足りないテーマがあれば先頭に追記
printf "sports\n$(cat scripts/theme_queue.txt)" > scripts/theme_queue.txt
```

- 既存アイテム（`data.ts` に記載済み）は自動スキップされるため、中断・再開を繰り返しても重複しない

---

## レート制限（ChatGPT Plus）

> **絶対ルール: あらゆるプロンプト送信の前後に必ず 380〜460秒のインターバルを挟む。リトライ・Cloudflare・タイムアウト・エラー・DL失敗・復旧処理、いかなる場合も例外なし。1日の目標枚数（150枚）はあくまで目安。インターバル遵守を最優先とする。**

- **3時間ローリングウィンドウ**で40リクエストが上限
- 380〜460s/req → ~206枚/日・26req/3h（安全圏・余裕35%）。`--daily 150` は目安設定であり、リトライ・エラー時は枚数未達になってもよい
- `SEND_INTERVAL = 380`（スクリプト定数で強制。短くしない）
- 429検知 → `os._exit(1)` で即終了（Retry-Afterをログに記録）
- 慣らし運転: 起動後0〜1回目は5〜10分待機、5回目以降で通常モード

### スクリプト再起動時の3h窓チェック方法

```bash
# 直近3時間のfirst-attempt件数を確認（例: 現在15:30なら12:30以降を数える）
sed -n '行番号,$p' scripts/generate_chatgpt.log | \
  grep "生成開始 (試行 1" | \
  awk -F'[][]' '{print $2}' | sort -u | \
  awk -F: '($1>=開始時 && $1<=現在時)'
```

> **注意**: ログファイルは日付なしで蓄積されるため、前日以前の同時間帯エントリが混入することがある。セッション開始行（`キューモード開始`）の行番号を起点にして `sed -n '行番号,$p'` で絞ること。

### kill後の再起動手順

スクリプトを kill しても、直前のリクエストは ChatGPT に届いている。即再起動すると2リクエストが短期集中するため、**必ずインターバル残りを確認してから再起動する**。

```bash
# 残り待機秒数を確認（0になってから再起動）
python3 -c "
import time
last = float(open('scripts/.last_send_time').read())
remaining = 380 - (time.time() - last)
print(f'残り待機: {max(0, remaining):.0f}秒')
"
```

### 安全な再起動の目安

| 3h窓のリクエスト数 | 判断 |
|---|---|
| 〜30件 | すぐ再起動OK |
| 31〜40件 | 慣らし運転（P1: 5〜10分）で最初のリクエストまで時間が稼げるため基本OK |
| 41〜50件 | 慎重に。30分以上待ってから再起動するか、最初のリクエストまでの待機を手動で確認 |
| 50件超 | 再起動しない。429が出てos._exitする可能性が高い |

### リトライが発生する主な原因

リトライはインターバルを**守らずに**即座に再試行する（インターバルはリトライ後に発生）。

| 原因 | 頻度 |
|---|---|
| タイムアウト（生成240秒超） | 多い |
| サーバーエラー（ChatGPT側の一時障害） | 時々 |
| コンテンツポリシー拒否 | まれ |
| 画像DL失敗 | まれ |

プロンプトの長さ（平均518文字程度）はリトライ原因にならない。

---

## エラー自動回復（3段階）

1. 通常: 最大3回リトライ
2. ①: 60秒待機 → 再試行
3. ②: Chrome再起動 → CDP再接続 → 再試行
4. ③: スキップ → `scripts/failed_ids.txt` 記録 + macOS通知 → 次へ

---

## 就寝・長時間離席

```bash
caffeinate -i &       # システムスリープ防止
pmset displaysleepnow # ディスプレイだけOFF
# 復帰後: killall caffeinate
```

---

## プロンプト共通ルール（全テーマ）

```
背景は必ず純白 #FFFFFF
線画スタイル（塗りつぶしなし）
輪郭線は太くはっきりと描き、細い線や掠れた線は使わない
A4横長・高画質
文字・テキスト・ラベル・枠線・フレームは一切入れない
イラスト1点のみ・コマ割りや複数構成にしない
```

---

## 難易度別構図パターン

| 難易度 | 対象年齢 | 構図 |
|---|---|---|
| simple | 2〜3歳 | 対象1個のみ・背景なし・余白たっぷり |
| easy | 3歳 | 複数個を自然に並べた構図 or まるごと＋日常でよく見る形（切り方・食べ方）を添える |
| normal | 3〜5歳 | まるごと＋カット版 or 料理前の材料が並ぶ構図 |
| rich | 4〜6歳 | 人物が登場するにぎやかな場面（複数キャラ＋背景）。野菜・果物テーマは収穫・料理の1シーンに絞る |

---

## 野菜・果物テーマの追加ルール

### 食べ物全般（FOOD_COND_ITEMS）に適用

- 食べ物・野菜・果物に顔・目・口などの表情はつけない
- 収穫・畑シーンに切断済みの食材を描かない（収穫はまるごとの状態のみ）
- 食卓・料理シーンは現実的な1つの食事場面に絞る（カレー＋シチュー＋ポテトを同時に並べるなど非現実的な組み合わせNG）
- 食器・料理・食べ物のサイズは人物に対して現実的なスケールで描く（子どもの体と同じかそれ以上に大きい皿・鍋はNG）

### 野菜専用（VEGETABLE_COND_ITEMS）の追加条件

- 野菜の表面にはその野菜らしいスジや曲線を1〜3本程度シンプルに入れる（芽・点々・複雑な模様・過剰なディテールはNG）
- 人物と野菜のサイズ比は現実的に（野菜が人物の頭や体と同じかそれ以上に巨大はNG・野菜は人物の手に収まる〜腕程度のサイズ感）
- 登場する人物には必ず顔（目・鼻・口・笑顔などの表情）を描く（顔なしはNG）
- 登場人物は1〜2人まで（多人数・にぎやかすぎる構図はNG）
- 収穫・畑シーンに切断済みの野菜を描かない。料理シーンに土付き・茎付きの野菜を描かない（場面の文脈と食材の状態を必ず一致させる）
- 畑のシーンは主役の野菜だけを育てている畑として描く（にんじん畑はにんじんのみ）。異なる種類の野菜を同じ畑に大量に混ぜない
- 野菜の大きさは実物の大きさに忠実に描く（ブロッコリーは子どもの手に収まる程度・にんじんは腕の長さ程度）。木のように大きくなるのはNG

### 描画前の検索指示（野菜・果物）

生成前に `{野菜名} 写真` でウェブ検索し、実物の形・断面・シーンの状態を確認してから描く。
→ スクリプトが自動でプロンプト冒頭に挿入する。

---

## 参照画像システム

`scripts/refs/{item}-ref.png` を置くと、ChatGPT生成時に自動添付される。

```
scripts/refs/
  broccoli-ref.png   # 設定済み（クラスター形状・適度な凹凸）
  carrot-ref.png     # 必要に応じて追加
```

- スクリプトが `attach_ref_image(page, item_id)` を自動呼び出し
- 添付時に「このディテール感・線の太さを参考に」と指示が付く
- 新しいアイテムは ref ファイルを置くだけでOK

---

## アンチパターン（過去の失敗と対策）

| 問題 | 原因 | 対策 |
|---|---|---|
| 野菜が豆・卵のように滑らかで識別できない | 輪郭を「シンプル」と指示しすぎ | 輪郭のでこぼこ・形状を具体的に指定 |
| ブロッコリーのテクスチャが点々で塗りにくい | 「密集したこぶ」と指示 | こぶ数を10〜20個程度に制限・stipple禁止 |
| 野菜が人物と同じか木サイズになる | 「大きく描く」指示の副作用 | 実物サイズを具体的に記載（手に収まる程度等） |
| 畑にいろんな野菜が混在 | 「にぎやかな野菜畑」という記述 | 「○○畑は○○のみ」と明示 |
| 収穫シーンに切断された野菜が描かれる | 料理シーンとの混同 | 場面ごとに食材の状態を明記 |
| 1つの食卓にカレー・シチュー・ポテトが全部並ぶ | 複数料理を列挙 | 1食事シーンに絞り単一料理を指定 |
| 人物に顔がない | 「食べ物に顔をつけない」ルールが人物にも適用された | 「人物には必ず顔を描く」を明記 |
| 食べ物に顔がついた | 指定なし | FOOD_COND_ITEMSで「顔はつけない」を追加 |
| じゃがいもの芽が大量に描かれる | 表面ディテールの指示が過剰 | note に「芽（目のような突起）は一切描かない」と明記 |

---

## tmp管理

- `tmp_materials/` = 生成済みの中間ファイル置き場（Supabase upload後も残る）
- **スクリプト起動時に90日以上前のファイルを自動削除**（`cleanup_tmp_materials(days=90)`）
- 手動でリセットしたい場合: `rm tmp_materials/{item}-*.png` してスクリプト再起動

### 特定アイテムの再生成手順

1. `src/lib/data.ts` から該当IDのエントリを削除
2. `tmp_materials/{file_id}-illust.png` を削除
3. スクリプトを再起動（スキップされず再生成される）

---

## 並列生成（複数環境）

- テーマ単位で環境を分担（同じテーマを複数環境で同時生成しない）
- `data.ts` への書き込みは `fcntl.LOCK_EX` でロック（競合回避）
- push前に `git pull --rebase` を実行

---

## 主要関数リファレンス（`scripts/generate_chatgpt.py`）

| 関数 | 役割 |
|---|---|
| `build_prompt(scene, note, cond_items)` | 20スタイルランダム選択でプロンプト生成 |
| `attach_ref_image(page, item_id)` | 参照画像添付（refs/{item}-ref.png） |
| `attach_rate_limit_guard(page)` | 429 Fail-Fast リスナー |
| `make_daily_schedule(n_items, hours)` | 24h分散スケジューラー |
| `jitter_sleep(max, rate_limited, success_count)` | 慣らし運転対応バックオフ |
| `cleanup_tmp_materials(days=90)` | 起動時に古いtmpファイルを自動削除 |
| `human_pause / human_move_and_click / human_type` | 人間らしい操作ヘルパー |
