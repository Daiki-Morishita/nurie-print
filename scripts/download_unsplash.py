#!/usr/bin/env python3
"""
Unsplash からコラム用画像をダウンロード。

使い方:
  python3 scripts/download_unsplash.py              # 全画像
  python3 scripts/download_unsplash.py --id col13-hero
  python3 scripts/download_unsplash.py --list

仕組み:
  - Chrome CDP（localhost:9222）を経由して Unsplash 検索ページを開く
  - 検索結果の最初の画像URLを抽出
  - そのURLから直接 HTTP で画像をダウンロード（imagesサブドメインは Chrome 不要）
  - public/columns/{filename}.jpg に保存

Unsplash ライセンス: 無料・商用利用可・出典明示不要（推奨ではある）
  https://unsplash.com/license

ChromeでShutterstock タブが残ってても OK。新しいタブで Unsplash を開く。
"""

import os, sys, time, re, argparse, urllib.request, urllib.parse
from pathlib import Path
from playwright.sync_api import sync_playwright, Page

REPO_DIR = Path(__file__).parent.parent
OUT_DIR  = REPO_DIR / "public" / "columns"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# col13-col36 の24件（Shutterstockスクリプトと同じクエリ）
IMAGES = [
    ("col13-hero", "children playing outdoors park",                "col13-hero.jpg", "外遊び"),
    ("col14-hero", "preschool counting numbers blocks",             "col14-hero.jpg", "数字学習"),
    ("col15-hero", "child drawing creative art",                    "col15-hero.jpg", "自由描画"),
    ("col16-hero", "young child focused activity",                  "col16-hero.jpg", "集中"),
    ("col17-hero", "shy child art activity",                        "col17-hero.jpg", "苦手サポート"),
    ("col18-hero", "child writing letters practice",                "col18-hero.jpg", "ひらがな練習"),
    ("col19-hero", "four year old child coloring",                  "col19-hero.jpg", "4歳ぬりえ"),
    ("col20-hero", "child morning routine learning",                "col20-hero.jpg", "毎日の習慣"),
    ("col21-hero", "child worksheet dot to dot",                    "col21-hero.jpg", "点つなぎ"),
    ("col22-hero", "toddler coloring crayon",                       "col22-hero.jpg", "2歳ぬりえ"),
    ("col23-hero", "child painting colors",                         "col23-hero.jpg", "色の学習"),
    ("col24-hero", "child writing numbers practice",                "col24-hero.jpg", "数字書き方"),
    ("col25-hero", "child sand water play",                         "col25-hero.jpg", "感覚遊び"),
    ("col26-hero", "kids autumn winter activities",                 "col26-hero.jpg", "季節のテーマ"),
    ("col27-hero", "child scribble drawing art",                    "col27-hero.jpg", "絵の発達段階"),
    ("col28-hero", "kindergarten animals learning",                 "col28-hero.jpg", "動物学習"),
    ("col29-hero", "child school pencil writing",                   "col29-hero.jpg", "就学準備"),
    ("col30-hero", "children group craft activity",                 "col30-hero.jpg", "集団工作"),
    ("col31-hero", "child dinosaur toy learning",                   "col31-hero.jpg", "恐竜学習"),
    ("col32-hero", "summer kids beach activities",                  "col32-hero.jpg", "夏の工作"),
    ("col33-hero", "child hands fine motor craft",                  "col33-hero.jpg", "微細運動"),
    ("col34-hero", "child toy cars trains",                         "col34-hero.jpg", "乗り物ぬりえ"),
    ("col35-hero", "child tablet drawing balance",                  "col35-hero.jpg", "スクリーンタイム"),
    ("col36-hero", "children playground slide swing",               "col36-hero.jpg", "公園遊具"),
]
IMAGES_BY_ID = {img[0]: img for img in IMAGES}


def search_first_image(page: Page, query: str) -> str | None:
    """Unsplash 検索ページから最初の画像URL（フルサイズ）を取得"""
    encoded = urllib.parse.quote(query)
    url = f"https://unsplash.com/s/photos/{encoded}"
    print(f"  → 検索: {url}")
    page.goto(url, wait_until="domcontentloaded", timeout=30000)
    time.sleep(2.5)

    # 画像URL候補（photo-XXX のもののみ・profile-XXXは除外）
    candidates = []

    # パターン1: figure内のimg.srcset
    imgs = page.query_selector_all('figure img[srcset]')
    for img in imgs[:10]:
        srcset = img.get_attribute('srcset')
        if not srcset:
            continue
        parts = [p.strip() for p in srcset.split(',') if 'images.unsplash.com' in p and '/photo-' in p]
        if parts:
            # 1080w 前後を選ぶ
            target = next((p for p in parts if '1080w' in p),
                  next((p for p in parts if '1200w' in p), parts[-1]))
            u = target.split()[0]
            candidates.append(u)

    # パターン2: src で /photo- を含むもの
    if not candidates:
        imgs = page.query_selector_all('img[src*="images.unsplash.com/photo-"]')
        for img in imgs[:10]:
            src = img.get_attribute('src')
            if src and '/photo-' in src and 'plus.unsplash.com' not in src:
                candidates.append(src)

    if not candidates:
        return None

    return candidates[0]


def download_url(url: str, out_path: Path) -> bool:
    """画像URLをHTTPで直接DL（Chrome経由ではないので安定）"""
    try:
        # 高解像度版に書き換え: クエリ部分を入れ替え
        if 'images.unsplash.com' in url and '?' in url:
            base = url.split('?')[0]
            url = f"{base}?w=1600&q=80&auto=format&fit=crop"
        elif 'images.unsplash.com' in url:
            url = f"{url}?w=1600&q=80&auto=format&fit=crop"

        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
        out_path.write_bytes(data)
        return True
    except Exception as e:
        print(f"  ✗ DL失敗: {e}")
        return False


def process(page: Page, img_id: str, query: str, filename: str, desc: str) -> bool:
    out_path = OUT_DIR / filename
    if out_path.exists():
        print(f"[{img_id}] スキップ（既存）: {filename}")
        return True
    print(f"\n[{img_id}] {desc}")
    print(f"  クエリ: {query}")
    try:
        url = search_first_image(page, query)
        if not url:
            print("  ✗ 画像が見つからない")
            return False
        print(f"  → 画像URL: {url[:80]}...")
        if download_url(url, out_path):
            sz = out_path.stat().st_size // 1024
            print(f"  ✓ 保存: {filename} ({sz} KB)")
            return True
        return False
    except Exception as e:
        print(f"  ✗ エラー: {e}")
        return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--id", help="特定の画像IDのみ")
    parser.add_argument("--list", action="store_true")
    args = parser.parse_args()

    if args.list:
        for img_id, query, filename, desc in IMAGES:
            mark = "✓" if (OUT_DIR / filename).exists() else " "
            print(f"{mark} {img_id:<12} {filename:<18} {desc}")
        return

    targets = IMAGES
    if args.id:
        if args.id not in IMAGES_BY_ID:
            print(f"ERROR: {args.id} が見つかりません")
            sys.exit(1)
        targets = [IMAGES_BY_ID[args.id]]

    with sync_playwright() as pw:
        print("Chrome CDP に接続中 (localhost:9222)...")
        browser = pw.chromium.connect_over_cdp("http://localhost:9222")
        context = browser.contexts[0]
        page = context.new_page()

        results = {}
        for img_id, q, fn, desc in targets:
            ok = process(page, img_id, q, fn, desc)
            results[img_id] = ok
            if len(targets) > 1:
                time.sleep(2)  # Unsplash は緩いが念のため
        page.close()

    print("\n=== 結果 ===")
    ok_count = sum(1 for v in results.values() if v)
    for img_id, ok in results.items():
        print(f"  {'✓' if ok else '✗'} {img_id}")
    print(f"\n{ok_count}/{len(results)} 完了")


if __name__ == "__main__":
    main()
