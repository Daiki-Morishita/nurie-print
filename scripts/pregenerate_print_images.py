#!/usr/bin/env python3
"""
印刷用 3500px 高解像度画像を事前生成して Supabase Storage(print-hires) へ上げる。

背景:
  /api/print-image/[id] が sharp で元画像(約1536px)を都度 3500px に lanczos
  アップスケールして返していた。Vercel CDN が MISS を返し続け、リクエスト毎に
  770KB が Origin Transfer に流れて無料枠を超過した。
  → 3500px 版を事前生成して別バケットへ置き、route.ts はそこへリダイレクトするだけにする。

対象:
  featured もしくは indexReady の素材のみ（当面）。SVG は解像度非依存なのでスキップ。
  残りの素材はリダイレクト側で元画像にフォールバックする。

品質:
  既存 route.ts と同等。長辺3500px・LANCZOS・白背景フラット化・PNG。

実行:
  python3 scripts/pregenerate_print_images.py            # featured ∪ indexReady を生成
  python3 scripts/pregenerate_print_images.py --all      # 全素材
  python3 scripts/pregenerate_print_images.py --dry-run  # 対象一覧だけ表示
  python3 scripts/pregenerate_print_images.py --limit 5  # 先頭5件だけ（動作確認用）

既に print-hires に上がっているものはスキップ（レジューム可能）。
完了後、生成済みID一覧を src/lib/print-hires-ids.json に書き出す（route.ts が参照）。
"""
import argparse
import io
import json
import os
import re
import sys
from pathlib import Path

from PIL import Image
from supabase import create_client

REPO_DIR = Path(__file__).resolve().parent.parent
DATA_TS = REPO_DIR / "src" / "lib" / "data.ts"
MANIFEST = REPO_DIR / "src" / "lib" / "print-hires-ids.json"

SUPABASE_URL = "https://hdhogsjmdowevijxooiq.supabase.co"
HIRES_BUCKET = "print-hires"
LONG_EDGE = 3500

# --- env ---
SUPABASE_KEY = os.environ.get("SUPABASE_SECRET_KEY", "")
_env_file = REPO_DIR / ".env.local"
if not SUPABASE_KEY and _env_file.exists():
    for _line in _env_file.read_text().splitlines():
        if _line.startswith("SUPABASE_SECRET_KEY="):
            SUPABASE_KEY = _line.split("=", 1)[1].strip().strip('"')
            break
if not SUPABASE_KEY:
    print("ERROR: SUPABASE_SECRET_KEY が未設定（.env.local か環境変数）", file=sys.stderr)
    sys.exit(1)


def parse_materials():
    """data.ts から {id, imageUrl, featured, indexReady} を抽出。"""
    src = DATA_TS.read_text(encoding="utf-8")
    out = []
    for m in re.finditer(r"^    id: '([^']+)',", src, re.MULTILINE):
        mid = m.group(1)
        end = src.find("\n  },", m.start())
        block = src[m.start():end if end != -1 else len(src)]
        url_m = re.search(r"imageUrl:\s*'([^']*)'", block)
        out.append({
            "id": mid,
            "imageUrl": url_m.group(1) if url_m else "",
            "featured": "featured: true" in block,
            "indexReady": "indexReady: true" in block,
        })
    return out


def upscale_to_png(raw: bytes) -> bytes:
    """元画像を長辺3500pxへLANCZOSアップスケール・白背景フラット化してPNGに。"""
    img = Image.open(io.BytesIO(raw))
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
        img = Image.alpha_composite(bg, img).convert("RGB")
    else:
        img = img.convert("RGB")

    w, h = img.size
    scale = LONG_EDGE / max(w, h)
    new_size = (max(1, round(w * scale)), max(1, round(h * scale)))
    img = img.resize(new_size, Image.LANCZOS)

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--all", action="store_true", help="全素材を対象（既定は featured∪indexReady）")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=0, help="先頭N件だけ処理（0=無制限）")
    args = ap.parse_args()

    mats = parse_materials()
    targets = [
        m for m in mats
        if m["imageUrl"]
        and not m["imageUrl"].endswith(".svg")
        and (args.all or m["featured"] or m["indexReady"])
    ]
    print(f"全素材={len(mats)} / 対象={len(targets)} "
          f"(featured∪indexReady, SVG除く{'・全件' if args.all else ''})")

    if args.dry_run:
        for m in targets[: args.limit or len(targets)]:
            tag = "F" if m["featured"] else " "
            tag += "I" if m["indexReady"] else " "
            print(f"  [{tag}] {m['id']}")
        return

    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    try:
        client.storage.create_bucket(HIRES_BUCKET, options={"public": True})
        print(f"バケット '{HIRES_BUCKET}' を作成")
    except Exception as e:
        if any(s in str(e).lower() for s in ("already exists", "duplicate")):
            print(f"バケット '{HIRES_BUCKET}' は既存 — 続行")
        else:
            print(f"バケット作成エラー（続行）: {e}")

    existing = set()
    try:
        for f in client.storage.from_(HIRES_BUCKET).list():
            existing.add(f["name"])
    except Exception as e:
        print(f"既存リスト取得失敗（全件生成扱い）: {e}")
    print(f"既存アップロード済み: {len(existing)} 件")

    import urllib.request

    done_ids = set()  # バケットに存在する {id} 全部（manifest用）
    for name in existing:
        if name.endswith("-print.png"):
            done_ids.add(name[: -len("-print.png")])

    todo = targets[: args.limit] if args.limit else targets
    ok = skip = fail = 0
    for i, m in enumerate(todo):
        mid = m["id"]
        fname = f"{mid}-print.png"
        if fname in existing:
            skip += 1
            done_ids.add(mid)
            continue
        try:
            with urllib.request.urlopen(m["imageUrl"], timeout=60) as r:
                raw = r.read()
            out = upscale_to_png(raw)
            client.storage.from_(HIRES_BUCKET).upload(
                path=fname,
                file=out,
                file_options={
                    "content-type": "image/png",
                    "cache-control": "31536000",
                    "upsert": "true",
                },
            )
            ok += 1
            done_ids.add(mid)
            print(f"  [{i+1}/{len(todo)}] {mid}  {len(raw)//1024}KB→{len(out)//1024}KB")
        except Exception as e:
            fail += 1
            print(f"  失敗: {mid} — {e}")

    print(f"\n完了: 生成={ok} スキップ={skip} 失敗={fail}")

    # manifest 書き出し（route.ts が参照）
    MANIFEST.write_text(
        json.dumps(sorted(done_ids), ensure_ascii=False, indent=0) + "\n",
        encoding="utf-8",
    )
    print(f"manifest 更新: {MANIFEST.relative_to(REPO_DIR)} ({len(done_ids)} 件)")


if __name__ == "__main__":
    main()
