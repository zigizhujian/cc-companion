---
description: "Show your CC companion pet with ASCII art, stats, and rarity"
allowed-tools: Bash(bun:*), Bash(command:*)
---

## Your task

Run this command to display the user's CC companion pet:

```bash
PLUGIN_DIR=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-)
bun "${PLUGIN_DIR}scripts/companion.mjs"
```

If `bun` is not found, try:
```bash
"$HOME/.bun/bin/bun" "${PLUGIN_DIR}scripts/companion.mjs"
```

Show the output to the user exactly as printed. Do not add any extra commentary.
