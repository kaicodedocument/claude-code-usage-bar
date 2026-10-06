# Privacy

`usage-bar` collects nothing and sends nothing.

- **No network.** The mod makes no network requests. No data about you, your sessions or your usage leaves your machine because of it.
- **No accounts, analytics or tracking.** There is no telemetry and no third-party service.
- **What it reads.** Figures Claude Code already holds for the running session: the rate-limit windows, the session's cost, and the token counts of each turn. It does not read your prompts, the model's replies, your tool calls, your files or any credential.
- **What it stores.** One value in the mod's own store, kept by Claude Code on your machine: the latest rate-limit percentages and the time they were read, so your other local sessions can show them. Its running totals live in session state and are gone when the session ends.
- **Removing it.** Uninstalling the mod stops all of the above. The stored reading stays in Claude Code's plugin store until you remove it.

The source is in this repository; the [README](README.md#what-it-reads-and-writes) lists every hook the mod registers.

Questions: open an issue at <https://github.com/kaicodedocument/claude-code-usage-bar/issues>.
