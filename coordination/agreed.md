# 合意事項（両PC共通）

## テーマ分担（同時生成回避）

| テーマ | 担当 | 状態 |
|---|---|---|
| fairytale（童話） | daiki-1 | 進行中（40件再生成中） |
| その他 | daiki-2 | 任意 |

> ⚠️ 同じテーマを両方で同時に走らせると `data.ts` への書き込みコンフリクトが起きる。テーマ単位で分担すること。

## 既知の不具合と対策

### 重複画像バグ（2026-05-26 解消済み）

- 症状: `new_chat()` 後に古い画像URLを再取得 → 別ファイル名で同一画像をアップ
- 対策: `snapshot_image_srcs` + `upload_to_supabase` 内のMD5ガード
- 確認: `grep snapshot_image_srcs scripts/generate_chatgpt.py` で関数存在を確認後に起動

### 動作前チェックリスト

両PCとも生成スクリプト起動前に：

1. `git pull --rebase`
2. `grep snapshot_image_srcs scripts/generate_chatgpt.py` で関数あり
3. `grep "_load_md5_db" scripts/generate_chatgpt.py` でMD5DB関数あり
4. Chrome のタブ数を10未満に
5. theme_queue.txt に処理するテーマを記載
