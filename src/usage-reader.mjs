import { execFile } from "node:child_process";
import { access } from "node:fs/promises";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function readUsage({
  dbPath,
  now = new Date(),
  accountSnapshot = null,
  authFallback = null
}) {
  await assertReadable(dbPath);

  const rows = await queryJson(dbPath, `
    SELECT
      id,
      created_at_ms,
      updated_at_ms,
      model,
      tokens_used,
      source,
      cwd,
      title
    FROM threads
    WHERE archived = 0
      AND source = 'cli'
      AND updated_at_ms >= ${Number(now) - SEVEN_DAYS_MS}
    ORDER BY updated_at_ms DESC;
  `);

  const rateLimits = normalizeRateLimits(accountSnapshot);
  const currentSession = toSession(rows[0], rateLimits);
  const windows = {
    fiveHours: summarizeWindow(
      rows,
      Number(now) - FIVE_HOURS_MS,
      now,
      rateLimits?.primary ?? null
    ),
    sevenDays: summarizeWindow(
      rows,
      Number(now) - SEVEN_DAYS_MS,
      now,
      rateLimits?.secondary ?? null
    )
  };

  return {
    generatedAt: now.toISOString(),
    dbPath,
    model: rows[0]?.model ?? null,
    account: sanitizeAccount(accountSnapshot?.account ?? null),
    planType:
      accountSnapshot?.account?.planType ??
      rateLimits?.planType ??
      authFallback?.planType ??
      "unknown",
    rateLimitsSource: rateLimits ? "codex-app-server" : null,
    rateLimitsError: accountSnapshot?.rateLimitsError ?? null,
    currentSession,
    recentSessions: rows.slice(0, 10).map((row) => toSession(row, rateLimits)),
    windows
  };
}

function summarizeWindow(rows, sinceMs, now, rateLimit = null) {
  const matching = rows.filter((row) => Number(row.updated_at_ms) >= sinceMs);
  const tokens = sum(matching.map((row) => Number(row.tokens_used) || 0));
  const models = countBy(matching.map((row) => row.model).filter(Boolean));
  const activeMs = sum(matching.map((row) => estimateActiveMs(row, sinceMs, Number(now))));

  return {
    since: new Date(sinceMs).toISOString(),
    sessions: matching.length,
    tokens,
    rateLimit,
    activeMinutes: Math.round(activeMs / 60000),
    models,
    latestThread: matching[0]
      ? {
          id: matching[0].id,
          model: matching[0].model,
          updatedAt: new Date(Number(matching[0].updated_at_ms)).toISOString(),
          title: matching[0].title
        }
      : null
  };
}

function estimateActiveMs(row, sinceMs, nowMs) {
  const created = Math.max(Number(row.created_at_ms) || 0, sinceMs);
  const updated = Math.min(Number(row.updated_at_ms) || created, nowMs);
  return Math.max(updated - created, 0);
}

export function normalizeRateLimits(accountSnapshot) {
  const snapshot =
    accountSnapshot?.rateLimitsByLimitId?.codex ??
    accountSnapshot?.rateLimits ??
    null;

  if (!snapshot) return null;

  return {
    limitId: snapshot.limitId ?? "codex",
    limitName: snapshot.limitName ?? null,
    planType: snapshot.planType ?? null,
    rateLimitReachedType: snapshot.rateLimitReachedType ?? null,
    credits: snapshot.credits ?? null,
    primary: normalizeRateLimitWindow(snapshot.primary),
    secondary: normalizeRateLimitWindow(snapshot.secondary)
  };
}

function normalizeRateLimitWindow(window) {
  if (!window) return null;
  const usedPercent = Number(window.usedPercent);
  const resetsAt = Number(window.resetsAt);

  return {
    usedPercent: Number.isFinite(usedPercent) ? usedPercent : null,
    remainingPercent: Number.isFinite(usedPercent)
      ? Math.max(0, 100 - usedPercent)
      : null,
    windowDurationMins:
      window.windowDurationMins === null || window.windowDurationMins === undefined
        ? null
        : Number(window.windowDurationMins),
    resetsAt: Number.isFinite(resetsAt) ? resetsAt : null,
    resetsAtIso: Number.isFinite(resetsAt)
      ? new Date(resetsAt * 1000).toISOString()
      : null
  };
}

function toSession(row, rateLimits) {
  if (!row) return null;
  return {
    id: row.id,
    model: row.model,
    title: row.title,
    cwd: row.cwd,
    tokens: Number(row.tokens_used) || 0,
    createdAt: new Date(Number(row.created_at_ms)).toISOString(),
    updatedAt: new Date(Number(row.updated_at_ms)).toISOString(),
    usageSnapshot: rateLimits
      ? {
          fiveHoursUsedPercent: rateLimits.primary?.usedPercent ?? null,
          sevenDaysUsedPercent: rateLimits.secondary?.usedPercent ?? null,
          fiveHoursResetsAt: rateLimits.primary?.resetsAtIso ?? null,
          sevenDaysResetsAt: rateLimits.secondary?.resetsAtIso ?? null
        }
      : null
  };
}

function sanitizeAccount(account) {
  if (!account) return null;
  return {
    type: account.type ?? null,
    planType: account.planType ?? null
  };
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function countBy(values) {
  const counts = {};
  for (const value of values) {
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

async function assertReadable(path) {
  try {
    await access(path);
  } catch {
    throw new Error(`Codex state DB not found or unreadable: ${path}`);
  }
}

async function queryJson(dbPath, sql) {
  const { stdout } = await execFileAsync("sqlite3", ["-json", dbPath, sql], {
    maxBuffer: 10 * 1024 * 1024
  });
  const trimmed = stdout.trim();
  return trimmed ? JSON.parse(trimmed) : [];
}
