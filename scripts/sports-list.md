# スポーツテーマ 素材生成リスト

保育園児向けぬりえ・スポーツカテゴリの生成計画。

## 共通仕様

- **命名**: `{item}-{unit}-{連番}`  例: `soccer-rich-1`
- **Unit 展開** (4段階固定):
  - `simple` … 道具1点のみ・背景なし（2〜3歳）
  - `easy` … 子どもが1人で競技している様子（3歳）
  - `normal` … 子どもが道具や環境と一緒にいる構図（3〜5歳）
  - `rich` … 友達と遊ぶ・試合・運動会などにぎやかな場面（4〜6歳）
- **描画方針**: 子どもが主役・道具は実物サイズに忠実・元気でかわいい線画

## 選定基準

1. 保育園・幼稚園の日常（運動会・体育・習い事）でなじみが深い
2. A4 横長の線画として画になる（単体でも場面でも成立する）
3. 日本の子ども文化に根ざしている（すもう・なわとびなど）

---

## アイテムリスト（15種）

| # | item_id | 日本語名 | 英語説明 | メモ |
|---|---|---|---|---|
| 1 | soccer | サッカー | soccer / football | 保育園で最も人気のスポーツ |
| 2 | baseball | 野球 | baseball | バット・グローブ・ボール |
| 3 | swimming | 水泳 | swimming | 夏の定番・プール |
| 4 | running | かけっこ | running / sprint | 運動会の花形 |
| 5 | jump-rope | なわとび | jump rope | 冬の保育園の定番 |
| 6 | gymnastics | 体操 | gymnastics | マット・鉄棒・跳び箱 |
| 7 | dodgeball | ドッジボール | dodgeball | 保育園で超定番の球技 |
| 8 | basketball | バスケットボール | basketball | ミニバス・輪投げ感覚で親しみやすい |
| 9 | tennis | テニス | tennis | ラケット・ボール |
| 10 | sumo | すもう | sumo wrestling | 日本らしい・どすこいポーズ |
| 11 | cycling | じてんしゃ | cycling / bicycle | 補助輪なし自転車の練習 |
| 12 | skiing | スキー | skiing | 冬のウィンタースポーツ |
| 13 | skating | スケート | ice skating | 冬のウィンタースポーツ |
| 14 | volleyball | バレーボール | volleyball | ビーチ・体育館どちらでも |
| 15 | karate | 空手 | karate | 道場・習い事として人気 |

---

## 集計

| 区分 | 種数 | 素材数（×4 unit） | 1バリアントルール |
|---|---:|---:|---:|
| 🆕 新規 | 15 | 60 | **15枚** |

---

## Python dict（generate_chatgpt.py 用）

```python
SPORTS = {
    "soccer":      {"ja": "サッカー",           "variants": [1, 2, 3, 4]},
    "baseball":    {"ja": "野球",               "variants": [1, 2, 3, 4]},
    "swimming":    {"ja": "水泳",               "variants": [1, 2, 3, 4]},
    "running":     {"ja": "かけっこ",           "variants": [1, 2, 3, 4]},
    "jump-rope":   {"ja": "なわとび",           "variants": [1, 2, 3, 4]},
    "gymnastics":  {"ja": "体操",               "variants": [1, 2, 3, 4]},
    "dodgeball":   {"ja": "ドッジボール",       "variants": [1, 2, 3, 4]},
    "basketball":  {"ja": "バスケットボール",   "variants": [1, 2, 3, 4]},
    "tennis":      {"ja": "テニス",             "variants": [1, 2, 3, 4]},
    "sumo":        {"ja": "すもう",             "variants": [1, 2, 3, 4]},
    "cycling":     {"ja": "じてんしゃ",         "variants": [1, 2, 3, 4]},
    "skiing":      {"ja": "スキー",             "variants": [1, 2, 3, 4]},
    "skating":     {"ja": "スケート",           "variants": [1, 2, 3, 4]},
    "volleyball":  {"ja": "バレーボール",       "variants": [1, 2, 3, 4]},
    "karate":      {"ja": "空手",               "variants": [1, 2, 3, 4]},
}

SPORTS_COND_ITEMS = COMMON_COND_ITEMS + [
    "子どもが主役の元気でかわいい線画にする",
    "スポーツ道具・用具は実物のサイズ感に忠実に描く（ボールが子どもの頭より大きくなるのはNG）",
    "登場する子どもには必ず顔（目・鼻・口・笑顔などの表情）を描く",
    "登場人物は1〜2人まで（richは2〜3人可）",
    "ユニフォームや道具の過剰なブランドロゴ・文字は描かない",
]
```

---

## 難易度別構図ガイド（スポーツ専用）

| 難易度 | 構図例 |
|---|---|
| simple | 道具だけ（サッカーボール1個・ラケット1本・ひも1本） |
| easy | 子ども1人が競技している（ボールを蹴る・泳ぐ・走る） |
| normal | 子ども1人＋環境（ゴール前・プール・コート・土俵） |
| rich | 子ども2〜3人＋観客・運動会・試合の場面 |

---

## 生成コマンド（準備中）

```bash
# 事前に generate_chatgpt.py に SPORTS / SPORTS_COND_ITEMS を追加してから実行
python3 scripts/generate_chatgpt.py --type sports --all --daily 150 --cdp http://localhost:9222
```

---

*作成: 2026-05-18*
