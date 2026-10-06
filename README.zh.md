# claude-code-usage-bar

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[English](README.md) | 中文

`usage-bar` 是一个 Claude Code mod，在输入框上方显示用量条：5 小时和 7 天额度窗口的剩余量、本会话的 token 数和费用。

![应用浅色主题下的用量条](docs/screenshot-light.png)

![应用深色主题下的用量条，默认配色](docs/screenshot-dark.png)

两张都是默认配色。更暗的一套配色通过 [`theme` 配置项](#配置)选择。

> **早期接口。** Claude Code 的 mod（function hooks）接口可能随版本变化，Claude Code 升级后本 mod 可能失效。实际使用过的环境见[环境要求](#环境要求)。

## 环境要求

- 支持 mod（function hooks）的 Claude Code。本 mod 基于 2.1.288 编写。
- mod 是早期功能，在你的版本里可能默认关闭。macOS 桌面端（2.1.288）可以直接加载；终端 CLI（2.1.285）需要设置 `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1` 才会加载，写在 shell 环境里或 `~/.claude/settings.json` 的 `env` 里都可以。
- 只在 macOS 桌面端使用过。终端里显示为一行文字。Windows、Linux、VS Code 扩展和手机端未测试。
- `5h` 和 `7d` 两项需要 Claude 订阅账号。非订阅账号下 Claude Code 不提供额度窗口，这两项显示 `--`。

## 安装

两种方式选一种，不要都用：装两遍会加载两次。

### 通过插件市场

```bash
claude plugin marketplace add kaicodedocument/claude-code-usage-bar
claude plugin install usage-bar@claude-code-usage-bar
```

然后新开一个会话。这种方式只在终端 CLI 里试过。

### 手动安装

```bash
git clone https://github.com/kaicodedocument/claude-code-usage-bar ~/.claude/mods/usage-bar
```

在 `~/.claude/settings.json` 的 `env` 里指向该目录，然后新开一个会话：

```json
{
  "env": {
    "CLAUDE_CODE_PLUGIN_DIRS": "~/.claude/mods/usage-bar"
  }
}
```

如果该变量里已经有其他目录，用 `:` 隔开追加（Windows 上用 `;`）。

只在单个终端会话里试用：

```bash
claude --plugin-dir ~/.claude/mods/usage-bar
```

## 更新与卸载

| | 插件市场安装 | 手动安装 |
| --- | --- | --- |
| 更新 | 先 `claude plugin marketplace update claude-code-usage-bar`，再 `claude plugin update usage-bar@claude-code-usage-bar` | `git -C ~/.claude/mods/usage-bar pull` |
| 卸载 | `claude plugin uninstall usage-bar@claude-code-usage-bar` | 从 `~/.claude/settings.json` 里删掉 `CLAUDE_CODE_PLUGIN_DIRS`（或其中的这个目录），再删除该目录 |

两种方式操作后都要新开会话；已经打开的会话保持原来加载的内容。配置项会留在 `pluginConfigs` 里，直到你手动删除。

## 显示内容

| 项目 | 含义 |
| --- | --- |
| `5h`、`7d` | 该窗口的剩余额度，以进度条和百分比显示 |
| 进度条上的竖线 | 该窗口剩余时间的比例。填充超过竖线，说明额度剩得比时间多 |
| 时钟 | 距离窗口重置的时间 |
| 刷新标记 | 两个百分比是多久之前读到的，见[更新时机](#更新时机) |
| 向上箭头 | 本会话输入 token：未缓存输入加缓存写入（见 `countCacheWrites`） |
| 向下箭头 | 本会话输出 token |
| 叠层 | 本会话从提示词缓存读取的 token |
| 硬币 | 本会话费用（美元），与 `/cost` 一致 |

剩余 30% 以下进度条变橙，10% 以下变红。读数超过 10 分钟未更新时变灰。这三个值都[可以配置](#配置)。

## 配置

配置项从 `~/.claude/settings.json` 的 `pluginConfigs` 读取。全部可选，修改后新开会话生效。键名取决于安装方式：手动安装是 `usage-bar`，插件市场安装是 `usage-bar@claude-code-usage-bar`。下面的例子按手动安装写。

```json
{
  "pluginConfigs": {
    "usage-bar": {
      "options": {
        "theme": "dark",
        "staleMinutes": 10,
        "warnBelow": 30,
        "dangerBelow": 10,
        "countCacheWrites": true,
        "showUpdated": true
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
| `showUpdated` | `true` | 在 `7d` 胶囊后显示额度读数是多久之前读到的 |
| `countCacheWrites` | `true` | `true`：向上箭头为未缓存输入加缓存写入。`false`：只算未缓存输入，缓存写入并入缓存读取一项 |

设置 `"theme": "dark"` 后的效果：

![应用深色主题下的深色配色](docs/screenshot-dark-palette.png)

## 隐藏与显示

- 点用量条右端的 `×` 隐藏，隐藏后不占位。
- 输入 `/usage-bar` 恢复显示或切换。

隐藏状态只在当前会话有效，新会话默认显示。

## 更新时机

本 mod 从不查询 Anthropic 的服务器。Claude Code 把最近一次模型响应附带的额度数据交给它，用量条上每项数据各有自己的刷新触发条件：

| 数据 | 何时更新 |
| --- | --- |
| `5h` / `7d` 的百分比和进度条 | 本会话收到模型响应时；或本机其他任意会话收到响应后约一分钟内 |
| 读数时间（`7d` 后面的刷新标记） | 每 60 秒刷新；收到新读数时回到 `now` |
| 重置倒计时和竖线 | 每 60 秒按时钟刷新 |
| token 数 | 本会话每轮对话结束时 |
| 费用 | 本会话每轮对话结束时 |

### 读数时间

`7d` 胶囊后面的标记表示百分比是多久之前读到的：不足一分钟显示 `now`，之后是 `3m`、`1h 5m` 这样的格式。看它就能判断百分比还新不新。

- `now` 或几分钟：百分比是当前的。
- 超过 10 分钟（`staleMinutes` 配置项）：百分比同时变灰。
- `--`：有读数但不知道是什么时候的。出现在本会话还没有收到过自己的响应、也没有从其他会话拿到共享读数的时候。

把 `showUpdated` 设为 `false` 可以不显示这个标记。

### 实际使用中的表现

- **只用一个会话。** 每次回复后百分比都会更新，最多落后一轮。
- **同时开着多个会话。** 任意一个收到回复，其他会话约一分钟内同步到新的百分比，不需要发消息。
- **所有会话都空闲。** 不会更新。读数时间持续增加，10 分钟后百分比变灰。倒计时照常在走，因为它按时钟计算。
- **在 Claude Code 之外的用量。** 网页端和手机端的用量要等本机某个会话收到下一次回复后才能看到。
- **空闲期间窗口重置了。** 用量条仍显示重置前的百分比（灰色），直到下一次回复。这时真实的剩余量接近 100%。

想立即刷新，在本机任意会话里发一条消息即可。

## 故障排查

**用量条没有出现。** 会话在启动时读取配置，请新开一个会话；新会话里仍没有就重启应用。在终端里使用时，需要设置 `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1`（见[环境要求](#环境要求)）。检查 `CLAUDE_CODE_PLUGIN_DIRS` 指向的是包含 `.claude-plugin/` 的那个目录。mod 加载失败时，`claude --debug` 的日志里会有一行以 `usage-bar:` 开头的记录。

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
