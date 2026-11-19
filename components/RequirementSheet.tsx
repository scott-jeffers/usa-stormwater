import Link from "next/link";
import { CRITERIA, GROUPS, allRequirementValues, statsOf, fmtValue, type RequirementValue } from "@/lib/requirements";

const CHECK_NOTE: Record<string, string> = {
  verified: "quote and value found in PDF",
  hand: "read by hand",
  value_not_stated: "value not in the quote",
  not_found: "quote not found in PDF",
  unverifiable: "PDF text unreadable",
  no_quote: "no quote",
  unchecked: "unchecked",
};

/**
 * The record's numbers first: each requirement this manual states, beside the
 * national most-common value and the model-manual clause.
 */
export function RequirementSheet({ slugs, name }: { slugs: string[]; name: string }) {
  const all = allRequirementValues();
  const rows: Array<{ key: string; v: RequirementValue }> = [];
  for (const c of CRITERIA) {
    const vs = all.get(c.key) ?? [];
    const hit = slugs.map((s) => vs.find((v) => v.slug === s)).find(Boolean);
    if (hit) rows.push({ key: c.key, v: hit });
  }
  if (!rows.length) {
    return (
      <section aria-labelledby="req" className="space-y-2">
        <h2 id="req" className="text-lg font-semibold text-ink">Requirements</h2>
        <p className="text-sm text-fg-muted">
          None of the {CRITERIA.length} tracked requirements has been read from this manual yet. The design criteria found in it are listed below.
        </p>
      </section>
    );
  }
  return (
    <section aria-labelledby="req" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="req" className="text-lg font-semibold text-ink">Requirements</h2>
        <p className="text-sm text-fg-muted">{rows.length} of {CRITERIA.length} tracked requirements stated in {name}&rsquo;s manual</p>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Requirement</th>
              <th className="text-right">This manual</th>
              <th className="text-right">Most common nationally</th>
              <th>Source</th>
              <th>Model manual</th>
            </tr>
          </thead>
          {GROUPS.map((g) => {
            const gr = rows.filter((r) => CRITERIA.find((c) => c.key === r.key)!.group === g);
            if (!gr.length) return null;
            return (
              <tbody key={g}>
                <tr>
                  <th colSpan={5} scope="colgroup" className="bg-surface-muted text-xs font-semibold uppercase tracking-wide text-fg-muted">{g}</th>
                </tr>
                {gr.map(({ key, v }) => {
                  const c = CRITERIA.find((x) => x.key === key)!;
                  const s = statsOf(all.get(key) ?? []);
                  const diff = s ? (v.value === s.mode ? "same" : v.value > s.mode ? "higher" : "lower") : null;
                  const pageNum = typeof v.page === "number" ? v.page : Number(String(v.page ?? "").match(/\d+/)?.[0]);
                  return (
                    <tr key={key} className="align-top">
                      <td className="min-w-[12rem]">
                        <Link href={`/requirements/${key}/`} className="font-medium text-water-link hover:underline">{c.label}</Link>
                      </td>
                      <td className="whitespace-nowrap text-right">
                        <span className="num font-semibold text-ink">{fmtValue(v.value, c.unit)}</span>
                        {v.qualifier && v.qualifier !== "design" ? <span className="ml-1 text-xs text-fg-muted">{v.qualifier}</span> : null}
                        {v.basisNote === "runoff" ? <div className="text-xs text-fg-muted">of runoff</div> : null}
                      </td>
                      <td className="whitespace-nowrap text-right">
                        {s ? (
                          <>
                            <span className="num">{fmtValue(s.mode, c.unit)}</span>
                            <div className={`text-xs ${diff === "same" ? "text-fg-muted" : "font-medium text-fg-secondary"}`}>
                              {diff === "same" ? "same" : `this is ${diff}`} · {s.n} manuals
                            </div>
                          </>
                        ) : "—"}
                      </td>
                      <td className="min-w-[16rem] max-w-lg text-sm">
                        {v.quote ? (
                          <details>
                            <summary className="cursor-pointer text-fg-secondary"><span className="line-clamp-1 inline">“{v.quote}”</span></summary>
                            <p className="mt-1 text-fg-secondary">“{v.quote}”</p>
                          </details>
                        ) : <span className="text-fg-faint">No quote</span>}
                        <div className="text-xs text-fg-muted">
                          {v.pdf && Number.isFinite(pageNum) ? <a href={`${v.pdf}#page=${pageNum}`} target="_blank" rel="noreferrer" className="font-medium text-water-link hover:underline">PDF p. {pageNum} ↗</a> : null}
                          {v.pdf && Number.isFinite(pageNum) ? " · " : ""}
                          {CHECK_NOTE[v.check] ?? v.check}
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        {c.clause ? <Link href={`/manual/#c-${c.clause.replace(/\./g, "-")}`} className="text-water-link hover:underline">§{c.clause}</Link> : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            );
          })}
        </table>
      </div>
    </section>
  );
}
