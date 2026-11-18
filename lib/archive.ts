/** Design archive: agency drawing libraries, drawings and worked examples in atlas manuals. */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { ESC_PRACTICES } from "@/scripts/archive/practices";

export type Library = {
  id: string;
  agency: string;
  state: string;
  level: string;
  url: string;
  formats: string[];
  practices: string[];
  part: string;
  description: string;
};
export type ExternalPlan = { id: string; agency: string; state: string; url: string; formats: string[]; kind: string; practices: string[]; description: string };

const ROOT = process.cwd();
const ontology = JSON.parse(readFileSync(path.join(ROOT, "data/ontology/bmp-aliases.json"), "utf-8")).practices as Record<string, { label: string }>;

export const PRACTICE_LABELS: Record<string, string> = {
  ...Object.fromEntries(Object.entries(ontology).map(([k, v]) => [k, v.label])),
  ...Object.fromEntries(Object.entries(ESC_PRACTICES).map(([k, v]) => [k, v.label])),
  rainwater_harvesting: "Rainwater Harvesting",
};

function read<T>(file: string, key: string): T[] {
  const p = path.join(ROOT, "data/archive", file);
  return existsSync(p) ? (JSON.parse(readFileSync(p, "utf-8"))[key] as T[]) : [];
}
export const loadLibraries = () => read<Library>("libraries.json", "libraries");
export const loadExternalPlans = () => read<ExternalPlan>("sample-plans-external.json", "sample_plans");
export function archiveCounts() {
  const d = existsSync(path.join(ROOT, "data/archive/drawings.json")) ? JSON.parse(readFileSync(path.join(ROOT, "data/archive/drawings.json"), "utf-8")) : { drawings: [] };
  const e = existsSync(path.join(ROOT, "data/archive/examples.json")) ? JSON.parse(readFileSync(path.join(ROOT, "data/archive/examples.json"), "utf-8")) : { examples: [] };
  return {
    drawings: d.drawings.length as number,
    drawingManuals: new Set((d.drawings as Array<{ slug: string }>).map((x) => x.slug)).size,
    examples: (e.examples as Array<{ kind: string }>).filter((x) => x.kind === "worked_example").length,
    plans: (e.examples as Array<{ kind: string }>).filter((x) => x.kind !== "worked_example").length,
  };
}
