# codex-session-usage

Install a Codex TUI status line that shows the current model, working directory, 5-hour limit, weekly limit, context usage, and token usage.

This tool does not ask users to enter account details or manual limits. It uses the Codex login session already available on the machine and enables Codex's built-in status-line items.

## Install

Run this from a normal terminal:

```bash
npm install -g github:UrbanWatcherKr/codex-session-usage
codex-session-usage install
```

Then fully restart Codex:

```bash
codex
```

After restart, the Codex footer should show a status line like:

```text
gpt-5.5 high · ~/project · 5h 27% · weekly 88% · Context 21% used …
```

The 5-hour and weekly values are rendered by Codex's built-in `five-hour-limit` and `weekly-limit` status-line items.

## Verify Installation

The installer writes this setting to `~/.codex/config.toml`:

```toml
[tui]
status_line = [
  "model-with-reasoning",
  "current-dir",
  "five-hour-limit",
  "weekly-limit",
  "context-used",
  "used-tokens"
]
```

## Check Current Usage

You can also run the CLI directly:

```bash
codex-session-usage
```

Example output:

```text
model gpt-5.5 | plan plus | 5h 38% used (62% left, resets Apr 25, 12:02 PM) | 7d 6% used (94% left, resets Apr 29, 10:31 AM)
```

## Uninstall

Remove the global command:

```bash
npm uninstall -g codex-session-usage
```

To remove the Codex footer settings, edit `~/.codex/config.toml` and remove or change the `[tui] status_line` entry.
