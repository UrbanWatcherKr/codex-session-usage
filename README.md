# codex-session-usage

Codex CLI usage reporter and status-line installer.

This package reads the same Codex app-server account endpoint that the Codex TUI uses, so it reports usage against the logged-in ChatGPT/Codex subscription plan instead of asking users to configure guessed limits.



It reports:

- detected Codex account plan, for example `plus`
- official 5-hour usage percent and reset time
- official weekly usage percent and reset time
- current local Codex session/thread tokens from `~/.codex/state_5.sqlite`
- a JSONL snapshot history of each run at `~/.codex-session-usage/snapshots.jsonl`

## Install from GitHub

Publish this package as the root of a GitHub repository. The repository root
must contain `package.json`, `bin/`, and `src/`.

```bash
npx github:<owner>/codex-session-usage install
```

For a persistent global command:

```bash
npm install -g github:<owner>/codex-session-usage
codex-session-usage install
```

Files to publish:

```text
.gitignore
README.md
USAGE.ko.md
package.json
bin/
src/
test/
```

Do not publish local runtime data such as `node_modules/`, `.env`, `~/.codex/`,
or `~/.codex-session-usage/`.

The `install` command writes Codex TUI `tui.status_line` to include:

```toml
tui.status_line = [
  "model-with-reasoning",
  "current-dir",
  "five-hour-limit",
  "weekly-limit",
  "context-used",
  "used-tokens"
]
```

Restart Codex after installing. Codex already has built-in status-line items for 5-hour and weekly limits, so this is the most stable way to put the values in the footer without patching the native binary.

## CLI usage

```bash
codex-session-usage
codex-session-usage --verbose
codex-session-usage --json
codex-session-usage --history --json
```

Local development:

```bash
node bin/codex-session-usage.mjs
node bin/codex-session-usage.mjs install
```

Example compact output:

```text
model gpt-5.5 | plan plus | 5h 38% used (62% left, resets Apr 25, 12:02 PM) | 7d 6% used (94% left, resets Apr 29, 10:31 AM)
```

## Why app-server

Codex exposes `account/read` and `account/rateLimits/read` through `codex app-server`. The rate-limit response includes:

- `planType`
- `primary.usedPercent`
- `primary.windowDurationMins`
- `primary.resetsAt`
- `secondary.usedPercent`
- `secondary.windowDurationMins`
- `secondary.resetsAt`

For current Codex CLI versions, `primary` is the 5-hour window and `secondary` is the weekly window.

## Notes

- This package does not read or print access tokens.
- Snapshot history stores plan, session id, model, usage percentages, and reset times. It does not store account email.
- `--offline` skips app-server and only reads local Codex files, so official usage percentages are unavailable.
- Requires the `sqlite3` command for local session/thread token summaries.

## Applied skill

- `openai-docs`: used to verify Codex configuration/status-line behavior and official plan-limit context.

## References

- Codex config reference: https://developers.openai.com/codex/config-reference
- Codex with ChatGPT plans: https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
- Codex app-server: https://developers.openai.com/codex/app-server
