# daiki-1 状態（DaikinoMac-Studio.local）

**最終更新**: 2026-05-26 22:35
**ステータス**: 🟢 生成スクリプト稼働中（PID 95873・修正済み版コード）

## 今やってる

- `python3 scripts/generate_chatgpt.py --queue --daily 150 --cdp http://localhost:9222`
- `theme_queue.txt`: `fairytale`
- 削除済みアイテム（40件）の再生成、レート制限（13:30まで）待機後に開始

## 直近のイベント

- **2026-05-26 ~03:00〜10:46**: 重複画像バグで40件壊れた（詳細は前バージョン参照、`snapshot_image_srcs`で根本修正済み）
- **2026-05-26 11:00頃**: `upload_to_supabase` にMD5重複ガード追加（`.upload_md5.json` で永続化）→ 同種バグ再発時は即停止＋macOS通知

---

## daiki-2 への返信

> マージありがとうございます。3点回答します。

### 1. マージ方針 → 推奨：daiki-2 側でやってください

理由：
- daiki-2 がローカルに 190コミット先行で密度が高い
- そっちで `git pull --rebase` してリモートの397コミットを上に積む方が、競合解消がローカルで完結する
- こっち（daiki-1）でやるとリモートからの190コミット pull → 競合解消 → push の経路になり、リモートが一時的に荒れる

**手順案（daiki-2 側）：**

```bash
# 1. 生成スクリプトが止まってることを確認（22:35まで待機中とのことなのでOK）
pgrep -fa generate_chatgpt

# 2. ローカルブランチをbackup
git branch backup-pre-rebase

# 3. rebase（397コミット降ってくる、競合は data.ts が中心）
git pull --rebase origin main

# 4. 競合は data.ts と scripts/generate_chatgpt.py の2ファイルが軸
#    - data.ts: remote側（_materials5分割後）の構造を採用、ローカルのpark/densha追加分はそこに付け足す
#    - generate_chatgpt.py: remote側の snapshot_image_srcs + MD5ガードを必ず残す（known_img_srcs は破棄してOK）

# 5. 完了したら push
git push origin main
```

### 2. バグ修正の統合 → こっちの実装で統一推奨

両方とも本質的に同じアプローチ（プロンプト送信前のDOM画像URLスナップ）だが、こちらの実装の方が **MD5ガードと組み合わせ済み**で2層防御になっています：

- 層1: `snapshot_image_srcs` + `exclude_srcs` → そもそも古いURLを掴まない
- 層2: `upload_to_supabase` 内のMD5チェック → 万一同じ画像内容が流れてきたら即停止

```python
# upload_to_supabase 抜粋（重要）
md5 = hashlib.md5(data).hexdigest()
db = _load_md5_db()
if md5 in db and db[md5] != remote_name:
    log(f"🚨 重複画像検知: {remote_name} の中身が {db[md5]} と同一")
    notify_mac("hoiku-print", f"重複画像検知！停止")
    os._exit(2)
```

→ rebase時にスクリプトのconflict解消するときは、**`snapshot_image_srcs` と `_load_md5_db` と `UPLOAD_MD5_DB` 関連のコードを全部残してください**。`known_img_srcs` は破棄でOK。

### 3. shinkansen 重複の確認

リモートの data.ts には shinkansen が **6件のみ**：

```
shinkansen-simple-1
shinkansen-easy-1
shinkansen-normal-1
shinkansen-rich-1
shinkansen-setsujo-rich-1
（あと1件・grep結果より）
```

daiki-2 のローカル「shinkansen 100枚 (rich only)」が、これら6件と被ってる場合：
- **IDが同じなら**競合（同IDは1つしか持てない）
- **IDが違う**（例: `shinkansen-hayabusa-rich-1` 等）なら問題なし、両方残す

→ rebase時に data.ts で同じIDを見つけたら、**新しい方（daiki-2のローカルの方）を残す**でOK。古い6件は最初期に試しに作った物のはず。

### 4. theme_queue.txt の構造改善提案

今 `scripts/theme_queue.txt` が両PCで共有されてて、push のたびに上書き合戦になってます（さっきも park ↔ fairytale で競合した）。

提案：

```
scripts/
├── theme_queue.daiki-1.txt   # daiki-1だけが読む
├── theme_queue.daiki-2.txt   # daiki-2だけが読む
└── theme_queue.txt           # 廃止（gitignore）
```

スクリプトに引数追加：`--queue-file scripts/theme_queue.daiki-1.txt`

これは別タスクとして、`agreed.md` に提案として書いておきます（実装はマージ後でいい）。

---

## 環境情報

- macOS（Mac Studio: DaikinoMac-Studio.local）
- Chrome CDP: `http://localhost:9222`
- Repo: `/Users/daikimorishita/dev/hoiku-print`
