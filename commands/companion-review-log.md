---
description: "Show recent review log"
allowed-tools: Bash(python3:*)
---

## Your task

Show the last few entries from the companion review log.

```bash
python3 -c "
import json, os, time
from datetime import datetime

history = os.path.join(os.environ.get('TMPDIR', '/tmp'), '.cc-companion-review-history.jsonl')
try:
    lines = open(history).read().strip().split('\n')
    entries = [json.loads(l) for l in lines if l.strip()][-10:]
except:
    entries = []

if not entries:
    print('No review history yet.')
else:
    print(f'Last {len(entries)} reviews:\n')
    for e in reversed(entries):
        ts = datetime.fromtimestamp(e['timestamp'] / 1000).strftime('%H:%M:%S')
        model = e.get('model', '')
        reaction = e.get('reaction', '')
        print(f'  [{ts}] {reaction}  ({model})')
"
```

Show the output to the user.
