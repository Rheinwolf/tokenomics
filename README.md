<img src=".claude-plugin/icon.png" width="96" alt="Tokenomics icon">

# Tokenomics

**Version 0.4.3** · MIT license · [Changelog](CHANGELOG.md)

*Token + economics:* a calm, readable bar above the prompt in Claude Code (desktop app and terminal) that shows what the current session costs and how much of your limits it uses:

```
Tokenomics 0.4.3  ·  1h30m  ·  API value this session: $4.37 · covered by subscription  ·  5h limit 41% · resets in 1h59m  ·  7d limit 17% · resets in 3d11h  ·  context 38%  ·  Opus 5.5  ·  LottoLabor · main ✗
```

<!-- Screenshot: docs/screenshot.png -->

## What it shows

| Segment | Example | Source |
|---|---|---|
| Cost / API value | `API cost this session: $4.37` | `$.session.usage().cost` |
| 5-hour limit + reset | `5h limit 41% · resets in 1h59m` | `rateLimits` (subscription only) |
| 7-day limit + reset | `7d limit 17% · resets in 3d11h` | `rateLimits` (subscription only) |
| Context fill | `context 38%` | `context.percent` |
| Model | `Opus 5.5` | `$.session.model()` |
| Project · branch · uncommitted | `LottoLabor · main ✗` | project root + git |
| Lines (full mode) | `+120 / −30 lines` | uncommitted git diff vs `HEAD` |
| Duration | `1h30m` | session start time |

Any value the app does not provide is simply left out. Nothing is guessed.

### Traffic light
Colour is never the only signal — a symbol is added too:

Limits (5h / 7d) and context use the same traffic light:

- up to 50 %: green
- up to 75 %: yellow + `△`
- above 75 %: red + `▲`

## The cost figure

Claude Code always computes a session cost at API list prices — even on a subscription. Tokenomics detects the billing type itself:

- **Subscription** (detected because 5h/7d limit data is present):
  `API value this session: $4.37 · covered by subscription`
  This is what the session *would* cost at API prices. It is not billed, your plan price is **not** subtracted, and it covers this session only. So it is not a "saving".
- **API billing:** `API cost this session: $4.37`
  A client-side estimate. Your invoice is the final authority.
- A trailing `*` means a model with no known price was counted at another model's rates.

Type `/tokenomics-explain` for this explanation inside the app.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install tokenomics-bar --marketplace Rheinwolf/tokenomics
```

Answer `y` to add the marketplace, then pick a scope (user scope = every session).

From a shell:

```
claude plugin install tokenomics-bar --marketplace Rheinwolf/tokenomics
```

In the **desktop app** (where `/plugin` does not run): click **+** next to the prompt box → **Plugins** → **Add marketplace** with `Rheinwolf/tokenomics` → **Add plugin**.

Installed at the user scope from a terminal, the bar also shows in the desktop app's Code tab.

### For development

```
claude --plugin-dir /path/to/tokenomics
```

or add the folder to the `CLAUDE_CODE_PLUGIN_DIRS` environment variable.

## Setup

After installing, type:

```
/tokenomics-setup
```

A short guided setup opens in Claude's own question dialog and asks, one step at a time:

0. **Language**: English is always offered, plus the language detected from your recent messages. You can also type any language, in English or in your own language ("German" or "Deutsch"). Setup texts are available in English, Deutsch, Français, Español, Italiano, Polski, Nederlands and Português; other languages fall back to English.
1. **Detail level**
   - *Compact*: cost, limits and context only, no reset times
   - *Normal* (default): adds reset times, model, project + git branch and session time
   - *Full*: adds uncommitted lines (+/-)
2. **Segments**: tick what you want to see (limits, context + model, project + git, session time). The cost figure always shows.
3. **Second currency** (optional): e.g. EUR, GBP, CHF or any code you type
4. **Fixed rate** for that currency (e.g. `0.92`). In full mode the rate is shown next to the converted value. No live rates are fetched.

Your choices are saved and apply to every session. Until you run the setup, the defaults are used (normal, everything visible, USD only).

### Commands

| Command | What it does |
|---|---|
| `/tokenomics-setup` | guided setup (also `/tokenomics setup`) |
| `/tokenomics` | cycle compact → normal → full |
| `/tokenomics compact` · `normal` · `full` | jump to a level |
| `/tokenomics-explain` | explain the cost figure |
| `/tokenomics-reset` | back to defaults (keeps your setup language) |

## Privacy

**Tokenomics sends nothing anywhere.** It makes no network requests, loads nothing from the internet and has no telemetry. Everything stays on your computer. If a value is missing or a call fails, that segment is hidden and the app is never disturbed.

### What it reads

| Data | Why | How |
|---|---|---|
| Session cost, 5h/7d limits, context fill, start time | the bar's figures | `$.session.usage()`, local to Claude Code |
| Model name | the model segment | `$.session.model()` |
| Project folder | its name for the project segment | `$.session.root()` |
| Git branch and uncommitted changes | the `project · branch ✗` segment and `+/− lines` | three read-only git commands run locally in the project folder: `git rev-parse --abbrev-ref HEAD`, `git status --porcelain`, `git diff --numstat HEAD` |
| Your last chat messages (text only) | **only during `/tokenomics-setup`**, to guess your language for the pre-selected option; counted locally, never stored or sent | `$.session.messages()` |

### Programs it runs

Tokenomics starts exactly one program: **`git`**, and only these three read-only commands, written as fixed text in `hooks/register.ts` (function `refreshRepo`):

| Command | Why |
|---|---|
| `git rev-parse --abbrev-ref HEAD` | the name of the current branch (e.g. `main`) |
| `git status --porcelain` | whether there are uncommitted changes (the `✗`) |
| `git diff --numstat HEAD` | how many lines were added and removed (`+120 / −30 lines`, full mode) |

- They run in the project folder of the current session, at session start and after each turn, with a 5-second timeout.
- They only read. They change nothing, contact no server (no `fetch`, `pull` or `push`) and their output is used only to draw the bar.
- If git is not installed or the folder is not a git repository, the project segment simply shows the folder name.
- To avoid them completely, untick **Project + git** in `/tokenomics-setup`.

### What it stores

Only your setup choices (language, detail level, visible segments, currency and rate), in Claude Code's local plugin store (`$.store`).

### What each hook does

| Hook | What it does |
|---|---|
| `session.start` | registers the four `/tokenomics…` commands, loads your saved setup, reads the git info |
| `command.run` | answers the four `/tokenomics…` commands only; it does not touch any other command |
| `session.measure` | redraws the bar when cost, limits or context change |
| `turn.complete` | refreshes the git info after each turn and redraws the bar |
| `ui.render` (`AbovePrompt`) | draws the bar above the prompt |

Tokenomics uses no other plugin and calls nothing outside Claude Code's own plugin interface.

## Development

```
node test/format.check.ts
node test/lang.check.ts
node test/syntax.check.ts
node test/version.check.ts
```

runs the formatter against sample data (subscription, API billing, missing values, Windows paths).

## License

MIT
