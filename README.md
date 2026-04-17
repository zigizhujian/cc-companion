# CC Companion

Your coding buddy pet for Claude Code. Each user gets a unique deterministic companion based on their account — view it, customize it, display it in your statusline, collect favorites, or watch random pets parade by in screensaver mode.

```
★★★★★  DRAGON ✨
   \^^^/      DEBUGGING ██████████ 100    opus
  /^\  /^\    PATIENCE  ███████░░░  69    CC v2.1.104
 <  ✦  ✦  >   CHAOS     █████████░  86    ctx ████░░░░░░  40%
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
| `/cc-companion:companion` | Show your companion pet (ASCII art, stats, rarity). Names your pet on first use |
| `/cc-companion:companion-customize` | Choose your own species, rarity, eyes, hat, and stats |
| `/cc-companion:companion-statusline` | Toggle companion statusline on/off |
| `/cc-companion:companion-screensaver` | Toggle screensaver mode on/off |
| `/cc-companion:companion-collection` | Save, list, switch, or remove favorite pets |
| `/cc-companion:companion-pet` | Pet your companion — shows floating hearts animation |

## Statusline

The companion statusline replaces your default statusline (or claude-hud) with a 3-column display:

- **Column 1**: Species name + animated ASCII sprite (cycles 3 frames every second)
- **Column 2**: 5 stats with colored bars (cyan = high, yellow = mid, red = low)
- **Column 3**: Model, CC version, context usage bar, session cost, session duration

The statusline auto-refreshes every 4 seconds (`refreshInterval: 4`), driving a natural animation with occasional fidgets and blinks — one full cycle per minute.

Run `/cc-companion:companion-statusline` to toggle it on or off.

### Animation Modes

Set `animationMode` in `~/.claude/plugins/cc-companion/config.json`:

- **`"classic"`** (default) — CC's original time-driven idle sequence `[0,0,0,0,1,0,0,0,-1,0,0,2,0,0,0]` at 500ms/frame. Mostly idle, with occasional fidgets and blinks — feels alive. One full cycle per minute at `refreshInterval: 4`.
- **`"sequential"`** — frame advances on every refresh: 0→1→2→blink→0. Mechanical but predictable.

### Display Modes

Set `displayMode` in `~/.claude/plugins/cc-companion/config.json`:

- **`"hud"`** (default) — 3-column layout: sprite + stats + session info
- **`"sprite"`** — right-aligned pet only, with name above and hearts animation. Minimal and clean, closest to the original CC buddy UI

### Pet Name

Your companion can have a custom name. `/cc-companion:companion` will ask you on first use. To rename anytime, just tell Claude: "rename my pet to xxx".

The name displays above your pet in sprite mode.

### Pet Animation

Run `/cc-companion:companion-pet` or `~/.claude/plugins/cache/cc-companion/cc-companion/*/scripts/pet.sh` to pet your companion. Floating hearts appear for 4 refreshes then fade away.

## Screensaver Mode

Turn your statusline into a pet parade — a random companion appears periodically, like opening blind boxes while you code.

Run `/cc-companion:companion-screensaver` to toggle. It will ask for a refresh interval:

- **0** — a new random pet on every statusline refresh (every time Claude responds)
- **1** — a new pet every minute
- **5** (default) — a new pet every 5 minutes

Each random pet has its own species, rarity, eyes, hat, stats — fully randomized. You never know what you'll get next.

## Collection

Save your favorite pets and switch between them anytime.

Run `/cc-companion:companion-collection`:

- **save** — save current pet to your collection (default name: `Legendary Shiny Crown Dragon`)
- **list** — show all collected pets
- **switch** — switch to a collected pet
- **remove** — remove a pet from collection

## Species

18 unique species, each with 3-frame animation:

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

You can also restore to your original (default) companion via the customize command.

## How It Works

Claude Code generates companions deterministically: `Bun.hash(userId + salt)` feeds a Mulberry32 seeded PRNG that picks species, rarity, eyes, hat, and stats. This plugin uses the exact same algorithm to display your pet.

Customization works by finding an alternative salt (same length, 15 characters) that produces your desired traits when combined with your userId. The salt is stored locally — no binary patching required.

Config is stored at `~/.claude/plugins/cc-companion/config.json`.

## License

MIT
