# Tokenomics

*Token + economics:* a calm, readable bar above the prompt in Claude Code (desktop app and terminal) that shows what the current session costs and how much of your limits it uses:

```
API value this session: $4.37 · covered by subscription  ·  5h limit 41% · resets in 1h59m  ·  7d limit 17% · resets in 3d11h  ·  context 38%  ·  Opus 5.5  ·  LottoLabor · main ✗  ·  1h30m
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

### Warnings
Colour is never the only signal — a symbol is added too:

- Limits: `△` + orange from 60 %, `▲` + red from 80 %
- Context: `▲` + red from 80 %

## The cost figure

Claude Code always computes a session cost at API list prices — even on a subscription. Tokenomics detects the billing type itself:

- **Subscription** (detected because 5h/7d limit data is present):
  `API value this session: $4.37 · covered by subscription`
  This is what the session *would* cost at API prices. It is not billed, your plan price is **not** subtracted, and it covers this session only. So it is not a "saving".
- **API billing:** `API cost this session: $4.37`
  A client-side estimate. Your invoice is the final authority.
- A trailing `*` means a model with no known price was counted at another model's rates.

Type `/tokenomics explain` for this explanation inside the app.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install tokenomics --marketplace Rheinwolf/tokenomics
```

Answer `y` to add the marketplace, then pick a scope (user scope = every session).

From a shell:

```
claude plugin install tokenomics --marketplace Rheinwolf/tokenomics
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
   - *Full*: adds uncommitted lines (+/-) and a footnote explaining the cost figure
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
| `/tokenomics explain` | explain the cost figure |
| `/tokenomics reset` | back to defaults |

## Privacy

Reads local session data only. Sends nothing, loads nothing from the internet, stores nothing but your own setup choices. If a value is missing or a call fails, the segment is hidden and the app is never disturbed.

## Development

```
node test/format.check.ts
node test/lang.check.ts
```

runs the formatter against sample data (subscription, API billing, missing values, Windows paths).

## License

MIT
