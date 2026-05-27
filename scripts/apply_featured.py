#!/usr/bin/env python3
"""
featured_candidates.txt のIDに featured: true を data.ts に適用。

- 既存の `popular: true/false,` の直後に ` featured: true,` を挿入
- 既に featured フラグがある行はスキップ
- 候補にないエントリは触らない

実行:
  python3 scripts/apply_featured.py [--dry-run]
"""

import re
import sys
from pathlib import Path

DATA_TS = Path(__file__).resolve().parent.parent / "src" / "lib" / "data.ts"
CAND = Path(__file__).resolve().parent / "featured_candidates.txt"


def main(dry_run: bool = False):
    ids = [line.strip() for line in CAND.read_text(encoding="utf-8").splitlines() if line.strip()]
    print(f"候補ID数: {len(ids)}")

    src = DATA_TS.read_text(encoding="utf-8")

    added = 0
    skipped = 0
    not_found = []
    for mid in ids:
        # entry の開始位置
        m = re.search(rf"id:\s*'{re.escape(mid)}',", src)
        if not m:
            not_found.append(mid)
            continue
        # entry のブロック範囲 (この id から次の `\n  },` まで)
        start = m.start()
        end = src.find("\n  },", start)
        if end == -1:
            not_found.append(mid)
            continue
        block = src[start:end]
        if "featured:" in block:
            skipped += 1
            continue
        # popular: true/false, の直後に featured: true, を挿入
        new_block, n = re.subn(
            r"(popular:\s*(?:true|false),)",
            r"\1 featured: true,",
            block,
            count=1,
        )
        if n == 0:
            not_found.append(mid + " (popular field absent)")
            continue
        src = src[:start] + new_block + src[end:]
        added += 1

    print(f"追加: {added}")
    print(f"スキップ（既にfeatured）: {skipped}")
    print(f"見つからない: {len(not_found)}")
    if not_found[:10]:
        print(f"  例: {not_found[:10]}")

    if dry_run:
        print("\n[dry-run] data.ts は書き換えません")
        return

    DATA_TS.write_text(src, encoding="utf-8")
    print(f"\n書き換え完了: {DATA_TS}")


if __name__ == "__main__":
    main(dry_run="--dry-run" in sys.argv)
