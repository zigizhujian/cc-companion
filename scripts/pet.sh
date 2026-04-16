#!/bin/bash
# Pet your companion — writes timestamp to config, hearts appear for 5 seconds
CONFIG="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/plugins/cc-companion/config.json"
if [ ! -f "$CONFIG" ]; then echo "No companion config found"; exit 1; fi
python3 -c "
import json, time
d = json.load(open('$CONFIG'))
d['petAt'] = int(time.time() * 1000)
json.dump(d, open('$CONFIG', 'w'), indent=2)
name = d.get('petName', 'companion')
print(f'petted {name}! \u2764')
"
