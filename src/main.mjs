import { homedir } from "node:os";
import { join } from "node:path";
import { readCodexAccountAndRateLimits } from "./app-server-client.mjs";
import { readPlanFromCodexAuth } from "./auth-reader.mjs";
import { installCodexStatusLine } from "./install.mjs";
import { readUsage } from "./usage-reader.mjs";
import { formatStatusLine, formatVerboseReport } from "./render.mjs";
import {
  defaultHistoryPath,
  recordUsageSnapshot,
  readRecentSnapshots
} from "./snapshot-store.mjs";

export async function main(args) {
  const options = parseArgs(args);

  if (options.command === "install") {
    const result = await installCodexStatusLine({
      codexBin: options.codexBin,
      dryRun: options.dryRun
    });
    console.log(
      result.changed
        ? `Installed Codex status line: ${result.items.join(", ")}`
        : `Would install Codex status line: ${result.items.join(", ")}`
    );
    return;
  }

  const dbPath = options.db ?? join(homedir(), ".codex", "state_5.sqlite");
  const now = options.now ? new Date(options.now) : new Date();
  const accountSnapshot = options.offline
    ? null
    : await readCodexAccountAndRateLimits({
        codexBin: options.codexBin,
        timeoutMs: options.timeoutMs
      });
  const authFallback = await readPlanFromCodexAuth();
  const usage = await readUsage({ dbPath, now, accountSnapshot, authFallback });

  if (options.record) {
    usage.historyPath = await recordUsageSnapshot({
      usage,
      historyPath: options.historyPath
    });
  }

  if (options.history) {
    usage.history = await readRecentSnapshots({
      historyPath: options.historyPath,
      limit: options.historyLimit
    });
  }

  if (options.json) {
    console.log(JSON.stringify(usage, null, 2));
    return;
  }

  if (options.verbose) {
    console.log(formatVerboseReport(usage));
    return;
  }

  console.log(formatStatusLine(usage));
}

function parseArgs(args) {
  const options = {
    command: null,
    json: false,
    verbose: false,
    db: null,
    now: null,
    record: true,
    history: false,
    historyLimit: 20,
    historyPath: defaultHistoryPath,
    codexBin: "codex",
    timeoutMs: 10000,
    offline: false,
    dryRun: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if ((arg === "install" || arg === "status") && index === 0) {
      options.command = arg;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--db") {
      options.db = args[index + 1];
      index += 1;
    } else if (arg === "--no-record") {
      options.record = false;
    } else if (arg === "--history") {
      options.history = true;
    } else if (arg === "--history-limit") {
      options.historyLimit = Number(args[index + 1]);
      index += 1;
    } else if (arg === "--history-path") {
      options.historyPath = args[index + 1];
      index += 1;
    } else if (arg === "--codex-bin") {
      options.codexBin = args[index + 1];
      index += 1;
    } else if (arg === "--timeout-ms") {
      options.timeoutMs = Number(args[index + 1]);
      index += 1;
    } else if (arg === "--offline") {
      options.offline = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--now") {
      options.now = args[index + 1];
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`codex-session-usage

Usage:
  codex-session-usage [status] [--json] [--verbose] [--db PATH]
  codex-session-usage install

Reads the logged-in Codex account through Codex app-server and prints the
official 5-hour / 7-day usage percentages, reset times, and local session data.

Options:
  --json                         Print structured JSON.
  --verbose                      Print a multiline report.
  --db PATH                      Read a specific Codex state SQLite database.
  --no-record                    Do not append this run to the snapshot history.
  --history                      Include recent recorded snapshots in JSON.
  --history-path PATH            Snapshot history path. Defaults to ~/.codex-session-usage/snapshots.jsonl.
  --codex-bin PATH               Codex executable. Defaults to codex.
  --offline                      Skip Codex app-server and only read local files.
  --now ISO                      Override current time for tests/debugging.

Install:
  install                        Configure Codex TUI status_line with model, cwd,
                                 five-hour-limit, weekly-limit, context-used,
                                 and used-tokens.
`);
}
