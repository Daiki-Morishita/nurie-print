#!/usr/bin/env python3
"""
全素材の画像をDLしてMD5計算、重複画像をグループ化して JSON 出力。

出力:
  scripts/duplicate_images.json  — 同一ハッシュのグループ（2件以上）
  scripts/broken_images.json     — 404・0バイトの素材
  scripts/image_hashes.json      — 全 (id, hash, size) のキャッシュ（resumable）

実行:
  python3 scripts/detect_duplicate_images.py [--theme densha] [--workers 20]
"""

import os
import re
import json
import hashlib
import argparse
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_TS = ROOT / "src" / "lib" / "data.ts"
HASH_CACHE = ROOT / "scripts" / "image_hashes.json"
DUP_OUT = ROOT / "scripts" / "duplicate_images.json"
BROKEN_OUT = ROOT / "scripts" / "broken_images.json"


def parse_materials(src: str):
    """data.ts から (id, theme, imageUrl) を抽出"""
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
        m_id = re.search(r"id: '([^']+)'", block)
        m_url = re.search(r"imageUrl: '([^']+)'", block)
        m_theme = re.search(r"theme: '([^']+)'", block)
        if m_id and m_url:
            out.append({
                "id": m_id.group(1),
                "theme": m_theme.group(1) if m_theme else "",
                "url": m_url.group(1),
            })
    return out


def hash_image(url: str, timeout: int = 12):
    """画像をDLしてMD5を返す。エラーは status='broken' で返す"""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "nurie-print-dup-scan/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status >= 400:
                return {"status": "broken", "code": resp.status}
            data = resp.read(50_000_000)
        if len(data) == 0:
            return {"status": "broken", "code": "0bytes"}
        return {"status": "ok", "hash": hashlib.md5(data).hexdigest(), "size": len(data)}
    except urllib.error.HTTPError as e:
        return {"status": "broken", "code": e.code}
    except Exception as e:
        return {"status": "broken", "code": str(e)[:60]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--theme", help="特定テーマのみスキャン")
    ap.add_argument("--workers", type=int, default=25)
    ap.add_argument("--limit", type=int, help="上限件数（テスト用）")
    args = ap.parse_args()

    src = DATA_TS.read_text(encoding="utf-8")
    materials = parse_materials(src)
    if args.theme:
        materials = [m for m in materials if m["theme"] == args.theme]
    if args.limit:
        materials = materials[:args.limit]
    print(f"対象: {len(materials)}件")

    # キャッシュ読込（resumable）
    cache = {}
    if HASH_CACHE.exists():
        cache = json.loads(HASH_CACHE.read_text(encoding="utf-8"))
        print(f"キャッシュ: {len(cache)}件")

    todo = [m for m in materials if m["id"] not in cache]
    print(f"未処理: {len(todo)}件")

    done = 0
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        fut_map = {ex.submit(hash_image, m["url"]): m for m in todo}
        for fut in as_completed(fut_map):
            m = fut_map[fut]
            try:
                result = fut.result()
            except Exception as e:
                result = {"status": "broken", "code": str(e)[:60]}
            cache[m["id"]] = {"theme": m["theme"], "url": m["url"], **result}
            done += 1
            if done % 50 == 0:
                # 中間保存
                HASH_CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
                print(f"  ... {done}/{len(todo)} 処理済み")
    HASH_CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n総処理: {done}件 / 累計 {len(cache)}件")

    # 重複グループ化
    by_hash = {}
    broken = []
    for mid, info in cache.items():
        if info.get("status") == "ok" and info.get("hash"):
            by_hash.setdefault(info["hash"], []).append({
                "id": mid,
                "theme": info["theme"],
                "size": info["size"],
            })
        elif info.get("status") == "broken":
            broken.append({"id": mid, "theme": info["theme"], "code": info.get("code")})

    dup_groups = []
    for h, items in by_hash.items():
        if len(items) > 1:
            items_sorted = sorted(items, key=lambda x: x["id"])
            theme_set = sorted({i["theme"] for i in items_sorted})
            dup_groups.append({
                "hash": h,
                "size": items_sorted[0]["size"],
                "count": len(items_sorted),
                "themes": theme_set,
                "ids": [i["id"] for i in items_sorted],
            })
    dup_groups.sort(key=lambda g: -g["count"])

    DUP_OUT.write_text(json.dumps(dup_groups, ensure_ascii=False, indent=2), encoding="utf-8")
    BROKEN_OUT.write_text(json.dumps(broken, ensure_ascii=False, indent=2), encoding="utf-8")

    total_dup_excess = sum(g["count"] - 1 for g in dup_groups)
    print(f"\n=== 結果 ===")
    print(f"重複グループ: {len(dup_groups)}")
    print(f"重複除外対象（2件目以降）: {total_dup_excess}件")
    print(f"壊れた画像: {len(broken)}件")
    print(f"出力: {DUP_OUT.name} / {BROKEN_OUT.name}")
    print()
    print("上位5重複グループ:")
    for g in dup_groups[:5]:
        print(f"  hash={g['hash'][:12]}... count={g['count']} themes={g['themes']} sample={g['ids'][0]}")


if __name__ == "__main__":
    main()
