# Changelog

## 4.4.0

- Fix pet hearts: 1s protection window prevents bash-triggered refresh from eating frame 0
- All 4 heart frames now visible (0→1→2→3)

## 4.3.0

- Sprite display mode: right-aligned pet in statusline (set `displayMode: "sprite"` in config)
- Terminal width detection via parent PTY for accurate right-alignment
- Pet name displayed above sprite, centered
- `/companion:companion-pet` command + bash script for hearts animation (4 frames)
- Hearts and sprite auto-center when pet name is wider than sprite
- `/companion` now asks to name your pet on first use
- Pet naming via natural language ("rename my pet to xxx")

## 4.2.0

- Fix: unified 6-row layout (species + 5-line sprite) — frame 2 effects (smoke, spores, antenna) no longer get clipped
- Screensaver: collection mode to cycle through saved favorites
- Classic animation as default with 1s refresh

## 4.1.0

- Classic animation mode as default: CC's idle sequence with 1s refresh — natural fidgets and blinks
- Sequential mode available as option (0→1→2→blink cycle)
- Auto-refresh animation via `refreshInterval: 1` in statusline config
- Blink frame added to sequential mode

## 4.0.0

- Collection system: save, list, switch, and remove favorite pets
- Default collection name: `<Rarity> [Shiny] [Hat] <Species>`
- Animation: 3-frame sequential cycling on each statusline refresh
- Customize: restore to original option added

## 3.0.0

- Screensaver mode: random pet parade with configurable interval (0 = every refresh, N = minutes)
- Colored stat bars: cyan (high), yellow (mid), red (low)
- Session cost display in statusline
- Config moved to `~/.claude/plugins/cc-companion/config.json`

## 2.0.0

- 3-column statusline layout: sprite + stats + session info
- Bun.hash (wyhash) for exact CC algorithm match
- Conversational customize flow with shiny and peak stat support
- Statusline toggle on/off in single command
- Context usage bar, CC version, session duration display

## 1.0.0

- Initial release
- 18 species, 5 rarity tiers, 6 eye styles, 7 hats, 5 stats
- `/companion` — view your pet
- `/companion:customize` — choose your own pet via salt brute-force
- `/companion:statusline` — standalone statusline
- Marketplace-ready for distribution
