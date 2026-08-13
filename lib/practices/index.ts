/**
 * Load practice matrix / synthesis JSON from data/national/practices/.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  practiceMatrixSchema,
  practiceSynthesisSchema,
  type PracticeMatrix,
  type PracticeSynthesis,
} from "./types";

const PRACTICES_DIR = path.resolve(process.cwd(), "data/national/practices");

let cachedSyntheses: PracticeSynthesis[] | undefined;
let cachedMatrices: PracticeMatrix[] | undefined;
let cachedStamp = -1;

function practicesStamp(): number {
  if (!existsSync(PRACTICES_DIR)) return 0;
  let stamp = 0;
  try {
    for (const f of readdirSync(PRACTICES_DIR)) {
      if (!f.endsWith(".json")) continue;
      stamp = Math.max(stamp, statSync(path.join(PRACTICES_DIR, f)).mtimeMs);
    }
  } catch {
    /* ignore */
  }
  return stamp;
}

function ensureFresh(): void {
  const stamp = practicesStamp();
  if (stamp !== cachedStamp) {
    cachedSyntheses = undefined;
    cachedMatrices = undefined;
    cachedStamp = stamp;
  }
}

export function clearPracticesCache(): void {
  cachedSyntheses = undefined;
  cachedMatrices = undefined;
  cachedStamp = -1;
}

export function getAllPracticeSyntheses(): PracticeSynthesis[] {
  ensureFresh();
  if (cachedSyntheses) return cachedSyntheses;
  if (!existsSync(PRACTICES_DIR)) {
    cachedSyntheses = [];
    return cachedSyntheses;
  }
  const out: PracticeSynthesis[] = [];
  for (const f of readdirSync(PRACTICES_DIR)) {
    if (!f.endsWith(".json") || f.endsWith(".matrix.json")) continue;
    try {
      out.push(
        practiceSynthesisSchema.parse(
          JSON.parse(readFileSync(path.join(PRACTICES_DIR, f), "utf-8"))
        )
      );
    } catch (error) {
      console.warn(
        `[practices] skip ${f}: ${(error as Error).message}`
      );
    }
  }
  cachedSyntheses = out.sort((a, b) =>
    a.practice_label.localeCompare(b.practice_label)
  );
  return cachedSyntheses;
}

export function getPracticeSynthesis(
  practiceKey: string
): PracticeSynthesis | null {
  return (
    getAllPracticeSyntheses().find((p) => p.practice_key === practiceKey) ??
    null
  );
}

export function getPracticeMatrix(practiceKey: string): PracticeMatrix | null {
  ensureFresh();
  const p = path.join(PRACTICES_DIR, `${practiceKey}.matrix.json`);
  if (!existsSync(p)) return null;
  try {
    return practiceMatrixSchema.parse(JSON.parse(readFileSync(p, "utf-8")));
  } catch {
    return null;
  }
}

export function getAllPracticeMatrices(): PracticeMatrix[] {
  ensureFresh();
  if (cachedMatrices) return cachedMatrices;
  if (!existsSync(PRACTICES_DIR)) {
    cachedMatrices = [];
    return cachedMatrices;
  }
  const out: PracticeMatrix[] = [];
  for (const f of readdirSync(PRACTICES_DIR)) {
    if (!f.endsWith(".matrix.json")) continue;
    try {
      out.push(
        practiceMatrixSchema.parse(
          JSON.parse(readFileSync(path.join(PRACTICES_DIR, f), "utf-8"))
        )
      );
    } catch {
      /* skip */
    }
  }
  cachedMatrices = out;
  return cachedMatrices;
}
