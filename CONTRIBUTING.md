# Contributing to Tokenomics

Thanks for wanting to help! Bug reports, ideas, translations and code are all welcome.

## Reporting a bug or asking for a feature

Open an [issue](https://github.com/Rheinwolf/tokenomics/issues/new/choose) and pick the matching template. Please include your Tokenomics version (the bar starts with `Tokenomics x.y.z`).

Security problems go through the private route in [SECURITY.md](SECURITY.md), not a public issue.

## Translations

The setup and `/tokenomics-explain` texts live in `hooks/lang.ts` and `hooks/explain.ts`. Corrections from native speakers are especially welcome. A new language needs:

1. an entry in `LANGS` in `hooks/lang.ts` (name, spellings, frequent words, setup texts)
2. an entry in `TEXTS` in `hooks/explain.ts`

The bar itself stays in English.

## Working on the code

### Setup

```
git clone https://github.com/Rheinwolf/tokenomics.git
claude --plugin-dir ./tokenomics
```

You need [Node.js](https://nodejs.org/) 22.18 or newer to run the checks. There are no packages to install.

### Checks

Run them before every pull request:

```
node --test "test/*.test.ts"
```

For a coverage report add `--experimental-test-coverage`. The same checks run automatically on GitHub (Ubuntu, Windows, macOS) for every push and pull request; see `.github/workflows/ci.yml`. New edge cases belong in `test/edge.test.ts`.

### Rules that matter

- **Pass `$` only to functions declared at the top of the file.** Claude Code refuses a mod that hands `$` to a nested function, and the old version keeps running silently.
- **No new network access, no new programs.** Tokenomics sends nothing about the user, makes no request except the opt-in daily ECB download, and runs only the three documented read-only git commands. Anything else needs a very good reason and an update to the README's Privacy section and SECURITY.md.
- **Pure logic goes in `hooks/format.ts`**, so it can be tested with plain Node.
- **Missing data hides a segment.** Never guess or invent a value.
- **English** for code, comments and the bar.

### Versions

Every release changes the version in all of these, and `test/version.test.ts` makes sure they match:

- `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`
- `VERSION` in `hooks/explain.ts`
- the `**Version x.y.z**` line and the example bar in `README.md`
- a new entry at the top of `CHANGELOG.md`

In a pull request you may leave the version alone; the maintainer sets it when releasing.

## Pull requests

Keep them small and focused on one thing, describe what changed and why, and fill in the checklist in the template.

By contributing, you agree that your work is published under the project's [MIT license](LICENSE), and you follow the [Code of Conduct](CODE_OF_CONDUCT.md).
