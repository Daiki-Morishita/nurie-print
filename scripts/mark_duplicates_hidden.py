#!/usr/bin/env python3
"""
duplicate_images.json と broken_images.json から、
data.ts の該当エントリの imageStatus を 'duplicate' / 'broken' に書き換える。

重複グループの「先頭1件のみ残し、2件目以降」を duplicate にする。
壊れた画像 (404, 0バイト) は broken にする。
両方とも featured: true は除去する。
"""

import re
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_TS = ROOT / "src" / "lib" / "data.ts"
DUP_JSON = ROOT / "scripts" / "duplicate_images.json"
BROKEN_JSON = ROOT / "scripts" / "broken_images.json"


def update_entry(src: str, mid: str, new_status: str):
    pattern = re.compile(
        rf"(id: '{re.escape(mid)}'[^}}]*?)imageStatus: '[^']*'",
        re.DOTALL,
    )
    src_new, n = pattern.subn(rf"\1imageStatus: '{new_status}'", src, count=1)
    if n == 0:
        return src, False
    feat_pattern = re.compile(
        rf"(id: '{re.escape(mid)}'[^}}]*?), featured: true",
        re.DOTALL,
    )
    src_new, _ = feat_pattern.subn(r"\1", src_new, count=1)
    return src_new, True


def main():
    src = DATA_TS.read_text(encoding="utf-8")

    dup_groups = json.loads(DUP_JSON.read_text(encoding="utf-8"))
    dup_targets = []
    for g in dup_groups:
        for mid in g["ids"][1:]:
            dup_targets.append((mid, g["hash"][:8]))

    broken = json.loads(BROKEN_JSON.read_text(encoding="utf-8"))
    broken_targets = [(b["id"], b.get("code")) for b in broken]

    dup_done = 0
    dup_skip = []
    for mid, _h in dup_targets:
        src, ok = update_entry(src, mid, "duplicate")
        if ok:
            dup_done += 1
        else:
            dup_skip.append(mid)

    broken_done = 0
    broken_skip = []
    for mid, _code in broken_targets:
        src, ok = update_entry(src, mid, "broken")
        if ok:
            broken_done += 1
        else:
            broken_skip.append(mid)

    DATA_TS.write_text(src, encoding="utf-8")

    print(f"=== 結果 ===")
    print(f"重複→duplicate: {dup_done}件 / 対象 {len(dup_targets)} / スキップ {len(dup_skip)}")
    print(f"壊れ→broken:    {broken_done}件 / 対象 {len(broken_targets)} / スキップ {len(broken_skip)}")
    if dup_skip[:5]:
        print(f"重複スキップ例: {dup_skip[:5]}")
    if broken_skip[:5]:
        print(f"壊れスキップ例: {broken_skip[:5]}")


if __name__ == "__main__":
    main()
