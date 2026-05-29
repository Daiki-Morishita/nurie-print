# 合意事項（両PC共通）

## フェーズ転換（2026-05-29）

**量産フェーズ終了 → 絞り込み・作り込みフェーズ**。新規大量生成は原則停止。
生成するのは (1) 重複画像の再生成 (2) 需要のある実車種・人気テーマの補強 のみ。
新規量産を再開したい場合は事前にここで合意を取る。

## 🚨 要対応：電車テーマ画像の重複再生成（担当: daiki-2）

- densha + shinkansen で **206件が同一画像** の使い回し（MD5 `1393308b…`）
- daiki-1 が該当255件を `imageStatus: 'duplicate'` 化して非表示済み（公開サイトは安全）
- 充実させるには daiki-2 が各車種の正しい線画を再生成 → `pending_review` に戻す
- 重複リスト: `scripts/duplicate_images.json`（hash・ids 全件）
- 詳細は `daiki-1.md` 参照

## テーマ分担（同時生成回避）

| テーマ | 担当 | 状態 |
|---|---|---|
| fairytale（童話） | daiki-1 | 完了（seoDescription 付与済み） |
| densha/shinkansen 重複再生成 | daiki-2 | 未着手（依頼中） |
| その他 | daiki-2 | 任意（量産は事前合意） |

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

## 提案中（実装はマージ後）

### theme_queue を PC ごとに分離

現状 `scripts/theme_queue.txt` が共有されており push 競合の原因になっている。
提案：

- `scripts/theme_queue.daiki-1.txt`（daiki-1 専用）
- `scripts/theme_queue.daiki-2.txt`（daiki-2 専用）
- スクリプトに `--queue-file <path>` 引数追加（デフォルトはホスト名で自動選択）

両PCのマージが落ち着いてから着手。
