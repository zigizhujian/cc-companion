---
description: "Toggle screensaver mode (random pet on each statusline refresh)"
allowed-tools: Bash(cat:*), Bash(bun:*), Read, Edit
---

## Your task

Toggle the screensaver mode in `~/.claude/plugins/cc-companion/config.json`.

1. Read `~/.claude/plugins/cc-companion/config.json`
2. If `screensaver` is `true`: set it to `false` (or remove it). Also remove `screensaverInterval` and `screensaverMode` if present. Tell the user "Screensaver off — your custom pet is back."
3. If `screensaver` is missing or `false`: ask the user for:
   - Refresh interval in minutes (default 5, 0 = every refresh)
   - Mode: "random" (random pets) or "collection" (cycle through saved collection)
   Then set `screensaver` to `true`, `screensaverInterval` to the chosen value, and `screensaverMode` to the chosen mode. Tell the user "Screensaver on — [random pets / collection cycle] every N minutes."
