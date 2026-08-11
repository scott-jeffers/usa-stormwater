/**
 * Refresh core parent drafts + intro editorial prose (preserves tables/citations).
 *
 *   npx tsx scripts/national/refresh-core-parents.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { clearManualsCache } from "../../lib/data";
import { clearNationalCache } from "../../lib/national";
import { DRAFT_DIR, OUTLINE_PATH } from "../../lib/pipeline/paths";
import {
  draftSectionSchema,
  nationalOutlineSchema,
  type DraftSection,
} from "../../lib/pipeline/types";
import {
  buildPracticeSurveyFromStats,
  computeAtlasStats,
} from "../lib/atlasStats";

clearManualsCache();
clearNationalCache();

const outline = nationalOutlineSchema.parse(
  JSON.parse(readFileSync(OUTLINE_PATH, "utf-8"))
);
const atlas = computeAtlasStats();

type Patch = {
  draft_recommendation: string;
  regional_variants: string | null;
  open_issues: string;
};

const PATCHES: Record<string, Patch> = {
  intro: {
    draft_recommendation:
      "[DRAFT RECOMMENDATION — national manual draft, not adopted practice] This manual synthesizes common U.S. post-construction stormwater design practice for research use. It should: (1) State that controlling state, regional, and MS4 criteria prevail when more stringent; (2) Separate descriptive practice surveys and guidance tables from draft recommendations; (3) Require designers to name the design purpose (water quality, channel protection, flood control) before selecting criteria; (4) Cite jurisdiction manuals for any numeric default used on a project. This document is not regulation and is not a substitute for the local design manual.",
    regional_variants: null,
    open_issues:
      "Confirm public-facing disclaimer language. Decide whether a short navigation flowchart belongs in the intro or in submittals.",
  },
  hydrology: {
    draft_recommendation:
      "[DRAFT RECOMMENDATION — national manual draft, not adopted practice] A national hydrology chapter should: (1) Require the designer to name the design purpose (water quality, channel protection, flood control) before selecting a storm; (2) Present return periods and WQ depths as guidance tables with jurisdiction footnotes — more-stringent local criteria control; (3) Match computation methods to site scale (Rational with area limits; NRCS; continuous simulation where permits require volume control); (4) Call out regional forks (arid West capture volumes, coastal tide/surge, cold-climate frozen soils). Use the child sections for storms, methods, and software detail.",
    regional_variants:
      "Regional forks: arid_west (higher WQ depths / infiltration limits), coastal (tide and surge interactions), cold_climate (frozen ground, snowmelt hydrographs). Karst and high-groundwater settings may disallow infiltration-based assumptions.",
    open_issues:
      "Which return periods belong in a national MOP vs guidance-only; single national WQ depth vs climate bands; software prescribe vs allow-list.",
  },
  "water-quality": {
    draft_recommendation:
      "[DRAFT RECOMMENDATION — national manual draft, not adopted practice] A national water-quality chapter should: (1) Define WQv (or equivalent treatment volume) with an explicit rainfall/runoff basis and new vs redevelopment rules; (2) Prefer retention / runoff reduction before treatment-only BMPs where soils and groundwater allow; (3) Publish presumed pollutant-removal rates only as guidance with jurisdiction footnotes; (4) Apply the stricter of this guidance or the controlling MS4/state manual. Numeric national depths remain placeholders until excerpt review is complete — see water-quality.sizing for sizing detail.",
    regional_variants:
      "Arid West manuals often use larger capture depths or retention standards; cold-climate manuals adjust for frozen soils and snowmelt; coastal and karst settings may limit infiltration credits.",
    open_issues:
      "Single national WQ depth vs climate bands; whether nutrient criteria belong in the MOP; relationship to CGP/MS4 minimum measures.",
  },
  bmps: {
    draft_recommendation:
      "[DRAFT RECOMMENDATION — national manual draft, not adopted practice] A national BMP / SCM chapter should: (1) Publish a core menu of post-construction categories with a selection hierarchy (avoid → minimize → treat → detain); (2) Point sizing back to hydrology/WQv chapters rather than duplicating storms; (3) Treat manufactured devices as conditionally allowed with verification-program references; (4) Require O&M plans and inspection access as design deliverables. Present the menu as guidance with jurisdiction footnotes — not a mandatory national list. See selection, sizing, and manufactured child sections for detail.",
    regional_variants:
      "Karst and high-groundwater areas restrict infiltration SCMs; arid West emphasizes retention and dust/TSS; cold climate needs freeze-thaw detailing and underdrains. Coastal salinity and tide may affect wetland and outfall design.",
    open_issues:
      "How to reference proprietary MTD approval programs; whether green-infrastructure-first is a requirement or guidance; separation of ESC vs permanent SCMs.",
  },
};

for (const [id, patch] of Object.entries(PATCHES)) {
  const section = outline.sections.find((s) => s.id === id);
  if (!section) {
    console.warn(`outline missing ${id}`);
    continue;
  }
  const filePath = path.join(DRAFT_DIR, `${id}.json`);
  const raw = draftSectionSchema.parse(
    JSON.parse(readFileSync(filePath, "utf-8"))
  );
  const stats = atlas.forSection(section);
  const next: DraftSection = {
    ...raw,
    generated_at: new Date().toISOString(),
    model: "heuristic+editorial",
    editorial_status: "reviewed",
    practice_survey: buildPracticeSurveyFromStats({ section, stats }),
    draft_recommendation: patch.draft_recommendation,
    regional_variants: patch.regional_variants,
    open_issues: patch.open_issues,
  };
  writeFileSync(filePath, JSON.stringify(next, null, 2) + "\n", "utf-8");
  console.log(
    `refreshed ${id} (citations=${next.citations.length}, tables=${next.guidance_tables?.length ?? 0})`
  );
}
