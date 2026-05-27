# daiki-2 状態（morishitadaikinoMacBook-Pro.local）

**最終更新**: 2026-05-26 17:30
**ステータス**: 🟡 待機中（レート制限、22:35以降に park 再開予定）

## このPCのみのルール

- **自動デプロイ**: 毎日 1:00 / 13:00 JST に `git push origin main` → Vercel 自動デプロイ
  - macOS crontab 登録済み（`crontab -l` で確認）
  - ログ: `/tmp/hoiku-deploy.log`

## 今やってる

- テーマ: `park`（公園・遊具）
- 進捗: 58/88 ユニット完了、30ユニット残
- 22:35 以降に再開予定

## 🚨 daiki-1 へ：壊れた童話画像の対応済み＋再生成依頼

### 対応内容（daiki-2 側で実施済み・push 済み）

スクリプト確認したところ、Supabase 上の以下77件の画像が壊れていることを確認したため、
`imageStatus: 'needs_revision'` に変更してサイトから非表示化した（削除ではなくデータは保持）。

#### 状態内訳

| 状態 | 件数 | 内容 |
|---|---|---|
| 🐦 カラス（crow-pitcher）画像 | 33件 | Supabase に誤画像が存在 |
| 🔴 ファイルなし（69B JSON error） | 42件 | Supabase に画像ファイル自体がない |
| ✅ 正しい画像あり → pending_review | 2件 | snow-white-simple-1 / normal-1 のみ |

#### 再生成が必要な75件のテーマ

```
three-little-pigs (4件), jack-beanstalk (4件), goldilocks (4件),
tom-thumb (4件), wizard-oz (4件), peter-rabbit (4件),
happy-prince (4件), aladdin (4件), crow-pitcher (rich-1のみ 1件),
alice-wonderland (4件), beauty-beast (4件), little-mermaid (4件),
peter-pan (4件), pinocchio (4件), rapunzel (4件),
snow-queen (4件), snow-white (easy/rich の2件),
thumbelina (4件), tin-soldier (4件), ugly-duckling (4件)
```

### daiki-1 側でやること

1. 上記75件を ChatGPT で再生成・Supabase に正しい画像をアップロード
2. 各アイテムの `imageStatus` を `'needs_revision'` → `'pending_review'` に変更
3. push → 自動でサイトに反映

### 確認コマンド（再生成前）

```python
# 対象アイテムの imageStatus 確認
grep -A5 "id: 'fairytale-wizard-oz-simple-1'" src/lib/data.ts | grep imageStatus
# → imageStatus: 'needs_revision' になっていればOK
```

### 再生成スクリプトのヒント

スクリプトは `needs_revision` のアイテムをスキップする可能性あり。
再生成するには一度 data.ts から該当エントリを削除してから実行するか、
スクリプト側で `needs_revision` も処理対象にする改修が必要かもしれない。

## 環境情報

- macOS（MacBook Pro: morishitadaikinoMacBook-Pro.local）
- Chrome CDP: `http://localhost:9222`
- Repo: `/Users/daikimorishita/hoiku-print`
