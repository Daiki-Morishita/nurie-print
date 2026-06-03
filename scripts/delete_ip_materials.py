#!/usr/bin/env python3
"""
著作権侵害キャラIP素材を data.ts から完全削除。
削除対象は ip_risk_report.json の severity=="high" のID。
削除前に imageUrl を回収し scripts/deleted_ip_images.json に保存
（Supabase Storage 削除に使う）。
"""
import re
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "lib" / "data.ts"
REPORT = ROOT / "scripts" / "ip_risk_report.json"
IMG_OUT = ROOT / "scripts" / "deleted_ip_images.json"

TARGET_IDS = {
    r["id"] for r in json.loads(REPORT.read_text(encoding="utf-8"))
    if r["severity"] == "high"
}
print(f"削除対象: {len(TARGET_IDS)}件 -> {sorted(TARGET_IDS)}")

src = DATA.read_text(encoding="utf-8")

# ブロック単位で走査し、対象IDのブロックを除去
out_parts = []
images = []
pos = 0
removed = []
while True:
    start = src.find("\n  {\n", pos)
    if start == -1:
        out_parts.append(src[pos:])
        break
    end = src.find("\n  },\n", start)
    if end == -1:
        out_parts.append(src[pos:])
        break
    block = src[start:end + 6]
    mid = re.search(r"id: '([^']+)'", block)
    bid = mid.group(1) if mid else None
    if bid in TARGET_IDS:
        # 直前テキスト（前ブロック末尾〜このブロック開始）は保持
        out_parts.append(src[pos:start])
        murl = re.search(r"imageUrl: '([^']+)'", block)
        images.append({"id": bid, "imageUrl": murl.group(1) if murl else None})
        removed.append(bid)
        pos = end + 6  # ブロック丸ごとスキップ（"\n  },\n" 含む）
    else:
        out_parts.append(src[pos:end + 6])
        pos = end + 6

new_src = "".join(out_parts)
DATA.write_text(new_src, encoding="utf-8")
IMG_OUT.write_text(json.dumps(images, ensure_ascii=False, indent=2), encoding="utf-8")

print(f"削除完了: {len(removed)}件")
for r in sorted(removed):
    print(f"  - {r}")
miss = TARGET_IDS - set(removed)
if miss:
    print(f"⚠ 未検出（要確認）: {sorted(miss)}")
print(f"画像URL保存: {IMG_OUT} ({len(images)}件)")
