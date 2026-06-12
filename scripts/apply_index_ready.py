#!/usr/bin/env python3
"""
厳選 indexReady 素材を data.ts に一括投入する。

scripts/index_ready_content.json の各 ID について:
  1. seoDescription が指定されていれば差し替え（画像と矛盾する記述の修正用）
  2. about: { ... } を画像固有テキストで挿入（既存の about は置換）
  3. indexReady: true を付与
そして src/lib/index-ready.ts の INDEX_READY_IDS を JSON のキー集合で再生成する。

data.ts の per-material フラグと index-ready.ts は必ず一致する（同じ JSON から両方を書く）。
一致は scripts/audit_index_pages.py が検証する。

実行:
  python3 scripts/apply_index_ready.py [--dry-run]
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_TS = ROOT / "src" / "lib" / "data.ts"
INDEX_READY_TS = ROOT / "src" / "lib" / "index-ready.ts"
CONTENT = Path(__file__).resolve().parent / "index_ready_content.json"

ABOUT_KEYS = ["featureDescription", "colorIdeas", "ageAim", "coloringTips", "printTips"]


def ts_str(s: str) -> str:
    """TS のシングルクオート文字列リテラルへ。"""
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"


def build_about_block(about: dict, indent: str) -> str:
    inner = []
    for k in ABOUT_KEYS:
        v = about.get(k)
        if v:
            inner.append(f"{indent}  {k}: {ts_str(v)},")
    return f"{indent}about: {{\n" + "\n".join(inner) + f"\n{indent}}},"


def find_entry(src: str, mid: str) -> tuple[int, int] | None:
    m = re.search(rf"id:\s*'{re.escape(mid)}',", src)
    if not m:
        return None
    start = src.rfind("{", 0, m.start())
    end = src.find("\n  },", m.start())
    if start == -1 or end == -1:
        return None
    return start, end  # end は閉じ "\n  }," の直前(= 最終フィールド行の末尾)


def apply_entry(src: str, mid: str, spec: dict) -> tuple[str, list[str]]:
    pos = find_entry(src, mid)
    if pos is None:
        return src, [f"{mid}: エントリ未検出"]
    start, end = pos
    block = src[start:end]
    notes = []

    # 1. seoDescription 差し替え
    if "seoDescription" in spec:
        new_seo = ts_str(spec["seoDescription"])
        if re.search(r"seoDescription:\s*'(?:[^'\\]|\\.)*'", block):
            block = re.sub(r"seoDescription:\s*'(?:[^'\\]|\\.)*'", f"seoDescription: {new_seo}", block, count=1)
            notes.append("seo差替")
        else:
            # popular 行の直前に追加（簡便のため createdAt の後ろ）
            block = re.sub(r"(createdAt:\s*'(?:[^'\\]|\\.)*',)", rf"\1 seoDescription: {new_seo},", block, count=1)
            notes.append("seo追加")

    # 2. about ブロック（既存があれば丸ごと置換）
    about_block = build_about_block(spec["about"], "    ")
    if re.search(r"\n\s*about:\s*\{", block):
        block = re.sub(r"\n\s*about:\s*\{.*?\n\s*\},", "\n    " + about_block, block, count=1, flags=re.DOTALL)
        notes.append("about置換")
    else:
        block = block.rstrip()
        if not block.endswith(","):
            block += ","
        block += "\n    " + about_block
        notes.append("about追加")

    # 3. indexReady: true
    if "indexReady:" not in block:
        m = re.search(r"(popular:\s*(?:true|false),)", block)
        if m:
            block = block[:m.end()] + " indexReady: true," + block[m.end():]
            notes.append("indexReady付与")
        else:
            block = block.rstrip().rstrip(",") + ",\n    indexReady: true,"
            notes.append("indexReady付与(末尾)")
    else:
        block = re.sub(r"indexReady:\s*(?:true|false),", "indexReady: true,", block, count=1)

    return src[:start] + block + src[end:], notes


def regen_index_ready_ts(ids: list[str]) -> str:
    lines = ",\n".join(f"  '{i}'" for i in ids)
    body = (
        "/**\n"
        " * index 解禁済み素材 ID（リンク層の crawl 判定専用・単一の真実源）。\n"
        " *\n"
        " * このファイルは scripts/apply_index_ready.py が data.ts の indexReady と同時に生成する。\n"
        " * 手で編集せず、scripts/index_ready_content.json を更新して再生成すること。\n"
        " * data.ts の indexReady と本 Set の一致は scripts/audit_index_pages.py が検証する。\n"
        " *\n"
        " * なぜ data.ts と別モジュールなのか: data.ts は数MBの巨大配列で、MaterialCard 等の\n"
        " * クライアント境界に import すると配列ごとクライアントバンドルに載ってしまう。\n"
        " * リンク層が必要とするのは ID の Set だけなので、ここに切り出している。\n"
        " */\n"
        "export const INDEX_READY_IDS: ReadonlySet<string> = new Set<string>([\n"
        f"{lines}\n"
        "])\n\n"
        "export function isIndexReadyId(id: string): boolean {\n"
        "  return INDEX_READY_IDS.has(id)\n"
        "}\n\n"
        "/**\n"
        " * 素材ページへの内部リンク用 rel。\n"
        " * index 解禁済み = follow（crawl 許可）、それ以外 = nofollow（巡回を最小化）。\n"
        " * 非 indexReady ページを完全に孤立させはせず、リンク自体は残して文脈だけ保つ。\n"
        " */\n"
        "export function relForMaterialLink(id: string): 'nofollow' | undefined {\n"
        "  return INDEX_READY_IDS.has(id) ? undefined : 'nofollow'\n"
        "}\n"
    )
    return body


def main(dry: bool):
    content = json.loads(CONTENT.read_text(encoding="utf-8"))
    ids = list(content.keys())
    src = DATA_TS.read_text(encoding="utf-8")

    applied = 0
    for mid, spec in content.items():
        src, notes = apply_entry(src, mid, spec)
        ok = "未検出" not in " ".join(notes)
        applied += 1 if ok else 0
        print(f"  {mid:28} {'/'.join(notes)}")

    ts = regen_index_ready_ts(ids)

    if dry:
        print(f"\n[dry-run] data.ts 適用 {applied}/{len(ids)} 件・index-ready.ts は書き換えません")
        return

    DATA_TS.write_text(src, encoding="utf-8")
    INDEX_READY_TS.write_text(ts, encoding="utf-8")
    print(f"\n書き換え完了: data.ts ({applied}/{len(ids)} 件) + index-ready.ts ({len(ids)} ID)")


if __name__ == "__main__":
    main(dry="--dry-run" in sys.argv)
