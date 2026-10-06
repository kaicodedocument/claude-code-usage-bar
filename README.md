# usage-bar

A Claude Code mod that draws a usage bar above the prompt: what is left of the 5-hour and 7-day rate-limit windows, this session's tokens, and its cost.

一个 Claude Code mod，在输入框上方显示用量条：5 小时和 7 天额度窗口的剩余量、本会话的 token 数和费用。

![usage-bar preview](docs/preview.svg)

> **Early access.** Claude Code's mod (function hooks) API may change between releases. Written against Claude Code 2.1.288 and used only on the macOS desktop app with a subscription account. Other setups are untested.
>
> **早期接口。** Claude Code 的 mod 接口可能随版本变化。本 mod 基于 2.1.288 编写，只在 macOS 桌面端、订阅账号下使用过，其他环境未测试。

## What it shows / 显示内容

| Item | Meaning | 含义 |
| --- | --- | --- |
| `5h` / `7d` bar and `%` | Allowance left in the window | 该窗口的剩余额度 |
| Vertical mark on the bar | Share of the window's time that is left. Fill past the mark means allowance is lasting longer than the clock | 该窗口剩余时间的比例。填充超过竖线，说明额度剩得比时间多 |
| Clock | Time until the window resets | 距离重置的时间 |
| Up arrow | Input tokens this session: uncached input plus cache writes | 本会话输入 token：未缓存输入加缓存写入 |
| Down arrow | Output tokens this session | 本会话输出 token |
| Layers | Tokens read from the prompt cache this session | 本会话从缓存读取的 token |
| Coin | Session cost in US dollars, as `/cost` totals it | 本会话费用，与 `/cost` 一致 |

The bar turns orange at 30% left and red at 10% left. A reading older than 10 minutes is drawn faded.

剩余 30% 以下进度条变橙，10% 以下变红。读数超过 10 分钟未更新时变灰。

## Install / 安装

```bash
git clone https://github.com/kaicodedocument/usage-bar ~/.claude/mods/usage-bar
```

Then name the folder in the `env` block of `~/.claude/settings.json`, and start a new session:

然后在 `~/.claude/settings.json` 的 `env` 里指向该目录，新开一个会话：

```json
{
  "env": {
    "CLAUDE_CODE_PLUGIN_DIRS": "~/.claude/mods/usage-bar"
  }
}
```

For one terminal session only / 只在单个终端会话里试用：

```bash
claude --plugin-dir ~/.claude/mods/usage-bar
```

## Hide and show / 隐藏与显示

- Press `×` at the right end of the bar to hide it. Hidden, it takes no space.
- Type `/usage-bar` to show it again, or to toggle.

- 点用量条右端的 `×` 隐藏，隐藏后不占位。
- 输入 `/usage-bar` 恢复显示或切换。

## Limits / 局限

- The rate-limit figures come from the last model response, not from a live query. Sessions share their latest reading through the mod's store and pick it up within a minute, but usage on claude.ai or the mobile app is not seen until a local session gets a response.
- Token counts start when the mod loads; turns before that are not counted.
- Pill colors are fixed and do not follow the dark theme.
- In a terminal the bar is one line of text; the drawing is desktop only.

- 额度数据来自最近一次模型响应，不是实时查询。各会话通过 mod 的存储共享最新读数，约一分钟内同步；但网页端和手机端的用量要等本机某个会话收到响应后才能看到。
- token 数从 mod 加载时开始累计，之前的轮次不计入。
- 胶囊颜色固定，不随深色主题变化。
- 终端里只显示一行文字，图形只在桌面端有。

## Develop / 开发

```bash
claude plugin validate .
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude plugin test .
```

`hooks/register.tsx` holds the behavior, `hooks/bar.ts` the drawing and number formats.

`hooks/register.tsx` 是行为逻辑，`hooks/bar.ts` 是绘图和数字格式。

## License

MIT
