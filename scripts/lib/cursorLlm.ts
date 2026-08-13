import { z } from "zod";
import { Agent, Cursor, CursorAgentError } from "@cursor/sdk";
import { loadEnvLocal } from "./loadEnv";

/**
 * Paid Cursor account login for the SDK (not IDE login, not Integrations API key).
 * Run: npm run pipeline:cursor-login
 */
export async function assertCursorAccountReady(): Promise<void> {
  loadEnvLocal();
  try {
    const status = await Cursor.auth.status();
    if (status?.status === "logged-in") return;
  } catch {
    // fall through
  }
  throw new Error(
    "Cursor SDK is not logged in with your Cursor account.\n" +
      "Run once (browser sign-in), then retry:\n" +
      "  npm run pipeline:cursor-login"
  );
}

/** SDK account login does not include composer-2.5-fast; map it to composer-2.5. */
const PIPELINE_MODEL_ALIASES: Record<string, string> = {
  "composer-2.5-fast": "composer-2.5",
};

export function getPipelineModel(): string {
  loadEnvLocal();
  const raw = process.env.PIPELINE_MODEL?.trim() || "composer-2.5";
  return PIPELINE_MODEL_ALIASES[raw] ?? raw;
}

/** Fail fast when PIPELINE_MODEL is not on this account (avoids 350 silent enrich fails). */
export async function assertPipelineModelAvailable(): Promise<string> {
  await assertCursorAccountReady();
  const model = getPipelineModel();
  try {
    const listed = await Cursor.models.list();
    const rows = Array.isArray(listed)
      ? listed
      : ((listed as { models?: unknown[] } | null)?.models ?? []);
    const ids = new Set(
      rows.map((m) => (typeof m === "string" ? m : String((m as { id?: string }).id ?? "")))
    );
    ids.delete("");
    if (ids.size > 0 && !ids.has(model) && model !== "default") {
      throw new Error(
        `PIPELINE_MODEL=${model} is not available on this Cursor account.\n` +
          `Available: ${[...ids].sort().join(", ")}\n` +
          `Set PIPELINE_MODEL (composer-2.5 is the overnight default).`
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("PIPELINE_MODEL=")) {
      throw error;
    }
  }
  return model;
}

function extractJsonBlock(text: string): string {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();

  const startObj = trimmed.indexOf("{");
  const startArr = trimmed.indexOf("[");
  let start = -1;
  if (startObj >= 0 && startArr >= 0) start = Math.min(startObj, startArr);
  else start = Math.max(startObj, startArr);

  if (start < 0) throw new Error("No JSON object/array found in model response");

  const opener = trimmed[start];
  const closer = opener === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === opener) depth += 1;
    else if (ch === closer) {
      depth -= 1;
      if (depth === 0) return trimmed.slice(start, i + 1);
    }
  }
  throw new Error("Unbalanced JSON in model response");
}

export interface CursorJsonPromptOptions<T> {
  prompt: string;
  schema: z.ZodType<T>;
  retries?: number;
  model?: string;
  name?: string;
}

/**
 * One-shot Cursor agent prompt that must return JSON matching a Zod schema.
 * Uses tools: [] so the model can only respond with text (no repo edits).
 * Auth: Cursor.auth account login only (npm run pipeline:cursor-login).
 */
export async function cursorJsonPrompt<T>(
  opts: CursorJsonPromptOptions<T>
): Promise<{ data: T; model: string; runId: string }> {
  await assertCursorAccountReady();
  const modelId = opts.model ?? getPipelineModel();
  const retries = opts.retries ?? 2;
  let lastError: Error | null = null;
  let feedback = "";

  for (let attempt = 0; attempt <= retries; attempt++) {
    const message =
      opts.prompt +
      (feedback
        ? `\n\nPrevious response failed validation:\n${feedback}\nReturn corrected JSON only.`
        : "") +
      `\n\nRespond with a single JSON value only. No markdown, no commentary.`;

    try {
      const result = await Agent.prompt(message, {
        model: { id: modelId },
        tools: [],
        name: opts.name ?? "pipeline-json",
        local: {
          cwd: process.cwd(),
          settingSources: [],
        },
      });

      if (result.status === "error") {
        const detail = result.error?.message ?? result.result ?? "unknown error";
        lastError = new Error(`Cursor run ${result.id} failed: ${detail}`);
        feedback = lastError.message;
        continue;
      }

      const text = result.result ?? "";
      if (!text.trim()) {
        lastError = new Error(`Empty result from run ${result.id}`);
        feedback = lastError.message;
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(extractJsonBlock(text));
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        feedback = `${lastError.message}\nRaw (truncated):\n${text.slice(0, 2000)}`;
        continue;
      }

      const validated = opts.schema.safeParse(parsed);
      if (!validated.success) {
        lastError = new Error(validated.error.message);
        feedback = validated.error.message;
        continue;
      }

      return { data: validated.data, model: modelId, runId: result.id };
    } catch (err) {
      if (err instanceof CursorAgentError) {
        lastError = err;
        if (!err.isRetryable && attempt >= retries) throw err;
        feedback = err.message;
        if (err.isRetryable) {
          await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        }
        continue;
      }
      throw err;
    }
  }

  throw lastError ?? new Error("cursorJsonPrompt failed with no error");
}
