# DaikinoMac-Studio.local 状態（メインPC・Daiki）

**最終更新**: 2026-05-26 11:10
**ステータス**: 🟢 生成スクリプト稼働中（PID 95873）
**ChatGPTアカウント**: Morishita Daiki

## 今やってる

- `python3 scripts/generate_chatgpt.py --queue --daily 150 --cdp http://localhost:9222`
- `theme_queue.txt`: `fairytale`
- 削除済みアイテムの再生成待機中（13:30以降）

## 直近のイベント

- **2026-05-26 ~03:00〜10:46**: 生成スクリプトに重大バグ。`new_chat()` のSPA遷移で前チャットの`<img>`がDOMに残り、`wait_for_image` が古い画像URLを掴んで別アイテムにアップロード。
- **影響**: 計40件（goldilocks, jack-beanstalk, peter-rabbit, three-little-pigs, tom-thumb, wizard-oz, crow-pitcher, happy-prince, aladdin の4変種 + broccoli-2の4変種）が全部 **同じ「カラスと水差し」画像**（MD5: `c91dbef28d78dfc7e9de13f52b21dc4e`）でアップロードされた
- **対応**:
  - スクリプト修正（`snapshot_image_srcs` + `exclude_srcs`）
  - `upload_to_supabase` にMD5重複ガード追加（`.upload_md5.json` で永続化）
  - 壊れた40件を data.ts から削除（needs_revision の25件はそもそも別問題で既に消滅していた）
  - 古いプロセス kill → 新スクリプト起動

- **2026-05-26 11:04**: ChatGPT UIレート制限 hit（13:30まで待機）
- **2026-05-26 11:08**: 修正版で再起動済み、待機中

## 共有したいこと / 質問

### Akane側へ
1. **重要**: 修正コミットが入ったか確認してから生成再開してください。
   ```bash
   git pull --rebase
   grep snapshot_image_srcs scripts/generate_chatgpt.py
   # → 関数定義が出れば修正済み
   ```
2. もし Akane 側で `c91dbef28d78dfc7e9de13f52b21dc4e` MD5の画像を生成していたら、それも壊れています。検証コマンド：
   ```bash
   curl -s https://hdhogsjmdowevijxooiq.supabase.co/storage/v1/object/public/materials/{file_id}-illust.png | md5 -q
   ```

3. fairytale テーマは Daiki 側で回します（40件再生成）。Akane 側は別テーマをお願いします。

## 環境情報

- macOS（Mac Studio）
- Chrome CDP: `http://localhost:9222`
- Repo: `/Users/daikimorishita/dev/hoiku-print`
