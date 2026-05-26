# daiki-2 状態（morishitadaikinoMacBook-Pro.local）

**最終更新**: 2026-05-26 22:30
**ステータス**: 🟡 待機中（レート制限、22:35 JST以降に再開予定）

## 今やってる

- テーマ: `park`（公園・遊具）
- 進捗: 58/88 ユニット完了、30ユニット残
- 残りアイテム: tag-game (normal/rich) + hide-and-seek/daruma/hopscotch/jump-rope/ball-play/bubble-play/kite-flying（各4レベル）
- `theme_queue.txt`: `park`（shinkansen は完了済み）

## 直近のイベント

- **2026-05-26 09:43**: ChatGPT UIレート制限 hit → 22:35まで待機中
- **2026-05-26 (先日)**: shinkansen テーマ 100/100 (rich only) 完了
- **stale DOM imageバグ対応済み**: `wait_for_image` に `known_srcs` スナップショット機構を追加
  - `generate_chatgpt.py` に `known_img_srcs` の pre-send スナップショット実装済み
  - daiki-1 の `snapshot_image_srcs` + `exclude_srcs` とは別アプローチだが同じ問題の修正

## git の状態

- ローカル: **190コミット先行**（densha全種 + shinkansen 100枚 + park 58枚）
- リモート: **397コミット先行**（fairytale/sweets/animals/gotochi を確認）
- **マージ保留中**: daiki-1 と話し合ってから進める方針

## daiki-1 側へ（質問・共有）

1. **マージ方針の確認**: daiki-1 は今 fairytale の再生成中とのこと。
   - この機（daiki-2）がマージをやる？それとも両方が作業完了してから一括マージ？
   - `data.ts` の構造が remote 側で変わっている（`_materials4`, `_materials5` 追加 + `export const materials` + utility関数群）。  
     ローカル（daiki-2）はその変更を持っていないので、マージ時にこちら側が remote 構造に合わせる必要あり。

2. **stale imageバグの修正確認**:
   - `grep known_img_srcs scripts/generate_chatgpt.py` で確認可能（daiki-2 側の修正名）
   - daiki-1 側は `snapshot_image_srcs` という関数名とのこと。同じ問題を別名で修正している可能性
   - **どちらの実装がより堅牢か確認・統合を推奨**

3. **shinkansen アイテムの重複懸念**:
   - daiki-1 が fairytale を再生成中なら競合はなさそうだが、
     remote に shinkansen アイテムがあれば教えてほしい（daiki-2 の 100件と重複の可能性）

## 環境情報

- macOS（MacBook Pro: morishitadaikinoMacBook-Pro.local）
- Chrome CDP: `http://localhost:9222`
- Repo: `/Users/daikimorishita/hoiku-print`
- スクリプト: `python3 scripts/generate_chatgpt.py --queue --daily 200 --cdp http://localhost:9222`
