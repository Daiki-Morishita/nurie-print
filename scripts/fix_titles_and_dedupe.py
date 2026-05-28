#!/usr/bin/env python3
"""
データタイトル整形 + 重複ID 一括処理:
  1. 重複IDエントリの削除（最初の1件だけ残す）
  2. 乗り物の「〜のまえすがた / よこすがた」→「〜（まえ） / （よこ）」
  3. 「〜のせかい」→ 個別マッピングで自然な日本語に
  4. 昔話タイトルに物語名プレフィックスを追加
  5. レポートを stdout に出す
"""

import re
from pathlib import Path

DATA_TS = Path(__file__).resolve().parent.parent / "src" / "lib" / "data.ts"

# ── 1. すがた → （まえ/よこ） ─────────────────────────────────────
POSE_MAP = [
    ("のまえすがた", "（まえ）"),
    ("のよこすがた", "（よこ）"),
    ("のうしろすがた", "（うしろ）"),
]

# ── 2. 〜のせかい 個別マッピング ─────────────────────────────────
SEKAI_MAP = {
    "うみのなかのかめたちのせかい": "うみのなかのかめたち",
    "にじのせかい": "おおきなにじ",
    "たいようのせかい": "かがやくたいよう",
    "くものせかい": "そらにうかぶくも",
    "あめのせかい": "あめのひ",
    "ゆきのせかい": "ゆきのひ",
    "かみなりのせかい": "かみなりがなる",
    "やまのせかい": "やまのけしき",
    "うみのせかい": "うみのけしき",
    "かわのせかい": "かわのながれ",
    "たきのせかい": "おおきなたき",
    "もりのせかい": "もりのなか",
    "かざんのせかい": "ふんかするかざん",
    "オーロラのせかい": "よぞらのオーロラ",
    "ながれぼしのせかい": "ながれぼしのよぞら",
    "ゆうやけのせかい": "ゆうやけぞら",
    "つきのせかい": "よぞらのつき",
    "きりのせかい": "きりのなか",
    "つららのせかい": "つららがさがる",
    "みずうみのせかい": "しずかなみずうみ",
    "なみのせかい": "うちよせるなみ",
    "しまのせかい": "とおくのしま",
    "たつまきのせかい": "たつまき",
}

# ── 3. 昔話の物語名プレフィックス ─────────────────────────────────
FAIRYTALE_STORY = {
    "aladdin": "アラジン",
    "ali-baba": "アリババ",
    "alice-wonderland": "ふしぎのくにのアリス",
    "ant-grasshopper": "アリとキリギリス",
    "beauty-beast": "びじょとやじゅう",
    "boy-cried-wolf": "おおかみしょうねん",
    "bremen-musicians": "ブレーメンのおんがくたい",
    "cinderella": "シンデレラ",
    "crow-pitcher": "カラスとみずがめ",
    "emperors-new-clothes": "はだかのおうさま",
    "fox-grapes": "きつねとぶどう",
    "frog-prince": "かえるのおうじさま",
    "golden-goose": "きんのがちょう",
    "goldilocks": "ゴルディロックスとさんびきのくま",
    "grateful-crane": "つるのおんがえし",
    "hanasaka-jiisan": "はなさかじいさん",
    "hansel-gretel": "ヘンゼルとグレーテル",
    "happy-prince": "こうふくなおうじ",
    "inaba-white-rabbit": "いなばのしろうさぎ",
    "issun-boshi": "いっすんぼうし",
    "jack-beanstalk": "ジャックとまめのき",
    "journey-west": "さいゆうき",
    "kachi-kachi-yama": "かちかちやま",
    "kaguya-hime": "かぐやひめ",
    "kasa-jizo": "かさじぞう",
    "kintaro": "きんたろう",
    "kobutori-jiisan": "こぶとりじいさん",
    "lion-mouse": "ライオンとねずみ",
    "little-mermaid": "にんぎょひめ",
    "match-girl": "マッチうりのしょうじょ",
    "momotaro": "ももたろう",
    "monkey-crab": "さるかにがっせん",
    "nightingale": "ナイチンゲール",
    "north-wind-sun": "きたかぜとたいよう",
    "onigiri-korori": "おむすびころりん",
    "peter-pan": "ピーターパン",
    "peter-rabbit": "ピーターラビット",
    "pinocchio": "ピノキオ",
    "princess-pea": "えんどうまめのおひめさま",
    "puss-in-boots": "ながぐつをはいたねこ",
    "rapunzel": "ラプンツェル",
    "red-riding-hood": "あかずきん",
    "red-shoes": "あかいくつ",
    "rumpelstiltskin": "ルンペルシュティルツキン",
    "sannen-netaro": "さんねんねたろう",
    "sinbad": "シンドバッド",
    "sleeping-beauty": "ねむれるもりのびじょ",
    "snow-queen": "ゆきのじょおう",
    "snow-white": "しらゆきひめ",
    "snow-white-rose-red": "ゆきしろとべにばら",
    "straw-millionaire": "わらしべちょうじゃ",
    "tanabata": "たなばた",
    "tanuki-itoguruma": "たぬきのいとぐるま",
    "tengu-kakuremino": "てんぐのかくれみの",
    "tennyo-hagoromo": "てんにょのはごろも",
    "three-little-pigs": "さんびきのこぶた",
    "thumbelina": "おやゆびひめ",
    "tin-soldier": "すずのへいたい",
    "tinderbox": "ひのうちばこ",
    "tom-thumb": "おやゆびトム",
    "tongue-cut-sparrow": "したきりすずめ",
    "tortoise-hare": "うさぎとかめ",
    "ugly-duckling": "みにくいあひるのこ",
    "umisachi-yamasachi": "うみさちやまさち",
    "urashima-taro": "うらしまたろう",
    "uriko-hime": "うりこひめ",
    "white-snake": "しろへび",
    "wild-swans": "やせいのはくちょう",
    "wizard-oz": "オズのまほうつかい",
    "wolf-seven-goats": "おおかみとしちひきのこやぎ",
    "yuki-onna": "ゆきおんな",
}

# fairytale-{key}-{difficulty}-{n} の正規表現
FAIRYTALE_ID_RE = re.compile(r"^fairytale-(.+?)-(simple|easy|normal|rich)-\d+$")


def fix_titles_in_text(src: str):
    """テキスト全体に対してタイトル整形を適用"""
    edits = {"pose": 0, "sekai": 0, "fairytale": 0}

    # ─ Pose 置換（〜のまえすがた等） ─
    for needle, repl in POSE_MAP:
        # title フィールド内のみ置換: title: 'XXXのまえすがた' → 'XXX（まえ）'
        def pose_sub(m):
            edits["pose"] += 1
            inner = m.group(1).replace(needle, repl)
            return f"title: '{inner}'"
        src = re.sub(rf"title: '([^']*?{needle})'", pose_sub, src)

    # ─ Sekai 置換 ─
    for needle, repl in SEKAI_MAP.items():
        def sekai_sub(m):
            edits["sekai"] += 1
            return f"title: '{repl}'"
        src = re.sub(rf"title: '{re.escape(needle)}'", sekai_sub, src)

    # ─ Fairytale プレフィックス追加 ─
    # 各 fairytale エントリを抽出して title を書き換える
    # エントリブロック (id, ..., title) のセットを正規表現で。
    # 行単位で id を見つけて、その直後の title 行を見つける方式
    lines = src.split("\n")
    out_lines = []
    pending_story = None  # id 行から決まる物語キー
    for line in lines:
        m_id = re.search(r"id: 'fairytale-([a-z-]+?)-(?:simple|easy|normal|rich)-\d+'", line)
        if m_id:
            pending_story = m_id.group(1)
            out_lines.append(line)
            continue

        # title 行
        m_title = re.match(r"^(\s*title: ')([^']*)('.*)$", line)
        if m_title and pending_story:
            current_title = m_title.group(2)
            story_name = FAIRYTALE_STORY.get(pending_story)
            if story_name and not current_title.startswith(story_name + "："):
                new_title = f"{story_name}：{current_title}"
                line = m_title.group(1) + new_title + m_title.group(3)
                edits["fairytale"] += 1
            pending_story = None

        out_lines.append(line)

    return "\n".join(out_lines), edits


def dedupe_entries(src: str):
    """重複ID（最初の出現のみ残す）。

    ブロック境界の overlap 問題に対処: 連続する block は `\\n  },\\n  {\\n` で
    つながっており、前 block の末尾 `\\n` と次 block の先頭 `\\n` が同じ位置を共有する。
    そのため pos を end+5 にして次回 find が前 block の末尾 `\\n` をスタートとして
    使えるようにする。
    """
    out = []
    pos = 0
    seen = set()
    removed = 0
    while True:
        start = src.find("\n  {\n", pos)
        if start == -1:
            out.append(src[pos:])
            break
        end = src.find("\n  },\n", start)
        if end == -1:
            out.append(src[pos:])
            break
        block_end = end + len("\n  },\n")  # exclusive
        block = src[start:block_end]
        m = re.search(r"id: '([^']+)'", block)
        next_pos = block_end - 1  # overlap: trailing `\n` is shared with next block's leading `\n`
        if m:
            mid = m.group(1)
            if mid in seen:
                out.append(src[pos:start])
                pos = next_pos
                removed += 1
                continue
            seen.add(mid)
        out.append(src[pos:start])
        out.append(block)
        pos = next_pos
    return "".join(out), removed


def main():
    src = DATA_TS.read_text(encoding="utf-8")
    original_len = len(src)

    # 1. dedupe
    src, dedupe_count = dedupe_entries(src)

    # 2-4. title fixes
    src, edits = fix_titles_in_text(src)

    DATA_TS.write_text(src, encoding="utf-8")

    print(f"重複削除: {dedupe_count}件")
    print(f"乗り物 〜すがた → （まえ/よこ/うしろ）: {edits['pose']}件")
    print(f"〜のせかい → 自然な表現: {edits['sekai']}件")
    print(f"昔話タイトルに物語名プレフィックス: {edits['fairytale']}件")
    print(f"バイト数変化: {original_len} → {len(src)} ({len(src) - original_len:+})")


if __name__ == "__main__":
    main()
