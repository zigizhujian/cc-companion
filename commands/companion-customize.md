---
description: "Choose your own companion pet (species, rarity, eyes, hat)"
allowed-tools: Bash(bun:*), Bash(command:*), AskUserQuestion
---

## Your task

Help the user choose their companion pet. Use AskUserQuestion to collect choices, then run the customize script with parameters.

### Step 1: Show current pet
```bash
PLUGIN_DIR=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-)
"$HOME/.bun/bin/bun" "${PLUGIN_DIR}scripts/companion.mjs"
```

### Step 2: Ask species and rarity using AskUserQuestion
- Question 1: "Which species?" with options (max 4 per question, so split into rounds):
  - Round 1: duck, goose, blob, cat
  - Round 2: dragon, octopus, owl, penguin
  - Round 3: turtle, snail, ghost, axolotl
  - Round 4: capybara, cactus, robot, rabbit
  - Round 5: mushroom, chonk
  
  OR: Ask the user to type their preferred species name directly.

- Question 2: "Which rarity?" — common, uncommon, rare, epic (legendary as Other)

- Question 3: "Which eyes?" — · (dot), ✦ (sparkle), × (cross), ◉ (circle)
  
- Question 4 (only if rarity is not common): "Which hat?" — crown, tophat, propeller, wizard

### Step 3: Run the finder + patcher non-interactively
After collecting all choices, run:
```bash
PLUGIN_DIR=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-)
"$HOME/.bun/bin/bun" "${PLUGIN_DIR}scripts/customize-auto.mjs" <species> <rarity> <eye> <hat>
```

### Step 4: Tell the user to restart Claude Code
