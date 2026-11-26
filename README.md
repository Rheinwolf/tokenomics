# Session Bar

A calm, readable bar above the prompt in the **Claude desktop app** (Code tab) that shows what is going on in the current session:

```
API value this session: $4.37 · covered by subscription  ·  5h limit 41% · resets in 1h59m  ·  7d limit 17% · resets in 3d11h  ·  context 38%  ·  Opus 5.5  ·  LottoLabor · main ✗  ·  1h30m
```

<!-- Screenshot: docs/screenshot.png -->

The terminal `statusLine` setting does not appear in the desktop app. Session Bar is a mod (plugin hooks module) that draws there instead, and it also works in the terminal.

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

Claude Code always computes a session cost at API list prices — even on a subscription. Session Bar detects the billing type itself:

- **Subscription** (detected because 5h/7d limit data is present):
  `API value this session: $4.37 · covered by subscription`
  This is what the session *would* cost at API prices. It is not billed, your plan price is **not** subtracted, and it covers this session only. So it is not a "saving".
- **API billing:** `API cost this session: $4.37`
  A client-side estimate. Your invoice is the final authority.
- A trailing `*` means a model with no known price was counted at another model's rates.

Type `/session-bar explain` for this explanation inside the app.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install session-bar --marketplace Rheinwolf/session-bar
```

Answer `y` to add the marketplace, then pick a scope (user scope = every session).

From a shell:

```
claude plugin install session-bar --marketplace Rheinwolf/session-bar
```

In the **desktop app** (where `/plugin` does not run): click **+** next to the prompt box → **Plugins** → **Add marketplace** with `Rheinwolf/session-bar` → **Add plugin**.

Installed at the user scope from a terminal, the bar also shows in the desktop app's Code tab.

### For development

```
claude --plugin-dir /path/to/session-bar
```

or add the folder to the `CLAUDE_CODE_PLUGIN_DIRS` environment variable.

## Settings

| Option | Values | Default |
|---|---|---|
| `detail` | `compact` · `normal` · `full` | `normal` |
| `currency` | e.g. `EUR` (empty = USD only) | empty |
| `rate` | fixed rate, 1 USD = ? (e.g. `0.92`) | empty |

The second currency always shows the fixed rate you entered (in full mode next to the value). No live rates are fetched.

Commands:
- `/session-bar` — cycle compact → normal → full
- `/session-bar full` — jump to a level
- `/session-bar explain` — explain the cost figure

## Privacy

Reads local session data only. Sends nothing, loads nothing from the internet, stores nothing outside the session. If a value is missing or a call fails, the segment is hidden and the app is never disturbed.

## Development

```
node test/format.check.ts
```

runs the formatter against sample data (subscription, API billing, missing values, Windows paths).

## License

MIT
