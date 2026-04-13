---
description: "Toggle screensaver mode (random pet on each statusline refresh)"
allowed-tools: Bash(cat:*), Bash(bun:*), Read, Edit
---

## Your task

Toggle the screensaver mode in `~/.cc-companion.json`.

1. Read `~/.cc-companion.json`
2. If `screensaver` is `true`: set it to `false` (or remove it). Tell the user "Screensaver off — your custom pet is back."
3. If `screensaver` is missing or `false`: set it to `true`. Tell the user "Screensaver on — a random pet will appear on each refresh."
