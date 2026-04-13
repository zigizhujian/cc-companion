# CC Companion

Your coding buddy pet for Claude Code. Each user gets a unique deterministic companion based on their account — view it, customize it, and display it in your statusline.

```
★★★★★  DRAGON ✨
   \^^^/      DEBUGGING ██████████ 100    opus
  /^\  /^\    PATIENCE  ███████░░░  69    CC v2.1.104
 <  ✦  ✦  >   CHAOS     █████████░  86    ctx  ████░░░░░░  40%
 (   ~~   )   WISDOM    ██████████ 100    cost: $38.70
  `-vvvv-´    SNARK     ████░░░░░░  41    ⏱ 1h 54m
```

## Installation

```
/plugin marketplace add zigizhujian/cc-companion
/plugin install cc-companion
```

**Requires [Bun](https://bun.sh)** — needed for `Bun.hash` (wyhash) to match Claude Code's companion algorithm.

## Commands

| Command | Description |
|---------|-------------|
| `/cc-companion:companion` | Show your companion pet (ASCII art, stats, rarity) |
| `/cc-companion:companion-customize` | Choose your own species, rarity, eyes, hat, and stats |
| `/cc-companion:companion-statusline` | Toggle companion statusline on/off |

## Statusline

The companion statusline replaces your default statusline (or claude-hud) with a 3-column display:

- **Column 1**: Species name + ASCII sprite
- **Column 2**: 5 stats with colored bars (cyan = high, yellow = mid, red = low)
- **Column 3**: Model, CC version, context usage bar, session cost, session duration

Run `/cc-companion:companion-statusline` to toggle it on or off.

## Species

18 unique species, each with 3-frame idle animation:

```
 1. duck       5. dragon     9. turtle    13. capybara  17. mushroom
 2. goose      6. octopus   10. snail     14. cactus    18. chonk
 3. blob       7. owl       11. ghost     15. robot
 4. cat        8. penguin   12. axolotl   16. rabbit
```

## Rarity

| Rarity    | Stars | Chance | Hat? |
|-----------|-------|--------|------|
| Common    | ★     | 60%    | No   |
| Uncommon  | ★★    | 25%    | Yes  |
| Rare      | ★★★   | 10%    | Yes  |
| Epic      | ★★★★  | 4%     | Yes  |
| Legendary | ★★★★★ | 1%     | Yes  |

**Shiny**: 1% chance per roll. Marked with ✨ in the statusline.

## Hats

Available for uncommon and above: crown, tophat, propeller, halo, wizard, beanie, tinyduck.

## Stats

Every companion has 5 stats (one peak, one dump):

- **DEBUGGING** — Code debugging ability
- **PATIENCE** — How patient your buddy is
- **CHAOS** — Tendency for mischief
- **WISDOM** — Coding wisdom
- **SNARK** — Sass and sarcasm level

## Customization

`/cc-companion:companion-customize` walks you through choosing:

1. Species (18 options)
2. Rarity (common → legendary)
3. Eyes (6 styles: · ✦ × ◉ @ °)
4. Hat (7 options, uncommon+ only)
5. Shiny (yes/no)

The plugin brute-force searches for a salt that produces your desired traits using `Bun.hash`. Usually takes under 2 seconds, even for shiny legendary pets.

Your custom salt is saved to `~/.claude/plugins/cc-companion/config.json`. The statusline reads it automatically — no restart needed.

To restore your original (default) companion:

```bash
~/.bun/bin/bun ~/.claude/plugins/cache/cc-companion/cc-companion/*/scripts/customize-auto.mjs restore
```

## How It Works

Claude Code generates companions deterministically: `Bun.hash(userId + salt)` feeds a Mulberry32 seeded PRNG that picks species, rarity, eyes, hat, and stats. This plugin uses the exact same algorithm to display your pet.

Customization works by finding an alternative salt (same length, 15 characters) that produces your desired traits when combined with your userId. The salt is stored locally — no binary patching required.

**Note**: The plugin also includes binary patching code (`patcher.mjs`) for when Anthropic re-enables the official `/buddy` UI. Currently unused since the official buddy feature is not active.

## License

MIT
