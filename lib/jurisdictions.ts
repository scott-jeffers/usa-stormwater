import { getManualListItems } from "@/lib/data";
import { allRequirementValues } from "@/lib/requirements";
import type { JurisdictionRow } from "@/components/JurisdictionsExplorer";

/** One row per jurisdiction record, with how many requirement values it carries. */
export function jurisdictionRows(): JurisdictionRow[] {
  const perSlug = new Map<string, number>();
  for (const vs of allRequirementValues().values()) for (const v of vs) perSlug.set(v.slug, (perSlug.get(v.slug) ?? 0) + 1);
  return getManualListItems().map((m) => ({
    slug: m.slug,
    name: m.jurisdiction_name,
    level: m.jurisdiction_level,
    state: m.state_code,
    title: m.document_title,
    basis: m.coverage_basis,
    revised: m.revisedAt,
    values: perSlug.get(m.slug) ?? 0,
    pdf: m.document_url,
  }));
}
