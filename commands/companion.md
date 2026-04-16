---
description: "Show your CC companion pet with ASCII art, stats, and rarity"
allowed-tools: Bash(bun:*), Bash(command:*), Bash(python3:*), Read
---

## Your task

Run this command to display the user's CC companion pet:

```bash
PLUGIN_DIR=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-)
"$HOME/.bun/bin/bun" "${PLUGIN_DIR}scripts/companion.mjs"
```

Show the output to the user exactly as printed.

Then check if the user has a pet name set:
```bash
python3 -c "import json; d=json.load(open('$HOME/.claude/plugins/cc-companion/config.json')); print(d.get('petName',''))" 2>/dev/null
```

If the pet name is empty, ask: "Want to give your companion a name?"

If yes, ask for the name, then save it:
```bash
python3 -c "
import json
p = '$HOME/.claude/plugins/cc-companion/config.json'
try: d = json.load(open(p))
except: d = {}
d['petName'] = '<NAME>'
json.dump(d, open(p, 'w'), indent=2)
print('Named!')
"
```
