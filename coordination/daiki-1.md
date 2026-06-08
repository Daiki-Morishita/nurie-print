# daiki-1 状態（DaikinoMac-Studio.local）

**最終更新**: 2026-06-08
**ステータス**: 🟢 通常稼働（AdSense審査ブロッカー対応中。生成は停止中＝量産フェーズ終了）

## 🚨 daiki-2 へ：AdSense審査ブロッカー＋著作権IP＋監査改善は daiki-1 が対応済み（重複作業不要）

森下さんから来た「D2への依頼書（F-1 + 監査改善）」と「著作権IP削除」は **daiki-1 側で全部実装・push 済み**。D2 は着手しないこと（コンフリクト回避）。

- **著作権IP削除**: anpanman-train×4・thomas-train×4 を data.ts と Supabase Storage から完全削除。`scripts/scan_ip_risk.py` で全素材走査しIP残0件を確認。
- **F-1（最優先・審査ブロッカー）**: `layout.tsx` の AdSenseスクリプトが env gate で本番未配信だった。gate を外し常時 `<head>` 配信に変更＋`verification.other` に `google-adsense-account` 追加。本番curlで存在確認済み。
- **H-1**: 共通テンプレ3ブロックの重複対策。「おうちでの楽しみ方」テーマ別可変化（`ENJOY_AT_HOME`）に加え、「育てる力」を素材IDで4パターンに分散（`themeStrength`）、「塗り方ガイド」に素材名差し込み＋3パターン分散（`coloringGuide`）。全て `theme-insights.ts`。
- **M-1**: `columns.ts` の経験者風一人称＋虚偽の実務経歴表現を全て参照型/出典ベースに書き換え（「長年」「現場で」「見てきた」grep=0確認済み）。
- **M-2**: privacy にパーソナライズ広告オプトアウトリンク追加。
- **L-1**: operator 住所を `大阪府大阪市西区江戸堀3-6-2` に補完。

→ 森下さんが Search Console で sitemap 再送信＋AdSense再審査申請する段階。D2 は生成・Pinterest 等の通常タスクに専念して。

## 🚨 daiki-2 へ：電車テーマ画像の大量重複を検出・再生成依頼

### 何が起きているか

全3,354素材を MD5 でスキャンしたところ（`scripts/detect_duplicate_images.py`）、
**完全に同一の画像ファイルが大量に使い回されている**ことが判明。

| MD5ハッシュ | 件数 | 主なテーマ | サンプルID |
|---|---|---|---|
| `1393308b…` | **206件** | densha + shinkansen | `hiroshima-astram-simple-1`, `sendai-namboku-*`, `kyoto-karasuma-*`, `minatomirai-y500-*`, `sotetsu-ynb-*` ほか |
| `f0aec39b…` | 44件 | fairytale | `fairytale-alice-wonderland-easy-1` ほか |
| `c91dbef2…` | 5件 | fairytale | `fairytale-crow-pitcher-rich-1` ほか |
| `43861860…` | 4件 | vegetables | `broccoli-easy-2` ほか |

広島アストラム・仙台南北線・京都烏丸線・みなとみらい線・相鉄… **タイトルは全部違うのに中身は同じ電車1枚**。

### daiki-1 側で対応済み（push 済み・commit 8406b92）

- 重複グループの2件目以降 **255件を `imageStatus: 'duplicate'`** に設定 → 公開サイトから完全除外（一覧・検索・sitemap・featuredから消える）
- 画像が404/0バイトの **90件を `imageStatus: 'broken'`** に設定
- `isPublic()` が duplicate / broken を除外するよう変更
- 管理画面のステータス選択肢にも duplicate / broken を追加（commit a1d8aa7）
- → **ユーザーには見えていない**ので緊急の実害はなし

### daiki-2 にお願いしたいこと（再生成）

電車テーマ（densha / shinkansen）を充実させたいなら、**重複している実車種の画像を正しく生成し直す**必要がある。

1. 重複リストは `scripts/duplicate_images.json` に全件ある（hash・ids 付き）
2. 各車種ごとに正しい線画を ChatGPT で生成し直して Supabase にアップロード
3. 該当アイテムの `imageStatus` を `'duplicate'` → `'pending_review'` に戻す
4. push → サイトに反映

### 重要：生成スクリプトのMD5ガードは効いているか？

- `upload_to_supabase` の MD5重複ガード（`.upload_md5.json`）は daiki-1 が 5/26 に追加済み
- だが今回 206件もの重複が残っているということは、**この206件はガード追加より前に生成された**か、別経路でアップされた可能性
- 再生成時は MD5ガードが有効か（`scripts/.upload_md5.json` が存在し参照されるか）必ず確認してから走らせて

## 量産フェーズについて（重要・方針変更）

サイトは **「量産フェーズ」から「絞り込み・作り込みフェーズ」に転換済み**。

- featured 295件を選定し、Claude Vision で個別解説文（seoDescription）を264件付与済み
- AdSense審査・scaled content 対策で、featured 以外の素材は noindex
- **無闇な新規量産はしない方針**。生成するなら「重複の再生成」か「需要のある実車種・人気テーマの補強」に限る

新規大量生成を再開する前に一度 `agreed.md` で相談してほしい。

## 環境情報

- macOS（Mac Studio: DaikinoMac-Studio.local）
- Chrome CDP: `http://localhost:9222`
- Repo: `/Users/daikimorishita/dev/hoiku-print`
- GitHubリポ名が `hoiku-print` → `nurie-print` に変更済み。remote URL更新を: `git remote set-url origin https://github.com/Daiki-Morishita/nurie-print.git`
