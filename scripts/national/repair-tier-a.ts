/**
 * Repair excerpts for Tier A + national draft citation slugs.
 *
 * Usage:
 *   npm run national:repair-tier-a
 *   npx tsx scripts/national/repair-tier-a.ts --dry-run
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { getTierASlugSet } from "../../lib/national/tierA";
import { DRAFT_DIR } from "../../lib/pipeline/paths";
import { draftSectionSchema } from "../../lib/pipeline/types";

function collectCitationSlugs(): Set<string> {
  const out = new Set<string>();
  if (!existsSync(DRAFT_DIR)) return out;
  for (const file of readdirSync(DRAFT_DIR).filter((f) => f.endsWith(".json"))) {
    try {
      const raw = JSON.parse(
        readFileSync(path.join(DRAFT_DIR, file), "utf-8")
      );
      const parsed = draftSectionSchema.safeParse(raw);
      if (!parsed.success) continue;
      for (const c of parsed.data.citations) out.add(c.slug);
      for (const s of parsed.data.supporting_slugs) out.add(s);
    } catch {
      // skip
    }
  }
  return out;
}

const dryRun = process.argv.includes("--dry-run");
const tierA = getTierASlugSet();
const cited = collectCitationSlugs();
const union = [...new Set([...tierA, ...cited])].sort();

console.log(
  `repair-tier-a: ${tierA.size} Tier A + ${cited.size} draft citation slugs → ${union.length} unique`
);
if (dryRun) {
  console.log(union.join("\n"));
  process.exit(0);
}

const result = spawnSync(
  "npx",
  ["tsx", "scripts/pipeline/repair-excerpts.ts", ...union],
  {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      PIPELINE_REPAIR_LIMIT: String(Math.max(union.length, 200)),
    },
  }
);

process.exit(result.status ?? 1);
