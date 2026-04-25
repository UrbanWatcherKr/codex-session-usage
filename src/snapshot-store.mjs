import { appendFile, mkdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export const defaultHistoryPath = join(
  homedir(),
  ".codex-session-usage",
  "snapshots.jsonl"
);

export async function recordUsageSnapshot({ usage, historyPath = defaultHistoryPath }) {
  const snapshot = {
    recordedAt: usage.generatedAt,
    sessionId: usage.currentSession?.id ?? null,
    model: usage.model ?? null,
    planType: usage.planType ?? null,
    limits: {
      fiveHours: pickWindowSnapshot(usage.windows.fiveHours),
      sevenDays: pickWindowSnapshot(usage.windows.sevenDays)
    }
  };

  await mkdir(dirname(historyPath), { recursive: true });
  await appendFile(historyPath, `${JSON.stringify(snapshot)}\n`, "utf8");
  return historyPath;
}

export async function readRecentSnapshots({
  historyPath = defaultHistoryPath,
  limit = 20
} = {}) {
  try {
    const text = await readFile(historyPath, "utf8");
    return text
      .trim()
      .split("\n")
      .filter(Boolean)
      .slice(-limit)
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

function pickWindowSnapshot(window) {
  return {
    usedPercent: window.rateLimit?.usedPercent ?? null,
    remainingPercent: window.rateLimit?.remainingPercent ?? null,
    resetsAt: window.rateLimit?.resetsAt ?? null,
    resetsAtIso: window.rateLimit?.resetsAtIso ?? null,
    windowDurationMins: window.rateLimit?.windowDurationMins ?? null
  };
}
