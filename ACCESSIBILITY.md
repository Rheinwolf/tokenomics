# Accessibility

Tokenomics should be readable for everyone, including people with colour vision deficiency or low vision.

## What we do

- **Colour is never the only signal.** Yellow always comes with `△`, red with `▲`, and every value is also written as a number (`context 82%`). The traffic light works with red-green colour blindness.
- **Text only.** The bar is plain text drawn by Claude Code itself, so it follows your Claude Code theme (light or dark), font size and any zoom you use.
- **Calm by default.** Only values that can run out get a colour; everything else stays muted. Nothing blinks or moves.
- **Adjustable amount of information.** `/tokenomics` switches between compact, normal and full, and `/tokenomics-setup` lets you hide whole segments.
- **Your language for setup and help.** `/tokenomics-setup` and `/tokenomics-explain` are available in 8 languages; the setup asks first and accepts any spelling of a language name.
- **Keyboard only.** Everything works through slash commands and Claude Code's own question dialog; no mouse is needed.

## Supported environments

- Claude Code desktop app (Code tab) on Windows and macOS
- Claude Code in the terminal

Tested by the maintainer on Windows 11 with the desktop app, dark theme.

## Known limitations

- **Screen readers:** the bar is plain text, but how it is announced depends on Claude Code and your screen reader. This has not been tested yet.
- **The bar itself is in English** (labels like `context`, `limit`, `resets in`). Only the setup and explain texts are translated.
- **Translations** other than English and German have not been reviewed by native speakers yet.
- **Colours** are Claude Code's theme colours for success, warning and error; Tokenomics cannot change them.

## Reporting a barrier

If something is hard to read or use for you, please open an [issue](https://github.com/Rheinwolf/tokenomics/issues/new/choose) and describe what you use (e.g. screen reader, high contrast, zoom). Accessibility problems are treated as bugs.
