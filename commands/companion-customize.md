---
description: "Choose your own companion pet (species, rarity, eyes, hat)"
allowed-tools: Bash(bun:*), Bash(command:*)
---

## Your task

Run the interactive customize script:

```bash
PLUGIN_DIR=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-)
bun "${PLUGIN_DIR}scripts/customize.mjs"
```

If `bun` is not found, try with full path:
```bash
"$HOME/.bun/bin/bun" "${PLUGIN_DIR}scripts/customize.mjs"
```

This script will:
1. Show the user's current pet
2. Let them choose species, rarity, eyes, hat, and optional stats
3. Search for a matching salt (usually takes seconds)
4. Patch the Claude Code binary
5. Save config to ~/.cc-companion.json

To restore the original pet, run with `restore` argument:
```bash
bun "${PLUGIN_DIR}scripts/customize.mjs" restore
```

**Important**: The user must restart Claude Code after patching for changes to take effect.
