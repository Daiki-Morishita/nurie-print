#!/usr/bin/env python3
"""
data.ts から featured 候補を選定する。

ルール:
  - 各テーマ（theme）から difficulty=simple を上から20件、easy を上から10件
  - audience が adult のもの・imageStatus が pending_review / needs_revision のものは除外
  - 合計が 300 を目安に出力する（多すぎる場合はテーマ分散後で調整）

出力:
  scripts/featured_candidates.txt — 1行1ID
  stdout: テーマごとの集計

実行:
  python3 scripts/select_featured.py
"""

import re
from pathlib import Path
from collections import defaultdict
import json

DATA_TS = Path(__file__).resolve().parent.parent / "src" / "lib" / "data.ts"
OUTPUT = Path(__file__).resolve().parent / "featured_candidates.txt"

# 1エントリ = `{ ... },` を緩めに抽出
ENTRY_RE = re.compile(r"\{\s*id:\s*'([^']+)',[^}]*?\},", re.DOTALL)

# フィールド抽出用
def extract(pattern, text):
    m = re.search(pattern, text)
    return m.group(1) if m else None

def parse_materials(src: str):
    """data.ts から material エントリを列挙し dict のリストで返す。
    difficulty は ID の suffix (simple/easy/normal/rich) から判定する。"""
    materials = []
    pos = 0
    while True:
        start = src.find("\n  {\n", pos)
        if start == -1:
            break
        end = src.find("\n  },", start)
        if end == -1:
            break
        block = src[start:end]
        pos = end + 5

        mid = extract(r"id:\s*'([^']+)'", block)
        if not mid:
            continue

        # ID suffix から difficulty 判定 (例: bear-simple-1 → simple)
        diff_kind = None
        for kind in ("simple", "easy", "normal", "rich"):
            if f"-{kind}-" in mid or mid.endswith(f"-{kind}"):
                diff_kind = kind
                break

        theme = extract(r"theme:\s*'([^']+)'", block)
        audience = extract(r"audience:\s*'([^']+)'", block)
        status = extract(r"imageStatus:\s*'([^']+)'", block)

        materials.append({
            "id": mid,
            "difficulty": diff_kind,
            "theme": theme or "_no_theme",
            "audience": audience or "kids",
            "imageStatus": status,
        })
    return materials


def main():
    src = DATA_TS.read_text(encoding="utf-8")
    materials = parse_materials(src)
    print(f"全エントリ数: {len(materials)}")

    # kids only + 公開可能（isPublic と同じ判定: needs_revision のみ除外）
    eligible_all = [
        m for m in materials
        if m["audience"] == "kids"
        and m["imageStatus"] != "needs_revision"
    ]
    print(f"kids & public (全難易度): {len(eligible_all)}")

    # 全テーマ×全難易度の分布を表示
    dist = defaultdict(lambda: defaultdict(int))
    for m in eligible_all:
        dist[m["theme"]][m["difficulty"] or "?"] += 1
    print()
    print(f"{'theme':<22} {'simple':>7} {'easy':>5} {'normal':>7} {'rich':>5} {'?':>3} {'sum':>5}")
    print("-" * 60)
    for theme in sorted(dist.keys()):
        d = dist[theme]
        s = d.get("simple", 0)
        e = d.get("easy", 0)
        n = d.get("normal", 0)
        r = d.get("rich", 0)
        q = d.get("?", 0)
        print(f"{theme:<22} {s:>7} {e:>5} {n:>7} {r:>5} {q:>3} {s+e+n+r+q:>5}")
    print()

    eligible = [m for m in eligible_all if m["difficulty"] in ("simple", "easy")]
    print(f"simple+easy のみ: {len(eligible)}")

    # テーマ×難易度でグルーピング（順序保持）
    by_theme_diff = defaultdict(lambda: defaultdict(list))
    for m in eligible:
        by_theme_diff[m["theme"]][m["difficulty"]].append(m["id"])

    # 全テーマで「上から simple 20件 + easy 10件」を計算（候補プール）
    theme_pool = []
    for theme in by_theme_diff:
        simples = by_theme_diff[theme].get("simple", [])[:20]
        easies = by_theme_diff[theme].get("easy", [])[:10]
        theme_pool.append((theme, simples, easies))

    # 充実度（simple+easy 件数）が高い順にソートし、上位10テーマを採用（≈300件）
    theme_pool.sort(key=lambda t: -(len(t[1]) + len(t[2])))

    selected = []
    summary = []
    MAX_THEMES = 10
    for theme, simples, easies in theme_pool[:MAX_THEMES]:
        selected.extend(simples)
        selected.extend(easies)
        summary.append((theme, len(simples), len(easies), len(simples) + len(easies)))

    # 表示
    print()
    print(f"{'theme':<20} {'simple':>7} {'easy':>5} {'sum':>5}")
    print("-" * 45)
    total = 0
    for theme, s, e, n in summary:
        print(f"{theme:<20} {s:>7} {e:>5} {n:>5}")
        total += n
    print("-" * 45)
    print(f"{'total':<20} {'':>7} {'':>5} {total:>5}")

    # 重複除去（念のため）
    seen = set()
    unique = [x for x in selected if not (x in seen or seen.add(x))]
    print(f"\n選定ID数 (unique): {len(unique)}")

    OUTPUT.write_text("\n".join(unique) + "\n", encoding="utf-8")
    print(f"出力: {OUTPUT}")


if __name__ == "__main__":
    main()
