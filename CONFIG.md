# Configuration Reference

Config file: `~/.claude/plugins/cc-companion/config.json`

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `salt` | string | (none) | Custom salt for pet generation. Set by `/companion:customize`. If absent, uses default salt `friend-2026-401` |
| `petName` | string | (none) | Your pet's display name. Shows above sprite in sprite mode. Set via `/companion` on first use or ask Claude to rename |
| `displayMode` | string | `"full"` | Statusline layout. `"full"` = 3-column (sprite + stats + info). `"sprite"` = right-aligned pet only |
| `animationMode` | string | `"classic"` | Sprite animation style. `"classic"` = CC's original idle sequence (time-driven, natural). `"sequential"` = frame advances every refresh (0→1→2→blink) |
| `screensaver` | boolean | `false` | Enable screensaver mode. Statusline shows rotating pets instead of your fixed pet |
| `screensaverMode` | string | `"random"` | Screensaver pet source. `"random"` = random pets. `"collection"` = cycle through saved collection |
| `screensaverInterval` | number | `5` | Minutes between pet changes in screensaver mode. `0` = change on every statusline refresh |
| `collection` | array | `[]` | Saved favorite pets. Each entry: `{ "name", "salt", "species", "rarity" }`. Managed via `/companion:collection` |

## Settings.json (CC statusline)

These go in `~/.claude/settings.json` under `statusLine`:

| Parameter | Value | Description |
|-----------|-------|-------------|
| `refreshInterval` | `4` | Seconds between statusline auto-refreshes. Drives animation. `4` = 1-minute animation cycle in classic mode |

## Example config

```json
{
  "salt": "jt3uEVrdkX97CRK",
  "petName": "Zigi",
  "displayMode": "sprite",
  "animationMode": "classic",
  "screensaver": false,
  "collection": [
    { "name": "Legendary Shiny Crown Dragon", "salt": "jt3uEVrdkX97CRK", "species": "dragon", "rarity": "legendary" },
    { "name": "Legendary Shiny Tinyduck Capybara", "salt": "wLt7wpVaXCIRr8I", "species": "capybara", "rarity": "legendary" }
  ]
}
```

## Notes

- `/companion` always shows your stored pet (config `salt`), regardless of screensaver mode
- Screensaver only affects the statusline display
- `refreshInterval` in settings.json is set by `/companion:statusline` command
- Hearts animation uses frame counting with 1s protection window — all 4 frames visible
- Terminal width for sprite mode is auto-detected via parent process PTY
