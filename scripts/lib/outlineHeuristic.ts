/**
 * Offline national outline from corpus topic/TOC stats (no API).
 */
import type {
  CorpusStructure,
  NationalOutline,
} from "../../lib/pipeline/types";
import { useHeuristicLlm } from "./corpusHeuristic";

export { useHeuristicLlm };

interface SectionDef {
  id: string;
  title: string;
  level: 1 | 2 | 3;
  parent_id: string | null;
  topic_tags: string[];
  toc_patterns: RegExp[];
  regional_notes: string[];
  summary: string;
}

const SECTION_DEFS: SectionDef[] = [
  {
    id: "intro",
    title: "Purpose, Scope, and How to Use This Synthesis",
    level: 1,
    parent_id: null,
    topic_tags: ["general"],
    toc_patterns: [/purpose/i, /scope/i, /introduction/i, /how to use/i],
    regional_notes: [],
    summary:
      "Frames this work as a synthesis of U.S. practice for research and committee review, not adopted regulation or a design manual.",
  },
  {
    id: "applicability",
    title: "Applicability and Relationship to Permits and Local Codes",
    level: 1,
    parent_id: null,
    topic_tags: ["general"],
    toc_patterns: [/applicab/i, /ms4/i, /npdes/i, /ordinance/i, /authority/i],
    regional_notes: ["ms4_vs_non_ms4"],
    summary:
      "When criteria apply (new development, redevelopment, thresholds) and how state/local manuals interact.",
  },
  {
    id: "hydrology",
    title: "Hydrology and Design Storms",
    level: 1,
    parent_id: null,
    topic_tags: ["hydrology"],
    toc_patterns: [/hydrolog/i, /design storm/i, /rainfall/i, /precipitation/i],
    regional_notes: ["arid_west", "coastal", "cold_climate"],
    summary:
      "Return periods and storm definitions used for water quality, channel protection, and flood control.",
  },
  {
    id: "hydrology.design-storms",
    title: "Design Storm Selection by Purpose",
    level: 2,
    parent_id: "hydrology",
    topic_tags: ["hydrology"],
    toc_patterns: [/design storm/i, /return period/i, /\d+-year/i],
    regional_notes: ["arid_west", "humid_east"],
    summary:
      "Separate WQ, channel, detention, and flood storms; avoid collapsing all purposes into one number.",
  },
  {
    id: "hydrology.methods",
    title: "Runoff and Peak-Flow Calculation Methods",
    level: 2,
    parent_id: "hydrology",
    topic_tags: ["hydrology", "peak_flow"],
    toc_patterns: [/rational/i, /tr-?\s*55/i, /hydrograph/i, /scs/i, /cn\b/i],
    regional_notes: [],
    summary:
      "Rational Method, NRCS/TR-55, continuous simulation, and when each is required or allowed.",
  },
  {
    id: "hydrology.software",
    title: "Approved Hydrologic and Hydraulic Software",
    level: 2,
    parent_id: "hydrology",
    topic_tags: ["software", "hydrology"],
    toc_patterns: [/software/i, /hec-/i, /swmm/i, /hydrocad/i, /model/i],
    regional_notes: [],
    summary: "Tools commonly required or accepted for sizing and flood routing.",
  },
  {
    id: "water-quality",
    title: "Water Quality Volume and Treatment",
    level: 1,
    parent_id: null,
    topic_tags: ["water_quality"],
    toc_patterns: [/water quality/i, /\bwqv\b/i, /treatment volume/i, /first flush/i, /tss/i],
    regional_notes: ["arid_west", "cold_climate"],
    summary:
      "Sizing basis for water-quality capture/treatment and pollutant-removal expectations.",
  },
  {
    id: "water-quality.sizing",
    title: "WQv / Treatment Volume Sizing Methods",
    level: 2,
    parent_id: "water-quality",
    topic_tags: ["water_quality"],
    toc_patterns: [/water quality volume/i, /treatment volume/i, /90\s*%/i, /first inch/i],
    regional_notes: ["arid_west"],
    summary:
      "Common approaches: first inch, 90th percentile, percent annual rainfall, TSS removal targets.",
  },
  {
    id: "channel-flood",
    title: "Channel Protection, Detention, and Flood Control",
    level: 1,
    parent_id: null,
    topic_tags: ["detention", "peak_flow"],
    toc_patterns: [/detention/i, /retention/i, /channel protection/i, /flood/i, /release rate/i],
    regional_notes: ["arid_west", "urban_infill"],
    summary:
      "Post-development peak matching, extended detention, and floodplain/channel criteria.",
  },
  {
    id: "channel-flood.release",
    title: "Allowable Discharge and Release Rates",
    level: 2,
    parent_id: "channel-flood",
    topic_tags: ["detention", "peak_flow"],
    toc_patterns: [/release rate/i, /allowable discharge/i, /pre-development/i, /peak match/i],
    regional_notes: [],
    summary: "Pre- vs post-development peaks and site-specific release limits.",
  },
  {
    id: "bmps",
    title: "Stormwater Control Measures (BMPs)",
    level: 1,
    parent_id: null,
    topic_tags: ["bmp_sizing"],
    toc_patterns: [/\bbmp\b/i, /bioretention/i, /infiltration/i, /swale/i, /facility/i, /scm/i],
    regional_notes: ["karst", "arid_west", "cold_climate"],
    summary:
      "Approved practice categories, selection hierarchy, and sizing/design criteria.",
  },
  {
    id: "bmps.selection",
    title: "BMP Selection and Treatment Trains",
    level: 2,
    parent_id: "bmps",
    topic_tags: ["bmp_sizing"],
    toc_patterns: [/selection/i, /treatment train/i, /hierarchy/i, /menu/i],
    regional_notes: [],
    summary: "How manuals prioritize infiltration, filtration, and proprietary devices.",
  },
  {
    id: "bmps.sizing",
    title: "Facility Sizing and Design Criteria",
    level: 2,
    parent_id: "bmps",
    topic_tags: ["bmp_sizing", "water_quality"],
    toc_patterns: [/sizing/i, /design criteria/i, /bioretention/i, /pond/i, /permeable/i],
    regional_notes: ["cold_climate", "arid_west"],
    summary: "Geometry, media, drawdown, setbacks, and underdrain requirements by practice type.",
  },
  {
    id: "bmps.manufactured",
    title: "Manufactured / Proprietary Treatment Devices",
    level: 2,
    parent_id: "bmps",
    topic_tags: ["bmp_sizing"],
    toc_patterns: [/manufactured/i, /proprietary/i, /mtd/i, /vendor/i, /clearinghouse/i],
    regional_notes: [],
    summary: "Approval lists, verification programs, and when MTDs may substitute for GI.",
  },
  {
    id: "construction-esc",
    title: "Construction Stormwater and ESC",
    level: 1,
    parent_id: null,
    topic_tags: ["construction_esc"],
    toc_patterns: [/erosion/i, /sediment/i, /\besc\b/i, /construction/i, /swppp/i],
    regional_notes: [],
    summary:
      "Temporary controls during construction; often in separate manuals from post-construction.",
  },
  {
    id: "om",
    title: "Inspection, Operations, and Maintenance",
    level: 1,
    parent_id: null,
    topic_tags: ["om"],
    toc_patterns: [/maintenance/i, /inspection/i, /operation/i, /\bo\s*&\s*m\b/i],
    regional_notes: [],
    summary: "Long-term O&M obligations, inspection frequency, and enforcement hooks.",
  },
  {
    id: "regional",
    title: "Regional and Site Constraints",
    level: 1,
    parent_id: null,
    topic_tags: ["hydrology", "bmp_sizing"],
    toc_patterns: [/cold climate/i, /arid/i, /karst/i, /coastal/i, /high groundwater/i],
    regional_notes: ["arid_west", "cold_climate", "karst", "coastal"],
    summary:
      "Where national defaults must fork: climate, soils, geology, and receiving-water sensitivity.",
  },
  {
    id: "submittals",
    title: "Plan Submittal, Review, and Variances",
    level: 1,
    parent_id: null,
    topic_tags: ["general"],
    toc_patterns: [/submittal/i, /plan review/i, /variance/i, /special circumstance/i],
    regional_notes: [],
    summary: "Documentation expected for approval and paths for alternatives.",
  },
];

function countTopics(
  items: Array<{ structure: CorpusStructure }>
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const { structure } of items) {
    for (const t of structure.topics_present) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return counts;
}

function countTocMatches(
  items: Array<{ structure: CorpusStructure }>,
  patterns: RegExp[]
): number {
  let n = 0;
  for (const { structure } of items) {
    const hit = structure.toc.some((entry) =>
      patterns.some((p) => p.test(entry.title))
    );
    if (hit) n += 1;
  }
  return n;
}

export function buildHeuristicOutline(
  items: Array<{ slug: string; structure: CorpusStructure }>
): NationalOutline {
  const n = Math.max(items.length, 1);
  const topicCounts = countTopics(items);

  const sections = SECTION_DEFS.map((def) => {
    const tagHits = def.topic_tags.reduce(
      (sum, tag) => sum + (topicCounts.get(tag) ?? 0),
      0
    );
    const tocHits = countTocMatches(items, def.toc_patterns);
    const source_manual_count = Math.max(tocHits, Math.min(n, Math.round(tagHits / Math.max(def.topic_tags.length, 1))));
    const prevalence = Math.min(
      1,
      Math.max(tocHits / n, tagHits / (n * Math.max(def.topic_tags.length, 1)) * 0.5)
    );

    return {
      id: def.id,
      title: def.title,
      level: def.level,
      parent_id: def.parent_id,
      prevalence: Math.round(prevalence * 100) / 100,
      topic_tags: def.topic_tags,
      source_manual_count,
      regional_notes: def.regional_notes,
      summary: def.summary,
    };
  });

  return {
    version: 1,
    title:
      "U.S. Stormwater Practice Synthesis — Research Outline",
    generated_at: new Date().toISOString(),
    model: "heuristic",
    sections,
  };
}
