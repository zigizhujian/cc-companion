# Changelog

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
