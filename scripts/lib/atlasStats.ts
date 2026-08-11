/**
 * Aggregate structured atlas design_criteria into practice-survey stats.
 */
import { getAllManuals, type ManualRecord } from "../../lib/data";
import { getTierASlugSet } from "../../lib/national/tierA";
import type {
  GuidanceTable,
  NationalOutline,
} from "../../lib/pipeline/types";
import {
  mergeFieldCitations,
  normalizeMethod,
  normalizeSoftware,
  bmpHint,
  resolveNormalizedFieldCitations,
  resolveReturnPeriodCitations,
  resolveWqMethodCitations,
  type FieldCitation,
} from "./fieldCitations";

export type FieldPresence = {
  field: string;
  present: number;
  total: number;
  pct: number;
  tierAPresent: number;
  tierATotal: number;
  tierAPct: number;
};

export type ValueCount = {
  value: string;
  count: number;
  pct: number;
};

export type SectionAtlasStats = {
  sectionId: string;
  totalManuals: number;
  tierAManuals: number;
  fields: FieldPresence[];
  returnPeriods: ValueCount[];
  peakMethods: ValueCount[];
  software: ValueCount[];
  bmpHints: ValueCount[];
  wqMethodPresentPct: number;
  wqMethodTierAPct: number;
  sampleSlugs: string[];
};

const SECTION_FIELDS: Record<string, string[]> = {
  intro: [],
  applicability: [],
  hydrology: [
    "design_storm_return_periods_years",
    "peak_flow_calculation_method",
  ],
  "hydrology.design-storms": ["design_storm_return_periods_years"],
  "hydrology.methods": ["peak_flow_calculation_method"],
  "hydrology.software": ["required_hydrologic_hydraulic_software"],
  "water-quality": ["water_quality_volume_method"],
  "water-quality.sizing": ["water_quality_volume_method"],
  "channel-flood": ["design_storm_return_periods_years"],
  "channel-flood.release": ["design_storm_return_periods_years"],
  bmps: ["approved_bmp_categories"],
  "bmps.selection": ["approved_bmp_categories"],
  "bmps.sizing": ["approved_bmp_categories"],
  "bmps.manufactured": ["approved_bmp_categories"],
  "construction-esc": [],
  om: [],
  regional: [],
  submittals: [],
};

function hasValue(v: unknown): boolean {
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "string") return v.trim().length > 0;
  return true;
}

function tallyValues(
  values: string[],
  totalWithField: number,
  max = 8
): ValueCount[] {
  const counts = new Map<string, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, max)
    .map(([value, count]) => ({
      value,
      count,
      pct: totalWithField > 0 ? Math.round((100 * count) / totalWithField) : 0,
    }));
}

function fieldPresence(
  manuals: ManualRecord[],
  tierA: Set<string>,
  key: keyof ManualRecord["data"]["design_criteria"]
): FieldPresence {
  const total = manuals.length;
  const tierAList = manuals.filter((m) => tierA.has(m.slug));
  const present = manuals.filter((m) =>
    hasValue(m.data.design_criteria[key])
  ).length;
  const tierAPresent = tierAList.filter((m) =>
    hasValue(m.data.design_criteria[key])
  ).length;
  return {
    field: `design_criteria.${key}`,
    present,
    total,
    pct: total > 0 ? Math.round((100 * present) / total) : 0,
    tierAPresent,
    tierATotal: tierAList.length,
    tierAPct:
      tierAList.length > 0
        ? Math.round((100 * tierAPresent) / tierAList.length)
        : 0,
  };
}

export function computeAtlasStats(opts?: {
  manuals?: ManualRecord[];
  tierASlugs?: Set<string>;
}): {
  totalManuals: number;
  tierAManuals: number;
  fields: Record<string, FieldPresence>;
  forSection: (
    section: NationalOutline["sections"][number]
  ) => SectionAtlasStats;
} {
  const manuals = opts?.manuals ?? getAllManuals();
  const tierA = opts?.tierASlugs ?? getTierASlugSet();
  const tierAManuals = manuals.filter((m) => tierA.has(m.slug)).length;

  const keys = [
    "design_storm_return_periods_years",
    "water_quality_volume_method",
    "peak_flow_calculation_method",
    "required_hydrologic_hydraulic_software",
    "approved_bmp_categories",
  ] as const;

  const fields: Record<string, FieldPresence> = {};
  for (const k of keys) {
    fields[k] = fieldPresence(manuals, tierA, k);
  }

  function forSection(
    section: NationalOutline["sections"][number]
  ): SectionAtlasStats {
    const fieldKeys = SECTION_FIELDS[section.id] ?? [];
    const sectionFields = fieldKeys.map((k) => fields[k]).filter(Boolean);

    const withStorms = manuals.filter((m) =>
      hasValue(m.data.design_criteria.design_storm_return_periods_years)
    );
    const returnPeriods: string[] = [];
    for (const m of withStorms) {
      for (const y of m.data.design_criteria.design_storm_return_periods_years ??
        []) {
        returnPeriods.push(`${y}-year`);
      }
    }

    const withPeak = manuals.filter((m) =>
      hasValue(m.data.design_criteria.peak_flow_calculation_method)
    );
    const peakMethods: string[] = [];
    for (const m of withPeak) {
      for (const method of m.data.design_criteria.peak_flow_calculation_method ??
        []) {
        peakMethods.push(normalizeMethod(method));
      }
    }

    const withSoft = manuals.filter((m) =>
      hasValue(m.data.design_criteria.required_hydrologic_hydraulic_software)
    );
    const software: string[] = [];
    for (const m of withSoft) {
      for (const s of m.data.design_criteria
        .required_hydrologic_hydraulic_software ?? []) {
        software.push(normalizeSoftware(s));
      }
    }

    const withBmp = manuals.filter((m) =>
      hasValue(m.data.design_criteria.approved_bmp_categories)
    );
    const bmpHints: string[] = [];
    for (const m of withBmp) {
      const hints = new Set<string>();
      for (const cat of m.data.design_criteria.approved_bmp_categories ?? []) {
        const h = bmpHint(cat);
        if (h) hints.add(h);
      }
      for (const h of hints) bmpHints.push(h);
    }

    const wq = fields.water_quality_volume_method;
    const sampleSlugs = manuals
      .filter((m) => tierA.has(m.slug) && !m.data.extraction_quality.needs_human_review)
      .slice(0, 8)
      .map((m) => m.slug);

    return {
      sectionId: section.id,
      totalManuals: manuals.length,
      tierAManuals,
      fields: sectionFields,
      returnPeriods: tallyValues(returnPeriods, withStorms.length),
      peakMethods: tallyValues(peakMethods, withPeak.length),
      software: tallyValues(software, withSoft.length),
      bmpHints: tallyValues(bmpHints, withBmp.length),
      wqMethodPresentPct: wq.pct,
      wqMethodTierAPct: wq.tierAPct,
      sampleSlugs,
    };
  }

  return {
    totalManuals: manuals.length,
    tierAManuals,
    fields,
    forSection,
  };
}

/** Build practice_survey prose from atlas field prevalence. */
export function buildPracticeSurveyFromStats(opts: {
  section: NationalOutline["sections"][number];
  stats: SectionAtlasStats;
}): string {
  const { section, stats } = opts;
  const parts: string[] = [];

  parts.push(
    `Across the atlas (${stats.totalManuals} manuals; ${stats.tierAManuals} Tier A anchors), structured extractions show the following for “${section.title}”.`
  );

  if (section.summary) {
    parts.push(`Topic framing: ${section.summary}`);
  }

  if (section.prevalence != null || section.source_manual_count != null) {
    parts.push(
      `Outline topic tagging: prevalence ≈ ${
        section.prevalence != null
          ? `${Math.round(section.prevalence * 100)}%`
          : "n/a"
      }; ~${section.source_manual_count ?? "n/a"} manuals tagged in corpus structure.`
    );
  }

  for (const f of stats.fields) {
    const short = f.field.replace("design_criteria.", "");
    parts.push(
      `Field \`${short}\` is populated in ${f.pct}% of all manuals (${f.present}/${f.total}) and ${f.tierAPct}% of Tier A (${f.tierAPresent}/${f.tierATotal}).`
    );
  }

  const id = section.id;
  if (id.includes("hydrology") || id.includes("channel-flood")) {
    if (stats.returnPeriods.length) {
      parts.push(
        `Most common return periods among manuals that list them: ${stats.returnPeriods
          .slice(0, 5)
          .map((v) => `${v.value} (${v.pct}% of storm-listing manuals)`)
          .join("; ")}.`
      );
    }
  }

  if (id.includes("methods") || id === "hydrology") {
    if (stats.peakMethods.length) {
      parts.push(
        `Peak-flow / runoff method families: ${stats.peakMethods
          .slice(0, 5)
          .map((v) => `${v.value} (${v.count})`)
          .join("; ")}.`
      );
    }
  }

  if (id.includes("software")) {
    if (stats.software.length) {
      parts.push(
        `Frequently named tools: ${stats.software
          .slice(0, 6)
          .map((v) => `${v.value} (${v.count})`)
          .join("; ")}.`
      );
    }
  }

  if (id.includes("water-quality")) {
    parts.push(
      `A water-quality volume / treatment method is specified in ${stats.wqMethodPresentPct}% of all manuals and ${stats.wqMethodTierAPct}% of Tier A anchors. Methods vary (first-inch / rainfall depth, 90th-percentile storm, pollutant-load reduction, continuous simulation).`
    );
  }

  if (id.includes("bmp") || id === "bmps") {
    if (stats.bmpHints.length) {
      parts.push(
        `BMP category signals in approved lists: ${stats.bmpHints
          .slice(0, 6)
          .map((v) => `${v.value} (${v.count} manuals)`)
          .join("; ")}.`
      );
    }
  }

  if (stats.sampleSlugs.length) {
    parts.push(
      `Tier A exemplars (clean extraction): ${stats.sampleSlugs.join(", ")}.`
    );
  }

  parts.push(
    "Counts are from structured atlas fields (not keyword-matched PDF chunks) and do not assert balloted national majorities."
  );

  return parts.join(" ");
}

const GUIDANCE_CAPTION =
  "Draft national guidance grounded in atlas practice — not a design manual or adopted regulation.";

function rpNote(stats: SectionAtlasStats, year: number): string {
  const v = stats.returnPeriods.find((r) => r.value === `${year}-year`);
  if (!v) return "Seldom listed among manuals that publish return periods";
  return `${v.pct}% of listing manuals (${v.count})`;
}

function methodNote(stats: SectionAtlasStats, family: string): string {
  const v = stats.peakMethods.find((r) =>
    r.value.toLowerCase().includes(family.toLowerCase())
  );
  if (!v) return "Present in atlas method lists at lower frequency";
  return `${v.pct}% of manuals with methods (${v.count})`;
}

function softwareNote(stats: SectionAtlasStats, name: string): string {
  const v = stats.software.find((r) =>
    r.value.toLowerCase().includes(name.toLowerCase())
  );
  if (!v) return "Named less often in atlas software lists";
  return `${v.pct}% of manuals with software lists (${v.count})`;
}

function bmpNote(stats: SectionAtlasStats, signal: string): string {
  const v = stats.bmpHints.find((r) =>
    r.value.toLowerCase().includes(signal.toLowerCase())
  );
  if (!v) return "Less common in approved-BMP field text";
  return `${v.pct}% of BMP-list manuals (${v.count})`;
}

export type GuidanceBuildResult = {
  tables: GuidanceTable[];
  /** Parallel to tables → rows: field-verified citations for each row. */
  rowEvidence: FieldCitation[][][];
};

type TableDraft = {
  table: GuidanceTable;
  evidence: FieldCitation[][];
};

function pushTable(
  drafts: TableDraft[],
  table: Omit<GuidanceTable, "row_citations">,
  evidence: FieldCitation[][]
): void {
  drafts.push({
    table: { ...table, row_citations: undefined },
    evidence,
  });
}

/** Build criteria-shaped guidance tables + per-row field evidence. */
export function buildGuidanceTablesForSection(
  sectionId: string,
  stats: SectionAtlasStats,
  opts?: {
    manuals?: ManualRecord[];
    tierASlugs?: Set<string>;
  }
): GuidanceBuildResult {
  const manuals = opts?.manuals ?? getAllManuals();
  const tierA = opts?.tierASlugs ?? getTierASlugSet();
  const drafts: TableDraft[] = [];

  const stormSections = new Set([
    "hydrology",
    "hydrology.design-storms",
    "channel-flood",
  ]);
  const methodSections = new Set(["hydrology", "hydrology.methods"]);
  const softwareSections = new Set(["hydrology", "hydrology.software"]);
  const wqSections = new Set(["water-quality", "water-quality.sizing"]);
  const bmpSections = new Set([
    "bmps",
    "bmps.selection",
    "bmps.sizing",
    "bmps.manufactured",
  ]);

  if (stormSections.has(sectionId) && stats.returnPeriods.length) {
    const wqCites = resolveWqMethodCitations(manuals, { max: 5 });
    const ch2 = resolveReturnPeriodCitations(manuals, 2);
    const ch10 = resolveReturnPeriodCitations(manuals, 10);
    const pk2 = resolveReturnPeriodCitations(manuals, 2);
    const pk25 = resolveReturnPeriodCitations(manuals, 25);
    const pk100 = resolveReturnPeriodCitations(manuals, 100);
    const flood100 = resolveReturnPeriodCitations(manuals, 100);
    pushTable(
      drafts,
      {
        id: "design-storm-criteria",
        title: "Design storms by purpose",
        caption: GUIDANCE_CAPTION,
        columns: [
          "Design purpose",
          "Suggested national guidance",
          "Atlas note",
        ],
        rows: [
          [
            "Water quality / treatment",
            "Prefer a rainfall or runoff depth, or a percentile WQ storm — not a long return period alone",
            `WQ method field present in ${stats.wqMethodPresentPct}% of all manuals (${stats.wqMethodTierAPct}% of Tier A)`,
          ],
          [
            "Channel / overbank protection",
            "Commonly select a short return period in the 1–10 year range; document local channel criteria",
            `2-yr: ${rpNote(stats, 2)}. 10-yr: ${rpNote(stats, 10)}`,
          ],
          [
            "Peak matching / detention",
            "Commonly use a 2–25 year suite (sometimes through 100-year); match pre-development peaks unless volume-based alternative applies",
            `2-yr: ${rpNote(stats, 2)}. 25-yr: ${rpNote(stats, 25)}. 100-yr: ${rpNote(stats, 100)}`,
          ],
          [
            "Flood / emergency conveyance",
            "Commonly design for the 100-year event with freeboard and a safe overflow path",
            `100-yr: ${rpNote(stats, 100)}`,
          ],
        ],
      },
      [
        wqCites,
        mergeFieldCitations([ch2, ch10], 6),
        mergeFieldCitations([pk2, pk25, pk100], 6),
        flood100,
      ]
    );
  }

  if (methodSections.has(sectionId) && stats.peakMethods.length) {
    pushTable(
      drafts,
      {
        id: "method-criteria",
        title: "When to use common peak-flow methods",
        caption: GUIDANCE_CAPTION,
        columns: [
          "Method family",
          "Suggested national guidance",
          "Atlas note",
        ],
        rows: [
          [
            "Rational Method",
            "Allow for small, largely impervious catchments only; document Tc and intensity assumptions; respect local area limits",
            methodNote(stats, "Rational"),
          ],
          [
            "NRCS / SCS",
            "Default for most site design; document CN, rainfall distribution, and Tc",
            methodNote(stats, "NRCS"),
          ],
          [
            "Continuous / event models",
            "Require where permits demand volume control, complex routing, or LID credit verification",
            methodNote(stats, "Continuous"),
          ],
          [
            "Unit hydrograph / other",
            "Allow when documented in the controlling jurisdiction manual",
            methodNote(stats, "Unit hydrograph"),
          ],
        ],
      },
      [
        resolveNormalizedFieldCitations(
          manuals,
          "peak_flow_calculation_method",
          normalizeMethod,
          "Rational"
        ),
        resolveNormalizedFieldCitations(
          manuals,
          "peak_flow_calculation_method",
          normalizeMethod,
          "NRCS"
        ),
        resolveNormalizedFieldCitations(
          manuals,
          "peak_flow_calculation_method",
          normalizeMethod,
          "Continuous"
        ),
        resolveNormalizedFieldCitations(
          manuals,
          "peak_flow_calculation_method",
          normalizeMethod,
          "Unit hydrograph"
        ),
      ]
    );
  }

  if (softwareSections.has(sectionId) && stats.software.length) {
    pushTable(
      drafts,
      {
        id: "software-criteria",
        title: "Software allow-list posture (capability, not a mandated product)",
        caption: GUIDANCE_CAPTION,
        columns: [
          "Capability need",
          "Suggested national guidance",
          "Atlas note",
        ],
        rows: [
          [
            "Event / watershed hydrology",
            "Accept tools that implement approved methods and export reviewable inputs/outputs (e.g. HEC-HMS class)",
            softwareNote(stats, "HEC-HMS"),
          ],
          [
            "Urban runoff / LID continuous",
            "Accept SWMM-class tools where continuous or multi-event simulation is required",
            softwareNote(stats, "SWMM"),
          ],
          [
            "Site detention / pond routing",
            "Accept HydroCAD-class or equivalent tools used by the review agency",
            softwareNote(stats, "HydroCAD"),
          ],
          [
            "Open channel / floodplain",
            "Accept HEC-RAS-class tools for conveyance and floodplain checks when required",
            softwareNote(stats, "HEC-RAS"),
          ],
          [
            "Submittal hygiene",
            "Require version disclosure and native input files with the drainage report — do not mandate a single brand",
            "Atlas lists named tools; product mandates are uncommon",
          ],
        ],
      },
      [
        resolveNormalizedFieldCitations(
          manuals,
          "required_hydrologic_hydraulic_software",
          normalizeSoftware,
          "HEC-HMS"
        ),
        resolveNormalizedFieldCitations(
          manuals,
          "required_hydrologic_hydraulic_software",
          (s) => normalizeSoftware(s),
          "SWMM"
        ),
        resolveNormalizedFieldCitations(
          manuals,
          "required_hydrologic_hydraulic_software",
          normalizeSoftware,
          "HydroCAD"
        ),
        resolveNormalizedFieldCitations(
          manuals,
          "required_hydrologic_hydraulic_software",
          normalizeSoftware,
          "HEC-RAS"
        ),
        [],
      ]
    );
  }

  if (wqSections.has(sectionId)) {
    const wqCites = resolveWqMethodCitations(manuals, { max: 5 });
    pushTable(
      drafts,
      {
        id: "wq-sizing-criteria",
        title: "Water-quality sizing basis options",
        caption: GUIDANCE_CAPTION,
        columns: ["Sizing basis", "Suggested national guidance", "Atlas note"],
        rows: [
          [
            "Fixed depth (e.g. first inch / capture depth)",
            "State an explicit rainfall or runoff depth for WQv; differentiate new vs redevelopment",
            `WQ method field present in ${stats.wqMethodPresentPct}% of manuals (${stats.wqMethodTierAPct}% Tier A)`,
          ],
          [
            "Percentile / statistical storm",
            "Allow a documented percentile storm (e.g. 90th) where climate data support it",
            "Common Tier A framing alongside depth standards",
          ],
          [
            "Load-based / performance",
            "Allow pollutant-load or performance targets when the controlling permit uses them; couple to verified BMP rates",
            "Less universal than depth/percentile; verify locally",
          ],
          [
            "Retention hierarchy",
            "Prefer retention / runoff reduction before treatment-only BMPs where soils and groundwater allow",
            "Hierarchy language widespread in GI/LID manuals",
          ],
        ],
      },
      [wqCites, wqCites, wqCites, []]
    );

    const exemplars: string[][] = [];
    const exemplarEvidence: FieldCitation[][] = [];
    for (const m of manuals) {
      if (!tierA.has(m.slug)) continue;
      const method = m.data.design_criteria.water_quality_volume_method;
      if (!method || !String(method).trim()) continue;
      const text = String(method).replace(/\s+/g, " ").trim();
      exemplars.push([
        m.slug,
        m.data.document_metadata.state_code ?? "",
        text.length > 120 ? text.slice(0, 117) + "…" : text,
      ]);
      const one = resolveWqMethodCitations([m], { max: 1 });
      exemplarEvidence.push(one);
      if (exemplars.length >= 6) break;
    }
    if (exemplars.length) {
      pushTable(
        drafts,
        {
          id: "wq-exemplars",
          title: "Tier A water-quality method exemplars",
          caption:
            "Truncated atlas field text from Tier A manuals — verify against source PDFs before design use.",
          columns: ["Slug", "State", "Method summary"],
          rows: exemplars,
        },
        exemplarEvidence
      );
    }
  }

  if (bmpSections.has(sectionId) && stats.bmpHints.length) {
    pushTable(
      drafts,
      {
        id: "bmp-hierarchy-criteria",
        title: "SCM selection hierarchy",
        caption: GUIDANCE_CAPTION,
        columns: [
          "Hierarchy step",
          "Suggested national guidance",
          "Atlas note",
        ],
        rows: [
          [
            "1. Avoid / minimize",
            "Reduce imperviousness and disconnect drainage before selecting structural SCMs",
            "Hierarchy language common in GI/LID chapters",
          ],
          [
            "2. Runoff reduction / retention",
            "Prefer infiltration, harvesting, and volume reduction where soils and groundwater allow",
            bmpNote(stats, "infiltration"),
          ],
          [
            "3. Filtration / bioretention",
            "Use bioretention and filtration for treatment when retention is limited",
            bmpNote(stats, "bioretention"),
          ],
          [
            "4. Detention / peak control",
            "Use detention to meet channel and flood criteria after volume and treatment steps",
            bmpNote(stats, "detention"),
          ],
          [
            "5. Manufactured treatment",
            "Allow MTDs conditionally with verification-program references; do not bypass hierarchy where infiltration is feasible",
            bmpNote(stats, "manufactured"),
          ],
        ],
      },
      [
        [],
        resolveNormalizedFieldCitations(
          manuals,
          "approved_bmp_categories",
          (s) => bmpHint(s) ?? s,
          "infiltration"
        ),
        resolveNormalizedFieldCitations(
          manuals,
          "approved_bmp_categories",
          (s) => bmpHint(s) ?? s,
          "bioretention"
        ),
        resolveNormalizedFieldCitations(
          manuals,
          "approved_bmp_categories",
          (s) => bmpHint(s) ?? s,
          "detention"
        ),
        resolveNormalizedFieldCitations(
          manuals,
          "approved_bmp_categories",
          (s) => bmpHint(s) ?? s,
          "manufactured"
        ),
      ]
    );
  }

  if (sectionId === "channel-flood.release" && stats.returnPeriods.length) {
    pushTable(
      drafts,
      {
        id: "release-rate-criteria",
        title: "Release-rate / peak-matching criteria",
        caption: GUIDANCE_CAPTION,
        columns: [
          "Design purpose",
          "Suggested national guidance",
          "Atlas note",
        ],
        rows: [
          [
            "Pre- vs post-development peaks",
            "Match or reduce post-development peaks to pre-development for the specified storm suite unless a regional facility provides equivalent control",
            `Common storm suite anchors: 2-yr ${rpNote(stats, 2)}; 10-yr ${rpNote(stats, 10)}; 100-yr ${rpNote(stats, 100)}`,
          ],
          [
            "Volume-based alternative",
            "Allow duration or volume-reduction compliance where the local manual endorses it in lieu of multi-storm peak matching",
            "Some GI manuals replace peak matching with retention standards",
          ],
          [
            "Hydrograph documentation",
            "Require pre/post hydrographs and routing assumptions in the drainage report",
            "Submittal expectation across plan-review manuals",
          ],
        ],
      },
      [
        mergeFieldCitations(
          [
            resolveReturnPeriodCitations(manuals, 2),
            resolveReturnPeriodCitations(manuals, 10),
            resolveReturnPeriodCitations(manuals, 100),
          ],
          6
        ),
        [],
        [],
      ]
    );
  }

  // Checklist sections — no structured field evidence on rows
  const checklistSpecs: Array<{
    id: string;
    match: string;
    title: string;
    columns: string[];
    rows: string[][];
  }> = [
    {
      id: "applicability-checklist",
      match: "applicability",
      title: "Applicability checklist",
      columns: ["Topic", "Suggested national guidance", "Atlas note"],
      rows: [
        [
          "New development",
          "State disturbed-area or impervious thresholds that trigger post-construction criteria",
          "Applicability framing common in purpose/scope chapters",
        ],
        [
          "Redevelopment",
          "Define partial-site or reduced WQv rules for redevelopment; prefer net reduction where feasible",
          "Redevelopment rules vary widely by MS4",
        ],
        [
          "Exemptions",
          "List exemptions narrowly (e.g. routine maintenance) so they do not undermine WQ goals",
          "Exemption lists appear widely but differ in scope",
        ],
        [
          "Stricter local codes",
          "Allow agencies to adopt stricter thresholds than this guidance",
          "Local codes frequently exceed state minimums",
        ],
      ],
    },
    {
      id: "esc-checklist",
      match: "construction-esc",
      title: "Construction ESC expectations",
      columns: ["Topic", "Suggested national guidance", "Atlas note"],
      rows: [
        [
          "Separate from permanent SCMs",
          "Keep ESC distinct; do not credit temporary controls as permanent treatment",
          "ESC often published as CGP companion handbooks",
        ],
        [
          "Plan + sequencing",
          "Require an ESC plan, limit exposed area, and stabilize promptly",
          "Standard CGP / grading-permit theme",
        ],
        [
          "Inspection",
          "Inspect after qualifying rain events and before final stabilization",
          "Nearly universal in construction stormwater programs",
        ],
      ],
    },
    {
      id: "om-checklist",
      match: "om",
      title: "O&M design deliverables",
      columns: ["Topic", "Suggested national guidance", "Atlas note"],
      rows: [
        [
          "Responsible party",
          "Name the long-term owner/operator and inspection frequency in an O&M plan",
          "Common design-deliverable requirement",
        ],
        [
          "Access",
          "Design easements, ramps, and cleanouts for inspection and maintenance",
          "Emphasized in GI manuals",
        ],
        [
          "Acceptance",
          "Tie occupancy or bond release to as-built acceptance where local codes allow",
          "Varies by agency",
        ],
      ],
    },
    {
      id: "regional-packages",
      match: "regional",
      title: "Regional design packages",
      columns: ["Package", "Suggested national guidance", "Atlas note"],
      rows: [
        [
          "Arid West",
          "Larger capture/retention depths; document infiltration limits and dust/TSS emphasis",
          "Capture-depth standards common in West manuals",
        ],
        [
          "Humid East",
          "Multi-storm peak matching and WQv depth/percentile standards",
          "Default framing in many East/Midwest manuals",
        ],
        [
          "Cold climate",
          "Account for frozen ground, snowmelt, and underdrain/plant detailing",
          "Freeze-thaw forks appear in northern manuals",
        ],
        [
          "Coastal / karst / high GW",
          "Limit infiltration credits; check tide, surge, and freeboard",
          "Geologic and coastal constraints are first-class in many locals",
        ],
      ],
    },
    {
      id: "submittal-checklist",
      match: "submittals",
      title: "Plan-review package checklist",
      columns: ["Deliverable", "Suggested national guidance", "Atlas note"],
      rows: [
        [
          "Drainage report",
          "Cover hydrology, WQv, SCM selection/sizing, and downstream impacts",
          "Nearly universal plan-review expectation",
        ],
        [
          "Plans & details",
          "Show drainage areas, SCM details, and maintenance access",
          "Standard construction-document set",
        ],
        [
          "Model files",
          "Include native input/output files and version disclosure",
          "Increasingly required for digital review",
        ],
        [
          "O&M + as-builts",
          "Include O&M plan and as-built/certification materials",
          "Often tied to occupancy or bond release",
        ],
      ],
    },
  ];

  for (const spec of checklistSpecs) {
    if (sectionId !== spec.match) continue;
    pushTable(
      drafts,
      {
        id: spec.id,
        title: spec.title,
        caption: GUIDANCE_CAPTION,
        columns: spec.columns,
        rows: spec.rows,
      },
      spec.rows.map(() => [])
    );
  }

  return {
    tables: drafts.map((d) => d.table),
    rowEvidence: drafts.map((d) => d.evidence),
  };
}
