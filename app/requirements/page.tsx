import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/site";
import { CRITERIA, GROUPS, allRequirementValues, statsOf, fmtValue, fmtRange } from "@/lib/requirements";
import { SearchMeta } from "@/components/SiteSearch";

export const metadata: Metadata = pageMeta(
  "/requirements/",
  "Requirements",
  "Every numeric stormwater design requirement the Atlas tracks, with the national range, the most common value and the source quote for each manual."
);

export default function RequirementsIndex() {
  const all = allRequirementValues();
  return (
    <main className="w-data mx-auto space-y-10">
      <SearchMeta type="Resource" />
      <header className="w-read space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Requirements</h1>
        <p className="text-fg-secondary">
          Each line is one design requirement, read from the manuals themselves. The most common value counts each manual once, and only manuals that
          set their own rules. Open a requirement to see every value, the quote and page it came from, and a map.
        </p>
      </header>
      {GROUPS.map((g) => {
        const cs = CRITERIA.filter((c) => c.group === g);
        return (
          <section key={g} aria-labelledby={`g-${g}`} className="space-y-3">
            <h2 id={`g-${g}`} className="text-lg font-semibold text-ink">{g}</h2>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-[34%]">Requirement</th>
                    <th className="text-right">Most common</th>
                    <th className="text-right">Range</th>
                    <th className="text-right">Manuals</th>
                    <th className="text-right">States</th>
                    <th>Model manual</th>
                  </tr>
                </thead>
                <tbody>
                  {cs.map((c) => {
                    const s = statsOf(all.get(c.key) ?? []);
                    return (
                      <tr key={c.key}>
                        <td>
                          <Link href={`/requirements/${c.key}/`} className="font-medium text-water-link hover:underline">{c.label}</Link>
                          <div className="text-xs text-fg-muted">{c.means}</div>
                        </td>
                        <td className="num whitespace-nowrap text-right font-medium">
                          {s ? fmtValue(s.mode, c.unit) : "—"}
                          {s ? <div className="text-xs font-normal text-fg-muted">{s.modeCount} of {s.n}</div> : null}
                        </td>
                        <td className="num whitespace-nowrap text-right text-fg-secondary">{s ? fmtRange(s.min, s.max, c.unit) : "—"}</td>
                        <td className="num text-right">{s?.n ?? 0}</td>
                        <td className="num text-right">{s?.states ?? 0}</td>
                        <td className="whitespace-nowrap">
                          {c.clause ? <Link href={`/manual/#c-${c.clause.replace(/\./g, "-")}`} className="text-water-link hover:underline">§{c.clause}</Link> : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
      <p className="w-read text-sm text-fg-muted">
        All values are in the open dataset: <Link href="/data/" className="text-water-link underline">download values.csv and the data dictionary</Link>.
      </p>
    </main>
  );
}
