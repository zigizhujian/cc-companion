---
description: "Embed your companion pet into claude-hud's statusline"
allowed-tools: Bash(bun:*), Bash(command:*), Read, Edit
---

## Your task

Embed the companion pet into the user's existing claude-hud statusline.

1. First, show their companion:
```bash
PLUGIN_DIR=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-)
bun "${PLUGIN_DIR}scripts/companion.mjs"
```

2. Test the extra-cmd output:
```bash
bun "${PLUGIN_DIR}scripts/hud-extra-cmd.mjs"
```

3. Detect bun path:
```bash
BUN_PATH=$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")
```

4. Read `~/.claude/settings.json` and append `--extra-cmd` to the existing statusline command. The flag should be:
```
--extra-cmd="{BUN_PATH} {PLUGIN_DIR}scripts/hud-extra-cmd.mjs"
```

5. This keeps claude-hud intact and just adds the pet label to the HUD output.
