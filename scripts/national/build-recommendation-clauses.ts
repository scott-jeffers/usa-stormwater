/**
 * Split draft recommendations into numbered clauses with citation_keys
 * for structured sections; attach registry-backed keys for all sections.
 *
 *   npx tsx scripts/national/build-recommendation-clauses.ts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { clearNationalCache } from "../../lib/national";
import { DRAFT_DIR, OUTLINE_PATH } from "../../lib/pipeline/paths";
import {
  draftSectionSchema,
  nationalOutlineSchema,
  type CitationRegistryEntry,
  type DraftSection,
  type RecommendationClause,
} from "../../lib/pipeline/types";

const STRUCTURED = new Set([
  "hydrology",
  "hydrology.design-storms",
  "hydrology.methods",
  "hydrology.software",
  "water-quality",
  "water-quality.sizing",
  "bmps",
  "bmps.selection",
  "bmps.sizing",
  "bmps.manufactured",
  "channel-flood",
  "channel-flood.release",
]);

type ClauseSeed = {
  id: string;
  text: string;
  confidence: RecommendationClause["confidence"];
  /** Prefer field_verified registry entries matching these field substrings. */
  preferFields?: string[];
  /** Prefer registry entries whose excerpt/slug matches these patterns. */
  preferExcerpt?: RegExp[];
};

const CLAUSES: Record<string, ClauseSeed[]> = {
  hydrology: [
    {
      id: "purpose-first",
      text: "Require designers to name the design purpose (water quality, channel protection, peak matching, or flood conveyance) before selecting a storm or method.",
      confidence: "editorial",
    },
    {
      id: "storms-by-purpose",
      text: "Present return periods and water-quality depths as guidance with jurisdiction footnotes; more-stringent local criteria control.",
      confidence: "field_verified",
      preferFields: ["design_storm_return_periods_years"],
    },
    {
      id: "methods-by-scale",
      text: "Match methods to site scale—Rational with documented area limits, NRCS for most site design, continuous simulation where permits require volume control.",
      confidence: "field_verified",
      preferFields: ["peak_flow_calculation_method"],
    },
    {
      id: "regional-forks",
      text: "Address arid West, coastal, and cold-climate forks explicitly; karst and high groundwater may disallow infiltration assumptions.",
      confidence: "editorial",
    },
  ],
  "hydrology.design-storms": [
    {
      id: "wq-storm",
      text: "For water quality, prefer a rainfall or runoff depth or a percentile storm—not a long return period alone.",
      confidence: "field_verified",
      preferFields: ["water_quality_volume_method"],
    },
    {
      id: "channel-storm",
      text: "For channel or overbank protection, commonly select a short return period in the 1–10 year range and document local channel criteria.",
      confidence: "field_verified",
      preferFields: ["design_storm_return_periods_years"],
    },
    {
      id: "detention-storm",
      text: "For detention or peak matching, commonly use a 2–25 year suite (sometimes through 100-year).",
      confidence: "field_verified",
      preferFields: ["design_storm_return_periods_years"],
    },
    {
      id: "flood-storm",
      text: "For flood or emergency conveyance, commonly design for the 100-year event with freeboard and a safe overflow path.",
      confidence: "field_verified",
      preferFields: ["design_storm_return_periods_years"],
    },
    {
      id: "precip-source",
      text: "Prefer NOAA Atlas 14 or successor precipitation where available; document any climate adjustments required locally.",
      confidence: "corpus_pattern",
    },
  ],
  "hydrology.methods": [
    {
      id: "rational",
      text: "Allow Rational Method only for small, largely impervious catchments with documented time-of-concentration and intensity assumptions.",
      confidence: "field_verified",
      preferFields: ["peak_flow_calculation_method"],
      preferExcerpt: [/rational/i],
    },
    {
      id: "nrcs",
      text: "Use NRCS/SCS methods for most site design; document CN, rainfall distribution, and Tc.",
      confidence: "field_verified",
      preferFields: ["peak_flow_calculation_method"],
      preferExcerpt: [/nrcs|scs|tr-?55|curve/i],
    },
    {
      id: "continuous",
      text: "Require continuous or multi-event simulation where permits demand runoff reduction or complex routing.",
      confidence: "field_verified",
      preferFields: ["peak_flow_calculation_method"],
      preferExcerpt: [/swmm|continuous|hec-?hms/i],
    },
    {
      id: "local-stricter",
      text: "Defer to stricter local method rules when they conflict with this guidance.",
      confidence: "editorial",
    },
  ],
  "hydrology.software": [
    {
      id: "allow-list",
      text: "Treat software as an allow-list of capabilities, not a single mandated product.",
      confidence: "editorial",
    },
    {
      id: "approved-tools",
      text: "Accept tools that implement approved hydrologic methods and export reproducible inputs and outputs (HEC-HMS, SWMM, HydroCAD, and HEC-RAS class tools are frequently named).",
      confidence: "field_verified",
      preferFields: ["required_hydrologic_hydraulic_software"],
    },
    {
      id: "submittal-files",
      text: "Require version disclosure and native input files with drainage-report submittals.",
      confidence: "editorial",
    },
  ],
  "water-quality": [
    {
      id: "define-wqv",
      text: "Define water-quality volume (or equivalent treatment volume) with an explicit rainfall or runoff basis and clear new versus redevelopment rules.",
      confidence: "field_verified",
      preferFields: ["water_quality_volume_method"],
    },
    {
      id: "retention-first",
      text: "Prefer retention and runoff reduction before treatment-only BMPs where soils and groundwater allow.",
      confidence: "editorial",
    },
    {
      id: "removal-rates",
      text: "Publish presumed pollutant-removal rates only as guidance with jurisdiction footnotes.",
      confidence: "corpus_pattern",
    },
    {
      id: "stricter-controls",
      text: "Apply the stricter of this guidance or the controlling MS4 or state manual.",
      confidence: "editorial",
    },
  ],
  "water-quality.sizing": [
    {
      id: "basis",
      text: "State the WQv basis (depth, percentile storm, or load-based) and how new versus redevelopment differ.",
      confidence: "field_verified",
      preferFields: ["water_quality_volume_method"],
    },
    {
      id: "size-to-wqv",
      text: "Size permanent SCMs to that volume with documented assumptions; prefer retention where feasible.",
      confidence: "field_verified",
      preferFields: ["water_quality_volume_method"],
    },
    {
      id: "pretreatment",
      text: "Require pretreatment for sediment-laden inflows to filtration and infiltration practices.",
      confidence: "editorial",
    },
    {
      id: "no-single-depth",
      text: "Do not invent a single national depth without climate context—present guidance ranges keyed to regional practice until committee defaults are set.",
      confidence: "editorial",
    },
  ],
  "channel-flood": [
    {
      id: "separate-purposes",
      text: "Separate channel-protection storms from flood conveyance; do not collapse both into one number.",
      confidence: "field_verified",
      preferFields: ["design_storm_return_periods_years"],
    },
    {
      id: "erosive-flows",
      text: "Limit post-development increases in erosive flows where stable channels are a goal.",
      confidence: "editorial",
    },
    {
      id: "flood-freeboard",
      text: "Size conveyance and freeboard for the flood design storm (commonly 100-year) with emergency overflow paths.",
      confidence: "field_verified",
      preferFields: ["design_storm_return_periods_years"],
    },
    {
      id: "floodplain-coord",
      text: "Coordinate with floodplain managers and FEMA mapping where applicable.",
      confidence: "editorial",
    },
  ],
  "channel-flood.release": [
    {
      id: "peak-match",
      text: "Match or reduce post-development peaks to pre-development for the specified storm suite unless a regional facility provides equivalent control.",
      confidence: "field_verified",
      preferFields: ["design_storm_return_periods_years"],
    },
    {
      id: "hydrographs",
      text: "Document pre- versus post-hydrographs and routing assumptions in the drainage report.",
      confidence: "editorial",
    },
    {
      id: "volume-alt",
      text: "Allow alternative volume-based or duration-control compliance where local manuals endorse it.",
      confidence: "editorial",
    },
  ],
  bmps: [
    {
      id: "core-menu",
      text: "Publish a core menu of post-construction SCM categories with a clear selection hierarchy.",
      confidence: "field_verified",
      preferFields: ["approved_bmp_categories"],
    },
    {
      id: "point-to-hydrology",
      text: "Point sizing back to hydrology and WQv chapters rather than duplicating storm criteria here.",
      confidence: "editorial",
    },
    {
      id: "mtd-conditional",
      text: "Treat manufactured devices as conditionally allowed with verification-program references.",
      confidence: "field_verified",
      preferFields: ["approved_bmp_categories"],
      preferExcerpt: [/manufactured|proprietary|hydrodynamic/i],
    },
    {
      id: "om-deliverable",
      text: "Require O&M plans and inspection access as design deliverables.",
      confidence: "editorial",
    },
  ],
  "bmps.selection": [
    {
      id: "hierarchy",
      text: "Follow a hierarchy: avoid and minimize imperviousness; prefer source control and runoff reduction; select treatment SCMs matched to pollutants and site constraints.",
      confidence: "editorial",
    },
    {
      id: "mtd-after-hierarchy",
      text: "Use manufactured devices only where approved and where hierarchy steps are met.",
      confidence: "field_verified",
      preferFields: ["approved_bmp_categories"],
      preferExcerpt: [/manufactured|proprietary/i],
    },
    {
      id: "screens",
      text: "Publish selection screens for soils, groundwater, karst, and cold climate.",
      confidence: "editorial",
    },
  ],
  "bmps.sizing": [
    {
      id: "tie-to-wqv",
      text: "Tie surface area, storage, and media depth to the WQv from the water-quality chapter.",
      confidence: "field_verified",
      preferFields: ["water_quality_volume_method", "approved_bmp_categories"],
    },
    {
      id: "drawdown",
      text: "Meet drawdown and underdrain criteria appropriate to climate and soils.",
      confidence: "editorial",
    },
    {
      id: "pretreatment",
      text: "Provide pretreatment for sediment-laden inflows; document infiltration rate, porosity, and orifice assumptions.",
      confidence: "editorial",
    },
  ],
  "bmps.manufactured": [
    {
      id: "verification",
      text: "Allow manufactured devices conditionally with reference to recognized verification programs or state approval lists.",
      confidence: "field_verified",
      preferFields: ["approved_bmp_categories"],
      preferExcerpt: [/manufactured|proprietary|hydrodynamic|mtds/i],
    },
    {
      id: "size-wq-peak",
      text: "Size for the water-quality peak or volume per manufacturer and agency rules.",
      confidence: "editorial",
    },
    {
      id: "no-bypass-hierarchy",
      text: "Do not use MTDs to bypass runoff-reduction hierarchy where infiltration is feasible; prefer verified performance data over marketing claims.",
      confidence: "editorial",
    },
  ],
};

function sectionNumberPrefix(
  sectionId: string,
  outlineOrder: string[]
): string {
  const idx = outlineOrder.indexOf(sectionId);
  const n = idx >= 0 ? idx + 1 : 1;
  return String(n);
}

function pickKeys(
  registry: CitationRegistryEntry[],
  seed: ClauseSeed,
  max = 4
): string[] {
  if (!registry.length) return [];

  const scored = registry.map((e) => {
    let score = 0;
    if (seed.preferFields?.length) {
      const field = e.field ?? "";
      for (const f of seed.preferFields) {
        if (field.includes(f)) score += 10;
      }
    }
    if (seed.preferExcerpt?.length) {
      for (const p of seed.preferExcerpt) {
        if (p.test(e.excerpt) || p.test(e.slug)) score += 5;
      }
    }
    if (e.confidence === "field_verified") score += 3;
    if (e.confidence === seed.confidence) score += 1;
    return { e, score };
  });

  scored.sort((a, b) => b.score - a.score || Number(a.e.key) - Number(b.e.key));

  const keys: string[] = [];
  const seenSlug = new Set<string>();
  for (const { e, score } of scored) {
    if (keys.length >= max) break;
    if (seed.preferFields?.length && score < 3 && e.confidence !== "field_verified")
      continue;
    if (seenSlug.has(e.slug)) continue;
    seenSlug.add(e.slug);
    keys.push(e.key);
  }

  // Fallback: first field_verified or first few registry entries
  if (keys.length === 0) {
    for (const e of registry) {
      if (keys.length >= Math.min(3, max)) break;
      if (seenSlug.has(e.slug)) continue;
      if (seed.confidence === "field_verified" && e.confidence !== "field_verified")
        continue;
      seenSlug.add(e.slug);
      keys.push(e.key);
    }
  }
  if (keys.length === 0) {
    for (const e of registry.slice(0, 2)) keys.push(e.key);
  }
  return keys;
}

clearNationalCache();

const outline = nationalOutlineSchema.parse(
  JSON.parse(readFileSync(OUTLINE_PATH, "utf-8"))
);
const outlineOrder = outline.sections.map((s) => s.id);

let updated = 0;
for (const section of outline.sections) {
  const filePath = path.join(DRAFT_DIR, `${section.id}.json`);
  if (!existsSync(filePath)) continue;
  const raw = draftSectionSchema.parse(
    JSON.parse(readFileSync(filePath, "utf-8"))
  );
  const registry = raw.citation_registry ?? [];
  const prefix = sectionNumberPrefix(section.id, outlineOrder);

  let recommendation_clauses: RecommendationClause[] | undefined;

  if (STRUCTURED.has(section.id) && CLAUSES[section.id]) {
    recommendation_clauses = CLAUSES[section.id].map((seed, i) => ({
      id: seed.id,
      number: `${prefix}.${i + 1}`,
      text: seed.text,
      citation_keys: pickKeys(registry, seed),
      confidence: seed.confidence,
    }));
  }

  const next: DraftSection = {
    ...raw,
    generated_at: new Date().toISOString(),
    recommendation_clauses,
  };

  // Non-structured: clear clauses (keep prose + registry only)
  if (!STRUCTURED.has(section.id)) {
    next.recommendation_clauses = undefined;
  }

  writeFileSync(filePath, JSON.stringify(next, null, 2) + "\n", "utf-8");
  const n = recommendation_clauses?.length ?? 0;
  const keyed =
    recommendation_clauses?.filter((c) => c.citation_keys.length > 0).length ??
    0;
  console.log(
    `${section.id}: ${n} clauses (${keyed} with keys), registry=${registry.length}`
  );
  updated += 1;
}

console.log(`Updated ${updated} draft sections`);
