import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

let loaded = false;

/**
 * Load KEY=VALUE pairs from .env.local into process.env (does not override existing).
 */
export function loadEnvLocal(): void {
  if (loaded) return;
  loaded = true;
  const filePath = path.resolve(process.cwd(), ".env.local");
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf-8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
