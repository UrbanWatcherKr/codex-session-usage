import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRateLimits } from "../src/usage-reader.mjs";

test("normalizes Codex app-server rate limit snapshot", () => {
  const result = normalizeRateLimits({
    rateLimits: {
      limitId: "codex",
      planType: "plus",
      primary: {
        usedPercent: 38,
        windowDurationMins: 300,
        resetsAt: 1777100542
      },
      secondary: {
        usedPercent: 6,
        windowDurationMins: 10080,
        resetsAt: 1777439486
      }
    }
  });

  assert.equal(result.planType, "plus");
  assert.equal(result.primary.usedPercent, 38);
  assert.equal(result.primary.remainingPercent, 62);
  assert.equal(result.primary.windowDurationMins, 300);
  assert.equal(result.primary.resetsAtIso, "2026-04-25T07:02:22.000Z");
  assert.equal(result.secondary.usedPercent, 6);
});

test("returns null when app-server has no rate limit snapshot", () => {
  assert.equal(normalizeRateLimits(null), null);
  assert.equal(normalizeRateLimits({ rateLimits: null }), null);
});
