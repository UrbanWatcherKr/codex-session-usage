import test from "node:test";
import assert from "node:assert/strict";
import { formatStatusLine } from "../src/render.mjs";

test("formats compact status line", () => {
  const output = formatStatusLine({
    model: "gpt-5.5",
    planType: "plus",
    windows: {
      fiveHours: {
        tokens: 1234,
        rateLimit: {
          usedPercent: 12.34,
          remainingPercent: 87.66,
          resetsAtIso: "2026-04-25T03:00:00.000Z"
        },
        sessions: 2,
        activeMinutes: 12
      },
      sevenDays: {
        tokens: 56789,
        rateLimit: {
          usedPercent: 56.789,
          remainingPercent: 43.211,
          resetsAtIso: "2026-04-30T03:00:00.000Z"
        },
        sessions: 4,
        activeMinutes: 144
      }
    }
  });

  assert.match(output, /^model gpt-5\.5 \| plan plus \| 5h 12% used \(88% left, resets /);
  assert.match(output, /\| 7d 57% used \(43% left, resets /);
});

test("formats status line without official rate limits", () => {
  const output = formatStatusLine({
    model: "gpt-5.5",
    planType: "unknown",
    windows: {
      fiveHours: {
        tokens: 1234,
        rateLimit: null
      },
      sevenDays: {
        tokens: 56789,
        rateLimit: null
      }
    }
  });

  assert.equal(output, "model gpt-5.5 | plan unknown | 5h 1,234 tok (official limit unavailable) | 7d 56,789 tok (official limit unavailable)");
});
