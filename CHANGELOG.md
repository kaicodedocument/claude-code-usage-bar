# Changelog

Versions follow [Semantic Versioning](https://semver.org/).

## 0.3.3 - 2026-10-06

Documentation only; the mod's behavior is unchanged.

- Moved Requirements and Install to the top of the README, ahead of the reference sections.
- Added an "Update and uninstall" section.
- Added `repository` and `homepage` to `plugin.json`.

## 0.3.2 - 2026-10-06

Documentation only; the mod's behavior is unchanged.

- Replaced the light-theme screenshot with one taken after a few turns, so the token counts and cost are not zero.

## 0.3.1 - 2026-10-06

Documentation only; the mod's behavior is unchanged.

- Replaced the dark-palette screenshot with one that shows the reading-age mark.

## 0.3.0 - 2026-10-06

- The bar now shows how long ago the rate-limit reading was taken, as a refresh mark after the `7d` pill: `now`, `3m`, `1h 5m`.
- Added the `showUpdated` option to leave the mark out.
- The README is now titled with the repository's name, and its screenshots show the reading-age mark.
- Expanded the "When it updates" section of the README with the reading age and what to expect with one, several or no active sessions.

## 0.2.2 - 2026-10-06

Documentation only; the mod's behavior is unchanged.

- Added a "When it updates" section saying what triggers each figure to refresh.

## 0.2.1 - 2026-10-06

Documentation only; the mod's behavior is unchanged.

- Added a screenshot of the dark palette in the app's dark theme.
- The repository is now `claude-code-usage-bar`. The mod's own name, its `/usage-bar` command and its `pluginConfigs` key stay `usage-bar`.

## 0.2.0 - 2026-10-06

- Added options, set under `pluginConfigs` in `~/.claude/settings.json`: `theme`, `staleMinutes`, `warnBelow`, `dangerBelow` and `countCacheWrites`.
- Added a dark palette, chosen with `theme: "dark"`.
- With no options set the bar draws exactly as in 0.1.1.

## 0.1.1 - 2026-10-06

Documentation only; the mod's behavior is unchanged.

- Split the README into English (`README.md`) and Chinese (`README.zh.md`).
- Added Requirements and Troubleshooting sections.
- Replaced the generated preview with a screenshot of the bar in the desktop app.
- Added this changelog.

## 0.1.0 - 2026-10-06

First release. Written against Claude Code 2.1.288.

- A bar above the prompt with the allowance left in the 5-hour and 7-day rate-limit windows, time until each resets, session token counts and session cost.
- Sessions share their latest rate-limit reading, so an idle session catches up within a minute.
- Readings older than 10 minutes are drawn faded.
- `×` hides the bar; `/usage-bar` toggles it.
