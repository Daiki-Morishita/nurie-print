#!/usr/bin/env python3
"""
featured 素材 295件に対して Claude Vision で 200字のオリジナル解説文を生成し、
seoDescription として data.ts に適用する。

スカラブルコンテンツ対策の主軸:
  - 「線画の絵から具体的なエピソード」を200字で書かせる
  - 汎用テンプレ文を避ける
  - 子どもが塗りたくなる視点

実行:
  # 1. 解説文生成（JSONに保存）。レジューム可能
  python3 scripts/generate_seo_descriptions.py --generate [--limit N]

  # 2. 生成済みJSONを data.ts に適用
  python3 scripts/generate_seo_descriptions.py --apply

  # 3. 1件だけテスト
  python3 scripts/generate_seo_descriptions.py --generate --id bear-simple-1

設計:
  - scripts/seo_descriptions.json に { id: { description, generated_at, prompt_v } }
  - 既に出力済みのIDはスキップ（resumable）
  - レート制限対策: 1件ごとに 1秒 sleep
"""

import os
import re
import json
import time
import sys
import argparse
from pathlib import Path
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parent.parent
DATA_TS = ROOT / "src" / "lib" / "data.ts"
JSON_OUT = ROOT / "scripts" / "seo_descriptions.json"
PROMPT_VERSION = "v1"


def load_env():
    """.env.local から ANTHROPIC_API_KEY を読み込み。
    既存環境変数が空文字なら上書きする（シェルで空文字定義されているケース対応）。"""
    env = ROOT / ".env.local"
    if not env.exists():
        return
    for line in env.read_text().splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if not os.environ.get(k):
                os.environ[k] = v


def parse_featured_materials(src: str):
    """data.ts から featured: true の材料を抽出"""
    materials = []
    pos = 0
    while True:
        start = src.find("\n  {\n", pos)
        if start == -1:
            break
        end = src.find("\n  },\n", start)
        if end == -1:
            break
        block = src[start:end + 6]
        pos = end + 5  # overlap
        if "featured: true" not in block:
            continue
        m_id = re.search(r"id: '([^']+)'", block)
        m_title = re.search(r"title: '([^']+)'", block)
        m_image = re.search(r"imageUrl: '([^']+)'", block)
        m_age_min = re.search(r"ageMin:\s*(\d+)", block)
        m_age_max = re.search(r"ageMax:\s*(\d+)", block)
        m_theme = re.search(r"theme: '([^']+)'", block)
        if not (m_id and m_title and m_image):
            continue
        materials.append({
            "id": m_id.group(1),
            "title": m_title.group(1),
            "imageUrl": m_image.group(1),
            "ageMin": int(m_age_min.group(1)) if m_age_min else 3,
            "ageMax": int(m_age_max.group(1)) if m_age_max else 6,
            "theme": m_theme.group(1) if m_theme else "",
        })
    return materials


def download_image(url: str, max_bytes: int = 5_000_000) -> bytes:
    """画像URLをダウンロード"""
    req = urllib.request.Request(url, headers={"User-Agent": "nurie-print/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = resp.read(max_bytes + 1)
        if len(data) > max_bytes:
            raise ValueError(f"image too large: {len(data)} bytes")
        return data


def build_prompt(material: dict) -> str:
    age_label = f"{material['ageMin']}〜{material['ageMax']}歳"
    return f"""この画像は「{material['title']}」というぬりえの線画です。
対象年齢は{age_label}向け。

これを子どもがこれから塗ろうとしているシーンを想像し、保護者・編集部目線で
200字以内の「この絵だけの個性的な解説文」を書いてください。

必ず守ること:
- 絵に実際に描かれている要素（ポーズ・小道具・背景・表情など）を具体的に2〜3個含める
- 汎用テンプレ語禁止: 「子どもの発達」「集中力を育てる」「想像力を育む」「楽しめます」「学びになります」のような抽象語を使わない
- 「〜の線画」「〜のぬりえ」のような形容も避ける
- 体言止め・常体・敬体のどれでもよいが、説明文として自然な日本語にする
- 結論や教訓を書かない。情景描写と、塗るときに目に入る要素への気づきだけ
- 改行は使わず、1段落でまとめる
- 出力は解説文のみ。前置きや「以下が解説文です：」のような文言は不要

例（猫が花に囲まれている絵）:
「花畑に座って空を見上げる白猫。耳のうしろにちょこんと止まったちょうちょと、足元に転がる小さなドングリにも気づきます。背景の野原はやさしい曲線で描かれていて、緑のグラデーションを試したくなる余白がたっぷり残っています。」

それでは、画像を見て解説を書いてください。"""


def call_claude_vision(image_bytes: bytes, prompt: str, api_key: str) -> str:
    import anthropic
    import base64
    client = anthropic.Anthropic(api_key=api_key)
    # 画像形式判定
    if image_bytes[:8] == b"\x89PNG\r\n\x1a\n":
        media_type = "image/png"
    elif image_bytes[:3] == b"\xff\xd8\xff":
        media_type = "image/jpeg"
    elif image_bytes[:4] == b"RIFF" and image_bytes[8:12] == b"WEBP":
        media_type = "image/webp"
    else:
        media_type = "image/png"  # fallback

    msg = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=400,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": base64.b64encode(image_bytes).decode(),
                    },
                },
                {"type": "text", "text": prompt},
            ],
        }],
    )
    return msg.content[0].text.strip()


def cmd_generate(args):
    load_env()
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    src = DATA_TS.read_text(encoding="utf-8")
    materials = parse_featured_materials(src)
    print(f"featured 素材: {len(materials)}件")

    # 既存JSONを読み込み（resumable）
    existing = {}
    if JSON_OUT.exists():
        existing = json.loads(JSON_OUT.read_text(encoding="utf-8"))
        print(f"既存生成: {len(existing)}件 (スキップ対象)")

    targets = materials
    if args.id:
        targets = [m for m in materials if m["id"] == args.id]
        if not targets:
            print(f"ID {args.id} は featured ではありません")
            sys.exit(1)
        # 1件指定時は既存もスキップしない（再生成）
        existing.pop(args.id, None)
    elif args.limit:
        targets = [m for m in materials if m["id"] not in existing][:args.limit]

    done_count = 0
    err_count = 0

    for i, m in enumerate(targets, 1):
        if m["id"] in existing and not args.id:
            continue
        try:
            print(f"[{i}/{len(targets)}] {m['id']} ({m['title']}) ...", end=" ", flush=True)
            img = download_image(m["imageUrl"])
            prompt = build_prompt(m)
            desc = call_claude_vision(img, prompt, api_key)
            existing[m["id"]] = {
                "description": desc,
                "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
                "prompt_v": PROMPT_VERSION,
                "char_count": len(desc),
            }
            done_count += 1
            print(f"OK ({len(desc)}字)")
            # 毎回保存（中断耐性）
            JSON_OUT.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8")
            time.sleep(1.0)
        except Exception as e:
            err_count += 1
            print(f"ERR {e}")
            time.sleep(2.0)

    print(f"\n完了: 成功 {done_count}件 / 失敗 {err_count}件 / 累計 {len(existing)}件")
    print(f"出力: {JSON_OUT}")


def cmd_apply(args):
    if not JSON_OUT.exists():
        print(f"ERROR: {JSON_OUT} がありません。先に --generate してください", file=sys.stderr)
        sys.exit(1)
    descriptions = json.loads(JSON_OUT.read_text(encoding="utf-8"))
    print(f"JSON: {len(descriptions)}件 を data.ts に適用します")

    src = DATA_TS.read_text(encoding="utf-8")
    applied = 0
    skipped = 0
    not_found = []

    for mid, payload in descriptions.items():
        desc = payload["description"]
        # 既に seoDescription があるエントリは上書きしない（force option があってもいい）
        # 対象エントリのブロックを見つけて popular: の直前に seoDescription を追加
        pattern = re.compile(rf"(id: '{re.escape(mid)}'.*?)(popular:\s*(?:true|false),)", re.DOTALL)
        m = pattern.search(src)
        if not m:
            not_found.append(mid)
            continue
        block_prefix = m.group(1)
        # 既存のseoDescription を更新 or 新規追加
        # シングルクォート内の特殊文字をエスケープ
        esc_desc = desc.replace("\\", "\\\\").replace("'", "\\'").replace("\n", " ").strip()
        new_field = f"seoDescription: '{esc_desc}',\n    "
        if "seoDescription:" in block_prefix:
            # 既存上書き
            updated = re.sub(
                rf"(id: '{re.escape(mid)}'.*?)seoDescription: '[^']*',\s*",
                lambda mm: mm.group(1) + new_field,
                src,
                count=1,
                flags=re.DOTALL,
            )
            if updated != src:
                src = updated
                applied += 1
            else:
                skipped += 1
        else:
            # 新規追加: popular: の直前に挿入
            new_text = block_prefix + new_field + m.group(2)
            src = src[:m.start()] + new_text + src[m.end():]
            applied += 1

    DATA_TS.write_text(src, encoding="utf-8")
    print(f"適用: {applied}件 / スキップ: {skipped}件 / 見つからない: {len(not_found)}件")
    if not_found[:5]:
        print(f"  例: {not_found[:5]}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--generate", action="store_true", help="解説文を生成しJSONに保存")
    parser.add_argument("--apply", action="store_true", help="JSONをdata.tsに適用")
    parser.add_argument("--id", help="特定IDのみ処理")
    parser.add_argument("--limit", type=int, help="生成件数上限")
    args = parser.parse_args()
    if args.generate:
        cmd_generate(args)
    elif args.apply:
        cmd_apply(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
