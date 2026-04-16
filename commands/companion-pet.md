---
description: "Pet your companion! Shows hearts animation"
allowed-tools: Bash
---

## Your task

Run the pet script:
```bash
PLUGIN_DIR=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-)
bash "${PLUGIN_DIR}scripts/pet.sh"
```

Do not add any extra commentary. The script output speaks for itself.
