# Configuration Reference

Config file: `~/.claude/plugins/cc-companion/config.json`

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `salt` | string | (none) | Custom salt for pet generation. Set by `/companion:customize`. If absent, uses default salt `friend-2026-401` |
| `petName` | string | (none) | Your pet's display name. Shows above sprite in sprite mode. Set via `/companion` on first use or ask Claude to rename |
| `displayMode` | string | `"hud"` | Statusline layout. `"hud"` = 3-column (sprite + stats + info). `"sprite"` = right-aligned pet only |
| `animationMode` | string | `"classic"` | Sprite animation style. `"classic"` = CC's original idle sequence (time-driven, natural). `"sequential"` = frame advances every refresh (0→1→2→blink) |
| `screensaver` | boolean | `false` | Enable screensaver mode. Statusline shows rotating pets instead of your fixed pet |
| `screensaverMode` | string | `"random"` | Screensaver pet source. `"random"` = random pets. `"collection"` = cycle through saved collection |
| `screensaverInterval` | number | `5` | Minutes between pet changes in screensaver mode. `0` = change on every statusline refresh |
| `speechBubble` | string\|boolean | `false` | Speech bubble mode. `false` = off. `"fun"` = LLM writes `<!-- buddy: ... -->` in response (costs extra tokens). `"review"` = independent API call reviews assistant's code changes (no extra tokens in main conversation). `true` = same as `"fun"` (backwards compat) |
| `reviewBaseURL` | string | (none) | Custom API base URL for review mode. Falls back to CC proxy (`ANTHROPIC_BASE_URL` in settings.json). Examples: `http://localhost:6655/anthropic` (Anthropic proxy), `http://localhost:6655/openai/v1` (OpenAI proxy), `http://localhost:6655/litellm/v1` (LiteLLM proxy), `http://localhost:6655/gemini` (Gemini proxy), `https://api.anthropic.com` (Anthropic direct), `https://api.openai.com/v1` (OpenAI direct) |
| `reviewApiKey` | string | (none) | Custom API key for review mode. Falls back to CC proxy (`ANTHROPIC_AUTH_TOKEN` in settings.json). Required when using direct API (non-proxy) |
| `reviewModel` | string | (none) | Custom model for review mode. Falls back to `ANTHROPIC_DEFAULT_HAIKU_MODEL` or `anthropic--claude-haiku-latest`. Examples: `anthropic--claude-sonnet-latest`, `gpt-4.1-mini`, `gemini-2.5-flash` |
| `reviewAPIFormat` | string | `"anthropic"` | API format for review mode. `"anthropic"` = Anthropic messages API. `"openai"` / `"litellm"` = OpenAI chat completions API. `"gemini"` = Google Gemini generateContent API |
| `collection` | array | `[]` | Saved favorite pets. Each entry: `{ "name", "salt", "species", "rarity" }`. Managed via `/companion:collection` |

## Settings.json (CC statusline)

These go in `~/.claude/settings.json` under `statusLine`:

| Parameter | Value | Description |
|-----------|-------|-------------|
| `refreshInterval` | `1` | Seconds between statusline auto-refreshes. Drives animation. `1` = smooth animation |

## Example config

```json
{
  "salt": "jt3uEVrdkX97CRK",
  "petName": "Zigi",
  "displayMode": "sprite",
  "animationMode": "classic",
  "screensaver": false,
  "speechBubble": "review",
  "reviewAPIFormat": "anthropic",
  "reviewModel": "anthropic--claude-sonnet-latest",
  "collection": [
    { "name": "Legendary Shiny Crown Dragon", "salt": "jt3uEVrdkX97CRK", "species": "dragon", "rarity": "legendary" }
  ]
}
```

## Notes

- `/companion` always shows your stored pet (config `salt`), regardless of screensaver mode
- Screensaver only affects the statusline display
- `refreshInterval` in settings.json is set by `/companion:statusline` command
- Hearts animation uses frame counting with 1s protection window — all 5 frames visible
- Terminal width for sprite mode is auto-detected via parent process PTY
- Speech bubble uses Stop hook, registered by `/companion:statusline`
- Fun mode also uses UserPromptSubmit hook to inject instructions
- Review mode reads `transcript_path` from Stop hook to extract tool_use content (Edit diffs, Write, Bash)
- Fun mode bubble TTL 10 seconds, review mode TTL 30 seconds. DIM fade in last 3 seconds
- Review mode supports multiple API formats: Anthropic (default), OpenAI, LiteLLM, Gemini
- Severity colors: `[CRIT]` = red border+text, `[WARN]` = yellow, no tag = pet rarity color
