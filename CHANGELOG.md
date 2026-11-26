# Changelog

## 0.6.0
- `/tokenomics-setup` now asks about every item on its own, with an explanation and an example, answered with Yes or No: usage limits, reset times, context, model, project + git, changed lines and session time. Replaces the detail levels and the multi-select step
- `/tokenomics` is now a quick switch between a compact bar and your own selection (`/tokenomics compact` · `full`)
- Reset times and changed lines can be switched off separately
- Git commands run only if project + git or changed lines are shown, or the changes pane is open
- An earlier "compact" choice carries over; other old detail levels become your full selection

## 0.5.0
- New `/tokenomics-changes`: a pane beside the chat listing every file changed since the last commit, with +/− lines per file and new files marked
- Changed lines (`+/− lines`) now show in normal mode too; full mode additionally shows the exchange rate used
- Opt-in daily exchange rate from the European Central Bank: chosen in step 4 of `/tokenomics-setup`, at most one request per day to ecb.europa.eu, cached locally, nothing about you is sent. Without opting in, Tokenomics still makes no network request at all
- README, SECURITY.md, CONTRIBUTING.md, wiki and all setup/explain translations updated accordingly

## 0.4.8
- README and wiki: clearer installation guide: which way fits which use (desktop app, terminal, team project, development), the three scopes, and what to do when `claude` is not recognized

## 0.4.7
- README links to the new [wiki](https://github.com/Rheinwolf/tokenomics/wiki): installation, setup, commands, the cost figure, traffic light, privacy, troubleshooting, FAQ and translations

## 0.4.6
- Community files: Code of Conduct, contributing guide, accessibility statement
- Issue forms for bug reports and feature requests, a security contact link, and a pull request template

## 0.4.5
- Added a security policy (SECURITY.md): supported versions, private reporting through GitHub, what counts as a security issue, security design

## 0.4.4
- Changelog no longer names the icon's file path (the plugin directory flagged it)

## 0.4.3
- README: new section "Programs it runs" listing the three read-only git commands and why
- With Project + git switched off in the setup, no git command runs at all
- Removed the `icon` field from the manifest (Claude Code does not read it); the icon file itself stays

## 0.4.2
- Install name is now `tokenomics-bar` (the name `tokenomics` was already taken in the plugin directory); the bar and the `/tokenomics…` commands are unchanged
- Git info now comes from three read-only local git commands instead of an experimental interface
- Author and icon in the manifest
- README: privacy section (what is read, what is stored, what each hook does; nothing is sent)
- Note: your saved setup starts fresh once because of the new name; run `/tokenomics-setup` again

## 0.4.1
- The bar now starts with "Tokenomics <version>", followed by the session time
- Removed the extra cost footnote in full mode (the same text is in `/tokenomics-explain`)

## 0.4.0
- Traffic-light colours for limits and context: up to 50 % green, up to 75 % yellow (△), above red (▲)
- `/tokenomics-explain` in all eight setup languages
- Version number shown in `/tokenomics-explain`; version check across all files

## 0.3.0
- Separate commands: `/tokenomics-setup`, `/tokenomics-explain`, `/tokenomics-reset`
- Setup asks for your language first (detected from your messages, any spelling); setup texts in 8 languages
- Syntax check for all hooks files

## 0.2.0
- Guided setup in Claude's own question dialog; choices saved for every session

## 0.1.0
- First release: API cost / API value, 5h and 7d limits, context, model, project + git, session time
