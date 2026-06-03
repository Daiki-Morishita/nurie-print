#!/usr/bin/env python3
"""
data.ts 全素材の id/title/description を走査し、実在キャラクター/ブランド名を検出。
AdSense「知的財産権の侵害」リスクのある素材をリスト化する。

出力: scripts/ip_risk_report.json
  [{ id, title, theme, matched: [keyword,...], severity: "high"|"review" }]

severity:
  high   = 明らかなキャラクターIP（削除推奨）
  review = 一般語と紛らわしい・要人間判断
"""
import re
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "lib" / "data.ts"
OUT = ROOT / "scripts" / "ip_risk_report.json"

# (keyword, severity)。keyword は id/title/description に対し大文字小文字無視で部分一致
KEYWORDS = [
    # ─ 明確なキャラIP（high） ─
    ("アンパンマン", "high"), ("anpanman", "high"),
    ("トーマス", "high"), ("thomas", "high"),
    ("ミッキー", "high"), ("ミニー", "high"), ("ディズニー", "high"), ("disney", "high"),
    ("プーさん", "high"), ("くまのプーさん", "high"),
    ("アナ雪", "high"), ("アナと雪の女王", "high"), ("エルサ", "high"),  # 「アナ」単独は モルジアナ 等に誤マッチするため除外
    ("トイストーリー", "high"), ("バズ", "high"), ("ウッディ", "high"),
    ("キティ", "high"), ("ハローキティ", "high"), ("マイメロ", "high"),
    ("シナモロール", "high"), ("ポムポムプリン", "high"), ("クロミ", "high"), ("sanrio", "high"), ("サンリオ", "high"),
    ("マリオ", "high"), ("mario", "high"), ("ルイージ", "high"),
    ("ピカチュウ", "high"), ("ポケモン", "high"), ("pokemon", "high"), ("ポケットモンスター", "high"),
    ("カービィ", "high"), ("kirby", "high"), ("ゼルダ", "high"),
    ("プリキュア", "high"), ("仮面ライダー", "high"), ("ウルトラマン", "high"), ("ガンダム", "high"),
    ("戦隊", "review"),  # 「戦隊」は一般語の可能性も
    ("スヌーピー", "high"), ("snoopy", "high"),
    ("ドラえもん", "high"), ("doraemon", "high"),
    ("しまじろう", "high"),
    ("ミッフィー", "high"), ("miffy", "high"),
    ("トトロ", "high"), ("ジブリ", "high"), ("ghibli", "high"), ("ポニョ", "high"), ("キキ", "review"),
    ("ドラゴンボール", "high"), ("ピカソ", "review"),
    ("リカちゃん", "high"), ("バービー", "high"), ("barbie", "high"),
    ("こえだちゃん", "review"), ("シルバニア", "high"),
    ("きかんしゃ", "review"),  # きかんしゃトーマス由来の可能性
]


def parse(src):
    out = []
    pos = 0
    while True:
        start = src.find("\n  {\n", pos)
        if start == -1:
            break
        end = src.find("\n  },\n", start)
        if end == -1:
            break
        block = src[start:end + 6]
        pos = end + 5
        mid = re.search(r"id: '([^']+)'", block)
        mtitle = re.search(r"title: '([^']*)'", block)
        mdesc = re.search(r"description: '([^']*)'", block)
        mtheme = re.search(r"theme: '([^']+)'", block)
        if not mid:
            continue
        out.append({
            "id": mid.group(1),
            "title": mtitle.group(1) if mtitle else "",
            "description": mdesc.group(1) if mdesc else "",
            "theme": mtheme.group(1) if mtheme else "",
        })
    return out


def main():
    src = DATA.read_text(encoding="utf-8")
    mats = parse(src)
    print(f"全素材: {len(mats)}")

    report = []
    for m in mats:
        hay = f"{m['id']} {m['title']} {m['description']}".lower()
        matched = []
        sev = "review"
        for kw, s in KEYWORDS:
            if kw.lower() in hay:
                matched.append(kw)
                if s == "high":
                    sev = "high"
        if matched:
            report.append({
                "id": m["id"],
                "title": m["title"],
                "theme": m["theme"],
                "matched": sorted(set(matched)),
                "severity": sev,
            })

    report.sort(key=lambda r: (r["severity"] != "high", r["id"]))
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    high = [r for r in report if r["severity"] == "high"]
    review = [r for r in report if r["severity"] == "review"]
    print(f"\n=== 検出 {len(report)}件 ===")
    print(f"high(削除推奨): {len(high)}件")
    for r in high:
        print(f"  [HIGH] {r['id']} «{r['title']}» {r['matched']}")
    print(f"\nreview(要判断): {len(review)}件")
    for r in review:
        print(f"  [review] {r['id']} «{r['title']}» {r['matched']}")
    print(f"\n出力: {OUT}")


if __name__ == "__main__":
    main()
