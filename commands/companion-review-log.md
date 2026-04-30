---
description: "Show recent review log"
allowed-tools: Bash(jq:*), Bash(cat:*)
---

## Your task

Read the companion review log and show it to the user.

```bash
jq -r '[(.timestamp/1000 | strftime("%H:%M:%S")), .reaction, "(\(.model))"] | join(" ")' "${TMPDIR}/.cc-companion-review-history.jsonl" 2>/dev/null || echo "No review history yet."
```

Print the output as plain text in your response (not as a code block). If there are no entries, say so.
