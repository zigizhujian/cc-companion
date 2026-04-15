---
description: "Save, list, or switch to a collected companion pet"
allowed-tools: Bash(bun:*), Bash(command:*), Read, Edit
---

## Your task

Manage the user's companion collection in `~/.claude/plugins/cc-companion/config.json`.

The `collection` field is an array of saved pets:
```json
{
  "collection": [
    { "name": "Gold Dragon", "salt": "65lGplfSYq3stdD", "species": "dragon", "rarity": "legendary" },
    { "name": "Capy", "salt": "wLt7wpVaXCIRr8I", "species": "capybara", "rarity": "legendary" }
  ]
}
```

### Step 1: Read config and ask what to do

Read `~/.claude/plugins/cc-companion/config.json`, then ask:
- "save" — save current pet to collection
- "list" — show all collected pets
- "switch" — switch to a collected pet
- "remove" — remove a pet from collection

### If save:
1. Show current pet:
```bash
PLUGIN_DIR=$(ls -d "${CLAUDE_CONFIG_DIR:-$HOME/.claude}"/plugins/cache/cc-companion/cc-companion/*/ 2>/dev/null | awk -F/ '{ print $(NF-1) "\t" $0 }' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1 | cut -f2-)
"$HOME/.bun/bin/bun" "${PLUGIN_DIR}scripts/companion.mjs"
```
2. Ask for a name (e.g. "Gold Dragon")
3. Add to `collection` array in config: `{ "name": "<name>", "salt": "<current salt>", "species": "<species>", "rarity": "<rarity>" }`
4. Tell user "Saved!"

### If list:
Show all collected pets as a numbered list:
```
1. Gold Dragon — dragon ★★★★★ legendary
2. Capy — capybara ★★★★★ legendary
```
If collection is empty, say "No pets collected yet."

### If switch:
1. List collected pets (numbered)
2. Ask user to pick a number
3. Set `salt` in config to the chosen pet's salt
4. Tell user the statusline will update automatically

### If remove:
1. List collected pets (numbered)
2. Ask user to pick a number
3. Remove from collection array
4. Tell user "Removed."
