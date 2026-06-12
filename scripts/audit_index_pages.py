#!/usr/bin/env python3
"""
再申請前ゲート: indexReady 素材の本文を実機相当で機械監査する。

測定項目（1件でも未達なら再申請ブロック＝exit 1）:
  1. 固有本文の総字数 >= MIN_CHARS (450)
  2. 画像固有の具体描写 >= MIN_FACTS (3)  ※ヒューリスティック。人手スポットチェック前提
  3. テンプレ共通定数（theme-insights.ts の既知文）の混入が無いこと
  4. 同テーマ内の本文一致率 < MAX_SIMILARITY (0.40)
  5. data.ts の indexReady 集合 == src/lib/index-ready.ts の INDEX_READY_IDS（ズレ検出）

indexReady ページの本文は materials/[id]/page.tsx の indexReady 分岐に対応:
  seoDescription + about.featureDescription + about.colorIdeas
  + about.ageAim + about.coloringTips + about.printTips
（テーマ共通定数 themeStrength / coloringGuide / ENJOY_AT_HOME は描画されない）

使い方:
  python3 scripts/audit_index_pages.py            # 監査して結果表示
  python3 scripts/audit_index_pages.py --json      # 機械可読出力
"""

from __future__ import annotations

import json
import re
import sys
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_TS = ROOT / "src" / "lib" / "data.ts"
INDEX_READY_TS = ROOT / "src" / "lib" / "index-ready.ts"
THEME_INSIGHTS_TS = ROOT / "src" / "lib" / "theme-insights.ts"

MIN_CHARS = 450
MIN_FACTS = 3
MAX_SIMILARITY = 0.40
TEMPLATE_MIN_LEN = 18  # これ以上の長さのテンプレ文を「混入」判定に使う

ABOUT_FIELDS = ["featureDescription", "colorIdeas", "ageAim", "coloringTips", "printTips"]
BODY_FIELDS = ["seoDescription"] + ABOUT_FIELDS

# 画像を「実際に見ないと書けない」具体描写の手がかり語（固有事実カウント用ヒューリスティック）
FACT_MARKERS = [
    "左", "右", "上", "下", "手前", "奥", "中央", "となり", "横", "後ろ", "前",
    "本", "匹", "頭", "つ", "個", "枚", "輪",
    "細い", "太い", "丸い", "曲線", "直線", "とがった", "大きな", "小さな",
    "余白", "うす", "なぞ", "線が", "輪郭",
]
NUM_RE = re.compile(r"[0-9０-９一二三四五六七八九十]")


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def js_str(block: str, key: str) -> str | None:
    """block 内の `key: '....'` を1つ抽出（エスケープ対応）。"""
    m = re.search(rf"(?<![A-Za-z]){re.escape(key)}:\s*'((?:[^'\\]|\\.)*)'", block)
    if not m:
        return None
    return m.group(1).encode().decode("unicode_escape") if "\\" in m.group(1) else m.group(1)


def parse_index_ready_materials(src: str) -> list[dict]:
    """data.ts から indexReady: true のエントリを抽出。"""
    out = []
    for m in re.finditer(r"id:\s*'([a-zA-Z0-9\-]+)',", src):
        start = m.start()
        end = src.find("\n  },", start)
        if end == -1:
            continue
        block = src[start:end]
        if not re.search(r"\bindexReady:\s*true\b", block):
            continue
        entry = {
            "id": m.group(1),
            "title": js_str(block, "title") or "",
            "theme": js_str(block, "theme") or "",
        }
        for f in BODY_FIELDS:
            entry[f] = js_str(block, f) or ""
        out.append(entry)
    return out


def parse_index_ready_ids_ts(src: str) -> set[str]:
    """index-ready.ts の INDEX_READY_IDS の中身を抽出。"""
    m = re.search(r"new Set<string>\(\[(.*?)\]\)", src, re.DOTALL)
    if not m:
        return set()
    return set(re.findall(r"'([a-zA-Z0-9\-]+)'", m.group(1)))


def extract_template_strings(src: str) -> list[str]:
    """theme-insights.ts の長い文字列リテラル（テンプレ定数）を回収。"""
    lits = re.findall(r"'((?:[^'\\]|\\.)*)'", src)
    lits += re.findall(r"`([^`]*)`", src)
    out = []
    for s in lits:
        s = s.encode().decode("unicode_escape") if "\\" in s else s
        s = s.strip()
        if len(s) >= TEMPLATE_MIN_LEN:
            out.append(s)
    return out


def char_count(text: str) -> int:
    return len(re.sub(r"\s", "", text))


def count_facts(entry: dict) -> int:
    """固有事実数ヒューリスティック: 具体描写文の数。"""
    src_text = " ".join(entry[f] for f in ["featureDescription", "coloringTips", "printTips"])
    sentences = [s for s in re.split(r"[。\n]", src_text) if s.strip()]
    facts = 0
    for s in sentences:
        if any(mk in s for mk in FACT_MARKERS) or NUM_RE.search(s):
            facts += 1
    return facts


def body_text(entry: dict) -> str:
    return "".join(entry[f] for f in BODY_FIELDS)


def template_leaks(entry: dict, templates: list[str]) -> list[str]:
    body = body_text(entry)
    hits = []
    for t in templates:
        # 双方向の部分一致（テンプレ文が固有本文に紛れ込んでいないか）
        if t in body or (len(body) >= TEMPLATE_MIN_LEN and body in t):
            hits.append(t[:30] + "…")
    return hits


def audit() -> dict:
    data_src = read(DATA_TS)
    materials = parse_index_ready_materials(data_src)
    templates = extract_template_strings(read(THEME_INSIGHTS_TS))

    ids_data = {m["id"] for m in materials}
    ids_ts = parse_index_ready_ids_ts(read(INDEX_READY_TS))
    drift_only_data = sorted(ids_data - ids_ts)
    drift_only_ts = sorted(ids_ts - ids_data)

    results = []
    by_theme: dict[str, list[dict]] = {}
    for m in materials:
        by_theme.setdefault(m["theme"], []).append(m)

    # 同テーマ内 最大一致率
    max_sim: dict[str, float] = {}
    sim_partner: dict[str, str] = {}
    for theme, group in by_theme.items():
        for i in range(len(group)):
            for j in range(i + 1, len(group)):
                a, b = group[i], group[j]
                r = SequenceMatcher(None, body_text(a), body_text(b)).ratio()
                if r > max_sim.get(a["id"], 0):
                    max_sim[a["id"]], sim_partner[a["id"]] = r, b["id"]
                if r > max_sim.get(b["id"], 0):
                    max_sim[b["id"]], sim_partner[b["id"]] = r, a["id"]

    for m in materials:
        chars = char_count(body_text(m))
        facts = count_facts(m)
        leaks = template_leaks(m, templates)
        sim = max_sim.get(m["id"], 0.0)
        fails = []
        if chars < MIN_CHARS:
            fails.append(f"字数{chars}<{MIN_CHARS}")
        if facts < MIN_FACTS:
            fails.append(f"固有事実{facts}<{MIN_FACTS}")
        if leaks:
            fails.append(f"テンプレ混入{len(leaks)}件")
        if sim >= MAX_SIMILARITY:
            fails.append(f"同テーマ一致率{sim:.0%}≥{MAX_SIMILARITY:.0%}(vs {sim_partner.get(m['id'])})")
        # about 必須サブフィールド欠落（画像固有値が空）
        empty_about = [f for f in ABOUT_FIELDS if not m[f].strip()]
        if empty_about:
            fails.append("about空:" + ",".join(empty_about))
        results.append({
            "id": m["id"], "theme": m["theme"], "title": m["title"],
            "chars": chars, "facts": facts, "leaks": leaks,
            "similarity": round(sim, 3), "empty_about": empty_about,
            "fails": fails, "ok": not fails,
        })

    drift_ok = not drift_only_data and not drift_only_ts
    all_ok = drift_ok and all(r["ok"] for r in results)
    return {
        "count": len(materials),
        "passed": sum(1 for r in results if r["ok"]),
        "failed": sum(1 for r in results if not r["ok"]),
        "drift_ok": drift_ok,
        "drift_only_data": drift_only_data,
        "drift_only_ts": drift_only_ts,
        "results": results,
        "all_ok": all_ok,
    }


def main():
    rep = audit()
    if "--json" in sys.argv:
        print(json.dumps(rep, ensure_ascii=False, indent=2))
        sys.exit(0 if rep["all_ok"] else 1)

    print(f"== indexReady 監査 ==  対象 {rep['count']} 件 / 合格 {rep['passed']} / 不合格 {rep['failed']}")
    if not rep["drift_ok"]:
        print("‼ 同期ズレ: data.ts と index-ready.ts の indexReady 集合が不一致")
        if rep["drift_only_data"]:
            print("   data.ts のみ:", rep["drift_only_data"])
        if rep["drift_only_ts"]:
            print("   index-ready.ts のみ:", rep["drift_only_ts"])
    if rep["count"] == 0:
        print("（indexReady 0 件。P3 固有化が未着手のため監査対象なし。機構は正常）")

    for r in rep["results"]:
        mark = "✅" if r["ok"] else "❌"
        print(f"{mark} {r['id']:28} [{r['theme']:10}] 字数{r['chars']:4} 固有事実{r['facts']} 一致率{r['similarity']:.0%}")
        if not r["ok"]:
            print("     →", " / ".join(r["fails"]))

    if rep["all_ok"] and rep["count"] > 0:
        print("\n結果: PASS — 全 indexReady ページが基準を満たす。再申請可。")
    elif rep["count"] == 0:
        print("\n結果: N/A — 対象0件。")
    else:
        print(f"\n結果: BLOCK — {rep['failed']} 件が基準未達。再申請前に修正必須。")
    sys.exit(0 if rep["all_ok"] else 1)


if __name__ == "__main__":
    main()
