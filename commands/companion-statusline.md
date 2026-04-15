---
description: "Toggle companion statusline on/off"
allowed-tools: Bash(bun:*), Bash(command:*), Read, Edit
---

## Your task

Manage the companion statusline. Read `~/.claude/settings.json` first to determine current state.

### If statusLine.command contains "cc-companion" (already installed):

Show the current pet:
```bash
PLUGIN_DIR=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-)
"$HOME/.bun/bin/bun" "${PLUGIN_DIR}scripts/companion.mjs"
```

Then ask: "Companion statusline is active. Remove it?"
- If yes: remove the `statusLine` field from settings.json entirely. Tell user to restart CC.
- If no: do nothing.

### If statusLine.command does NOT contain "cc-companion" (not installed):

Show the user's pet:
```bash
PLUGIN_DIR=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-)
"$HOME/.bun/bin/bun" "${PLUGIN_DIR}scripts/companion.mjs"
```

Warn that this will **replace** any current statusline (e.g. claude-hud). Ask to proceed.

If confirmed:
1. Detect bun path:
```bash
BUN_PATH=$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")
```

2. Update `~/.claude/settings.json` statusLine:
```json
{
  "statusLine": {
    "type": "command",
    "command": "bash -c 'PLUGIN_DIR=$(ls -d \"${CLAUDE_CONFIG_DIR:-$HOME/.claude}\"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '\"'\"'{ print $(NF-1) \"\\t\" $0 }'\"'\"' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-); exec \"{BUN_PATH}\" \"${PLUGIN_DIR}scripts/statusline.mjs\"'",
    "refreshInterval": 1
  }
}
```

3. Tell user to restart Claude Code.
