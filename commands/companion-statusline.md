---
description: "Toggle companion statusline on/off"
allowed-tools: Bash(bun:*), Bash(command:*), Bash(python3:*), Read, Edit
---

## Your task

Manage the companion statusline. Read `~/.claude/settings.json` first to determine current state.

### If statusLine.command contains "cc-companion" (already installed):

Show the current pet:
```bash
PLUGIN_DIR=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-)
"$HOME/.bun/bin/bun" "${PLUGIN_DIR}scripts/companion.mjs"
```

Then read the current displayMode:
```bash
python3 -c "import json, os; d=json.load(open(os.path.expanduser('~/.claude/plugins/cc-companion/config.json'))); print(d.get('displayMode','hud'))" 2>/dev/null
```

Ask the user:
> Companion statusline is active (current mode: **{displayMode}**). What would you like to do?
> 1. Change display mode
> 2. Remove statusline
> 3. Nothing

**If change display mode:**

Ask which mode they want:
- `hud` — animated sprite + stats + session info (full 3-column layout)
- `sprite` — minimal right-aligned pet only
- `combined` — screensaver pet on the left, your pet on the right

Save the chosen mode to config:
```bash
python3 -c "
import json, os
p = os.path.expanduser('~/.claude/plugins/cc-companion/config.json')
try: d = json.load(open(p))
except: d = {}
d['displayMode'] = '<MODE>'
json.dump(d, open(p, 'w'), indent=2)
print('Done!')
"
```
Tell user the statusline will update automatically.

**If remove:**
Remove the `statusLine` field from settings.json entirely. Tell user to restart CC.

**If nothing:** do nothing.

### If statusLine.command does NOT contain "cc-companion" (not installed):

Show the user's pet:
```bash
PLUGIN_DIR=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-)
"$HOME/.bun/bin/bun" "${PLUGIN_DIR}scripts/companion.mjs"
```

Warn that this will **replace** any current statusline (e.g. claude-hud). Ask to proceed.

If confirmed:
1. Ask which display mode they want:
   - `hud` (default) — animated sprite + stats + session info
   - `sprite` — minimal right-aligned pet only
   - `combined` — screensaver pet on the left, your pet on the right

2. Save the chosen mode to config:
```bash
python3 -c "
import json, os
p = os.path.expanduser('~/.claude/plugins/cc-companion/config.json')
try: d = json.load(open(p))
except: d = {}
d['displayMode'] = '<MODE>'
json.dump(d, open(p, 'w'), indent=2)
print('Done!')
"
```

3. Install statusline (detects bun path and writes settings.json automatically):
```bash
BUN_PATH=$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")
python3 - "$BUN_PATH" << 'PYEOF'
import json, os, sys
bun = sys.argv[1]
p = os.path.expanduser('~/.claude/settings.json')
try: s = json.load(open(p))
except: s = {}
awk = r'{ print $(NF-1) "\t" $' + '0 }'
cmd = f"bash -c 'PLUGIN_DIR=$(ls -d \"${{CLAUDE_CONFIG_DIR:-$HOME/.claude}}\"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '\\''{ awk }'\\'' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-); exec \"{bun}\" \"${{PLUGIN_DIR}}scripts/statusline.mjs\"'"
s['statusLine'] = {'type': 'command', 'command': cmd, 'refreshInterval': 4}
json.dump(s, open(p, 'w'), indent=2)
print('Done!')
PYEOF
```

4. Tell user to restart Claude Code.
