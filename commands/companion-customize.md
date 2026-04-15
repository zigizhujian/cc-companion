---
description: "Choose your own companion pet (species, rarity, eyes, hat)"
allowed-tools: Bash(bun:*), Bash(command:*)
---

## Your task

Help the user customize their companion pet. This is a conversational flow — ask the user questions directly in chat, no need for AskUserQuestion.

### Step 1: Show current pet and ask what to do
```bash
PLUGIN_DIR=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-)
"$HOME/.bun/bin/bun" "${PLUGIN_DIR}scripts/companion.mjs"
```

Then ask: "Customize a new pet, or restore to your original?" If restore, run:
```bash
PLUGIN_DIR=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-)
"$HOME/.bun/bin/bun" "${PLUGIN_DIR}scripts/customize-auto.mjs" restore
```
Then stop.

### Step 2: Ask the user to choose, one at a time

**Species** — show this list and ask the user to pick a number or name:
```
 1. duck       5. dragon     9. turtle    13. capybara  17. mushroom
 2. goose      6. octopus   10. snail     14. cactus    18. chonk
 3. blob       7. owl       11. ghost     15. robot
 4. cat        8. penguin   12. axolotl   16. rabbit
```

**Rarity** — ask:
```
1. common ★    2. uncommon ★★    3. rare ★★★    4. epic ★★★★    5. legendary ★★★★★
```

**Eyes** — ask:
```
1. · (dot)    2. ✦ (sparkle)    3. × (cross)    4. ◉ (circle)    5. @ (at)    6. ° (degree)
```

**Hat** (skip if common) — ask:
```
1. crown    2. tophat    3. propeller    4. halo    5. wizard    6. beanie    7. tinyduck
```

**Shiny?** — ask yes/no (takes ~100x longer to search, about 1 second)

### Step 3: Run the finder non-interactively
After collecting all choices, build the command. Add `--shiny` flag if user wants shiny:
```bash
PLUGIN_DIR=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-)
"$HOME/.bun/bin/bun" "${PLUGIN_DIR}scripts/customize-auto.mjs" <species> <rarity> <eye> [hat] [--shiny]
```

### Step 4: Tell the user the statusline will update automatically. No restart needed.
