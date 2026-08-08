import { getAllManuals } from "@/lib/data";
import { ManualsExplorer } from "@/components/ManualsExplorer";

export default function HomePage() {
  const manuals = getAllManuals();

  const statesCovered = new Set(
    manuals
      .map((m) => m.data.document_metadata.state_code)
      .filter((code): code is string => Boolean(code))
  ).size;

  const needsReviewCount = manuals.filter(
    (m) => m.data.extraction_quality.needs_human_review
  ).length;

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          USA Stormwater Manual Extractor
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          A one-stop shop for U.S. stormwater design manual requirements,
          extracted from source documents with cited evidence for every
          field.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Manuals ingested" value={manuals.length} />
        <StatCard label="States covered" value={statesCovered} />
        <StatCard
          label="Needing human review"
          value={needsReviewCount}
          tone={needsReviewCount > 0 ? "warning" : "default"}
        />
      </div>

      <ManualsExplorer manuals={manuals} />
    </main>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div
        className={`text-2xl font-semibold ${
          tone === "warning" && value > 0 ? "text-orange-600" : "text-slate-900"
        }`}
      >
        {value}
      </div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}
