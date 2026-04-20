#!/bin/bash
# Stop hook: extract <!-- buddy: ... --> from LLM response, write to reaction.json
# CC passes JSON via stdin with field "last_assistant_message"

TMPDIR_PATH="${TMPDIR:-/tmp}"
REACTION_FILE="${TMPDIR_PATH}/.cc-companion-reaction.json"

INPUT=$(cat)
MSG=$(echo "$INPUT" | jq -r '.last_assistant_message // ""' 2>/dev/null)
[ -z "$MSG" ] && exit 0

COMMENT=$(echo "$MSG" | sed -n 's/.*<!-- *buddy: *\(.*[^ ]\) *-->.*/\1/p' | tail -1)
[ -z "$COMMENT" ] && exit 0

python3 -c "
import json, time, sys
reaction = sys.stdin.read().strip()
if reaction:
    json.dump({'reaction': reaction, 'timestamp': int(time.time()*1000)},
        open('${REACTION_FILE}', 'w'))
" <<< "$COMMENT"
