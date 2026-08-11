/**
 * Offline section drafting from atlas stats + citation picker (no API).
 */
import type {
  CorpusChunk,
  DraftSection,
  NationalOutline,
} from "../../lib/pipeline/types";
import {
  buildPracticeSurveyFromStats,
  computeAtlasStats,
} from "./atlasStats";
import {
  pickCitations,
  type RetrievedChunk,
} from "./citationPicker";
import { useHeuristicLlm } from "./corpusHeuristic";

export { useHeuristicLlm };

type Retrieved = { slug: string; chunk: CorpusChunk; score?: number };

export function buildHeuristicDraft(opts: {
  section: NationalOutline["sections"][number];
  retrieved: Retrieved[];
  /** When true, skip overwriting editorial_status reviewed (caller handles). */
  preserveEditorial?: boolean;
}): DraftSection {
  const atlas = computeAtlasStats();
  const sectionStats = atlas.forSection(opts.section);
  const practice_survey = buildPracticeSurveyFromStats({
    section: opts.section,
    stats: sectionStats,
  });

  const candidates: RetrievedChunk[] = opts.retrieved.map((r) => ({
    slug: r.slug,
    chunk: r.chunk,
    score: r.score ?? 0,
  }));

  const picked = pickCitations({
    section: opts.section,
    candidates,
    maxTotal: 22,
    maxPerSlug: 2,
    minStates: 8,
  });

  const supporting_slugs = [...new Set(picked.map((c) => c.slug))];
  const citations = picked.map(({ slug, chunk_id, page_or_section, excerpt }) => ({
    slug,
    chunk_id,
    page_or_section,
    excerpt,
  }));

  const regional =
    (opts.section.regional_notes ?? []).join(", ") || "none flagged";

  const draft_recommendation = [
    `[DRAFT RECOMMENDATION — national manual draft, not adopted practice]`,
    `For “${opts.section.title}”, a national manual should:`,
    `(1) State the design purpose explicitly (e.g., water quality vs channel protection vs flood control) before specifying numeric criteria;`,
    `(2) Present a default national approach grounded in common U.S. manual practice, with footnotes to supporting jurisdictions;`,
    `(3) Provide regional alternatives where climate, soils, or MS4 permits diverge (${regional});`,
    `(4) Require designers to cite the controlling state/local manual where it is more stringent.`,
    `Numeric criteria in this draft remain placeholders until engineer review against the cited excerpts below.`,
  ].join(" ");

  const regional_variants = opts.section.regional_notes?.length
    ? `Regional forks to consider: ${opts.section.regional_notes.join(", ")}. Arid and cold-climate manuals often adjust capture volumes, infiltration feasibility, and freeze-thaw detailing; coastal and karst settings may restrict certain BMPs.`
    : null;

  const open_issues = [
    "Citations are automatic Tier-A-weighted excerpts and need engineer verification against source PDFs.",
    "Atlas field prevalence is measured from structured extractions; chapter-only proxies can still skew topic tags.",
    "Decide which numeric defaults (if any) belong in a national MOP versus guidance-only alternatives.",
  ].join(" ");

  return {
    section_id: opts.section.id,
    title: opts.section.title,
    generated_at: new Date().toISOString(),
    model: "heuristic",
    editorial_status: "draft",
    practice_survey,
    draft_recommendation,
    regional_variants,
    open_issues,
    citations,
    supporting_slugs,
  };
}
