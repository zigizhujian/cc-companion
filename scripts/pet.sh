#!/bin/bash
# Pet your companion — triggers hearts animation for 4 refreshes
CONFIG="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/plugins/cc-companion/config.json"
if [ ! -f "$CONFIG" ]; then echo "No companion config found"; exit 1; fi

# Write heart state directly to tmp — statusline reads this
TMPDIR_PATH="${TMPDIR:-/tmp}"
echo '{"framesLeft":4,"frame":0}' > "${TMPDIR_PATH}/.cc-companion-heart-frame.json"

# Print pet name
python3 -c "
import json
d = json.load(open('$CONFIG'))
name = d.get('petName', 'companion')
print(f'petted {name}! \u2764')
"
