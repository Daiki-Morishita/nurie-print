#!/usr/bin/env python3
"""
削除した著作権侵害IP素材の画像を Supabase Storage materials バケットから削除。
入力: scripts/deleted_ip_images.json
"""
import os
import sys
import json
from pathlib import Path
from urllib.parse import urlparse
from supabase import create_client

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "scripts" / "deleted_ip_images.json"
BUCKET = "materials"

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hdhogsjmdowevijxooiq.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SECRET_KEY", "")
if not SUPABASE_KEY:
    for line in (ROOT / ".env.local").read_text(encoding="utf-8").splitlines():
        if line.startswith("SUPABASE_SECRET_KEY="):
            SUPABASE_KEY = line.split("=", 1)[1].strip().strip('"')
if not SUPABASE_KEY:
    print("ERROR: SUPABASE_SECRET_KEY 未設定", file=sys.stderr)
    sys.exit(1)

client = create_client(SUPABASE_URL, SUPABASE_KEY)
images = json.loads(IMG.read_text(encoding="utf-8"))

# URL から materials/ 以降のパスを抽出
prefix = f"/storage/v1/object/public/{BUCKET}/"
paths = []
for it in images:
    url = it.get("imageUrl") or ""
    p = urlparse(url).path
    idx = p.find(prefix)
    if idx == -1:
        print(f"⚠ パス抽出失敗: {it['id']} {url}")
        continue
    paths.append(p[idx + len(prefix):])

print(f"削除対象ファイル {len(paths)}件:")
for p in paths:
    print(f"  - {p}")

res = client.storage.from_(BUCKET).remove(paths)
print(f"\nStorage remove 応答: {len(res) if isinstance(res, list) else res}件処理")

# 削除確認: 各ファイルの存在チェック
remaining = []
for p in paths:
    try:
        client.storage.from_(BUCKET).download(p)
        remaining.append(p)
    except Exception:
        pass
if remaining:
    print(f"⚠ まだ存在: {remaining}")
else:
    print("✓ 全ファイル削除確認")
