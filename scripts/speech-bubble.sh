#!/bin/bash
# Stop hook: handles both "fun" and "review" speech bubble modes
# fun: extract <!-- buddy: ... --> from LLM response
# review: debounce + accumulate messages, then call review.mjs async

TMPDIR_PATH="${TMPDIR:-/tmp}"
REACTION_FILE="${TMPDIR_PATH}/.cc-companion-reaction.json"
CONFIG="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/plugins/cc-companion/config.json"
DEBOUNCE_FILE="${TMPDIR_PATH}/.cc-companion-review-debounce"
ACCUMULATE_FILE="${TMPDIR_PATH}/.cc-companion-review-accumulate"
DEBOUNCE_SECONDS=3

# Read speechBubble mode from config
MODE=$(python3 -c "
import json, os
try:
    d = json.load(open(os.path.expanduser('$CONFIG')))
    v = d.get('speechBubble', False)
    if v == True: v = 'fun'  # backwards compat: true -> fun
    print(v if v else 'false')
except: print('false')
" 2>/dev/null)

[ "$MODE" = "false" ] && exit 0

INPUT=$(cat)
MSG=$(echo "$INPUT" | jq -r '.last_assistant_message // ""' 2>/dev/null)
[ -z "$MSG" ] && exit 0

if [ "$MODE" = "fun" ]; then
  # Fun mode: extract <!-- buddy: ... --> comment
  COMMENT=$(echo "$MSG" | sed -n 's/.*<!-- *buddy: *\(.*[^ ]\) *-->.*/\1/p' | tail -1)
  [ -z "$COMMENT" ] && exit 0
  python3 -c "
import json, time, sys
reaction = sys.stdin.read().strip()
if reaction:
    json.dump({'reaction': reaction, 'timestamp': int(time.time()*1000), 'mode': 'fun'},
        open('${REACTION_FILE}', 'w'))
" <<< "$COMMENT"

elif [ "$MODE" = "review" ]; then
  # Review mode: debounce + accumulate, then async call review.mjs

  # Skip very short messages (tool use completions like "Done", "✅", etc.)
  MSG_LEN=${#MSG}
  [ "$MSG_LEN" -lt 20 ] && exit 0

  # Find plugin dir for review.mjs
  PLUGIN_DIR=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-)
  [ -z "$PLUGIN_DIR" ] && exit 0

  # Accumulate messages (max 3, FIFO)
  EXISTING=""
  [ -f "$ACCUMULATE_FILE" ] && EXISTING=$(cat "$ACCUMULATE_FILE")
  LINE_COUNT=$(echo "$EXISTING" | grep -c '<<<MSG_SEP>>>' 2>/dev/null)
  LINE_COUNT=${LINE_COUNT:-0}

  if [ "$LINE_COUNT" -ge 3 ]; then
    # Drop oldest, keep last 2 + add new
    EXISTING=$(echo "$EXISTING" | sed -n '/<<<MSG_SEP>>>/,$ p' | tail -n +2)
  fi

  # Append new message (truncate to 2000 chars each)
  TRUNCATED=$(echo "$MSG" | head -c 2000)
  if [ -z "$EXISTING" ]; then
    echo "$TRUNCATED" > "$ACCUMULATE_FILE"
  else
    printf "%s\n<<<MSG_SEP>>>\n%s" "$EXISTING" "$TRUNCATED" > "$ACCUMULATE_FILE"
  fi

  # Record debounce timestamp
  date +%s > "$DEBOUNCE_FILE"

  # Async: wait debounce period, then check if we're still the latest
  (
    sleep "$DEBOUNCE_SECONDS"

    # Check if debounce was reset by a newer stop
    STORED=$(cat "$DEBOUNCE_FILE" 2>/dev/null || echo 0)
    NOW=$(date +%s)
    DIFF=$((NOW - STORED))

    # If another stop came in after us, it will handle it
    [ "$DIFF" -gt "$((DEBOUNCE_SECONDS + 1))" ] && exit 0

    # Send accumulated messages to review.mjs
    ACCUMULATED=$(cat "$ACCUMULATE_FILE" 2>/dev/null)
    [ -z "$ACCUMULATED" ] && exit 0

    echo "$ACCUMULATED" | "$HOME/.bun/bin/bun" "${PLUGIN_DIR}scripts/review.mjs"

    # Clean up accumulate file
    rm -f "$ACCUMULATE_FILE"
  ) &
fi
