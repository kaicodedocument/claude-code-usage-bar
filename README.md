# usage-bar

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

English | [中文](README.zh.md)

A Claude Code mod that draws a usage bar above the prompt: what is left of the 5-hour and 7-day rate-limit windows, this session's tokens, and its cost.

![usage-bar above the Claude Code prompt](docs/screenshot.png)

> **Early access.** Claude Code's mod (function hooks) API may change between releases, and a Claude Code update can break this mod. See [Requirements](#requirements) for what it has been used on.

## What it shows

| Item | Meaning |
| --- | --- |
| `5h` / `7d` bar and `%` | Allowance left in the window |
| Vertical mark on the bar | Share of the window's time that is left. Fill past the mark means the allowance is lasting longer than the clock |
| Clock | Time until the window resets |
| Up arrow | Input tokens this session: uncached input plus cache writes |
| Down arrow | Output tokens this session |
| Layers | Tokens read from the prompt cache this session |
| Coin | Session cost in US dollars, as `/cost` totals it |

The bar turns orange at 30% left and red at 10% left. A reading older than 10 minutes is drawn faded.

## Requirements

- Claude Code with mods (function hooks) available. Written against 2.1.288.
- Used only on the macOS desktop app. In a terminal the bar is one line of text. Windows, Linux, the VS Code extension and the mobile app are untested.
- A Claude subscription for the `5h` and `7d` windows. Without one Claude Code reports no rate-limit windows and both show `--`.

## Install

```bash
git clone https://github.com/kaicodedocument/usage-bar ~/.claude/mods/usage-bar
```

Name the folder in the `env` block of `~/.claude/settings.json`, then start a new session:

```json
{
  "env": {
    "CLAUDE_CODE_PLUGIN_DIRS": "~/.claude/mods/usage-bar"
  }
}
```

To try it in one terminal session only:

```bash
claude --plugin-dir ~/.claude/mods/usage-bar
```

## Hide and show

- Press `×` at the right end of the bar to hide it. Hidden, it takes no space.
- Type `/usage-bar` to show it again, or to toggle.

The choice lasts for the session; a new session starts with the bar shown.

## Troubleshooting

**The bar does not appear.** Sessions read the setting when they start, so open a new session; restart the app if a new session still has none. Check that the path in `CLAUDE_CODE_PLUGIN_DIRS` is the folder holding `.claude-plugin/`. `claude --debug` logs a line starting `usage-bar:` when the mod fails to load.

**Everything shows `--` or `0`.** No model response has come back yet in this session. Send a message.

**The percentages are faded.** The reading is more than 10 minutes old. It refreshes on the next response in any local session.

**The numbers differ from Settings > Usage.** The bar shows what is left, Settings shows what is used. The bar's figure is the one the last model response carried, rounded to a whole percent, so it lags a live query.

## Limits

- The rate-limit figures come from the last model response, not from a live query. Sessions share their latest reading through the mod's store and pick it up within a minute, but usage on claude.ai or the mobile app is not seen until a local session gets a response.
- Token counts start when the mod loads; turns before that are not counted.
- Pill colors are fixed and do not follow the dark theme.
- Nothing is configurable yet: colors and thresholds are constants in `hooks/bar.ts`.

## Develop

```bash
claude plugin validate .
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude plugin test .
```

`hooks/register.tsx` holds the behavior, `hooks/bar.ts` the drawing and number formats. Changes are listed in [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE)
