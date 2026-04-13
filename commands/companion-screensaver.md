---
description: "Toggle screensaver mode (random pet on each statusline refresh)"
allowed-tools: Bash(cat:*), Bash(bun:*), Read, Edit
---

## Your task

Toggle the screensaver mode in `~/.claude/plugins/cc-companion/config.json`.

1. Read `~/.claude/plugins/cc-companion/config.json`
2. If `screensaver` is `true`: set it to `false` (or remove it). Also remove `screensaverInterval` if present. Tell the user "Screensaver off — your custom pet is back."
3. If `screensaver` is missing or `false`: ask the user for the refresh interval in minutes (default 5). Then set `screensaver` to `true` and `screensaverInterval` to the chosen value. Tell the user "Screensaver on — a random pet will appear every N minutes."
