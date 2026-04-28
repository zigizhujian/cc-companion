# Changelog

## 7.2.1

- `reviewNoReasoning` config: disable reasoning for OpenAI reasoning models (GPT-5, GPT-5 Mini)
- Severity tag normalization: `[CRIT]`/`[WARN]` moved to front regardless of position in response
- Review prompt clarifies diff format: only review `+++ new` code, ignore `--- old`
- Lower review content threshold from 20 to 10 characters
- `run-statusline.sh` wrapper: statusLine.command no longer contains inline awk escapes
- Remove statusline now also cleans up cc-companion hooks from settings.json

## 7.2.0

- Multi-provider review: support Anthropic, OpenAI, LiteLLM, and Gemini API formats
- New config field `reviewAPIFormat`: `"anthropic"` (default), `"openai"`, `"litellm"`, `"gemini"`
- OpenAI/LiteLLM uses `max_completion_tokens` (required for reasoning models)
- Tested with Claude Sonnet, GPT-4.1 Mini, Gemini 2.5 Flash

## 7.1.0

- Speech bubble severity colors: `[CRIT]` = red (injection, XSS, security), `[WARN]` = yellow (minor issues), no tag = default color
- Reviewer detects severity from code changes and tags reaction accordingly

## 7.0.0

- Review mode: independent API call reviews assistant's code changes after each turn
- Stop hook reads `transcript_path` to extract actual Edit diffs, Write content, Bash commands
- Reviewer runs as a separate Claude instance (no shared history with main conversation)
- `speechBubble` is now three-state: `false` / `"fun"` / `"review"`
- Fun mode TTL 10s, review mode TTL 30s
- Custom API config: `reviewBaseURL`, `reviewApiKey`, `reviewModel`
- CJK-aware text wrapping: CJK chars break anywhere, Latin breaks at word boundaries
- Forbidden-start punctuation (。，！？etc) never appears at line start
- Word-boundary backtrack for English prevents mid-word line breaks
- `run-statusline.sh` wrapper — statusLine.command no longer contains inline awk
- Remove statusline now also cleans up cc-companion hooks from settings.json

## 6.0.0

- Speech bubble: companion reacts to each conversation turn with a short comment
- Stop hook extracts `<!-- buddy: ... -->` from LLM response
- UserPromptSubmit hook injects bubble instructions when `speechBubble` enabled
- Bubble renders in sprite and combined modes (34 wide, round border, 10s TTL)
- DIM fade in last 3 seconds, pet rarity color for border and text
- `speechBubble` config toggle (default off, saves tokens)
- Bubble language follows user's language
- Hook wrappers in config dir for version-independent paths

## 5.2.0

- 5-frame hearts animation from CC source (♥ float up + · dissolve)
- Display mode renamed: `full` → `hud`
- Col2 right padding (2 spaces) in hud and combined modes
- SHINY label color changed to gold (256-color 220)
- Default refreshInterval changed to 1 second
- Statusline install uses python script to avoid CC skill $0 stripping
- Companion statusline command: display mode switching when already active
- First-run onboarding: auto-init config defaults, read docs on first `/companion`
- Customize: dry-run by default, confirm before saving

## 5.0.0

- Combined display mode: left screensaver pet + stats + session info, right fixed pet
- Terminal width detection via parent PTY for right-aligned positioning
- Braille Blank padding throughout combined mode to resist CC trim
- Dynamic first-row overflow compensation for long species names
- Pet hearts animation works in combined mode
- COL2_WIDTH corrected to 24 (actual stats width)

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
