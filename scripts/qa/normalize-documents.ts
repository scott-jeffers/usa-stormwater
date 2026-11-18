/**
 * Normalize data/documents/*.json in place (idempotent):
 * - evidence field names → canonical dot-paths (design_parameters.x, ...)
 * - month-name dates ("November 2025") → ISO ("2025-11")
 *
 *   npm run qa:normalize            # write changes
 *   npm run qa:normalize -- --check # exit 1 if anything would change (CI)
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { normalizeEvidenceField } from "../../lib/practices/params";
import { normalizeIsoishDate } from "../../lib/schema";

const DIR = path.resolve(process.cwd(), "data/documents");
const check = process.argv.includes("--check");
let changed = 0;

for (const file of readdirSync(DIR).filter((f) => f.endsWith(".json")).sort()) {
  const p = path.join(DIR, file);
  const before = readFileSync(p, "utf-8");
  const doc = JSON.parse(before);
  const notes: string[] = [];

  for (const ev of doc.evidence ?? []) {
    const f = normalizeEvidenceField(ev.field);
    if (f !== ev.field) {
      notes.push(`evidence ${ev.field} → ${f}`);
      ev.field = f;
    }
  }
  const meta = doc.document_metadata ?? {};
  for (const k of ["adoption_or_effective_date", "last_revised_date"]) {
    const v = meta[k];
    if (typeof v === "string") {
      const iso = normalizeIsoishDate(v);
      if (iso !== v) {
        notes.push(`${k} "${v}" → ${JSON.stringify(iso)}`);
        meta[k] = iso;
      }
    }
  }

  const after = JSON.stringify(doc, null, 2) + "\n";
  if (after !== before) {
    changed += 1;
    console.log(`${file}: ${notes.join("; ") || "formatting"}`);
    if (!check) writeFileSync(p, after);
  }
}

console.log(`${changed} document(s) ${check ? "need normalizing" : "normalized"}.`);
if (check && changed > 0) process.exit(1);
