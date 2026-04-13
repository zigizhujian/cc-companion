---
description: "Remove companion statusline (restore to default or previous statusline)"
allowed-tools: Bash(cat:*), Read, Edit
---

## Your task

Remove the companion statusline from the user's settings.

1. Read `~/.claude/settings.json`
2. Check if the current `statusLine.command` contains `cc-companion`. If not, tell the user it's not using companion statusline.
3. If it is, remove the `statusLine` field entirely from settings.json (or ask if they want to restore claude-hud instead).
4. Tell the user to restart Claude Code.
