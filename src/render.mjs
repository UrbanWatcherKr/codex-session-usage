export function formatStatusLine(usage) {
  const fiveHours = usage.windows.fiveHours;
  const sevenDays = usage.windows.sevenDays;
  const model = usage.model ? `model ${usage.model}` : "model unknown";
  const plan = `plan ${usage.planType ?? "unknown"}`;

  return [
    model,
    plan,
    `5h ${formatWindowLimit(fiveHours)}`,
    `7d ${formatWindowLimit(sevenDays)}`
  ].join(" | ");
}

export function formatVerboseReport(usage) {
  return [
    `Codex session usage (${usage.generatedAt})`,
    `Database: ${usage.dbPath}`,
    `Plan: ${usage.planType ?? "unknown"}`,
    `Rate limits: ${usage.rateLimitsSource ?? usage.rateLimitsError ?? "unavailable"}`,
    usage.currentSession
      ? `Current session: ${usage.currentSession.id} (${formatNumber(usage.currentSession.tokens)} tok)`
      : "Current session: none",
    "",
    `5 hours: ${formatWindowLimit(usage.windows.fiveHours)}`,
    `Raw: ${formatWindowRaw(usage.windows.fiveHours)}`,
    renderModels(usage.windows.fiveHours.models),
    "",
    `7 days: ${formatWindowLimit(usage.windows.sevenDays)}`,
    `Raw: ${formatWindowRaw(usage.windows.sevenDays)}`,
    renderModels(usage.windows.sevenDays.models),
    "",
    renderRecentSessions(usage.recentSessions ?? [])
  ].join("\n");
}

function formatWindowRaw(window) {
  return `${formatNumber(window.tokens)} tok, ${window.sessions} sessions, ${window.activeMinutes}m active`;
}

function formatWindowLimit(window) {
  if (!window.rateLimit) {
    return `${formatNumber(window.tokens)} tok (official limit unavailable)`;
  }

  const reset = window.rateLimit.resetsAtIso
    ? `, resets ${formatResetTime(window.rateLimit.resetsAtIso)}`
    : "";

  return `${formatPercent(window.rateLimit.usedPercent)} used (${formatPercent(window.rateLimit.remainingPercent)} left${reset})`;
}

function renderModels(models) {
  const entries = Object.entries(models);
  if (!entries.length) return "Models: none";
  return `Models: ${entries.map(([model, count]) => `${model} x${count}`).join(", ")}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "unknown";
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 10 ? 0 : 1
  }).format(value)}%`;
}

function formatResetTime(iso) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
}

function renderRecentSessions(sessions) {
  if (!sessions.length) return "Recent sessions: none";

  const lines = sessions.slice(0, 5).map((session) => {
    const fiveHour = session.usageSnapshot?.fiveHoursUsedPercent;
    const weekly = session.usageSnapshot?.sevenDaysUsedPercent;
    return [
      `- ${session.id}`,
      session.model ?? "model unknown",
      `${formatNumber(session.tokens)} tok`,
      `5h ${formatPercent(fiveHour)}`,
      `7d ${formatPercent(weekly)}`
    ].join(" | ");
  });

  return ["Recent sessions:", ...lines].join("\n");
}
