import { z } from "zod";
import { Agent, CursorAgentError } from "@cursor/sdk";
import { loadEnvLocal } from "./loadEnv";

function getApiKey(): string {
  loadEnvLocal();
  const key = process.env.CURSOR_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "CURSOR_API_KEY is not set. Add it to .env.local (see .env.example)."
    );
  }
  return key;
}

export function getPipelineModel(): string {
  loadEnvLocal();
  return process.env.PIPELINE_MODEL?.trim() || "composer-2.5-fast";
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
 */
export async function cursorJsonPrompt<T>(
  opts: CursorJsonPromptOptions<T>
): Promise<{ data: T; model: string; runId: string }> {
  const apiKey = getApiKey();
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
        apiKey,
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
