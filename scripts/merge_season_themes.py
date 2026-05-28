#!/usr/bin/env python3
"""
data.ts の theme: 'autumn' / 'winter' を 'seasonal-events' に統合。
"""

import re
from pathlib import Path

DATA_TS = Path(__file__).resolve().parent.parent / "src" / "lib" / "data.ts"


def main():
    src = DATA_TS.read_text(encoding="utf-8")
    a_count = len(re.findall(r"theme: 'autumn'", src))
    w_count = len(re.findall(r"theme: 'winter'", src))
    src = src.replace("theme: 'autumn'", "theme: 'seasonal-events'")
    src = src.replace("theme: 'winter'", "theme: 'seasonal-events'")
    DATA_TS.write_text(src, encoding="utf-8")
    print(f"autumn → seasonal-events: {a_count}件")
    print(f"winter → seasonal-events: {w_count}件")
    print(f"統合計: {a_count + w_count}件")


if __name__ == "__main__":
    main()
