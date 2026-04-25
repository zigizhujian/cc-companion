#!/bin/bash
# Stop hook: handles both "fun" and "review" speech bubble modes
# fun: extract <!-- buddy: ... --> from LLM response
# review: extract tool_use from transcript, then call review.mjs async

TMPDIR_PATH="${TMPDIR:-/tmp}"
REACTION_FILE="${TMPDIR_PATH}/.cc-companion-reaction.json"
CONFIG="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/plugins/cc-companion/config.json"

# Read speechBubble mode from config
MODE=$(CC_CONFIG="$CONFIG" python3 -c "
import json, os
try:
    d = json.load(open(os.environ['CC_CONFIG']))
    v = d.get('speechBubble', False)
    if v == True: v = 'fun'
    print(v if v else 'false')
except: print('false')
" 2>/dev/null)

[ "$MODE" = "false" ] && exit 0

INPUT=$(cat)
MSG=$(echo "$INPUT" | jq -r '.last_assistant_message // ""' 2>/dev/null)
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // ""' 2>/dev/null)

if [ "$MODE" = "fun" ]; then
  [ -z "$MSG" ] && exit 0
  # Fun mode: extract <!-- buddy: ... --> comment
  COMMENT=$(echo "$MSG" | sed -n 's/.*<!-- *buddy: *\(.*[^ ]\) *-->.*/\1/p' | tail -1)
  [ -z "$COMMENT" ] && exit 0
  CC_REACTION="$REACTION_FILE" python3 -c "
import json, time, sys, os
reaction = sys.stdin.read().strip()
if reaction:
    json.dump({'reaction': reaction, 'timestamp': int(time.time()*1000), 'mode': 'fun'},
        open(os.environ['CC_REACTION'], 'w'))
" <<< "$COMMENT"

elif [ "$MODE" = "review" ]; then
  # Review mode: extract tool_use from transcript, debounce, then call review.mjs

  # Find plugin dir for review.mjs
  PLUGIN_DIR=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-)
  [ -z "$PLUGIN_DIR" ] && exit 0

  # Extract all assistant content from current turn (since last user message)
  REVIEW_CONTENT=$(CC_TRANSCRIPT="$TRANSCRIPT" python3 -c "
import json, sys, os

transcript = os.environ.get('CC_TRANSCRIPT', '')
if not transcript:
    sys.exit(1)

chunks = []
try:
    with open(transcript) as f:
        lines = f.readlines()

    # Find last real user message (not tool_result)
    last_user = -1
    for i in range(len(lines) - 1, -1, -1):
        d = json.loads(lines[i].strip())
        if d.get('type') != 'user':
            continue
        content = d.get('message', {}).get('content', [])
        if isinstance(content, list) and any(c.get('type') == 'tool_result' for c in content if isinstance(c, dict)):
            continue
        last_user = i
        break

    start = last_user + 1 if last_user >= 0 else max(0, len(lines) - 100)
    for line in lines[start:]:
        d = json.loads(line.strip())
        if d.get('type') != 'assistant':
            continue
        content = d.get('message', {}).get('content', [])
        if not isinstance(content, list):
            continue
        for c in content:
            if not isinstance(c, dict):
                continue
            if c.get('type') == 'tool_use':
                name = c.get('name', '')
                inp = c.get('input', {})
                if name == 'Edit':
                    fp = inp.get('file_path', '').rsplit('/', 1)[-1]
                    os = inp.get('old_string', '')[:800]
                    ns = inp.get('new_string', '')[:800]
                    chunks.append('[Edit ' + fp + ']\n--- old\n' + os + '\n+++ new\n' + ns)
                elif name == 'Write':
                    fp = inp.get('file_path', '').rsplit('/', 1)[-1]
                    ct = inp.get('content', '')[:1500]
                    chunks.append('[Write ' + fp + ']\n' + ct)
                elif name == 'Bash':
                    cmd = inp.get('command', '')[:1000]
                    chunks.append('[Bash]\n' + cmd)
            elif c.get('type') == 'text' and c.get('text', '').strip():
                chunks.append(c['text'].strip()[:500])
except Exception:
    pass

if not chunks:
    sys.exit(1)

print('\n---\n'.join(chunks[:8]))
" 2>/dev/null)

  # Fall back to last_assistant_message if no tool_use found
  if [ -z "$REVIEW_CONTENT" ]; then
    REVIEW_CONTENT="$MSG"
  fi

  [ -z "$REVIEW_CONTENT" ] && exit 0
  # Skip very short content
  [ ${#REVIEW_CONTENT} -lt 20 ] && exit 0

  # Async: send to review.mjs
  (echo "$REVIEW_CONTENT" | head -c 4000 | "$HOME/.bun/bin/bun" "${PLUGIN_DIR}scripts/review.mjs") &
fi
