import { writeCodexStatusLine } from "./app-server-client.mjs";

export const defaultStatusLineItems = [
  "model-with-reasoning",
  "current-dir",
  "five-hour-limit",
  "weekly-limit",
  "context-used",
  "used-tokens"
];

export async function installCodexStatusLine({ codexBin = "codex", dryRun = false } = {}) {
  if (dryRun) {
    return {
      changed: false,
      items: defaultStatusLineItems
    };
  }

  await writeCodexStatusLine({
    codexBin,
    items: defaultStatusLineItems
  });

  return {
    changed: true,
    items: defaultStatusLineItems
  };
}
