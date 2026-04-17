---
description: "Show your CC companion pet with ASCII art, stats, and rarity"
allowed-tools: Bash(bun:*), Bash(command:*), Bash(python3:*), Read
---

## Your task

### Step 1: Check and initialize config

```bash
python3 -c "
import json, os
p = os.path.expanduser('~/.claude/plugins/cc-companion/config.json')
defaults = {
  'displayMode': 'hud',
  'animationMode': 'classic',
  'screensaver': False,
  'screensaverMode': 'random',
  'screensaverInterval': 5,
  'collection': []
}
try:
    d = json.load(open(p))
except:
    d = {}
changed = False
for k, v in defaults.items():
    if k not in d:
        d[k] = v
        changed = True
if changed:
    os.makedirs(os.path.dirname(p), exist_ok=True)
    json.dump(d, open(p, 'w'), indent=2)
    print('FIRST_RUN')
else:
    print('OK')
"
```

If the output is `FIRST_RUN`, this is a new user. Read the following files to get full context before proceeding:

```bash
PLUGIN_DIR=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-)
echo "$PLUGIN_DIR"
```

Then read `${PLUGIN_DIR}README.md` and `${PLUGIN_DIR}CONFIG.md`.

After reading, briefly introduce what cc-companion can do (2-3 sentences), then continue to Step 2.

### Step 2: Show the companion pet

```bash
PLUGIN_DIR=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-)
"$HOME/.bun/bin/bun" "${PLUGIN_DIR}scripts/companion.mjs"
```

Show the output to the user exactly as printed.

### Step 3: Check pet name

```bash
python3 -c "import json, os; d=json.load(open(os.path.expanduser('~/.claude/plugins/cc-companion/config.json'))); print(d.get('petName',''))" 2>/dev/null
```

If the pet name is empty, ask: "Want to give your companion a name?"

If yes, ask for the name, then save it:
```bash
python3 -c "
import json, os
p = os.path.expanduser('~/.claude/plugins/cc-companion/config.json')
try: d = json.load(open(p))
except: d = {}
d['petName'] = '<NAME>'
json.dump(d, open(p, 'w'), indent=2)
print('Named!')
"
```
