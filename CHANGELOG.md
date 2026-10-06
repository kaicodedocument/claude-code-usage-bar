# Changelog

Versions follow [Semantic Versioning](https://semver.org/).

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
