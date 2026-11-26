# Security Policy

## Supported versions

Only the latest release gets security fixes. Please update before reporting.

| Version | Supported |
|---|---|
| latest 0.4.x | ✅ |
| older | ❌ |

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report it privately through GitHub instead:

1. Open the [Security tab](https://github.com/Rheinwolf/tokenomics/security) of this repository.
2. Click **Report a vulnerability**.
3. Describe what you found, how to reproduce it, and which version you used.

Only you and the maintainer can see the report. Tokenomics is a hobby project maintained by one person, so replies are best effort: usually within a week. Once a fix is released, you will be credited in the release notes unless you prefer not to be.

## What counts as a security issue

For example:

- Tokenomics sending any data about you anywhere (it is designed to send nothing)
- Tokenomics making any network request other than the opt-in daily ECB download, or making it when you did not choose it
- Tokenomics running anything other than the three documented read-only git commands
- Tokenomics reading data beyond what the README lists, or storing it
- A way to make Tokenomics run code or commands supplied by someone else

Display glitches, wrong numbers or translation mistakes are normal bugs: please open a regular issue for those.

## Security design

What Tokenomics does and does not do, so you can check it yourself in `hooks/`:

- **No network access by default.** No telemetry. The only request is opt-in: the public daily ECB reference rates (`ecb.europa.eu`), at most once per day, without any data about you.
- **One program, read-only.** It runs only `git`, with three fixed read-only commands (`rev-parse`, `status`, `diff --numstat`), locally in the project folder, with a 5-second timeout. With *No* to project + git in `/tokenomics-setup` and the changes pane closed, it runs none.
- **Minimal reading.** Session figures from Claude Code's plugin interface; your recent chat messages only during `/tokenomics-setup`, to guess your language, never stored or sent.
- **Minimal storage.** Only your setup choices, in Claude Code's local plugin store.
- **No dependencies.** No packages from npm or anywhere else; all code is in this repository.

See the **Privacy** section of the [README](README.md) for the full list.
