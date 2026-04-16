---
description: "Pet your companion! Shows hearts animation"
allowed-tools: Bash(bun:*), Read, Edit
---

## Your task

Pet the user's companion! Write the current timestamp to `~/.claude/plugins/cc-companion/config.json` as `petAt`:

```bash
python3 -c "
import json, time
p = '$HOME/.claude/plugins/cc-companion/config.json'
d = json.load(open(p))
d['petAt'] = int(time.time() * 1000)
json.dump(d, open(p, 'w'), indent=2)
print('petted!')
"
```

Then say something like "petted [name]!" with a heart emoji.
