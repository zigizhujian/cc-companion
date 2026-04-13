# CC Companion

Your coding buddy pet for Claude Code. Each user gets a unique deterministic companion based on their account — view it, customize it, or embed it in your statusline.

## Features

- `/companion` — Show your unique companion pet with ASCII art, stats, and rarity
- `/companion:customize` — Choose your own species, rarity, eyes, hat, and stats
- `/companion:statusline` — Set your companion as the CC statusline
- `/companion:hud` — Embed your companion into claude-hud

## Installation

```bash
/plugin marketplace add zigizhujian/cc-companion
/plugin install cc-companion
```

**Requires [Bun](https://bun.sh)** (usually already installed with Claude Code).

## Species

18 unique species, each with 3-frame idle animation:

```
duck      goose     blob      cat       dragon    octopus
owl       penguin   turtle    snail     ghost     axolotl
capybara  cactus    robot     rabbit    mushroom  chonk
```

## Rarity

| Rarity    | Stars | Chance | Hat? |
|-----------|-------|--------|------|
| Common    | ★     | 60%    | No   |
| Uncommon  | ★★    | 25%    | Yes  |
| Rare      | ★★★   | 10%    | Yes  |
| Epic      | ★★★★  | 4%     | Yes  |
| Legendary | ★★★★★ | 1%     | Yes  |

## Stats

Every companion has 5 stats (one peak, one dump):

- **DEBUGGING** — Code debugging ability
- **PATIENCE** — How patient your buddy is
- **CHAOS** — Tendency for mischief
- **WISDOM** — Coding wisdom
- **SNARK** — Sass and sarcasm level

## Customization

`/companion:customize` lets you pick exactly what you want. It brute-force searches for a salt that produces your desired traits, then patches the Claude Code binary. Usually takes under a second.

To restore your original companion:
```bash
/companion:customize restore
```

## How It Works

Claude Code generates companions deterministically: `hash(userId + salt)` feeds a seeded PRNG that picks species, rarity, eyes, hat, and stats. This plugin uses the same algorithm (Bun.hash / wyhash + Mulberry32 PRNG) to show your pet — and optionally finds a different salt to get the companion you want.

## License

MIT
