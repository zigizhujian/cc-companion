---
description: "Set your companion as the CC statusline (replaces current statusline)"
allowed-tools: Bash(bun:*), Bash(command:*), Read, Edit
---

## Your task

Configure the CC statusline to show the user's companion pet.

1. First, show the user what their companion looks like:
```bash
PLUGIN_DIR=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-)
bun "${PLUGIN_DIR}scripts/companion.mjs"
```

2. Warn that this will **replace** their current statusline. Ask if they want to proceed.

3. If confirmed, detect bun path and generate the statusline command:
```bash
BUN_PATH=$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")
```

4. Update `~/.claude/settings.json` statusLine:
```json
{
  "statusLine": {
    "type": "command",
    "command": "bash -c 'PLUGIN_DIR=$(ls -d \"${CLAUDE_CONFIG_DIR:-$HOME/.claude}\"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '\"'\"'{ print $(NF-1) \"\\t\" $0 }'\"'\"' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-); exec \"{BUN_PATH}\" \"${PLUGIN_DIR}scripts/statusline.mjs\"'"
  }
}
```

5. Tell them to restart Claude Code.

Note: If they have claude-hud, suggest `/companion:hud` instead to embed the pet into hud.
