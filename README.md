# CC Companion

> Your coding buddy pet for Claude Code — alive in your statusline while you work.

Each Claude Code user gets a **unique deterministic companion** based on their account. View it, customize it, collect favorites, or watch a random pet parade roll by in screensaver mode.

![combined mode — screensaver capybara + fixed dragon](assets/combined%20collection.png)

---

## Installation

```
/plugin marketplace add zigizhujian/cc-companion
/plugin install cc-companion
```

**Requires [Bun](https://bun.sh)** — used for `Bun.hash` (wyhash) to match Claude Code's companion algorithm exactly.

---

## Display Modes

### Combined — screensaver pet + your pet

Left side: a rotating pet from your collection (or random). Right side: your fixed companion, always visible.

![combined mode — random ghost](assets/combined%20random.png)

### HUD — full statusline

3-column layout: animated sprite + 5 stats + session info (model, context, cost, duration).

![hud mode — dragon collection](assets/hud%20collection.png)

![hud mode — random](assets/hud%20random.png)

### Sprite — minimal right-aligned pet

Just your companion in the corner. Name above, hearts when petted. Closest to the original CC buddy UI.

![sprite mode — own pet](assets/sprite%20own.png)

![sprite mode — hearts animation](assets/sprite%20pet.png)

![sprite mode — random screensaver](assets/sprite%20random.png)

![sprite mode — collection screensaver](assets/sprite%20collection.png)

Set `displayMode` in `~/.claude/plugins/cc-companion/config.json`: `"combined"` · `"hud"` · `"sprite"`

---

## Commands

| Command | Description |
|---------|-------------|
| `/cc-companion:companion` | Show your companion (ASCII art, stats, rarity). Names your pet on first use |
| `/cc-companion:companion-customize` | Choose your own species, rarity, eyes, hat, and stats |
| `/cc-companion:companion-statusline` | Toggle companion statusline on/off |
| `/cc-companion:companion-screensaver` | Toggle screensaver mode on/off |
| `/cc-companion:companion-collection` | Save, list, switch, or remove favorite pets |
| `/cc-companion:companion-pet` | Pet your companion — floating hearts animation |

---

## Screensaver Mode

Turn your statusline into a **pet parade** — like opening blind boxes while you code.

Run `/cc-companion:companion-screensaver` to toggle. Choose a refresh interval:

- **0** — new random pet on every statusline refresh
- **1** — new pet every minute
- **5** (default) — new pet every 5 minutes

Set `screensaverMode` to `"random"` for fully random pets, or `"collection"` to cycle through your saved favorites.

---

## Collection

Save your favorite pets and switch between them anytime.

Run `/cc-companion:companion-collection`:
- **save** — save current pet (default name: `Legendary Shiny Crown Dragon`)
- **list** — show all collected pets
- **switch** — switch to a collected pet
- **remove** — remove a pet from collection

---

## Customization

`/cc-companion:companion-customize` walks you through choosing:

1. Species (18 options)
2. Rarity (common → legendary)
3. Eyes (6 styles: `·` `✦` `×` `◉` `@` `°`)
4. Hat (7 options, uncommon+ only)
5. Shiny (yes/no)

The plugin brute-force searches for a salt that produces your desired traits using `Bun.hash`. Usually takes under 2 seconds, even for shiny legendary pets.

---

## Species

18 unique species, each with 3-frame animation:

```
duck · goose · blob · cat · dragon · octopus · owl · penguin · turtle
snail · ghost · axolotl · capybara · cactus · robot · rabbit · mushroom · chonk
```

---

## Rarity

| Rarity    | Stars | Chance | Hat? | Shiny? |
|-----------|-------|--------|------|--------|
| Common    | ★     | 60%    | —    | 1%     |
| Uncommon  | ★★    | 25%    | Yes  | 1%     |
| Rare      | ★★★   | 10%    | Yes  | 1%     |
| Epic      | ★★★★  | 4%     | Yes  | 1%     |
| Legendary | ★★★★★ | 1%     | Yes  | 1%     |

---

## Stats

Every companion has 5 stats, with one peak and one dump stat:

| Stat | Description |
|------|-------------|
| DEBUGGING | Code debugging ability |
| PATIENCE | How patient your buddy is |
| CHAOS | Tendency for mischief |
| WISDOM | Coding wisdom |
| SNARK | Sass and sarcasm level |

Stat bars are colored: **cyan** (high) · **yellow** (mid) · **red** (low)

---

## How It Works

Claude Code generates companions deterministically: `Bun.hash(userId + salt)` feeds a Mulberry32 seeded PRNG that picks species, rarity, eyes, hat, and stats. This plugin uses the exact same algorithm.

Customization finds an alternative salt (15 characters) that produces your desired traits when combined with your userId — no binary patching required. Config is stored at `~/.claude/plugins/cc-companion/config.json`.

---

## License

MIT
