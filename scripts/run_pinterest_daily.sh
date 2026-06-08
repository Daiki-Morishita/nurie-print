#!/bin/bash
# Pinterest 自動投稿 cron ラッパー
# 使い方: run_pinterest_daily.sh [prod|dry]
#   prod (既定): 未投稿ピンを最大2枚投稿
#   dry        : 公開せず動作確認のみ
REPO="/Users/daikimorishita/dev/hoiku-print"
LOG="$REPO/scripts/cron_pinterest.log"
PY="/opt/anaconda3/bin/python3"
MODE="${1:-prod}"
TS() { /bin/date '+%F %T'; }

echo "[$(TS)] === start ($MODE) ===" >> "$LOG"

# CDP Chrome (9223) が無ければ起動
if ! /usr/bin/curl -s http://localhost:9223/json/version >/dev/null 2>&1; then
  echo "[$(TS)] CDP未起動 → Chrome起動" >> "$LOG"
  /usr/bin/open -na "Google Chrome" --args \
    --remote-debugging-port=9223 \
    --user-data-dir="$HOME/.pinterest-chrome-profile" \
    "https://www.pinterest.com/" >> "$LOG" 2>&1
  /bin/sleep 18
else
  echo "[$(TS)] CDP既起動" >> "$LOG"
fi

cd "$REPO" || exit 1
if [ "$MODE" = "dry" ]; then
  "$PY" scripts/post_pinterest.py --once --dry-run >> "$LOG" 2>&1
else
  "$PY" scripts/post_pinterest.py --max 2 >> "$LOG" 2>&1
fi
echo "[$(TS)] === done ($MODE) ===" >> "$LOG"
