# usage-bar

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[English](README.md) | 中文

一个 Claude Code mod，在输入框上方显示用量条：5 小时和 7 天额度窗口的剩余量、本会话的 token 数和费用。

![输入框上方的用量条](docs/screenshot.png)

> **早期接口。** Claude Code 的 mod（function hooks）接口可能随版本变化，Claude Code 升级后本 mod 可能失效。实际使用过的环境见[环境要求](#环境要求)。

## 显示内容

| 项目 | 含义 |
| --- | --- |
| `5h`、`7d` | 该窗口的剩余额度，以进度条和百分比显示 |
| 进度条上的竖线 | 该窗口剩余时间的比例。填充超过竖线，说明额度剩得比时间多 |
| 时钟 | 距离窗口重置的时间 |
| 向上箭头 | 本会话输入 token：未缓存输入加缓存写入（见 `countCacheWrites`） |
| 向下箭头 | 本会话输出 token |
| 叠层 | 本会话从提示词缓存读取的 token |
| 硬币 | 本会话费用（美元），与 `/cost` 一致 |

剩余 30% 以下进度条变橙，10% 以下变红。读数超过 10 分钟未更新时变灰。这三个值都[可以配置](#配置)。

## 环境要求

- 支持 mod（function hooks）的 Claude Code。本 mod 基于 2.1.288 编写。
- 只在 macOS 桌面端使用过。终端里显示为一行文字。Windows、Linux、VS Code 扩展和手机端未测试。
- `5h` 和 `7d` 两项需要 Claude 订阅账号。非订阅账号下 Claude Code 不提供额度窗口，这两项显示 `--`。

## 安装

```bash
git clone https://github.com/kaicodedocument/usage-bar ~/.claude/mods/usage-bar
```

在 `~/.claude/settings.json` 的 `env` 里指向该目录，然后新开一个会话：

```json
{
  "env": {
    "CLAUDE_CODE_PLUGIN_DIRS": "~/.claude/mods/usage-bar"
  }
}
```

只在单个终端会话里试用：

```bash
claude --plugin-dir ~/.claude/mods/usage-bar
```

## 配置

配置项从 `~/.claude/settings.json` 的 `pluginConfigs` 读取，以 mod 名称为键。全部可选，修改后新开会话生效。

```json
{
  "pluginConfigs": {
    "usage-bar": {
      "options": {
        "theme": "dark",
        "staleMinutes": 10,
        "warnBelow": 30,
        "dangerBelow": 10,
        "countCacheWrites": true
      }
    }
  }
}
```

| 配置项 | 默认值 | 含义 |
| --- | --- | --- |
| `theme` | `"light"` | 胶囊配色，`"light"` 或 `"dark"`。mod 读不到应用的主题，需要手动选与之匹配的 |
| `staleMinutes` | `10` | 额度读数超过这个分钟数未更新时变灰 |
| `warnBelow` | `30` | 剩余百分比降到该值及以下时进度条变橙 |
| `dangerBelow` | `10` | 剩余百分比降到该值及以下时进度条变红 |
| `countCacheWrites` | `true` | `true`：向上箭头为未缓存输入加缓存写入。`false`：只算未缓存输入，缓存写入并入缓存读取一项 |

## 隐藏与显示

- 点用量条右端的 `×` 隐藏，隐藏后不占位。
- 输入 `/usage-bar` 恢复显示或切换。

隐藏状态只在当前会话有效，新会话默认显示。

## 故障排查

**用量条没有出现。** 会话在启动时读取配置，请新开一个会话；新会话里仍没有就重启应用。检查 `CLAUDE_CODE_PLUGIN_DIRS` 指向的是包含 `.claude-plugin/` 的那个目录。mod 加载失败时，`claude --debug` 的日志里会有一行以 `usage-bar:` 开头的记录。

**全部显示 `--` 或 `0`。** 本会话还没有收到过模型响应，发一条消息即可。

**百分比是灰色的。** 读数已超过 10 分钟。本机任意会话收到下一次响应后会刷新。

**数字和 Settings > Usage 不一致。** 用量条显示的是剩余，Settings 显示的是已用。用量条的数来自最近一次模型响应并取整到整数百分比，会比实时查询滞后。

## 局限

- 额度数据来自最近一次模型响应，不是实时查询。各会话通过 mod 的存储共享最新读数，约一分钟内同步；但网页端和手机端的用量要等本机某个会话收到响应后才能看到。
- token 数从 mod 加载时开始累计，之前的轮次不计入。
- mod 无法检测应用的主题，深色配色需要用 `theme` 配置项手动选择。
- 不支持逐个自定义颜色，两套配色是 `hooks/bar.ts` 里的常量。

## 开发

```bash
claude plugin validate .
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude plugin test .
```

`hooks/register.tsx` 是行为逻辑，`hooks/bar.ts` 是绘图和数字格式。版本变更见 [CHANGELOG.md](CHANGELOG.md)。

## 许可证

[MIT](LICENSE)
