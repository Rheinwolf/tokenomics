# Changelog

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
