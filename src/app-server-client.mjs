import { spawn } from "node:child_process";

const DEFAULT_TIMEOUT_MS = 10_000;

export async function readCodexAccountAndRateLimits({
  codexBin = "codex",
  timeoutMs = DEFAULT_TIMEOUT_MS
} = {}) {
  const client = new CodexAppServerClient({ codexBin, timeoutMs });
  try {
    await client.start();
    await client.request("initialize", {
      clientInfo: {
        name: "codex-session-usage",
        title: "Codex Session Usage",
        version: "0.2.0"
      },
      capabilities: {
        experimentalApi: true,
        optOutNotificationMethods: []
      }
    });

    const [accountResult, rateLimitResult] = await Promise.allSettled([
      client.request("account/read", { refreshToken: false }),
      client.request("account/rateLimits/read")
    ]);

    return {
      account:
        accountResult.status === "fulfilled" ? accountResult.value.account ?? null : null,
      accountError:
        accountResult.status === "rejected" ? accountResult.reason.message : null,
      rateLimits:
        rateLimitResult.status === "fulfilled" ? rateLimitResult.value.rateLimits ?? null : null,
      rateLimitsByLimitId:
        rateLimitResult.status === "fulfilled"
          ? rateLimitResult.value.rateLimitsByLimitId ?? null
          : null,
      rateLimitsError:
        rateLimitResult.status === "rejected" ? rateLimitResult.reason.message : null
    };
  } finally {
    client.close();
  }
}

export async function writeCodexStatusLine({
  items,
  codexBin = "codex",
  timeoutMs = DEFAULT_TIMEOUT_MS
}) {
  const client = new CodexAppServerClient({ codexBin, timeoutMs });
  try {
    await client.start();
    await client.request("initialize", {
      clientInfo: {
        name: "codex-session-usage",
        title: "Codex Session Usage",
        version: "0.2.0"
      },
      capabilities: {
        experimentalApi: true,
        optOutNotificationMethods: []
      }
    });

    return await client.request("config/value/write", {
      keyPath: "tui.status_line",
      value: items,
      mergeStrategy: "replace",
      reloadUserConfig: true
    });
  } finally {
    client.close();
  }
}

class CodexAppServerClient {
  constructor({ codexBin, timeoutMs }) {
    this.codexBin = codexBin;
    this.timeoutMs = timeoutMs;
    this.nextId = 1;
    this.pending = new Map();
    this.buffer = "";
    this.process = null;
    this.stderr = "";
  }

  async start() {
    this.process = spawn(this.codexBin, ["app-server", "--listen", "stdio://"], {
      stdio: ["pipe", "pipe", "pipe"]
    });

    this.process.stdout.setEncoding("utf8");
    this.process.stdout.on("data", (chunk) => this.onStdout(chunk));
    this.process.stderr.setEncoding("utf8");
    this.process.stderr.on("data", (chunk) => {
      this.stderr += chunk;
    });
    this.process.on("exit", () => {
      const error = new Error("Codex app-server exited before completing the request");
      for (const { reject, timer } of this.pending.values()) {
        clearTimeout(timer);
        reject(error);
      }
      this.pending.clear();
    });
  }

  request(method, params) {
    const id = this.nextId;
    this.nextId += 1;

    const message =
      params === undefined ? { id, method } : { id, method, params };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timed out waiting for ${method}`));
      }, this.timeoutMs);

      this.pending.set(id, { resolve, reject, timer });
      this.process.stdin.write(`${JSON.stringify(message)}\n`);
    });
  }

  close() {
    if (this.process && !this.process.killed) {
      this.process.kill();
    }
  }

  onStdout(chunk) {
    this.buffer += chunk;
    while (true) {
      const newline = this.buffer.indexOf("\n");
      if (newline === -1) return;
      const line = this.buffer.slice(0, newline).trim();
      this.buffer = this.buffer.slice(newline + 1);
      if (!line) continue;
      this.onMessage(JSON.parse(line));
    }
  }

  onMessage(message) {
    if (!Object.hasOwn(message, "id")) return;
    const pending = this.pending.get(message.id);
    if (!pending) return;

    this.pending.delete(message.id);
    clearTimeout(pending.timer);

    if (message.error) {
      pending.reject(new Error(message.error.message ?? "Codex app-server error"));
      return;
    }

    pending.resolve(message.result);
  }
}
