#!/bin/bash
# Pet your companion — triggers hearts animation (4 frames, 1s protection window)
CONFIG="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/plugins/cc-companion/config.json"
if [ ! -f "$CONFIG" ]; then echo "No companion config found"; exit 1; fi

TMPDIR_PATH="${TMPDIR:-/tmp}"
# Write heart state with timestamp for protection window
python3 -c "
import json, time
print(json.dumps({'framesLeft':4,'frame':0,'writtenAt':int(time.time()*1000)}))
" > "${TMPDIR_PATH}/.cc-companion-heart-frame.json"

# Print pet name
python3 -c "
import json
d = json.load(open('$CONFIG'))
name = d.get('petName', 'companion')
print(f'petted {name}! \u2764')
"
