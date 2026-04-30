---
description: "Show recent review log"
allowed-tools: Bash(jq:*), Bash(cat:*)
---

## Your task

Show the last few entries from the companion review log.

```bash
jq -r '[(.timestamp/1000 | strftime("%H:%M:%S")), .reaction, "(\(.model))"] | join(" ")' "${TMPDIR}/.cc-companion-review-history.jsonl" 2>/dev/null || echo "No review history yet."
```

Show the output to the user.
