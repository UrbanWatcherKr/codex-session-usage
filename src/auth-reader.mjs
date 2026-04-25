import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const PLAN_CLAIM = "https://api.openai.com/auth.chatgpt_plan_type";
const AUTH_CLAIM = "https://api.openai.com/auth";

export async function readPlanFromCodexAuth({
  authPath = join(homedir(), ".codex", "auth.json")
} = {}) {
  try {
    const auth = JSON.parse(await readFile(authPath, "utf8"));
    const tokenBundle =
      typeof auth.tokens === "string" ? JSON.parse(auth.tokens) : auth.tokens;
    const idClaims = decodeJwtPayload(tokenBundle?.id_token);
    const accessClaims = decodeJwtPayload(tokenBundle?.access_token);
    const planType =
      idClaims?.[PLAN_CLAIM] ??
      idClaims?.[AUTH_CLAIM]?.chatgpt_plan_type ??
      accessClaims?.[PLAN_CLAIM] ??
      accessClaims?.[AUTH_CLAIM]?.chatgpt_plan_type ??
      null;

    return {
      authMode: auth.auth_mode ?? null,
      accountId: tokenBundle?.account_id ?? null,
      planType
    };
  } catch (error) {
    return {
      authMode: null,
      accountId: null,
      planType: null,
      error: error.message
    };
  }
}

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
}
