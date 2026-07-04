#!/usr/bin/env python3
"""
迷路一覧(/maze)用のサムネイルPNGを事前生成して Supabase Storage(maze-thumbs) へ上げる。

背景:
  /maze の一覧ページが、320件全ての迷路SVGを buildMazeSvg() で生成し
  dangerouslySetInnerHTML でHTMLに直接埋め込んでいたため、HTMLが1.97MBに肥大化していた
  （index対象ページとしては品質異常）。
  → 事前にPNGサムネを生成してSupabaseへ置き、一覧は<img>参照だけにする。

svg.ts (buildMazeSvg) のロジックをPythonに移植（solution描画は一覧に不要なため省略）。
壁の座標計算ロジックは src/lib/maze/svg.ts の buildGridSvg / buildPolarSvg と同一にすること。

実行:
  python3 scripts/pregenerate_maze_thumbs.py            # 全件生成（既存はスキップ）
  python3 scripts/pregenerate_maze_thumbs.py --dry-run  # 対象件数だけ表示
  python3 scripts/pregenerate_maze_thumbs.py --force    # 既存も再生成
"""
from __future__ import annotations

import argparse
import io
import json
import math
import os
import sys
from pathlib import Path

import cairosvg
from supabase import create_client

REPO_DIR = Path(__file__).resolve().parent.parent
DATA_JSON = REPO_DIR / "src" / "lib" / "maze" / "data.json"

SUPABASE_URL = "https://hdhogsjmdowevijxooiq.supabase.co"
BUCKET = "maze-thumbs"

CELL = 42
WALL = 6
STROKE = "#2A1E22"
LONG_EDGE = 480  # サムネの長辺px

SUPABASE_KEY = os.environ.get("SUPABASE_SECRET_KEY", "")
_env_file = REPO_DIR / ".env.local"
if not SUPABASE_KEY and _env_file.exists():
    for _line in _env_file.read_text().splitlines():
        if _line.startswith("SUPABASE_SECRET_KEY="):
            SUPABASE_KEY = _line.split("=", 1)[1].strip().strip('"')
            break


def build_grid_svg(m: dict) -> tuple[str, float, float]:
    """src/lib/maze/svg.ts buildGridSvg の移植（solution層は省略）。"""
    cols, rows = m["cols"], m["rows"]
    walls, valid = m["walls"], m["valid"]
    sx, sy = m["start_cell"]
    gx, gy = m["goal_cell"]
    start_side, goal_side = m["start_side"], m["goal_side"]

    inner: list[str] = []
    outer: list[str] = []

    for x in range(cols):
        for y in range(rows):
            if not valid[x][y]:
                continue
            px, py = x * CELL, y * CELL
            cell = walls[x][y]

            if "N" in cell:
                neighbor_valid = y > 0 and valid[x][y - 1]
                is_start = x == sx and y == sy and start_side == "N"
                is_goal = x == gx and y == gy and goal_side == "N"
                if not (is_start or is_goal):
                    line = f"M{px} {py} L{px + CELL} {py}"
                    (inner if neighbor_valid else outer).append(line)

            if "S" in cell:
                neighbor_valid = y < rows - 1 and valid[x][y + 1]
                is_start = x == sx and y == sy and start_side == "S"
                is_goal = x == gx and y == gy and goal_side == "S"
                if not (is_start or is_goal) and not neighbor_valid:
                    outer.append(f"M{px} {py + CELL} L{px + CELL} {py + CELL}")

            if "W" in cell:
                neighbor_valid = x > 0 and valid[x - 1][y]
                is_start = x == sx and y == sy and start_side == "W"
                is_goal = x == gx and y == gy and goal_side == "W"
                if not (is_start or is_goal):
                    line = f"M{px} {py} L{px} {py + CELL}"
                    (inner if neighbor_valid else outer).append(line)

            if "E" in cell:
                neighbor_valid = x < cols - 1 and valid[x + 1][y]
                is_start = x == sx and y == sy and start_side == "E"
                is_goal = x == gx and y == gy and goal_side == "E"
                if not (is_start or is_goal) and not neighbor_valid:
                    outer.append(f"M{px + CELL} {py} L{px + CELL} {py + CELL}")

    pad = WALL
    vb_w = cols * CELL + pad * 2
    vb_h = rows * CELL + pad * 2
    svg = (
        f'<svg viewBox="-{pad} -{pad} {vb_w} {vb_h}" xmlns="http://www.w3.org/2000/svg">'
        f'<path d="{" ".join(inner)}" stroke="{STROKE}" stroke-width="{WALL}" '
        f'stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
        f'<path d="{" ".join(outer)}" stroke="{STROKE}" stroke-width="{WALL}" '
        f'stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
        f"</svg>"
    )
    return svg, float(vb_w), float(vb_h)


def build_polar_svg(m: dict) -> tuple[str, float, float]:
    """src/lib/maze/svg.ts buildPolarSvg の移植（solution層は省略）。"""
    rings, sectors = m["rings"], m["sectors"]
    circle_walls = m["circle_walls"]
    sr, ss = m["start_cell"]
    gr, gs = m["goal_cell"]
    start_side, goal_side = m["start_side"], m["goal_side"]

    CENTER_R = 32
    RING_W = 28
    CHAR_SPACE = RING_W * 1.6
    outer_r = CENTER_R + rings * RING_W
    vb = outer_r + CHAR_SPACE + 6
    sector_angle = (2 * math.pi) / sectors

    def pt(r: float, theta: float) -> tuple[float, float]:
        return r * math.cos(theta), r * math.sin(theta)

    def arc_path(r: float, t1: float, t2: float) -> str:
        x1, y1 = pt(r, t1)
        x2, y2 = pt(r, t2)
        large_arc = 1 if abs(t2 - t1) > math.pi else 0
        return f"M {x1:.2f} {y1:.2f} A {r} {r} 0 {large_arc} 1 {x2:.2f} {y2:.2f}"

    def line_path(r1: float, r2: float, theta: float) -> str:
        x1, y1 = pt(r1, theta)
        x2, y2 = pt(r2, theta)
        return f"M {x1:.2f} {y1:.2f} L {x2:.2f} {y2:.2f}"

    paths: list[str] = []
    for r in range(rings):
        for s in range(sectors):
            cell = circle_walls[r][s]
            t1 = s * sector_angle
            t2 = (s + 1) * sector_angle
            r_in = CENTER_R + r * RING_W
            r_out = CENTER_R + (r + 1) * RING_W

            if "IN" in cell:
                is_start = r == sr and s == ss and start_side == "IN"
                is_goal = r == gr and s == gs and goal_side == "IN"
                if not is_start and not is_goal:
                    paths.append(arc_path(r_in, t1, t2))
            if "OUT" in cell:
                is_start = r == sr and s == ss and start_side == "OUT"
                is_goal = r == gr and s == gs and goal_side == "OUT"
                if not is_start and not is_goal:
                    paths.append(arc_path(r_out, t1, t2))
            if "CW" in cell:
                paths.append(line_path(r_in, r_out, t2))

    svg = (
        f'<svg viewBox="{-vb} {-vb} {vb * 2} {vb * 2}" xmlns="http://www.w3.org/2000/svg">'
        f'<path d="{" ".join(paths)}" stroke="{STROKE}" stroke-width="{WALL}" '
        f'stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
        f"</svg>"
    )
    return svg, vb * 2, vb * 2


def render_png(m: dict) -> bytes:
    if m["shape"] == "circle":
        svg, vb_w, vb_h = build_polar_svg(m)
    else:
        svg, vb_w, vb_h = build_grid_svg(m)
    scale = LONG_EDGE / max(vb_w, vb_h)
    return cairosvg.svg2png(
        bytestring=svg.encode("utf-8"),
        output_width=round(vb_w * scale),
        output_height=round(vb_h * scale),
    )


def iter_mazes(dataset: dict):
    for shape, buckets in dataset.items():
        for diff, arr in buckets.items():
            for m in arr:
                yield m


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true", help="既存も再生成")
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    dataset = json.loads(DATA_JSON.read_text(encoding="utf-8"))
    mazes = list(iter_mazes(dataset))
    print(f"迷路総数: {len(mazes)}")

    if args.dry_run:
        for m in mazes[: args.limit or len(mazes)]:
            print(f"  {m['slug']}")
        return

    if not SUPABASE_KEY:
        print("ERROR: SUPABASE_SECRET_KEY が未設定（.env.local か環境変数）", file=sys.stderr)
        sys.exit(1)

    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    try:
        client.storage.create_bucket(BUCKET, options={"public": True})
        print(f"バケット '{BUCKET}' を作成")
    except Exception as e:
        if any(s in str(e).lower() for s in ("already exists", "duplicate")):
            print(f"バケット '{BUCKET}' は既存 — 続行")
        else:
            print(f"バケット作成エラー（続行）: {e}")

    existing: set[str] = set()
    if not args.force:
        try:
            for f in client.storage.from_(BUCKET).list(options={"limit": 1000}):
                existing.add(f["name"])
        except Exception as e:
            print(f"既存リスト取得失敗（全件生成扱い）: {e}")

    todo = mazes[: args.limit] if args.limit else mazes
    ok = skip = fail = 0
    for i, m in enumerate(todo):
        fname = f"{m['slug']}.png"
        if fname in existing:
            skip += 1
            continue
        try:
            png = render_png(m)
            client.storage.from_(BUCKET).upload(
                path=fname,
                file=png,
                file_options={
                    "content-type": "image/png",
                    "cache-control": "31536000",
                    "upsert": "true",
                },
            )
            ok += 1
            if (i + 1) % 20 == 0 or i == len(todo) - 1:
                print(f"  [{i + 1}/{len(todo)}] {m['slug']}  {len(png) // 1024}KB")
        except Exception as e:
            fail += 1
            print(f"  失敗: {m['slug']} — {e}")

    print(f"\n完了: 生成={ok} スキップ={skip} 失敗={fail}")


if __name__ == "__main__":
    main()
