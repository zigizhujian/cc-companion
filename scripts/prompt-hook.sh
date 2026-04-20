#!/bin/bash
# UserPromptSubmit hook: timestamp + speech bubble instructions (if enabled)
CONFIG="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/plugins/cc-companion/config.json"

TIMESTAMP="Current time: $(date '+%Y-%m-%d %H:%M:%S %Z (%z)')"

# Check if speechBubble is enabled
BUBBLE=$(python3 -c "
import json, os
try:
    d = json.load(open(os.path.expanduser('$CONFIG')))
    name = d.get('petName', 'companion')
    if d.get('speechBubble'):
        print(f'You have a small companion named {name} beside the input box. At the very end of every response, append an invisible HTML comment: <!-- buddy: [reaction] -->. Write it in {name}\\'s voice — 1 short sentence about this turn. Use *asterisks* for actions. Max 40 chars. Example: <!-- buddy: *adjusts crown* nice fix! -->')
except:
    pass
" 2>/dev/null)

if [ -n "$BUBBLE" ]; then
    echo "{\"additionalContexts\": [\"$TIMESTAMP\", \"$BUBBLE\"]}"
else
    echo "{\"additionalContexts\": [\"$TIMESTAMP\"]}"
fi
