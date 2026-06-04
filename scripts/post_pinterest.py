#!/usr/bin/env python3
"""
Pinterest 自動投稿（Playwright CDP・ChatGPT生成スクリプトと同じ運用思想）

前提: Pinterestログイン済みのCDP Chromeを起動しておく（毎回）
  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome \\
    --remote-debugging-port=9223 \\
    --user-data-dir="$HOME/.pinterest-chrome-profile"
  初回のみ https://pinterest.com にログイン

使い方:
  # 1枚だけテスト投稿（公開せず入力まで＋各ステップスクショ）
  python3 scripts/post_pinterest.py --once --dry-run --shot

  # 1枚だけ本番投稿
  python3 scripts/post_pinterest.py --once

  # キュー全部を間隔をあけて投稿（1回の実行で最大N枚）
  python3 scripts/post_pinterest.py --max 5
"""
import os, sys, time, json, random, argparse
from pathlib import Path
from playwright.sync_api import sync_playwright

SCRIPT_DIR = Path(__file__).parent
SHOT_DIR = SCRIPT_DIR / "pin_shots"
PIN_BUILDER = "https://www.pinterest.com/pin-builder/"

# 新規アカウントは慎重に。1日2〜5枚・各25分前後を推奨
SEND_INTERVAL = 1500          # 投稿間隔の基準秒（25分）
INTERVAL_JITTER = 300         # ±5分
WARMUP_POSTS = 2              # 最初の数枚は間隔を伸ばす
WARMUP_MULT = 1.4


def log(msg):
    ts = time.strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with open(SCRIPT_DIR / "post_pinterest.log", "a") as f:
        f.write(line + "\n")


# ---------- human-like helpers ----------
def human_pause(lo=0.4, hi=1.2):
    time.sleep(random.uniform(lo, hi))


def human_type(page, text):
    delay = random.uniform(45, 105)
    for i, line in enumerate(text.split("\n")):
        if line:
            page.keyboard.type(line, delay=delay)
        if i < text.count("\n"):
            human_pause(0.05, 0.13)
            page.keyboard.press("Shift+Enter")
    human_pause(0.15, 0.5)


def human_move_and_click(page, element):
    try:
        bbox = element.bounding_box()
        if not bbox:
            element.click()
            return
        page.mouse.move(random.uniform(150, 700), random.uniform(80, 350))
        human_pause(0.1, 0.35)
        tx = bbox["x"] + bbox["width"] * random.uniform(0.3, 0.7)
        ty = bbox["y"] + bbox["height"] * random.uniform(0.3, 0.7)
        page.mouse.move(tx, ty, steps=random.randint(8, 18))
        human_pause(0.05, 0.2)
        page.mouse.click(tx, ty)
    except Exception:
        element.click()


# ---------- DOM helpers (フォールバック多重) ----------
def find_first(page, selectors, timeout=8000, state="visible"):
    """複数セレクタを順に試し、最初に見つかった要素を返す"""
    deadline = time.time() + timeout / 1000
    while time.time() < deadline:
        for sel in selectors:
            try:
                el = page.query_selector(sel)
                if el and (state != "visible" or el.is_visible()):
                    return el
            except Exception:
                continue
        time.sleep(0.25)
    return None


def shot(page, name, enabled):
    if not enabled:
        return
    SHOT_DIR.mkdir(exist_ok=True)
    try:
        page.screenshot(path=str(SHOT_DIR / f"{name}.png"))
        log(f"  📸 {name}.png")
    except Exception as e:
        log(f"  📸 スクショ失敗: {e}")


TITLE_SEL = [
    'textarea[placeholder="タイトルを追加する"]',
    'textarea[placeholder*="タイトル"]',
    'textarea[id^="pin-draft-title"]',
    'textarea[placeholder*="title" i]',
]
DESC_SEL = [
    'div[role="combobox"][aria-label*="説明"]',
    'div[aria-label="ピンの説明文を追加する"]',
    '[contenteditable="true"][role="combobox"]',
    'div[data-test-id="pin-draft-description"] [contenteditable="true"]',
    'div[contenteditable="true"]',
]
LINK_SEL = [
    'textarea[placeholder="移動先リンクを追加する"]',
    'textarea[placeholder*="リンク"]',
    'textarea[placeholder*="移動先"]',
    'textarea[id^="pin-draft-link"]',
    'textarea[placeholder*="link" i]',
]
BOARD_BTN_SEL = [
    '[data-test-id="board-dropdown-select-button"]',
    '[data-test-id="boardDropdownSelectButton"]',
    'button[aria-label*="ボードを選択"]',
    'button[aria-label*="Choose a board" i]',
]
BOARD_SEARCH_SEL = [
    '[data-test-id="board-dropdown-search-input"] input',
    'input[placeholder*="検索"]',
    'input[id*="pickerSearchField"]',
    'input[placeholder*="Search" i]',
]
SAVE_SEL = [
    '[data-test-id="board-dropdown-save-button"]',
    '[data-test-id="storyboard-creation-nav-done"]',
    'button[aria-label="保存"]',
    'button[aria-label="公開する"]',
]


def _read_value(el):
    try:
        tag = el.evaluate("e => e.tagName.toLowerCase()")
        return el.input_value() if tag in ("textarea", "input") else (el.inner_text() or "")
    except Exception:
        return ""


def fill_field(page, selectors, text, label):
    el = find_first(page, selectors)
    if not el:
        log(f"  ⚠️ {label} フィールドが見つからない")
        return False
    probe = text.replace(" ", "").replace("\n", "")[:8]
    for attempt in (1, 2):
        try:
            el.scroll_into_view_if_needed()
            el.click()
        except Exception:
            human_move_and_click(page, el)
        human_pause(0.25, 0.5)
        try:
            page.keyboard.press("Meta+A")
            page.keyboard.press("Delete")
        except Exception:
            pass
        human_type(page, text)
        human_pause(0.2, 0.4)
        got = _read_value(el).replace(" ", "").replace("\n", "")
        if probe in got:
            log(f"  ✅ {label} 入力")
            return True
        log(f"  ↻ {label} 未反映、再試行 ({attempt})")
    log(f"  ⚠️ {label} 入力に失敗")
    return False


def upload_image(page, img_path):
    inputs = page.query_selector_all('input[type="file"]')
    for inp in inputs:
        try:
            inp.set_input_files(str(img_path))
            return True
        except Exception:
            continue
    return False


def select_board(page, board_name):
    btn = find_first(page, BOARD_BTN_SEL)
    if not btn:
        log("  ⚠️ ボード選択ボタンが見つからない")
        return False
    human_move_and_click(page, btn)
    human_pause(0.6, 1.2)
    search = find_first(page, BOARD_SEARCH_SEL, timeout=4000)
    if search:
        human_move_and_click(page, search)
        human_type(page, board_name)
        human_pause(0.8, 1.4)
    # board名に一致する行を探す
    rows = page.query_selector_all('[data-test-id="board-row"]') or \
           page.query_selector_all('div[role="button"]')
    for row in rows:
        try:
            if board_name in (row.inner_text() or ""):
                human_move_and_click(page, row)
                log(f"  ✅ ボード選択: {board_name}")
                human_pause(0.5, 1.0)
                return True
        except Exception:
            continue
    log(f"  ⚠️ ボード '{board_name}' が一覧で見つからない")
    return False


def publish(page):
    btn = find_first(page, SAVE_SEL)
    if not btn:
        log("  ⚠️ 公開ボタンが見つからない")
        return False
    human_move_and_click(page, btn)
    return True


def verify_published(page, timeout=15000):
    """公開成功の推定: トースト/確認/URL変化のいずれか"""
    deadline = time.time() + timeout / 1000
    while time.time() < deadline:
        try:
            body = page.inner_text("body")
            if any(k in body for k in ["公開しました", "保存しました", "ピンを公開", "Saved to", "Published"]):
                return True
        except Exception:
            pass
        if "/pin/" in page.url:
            return True
        time.sleep(0.5)
    return False


def post_one(page, entry, dry_run, shot_enabled, idx):
    img = (SCRIPT_DIR / entry["image"]).resolve()
    if not img.exists():
        log(f"  ❌ 画像なし: {img}")
        return False
    log(f"▶ 投稿 #{idx}: {entry['title'][:30]}… → [{entry['board']}]")

    page.goto(PIN_BUILDER, wait_until="domcontentloaded")
    human_pause(2.0, 3.5)

    # ログイン確認
    if "login" in page.url or "/business" in page.url:
        log("  ❌ 未ログイン。CDP Chromeでpinterest.comにログインしてください")
        return False

    shot(page, f"{idx}_1_builder", shot_enabled)

    if not upload_image(page, img):
        log("  ❌ 画像アップロードのinputが見つからない")
        shot(page, f"{idx}_x_noupload", shot_enabled)
        return False
    log("  ✅ 画像アップロード")
    human_pause(3.5, 6.0)  # プレビュー生成待ち
    shot(page, f"{idx}_2_uploaded", shot_enabled)

    fill_field(page, TITLE_SEL, entry["title"], "タイトル")
    human_pause(0.4, 0.9)
    fill_field(page, DESC_SEL, entry["description"], "説明")
    human_pause(0.4, 0.9)
    if entry.get("link"):
        fill_field(page, LINK_SEL, entry["link"], "リンク")
        human_pause(0.4, 0.9)
    shot(page, f"{idx}_3_filled", shot_enabled)

    select_board(page, entry["board"])
    shot(page, f"{idx}_4_board", shot_enabled)

    if dry_run:
        log("  🟡 dry-run: 公開せず終了")
        shot(page, f"{idx}_5_dryrun", shot_enabled)
        return True

    if not publish(page):
        return False
    human_pause(2.0, 4.0)
    ok = verify_published(page)
    shot(page, f"{idx}_5_published", shot_enabled)
    log("  🎉 公開成功" if ok else "  ⚠️ 公開確認できず（要手動確認）")
    return ok


def main():
    ap = argparse.ArgumentParser(description="Pinterest 自動投稿")
    ap.add_argument("--queue", default=str(SCRIPT_DIR / "pin_queue.json"))
    ap.add_argument("--cdp", default="http://localhost:9223")
    ap.add_argument("--once", action="store_true", help="未投稿の先頭1枚だけ")
    ap.add_argument("--max", type=int, default=99, help="今回の最大投稿数")
    ap.add_argument("--interval", type=int, default=SEND_INTERVAL)
    ap.add_argument("--dry-run", action="store_true", help="公開せず入力まで")
    ap.add_argument("--shot", action="store_true", help="各ステップでスクショ")
    args = ap.parse_args()

    qpath = Path(args.queue)
    queue = json.loads(qpath.read_text())
    todo = [(i, e) for i, e in enumerate(queue) if not e.get("posted_at")]
    if not todo:
        log("✅ 未投稿のピンはありません")
        return
    if args.once:
        todo = todo[:1]
    else:
        todo = todo[: args.max]
    log(f"=== Pinterest投稿開始: {len(todo)}枚 / dry_run={args.dry_run} ===")

    with sync_playwright() as pw:
        try:
            browser = pw.chromium.connect_over_cdp(args.cdp)
        except Exception as e:
            log(f"❌ CDP接続失敗（Chromeを起動した？）: {e}")
            sys.exit(1)
        ctx = browser.contexts[0] if browser.contexts else browser.new_context()
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        page.on("dialog", lambda d: d.accept())  # ドラフト破棄ダイアログを自動承認

        done = 0
        for n, (qi, entry) in enumerate(todo):
            ok = post_one(page, entry, args.dry_run, args.shot, qi)
            if ok and not args.dry_run:
                queue[qi]["posted_at"] = time.strftime("%Y-%m-%dT%H:%M:%S")
                qpath.write_text(json.dumps(queue, ensure_ascii=False, indent=2))
                done += 1
            if n < len(todo) - 1 and not args.dry_run:
                base = args.interval * (WARMUP_MULT if done <= WARMUP_POSTS else 1.0)
                wait = base + random.uniform(-INTERVAL_JITTER, INTERVAL_JITTER)
                log(f"⏳ 次まで {wait/60:.1f} 分待機…")
                time.sleep(max(60, wait))
        log(f"=== 完了: {done}枚公開 ===")


if __name__ == "__main__":
    main()
