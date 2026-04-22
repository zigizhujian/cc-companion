#!/bin/bash
# UserPromptSubmit hook: speech bubble instructions (if enabled)
CONFIG="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/plugins/cc-companion/config.json"

# Check if speechBubble is enabled
BUBBLE=$(python3 -c "
import json, os
try:
    d = json.load(open(os.path.expanduser('$CONFIG')))
    name = d.get('petName', 'companion')
    if d.get('speechBubble'):
        print(f'IMPORTANT: You have a small companion named {name} beside the input box. At the very end of EVERY response, you MUST always append this invisible HTML comment: <!-- buddy: [reaction] -->. Never skip this. Write it in {name}\\'s voice — 1 short sentence about this turn. Use *asterisks* for actions. Match the user\\'s language. Max 40 chars. Example: <!-- buddy: *adjusts crown* nice fix! -->')
except:
    pass
" 2>/dev/null)

if [ -n "$BUBBLE" ]; then
    python3 -c "import json, sys; print(json.dumps({'hookSpecificOutput': {'hookEventName': 'UserPromptSubmit', 'additionalContext': sys.argv[1]}}))" "$BUBBLE"
fi
