import type { PipelineStatusSummary } from "@/lib/pipeline/statusSummary";

const PROCESS_STEPS = [
  {
    id: "prepare",
    title: "Prepare",
    blurb: "Queue each jurisdiction PDF and normalize job metadata.",
  },
  {
    id: "corpus",
    title: "Corpus",
    blurb:
      "Extract full text into pages, structure, chunks, and topic tags — the evidence base for the national draft.",
  },
  {
    id: "extract",
    title: "Extract",
    blurb:
      "Fill the atlas JSON fields (design storms, WQv, BMPs, etc.) with cited excerpts.",
  },
  {
    id: "verify",
    title: "Verify",
    blurb: "Cross-check extracted fields against corpus chunks.",
  },
  {
    id: "outline",
    title: "Outline",
    blurb:
      "Synthesize a research outline of chapters from tagged corpus coverage.",
  },
  {
    id: "draft",
    title: "Draft",
    blurb:
      "Write practice survey + recommendation prose for each outline section, with citations.",
  },
] as const;

function pct(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

function statusLabel(status: string): string {
  if (status === "done") return "Done";
  if (status === "running") return "Running";
  if (status === "failed") return "Failed";
  if (status === "skipped") return "Skipped";
  return "Pending";
}

function statusClass(status: string): string {
  if (status === "done") return "text-water-deep";
  if (status === "running") return "text-amber-800 dark:text-amber-300";
  if (status === "failed") return "text-red-700 dark:text-red-400";
  return "text-fg-muted";
}

function StageBar({
  label,
  counts,
  total,
  doneLabel = "done",
}: {
  label: string;
  counts: PipelineStatusSummary["stages"]["corpus"];
  total: number;
  doneLabel?: string;
}) {
  const doneShare = pct(counts.done, total);
  const failedShare = pct(counts.failed, total);
  const skippedShare = pct(counts.skipped, total);
  const runningShare = pct(counts.running, total);
  const pendingShare = Math.max(
    0,
    100 - doneShare - failedShare - skippedShare - runningShare
  );

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-ink">{label}</span>
        <span className="font-mono text-xs text-fg-muted">
          {counts.done}/{total} {doneLabel}
          {counts.failed > 0 ? ` · ${counts.failed} failed` : ""}
          {counts.pending > 0 ? ` · ${counts.pending} pending` : ""}
          {counts.skipped > 0 ? ` · ${counts.skipped} skipped` : ""}
        </span>
      </div>
      <div
        className="flex h-2 overflow-hidden rounded-full bg-surface-muted"
        role="img"
        aria-label={`${label}: ${counts.done} of ${total} ${doneLabel}${counts.failed > 0 ? `, ${counts.failed} failed` : ""}`}
      >
        {doneShare > 0 && (
          <span className="bg-water" style={{ width: `${doneShare}%` }} />
        )}
        {runningShare > 0 && (
          <span className="bg-amber-400" style={{ width: `${runningShare}%` }} />
        )}
        {failedShare > 0 && (
          <span className="bg-red-400" style={{ width: `${failedShare}%` }} />
        )}
        {skippedShare > 0 && (
          <span className="bg-edge-strong" style={{ width: `${skippedShare}%` }} />
        )}
        {pendingShare > 0 && (
          <span
            className="bg-surface-muted"
            style={{ width: `${pendingShare}%` }}
          />
        )}
      </div>
    </div>
  );
}

export function NationalPipelineProgress({
  status,
}: {
  status: PipelineStatusSummary | null;
}) {
  const total = status?.jobCount ?? 0;

  return (
    <section className="space-y-5 p-5 sm:p-6">
      <div className="space-y-2">
        <p className="max-w-2xl text-sm leading-relaxed text-fg-secondary">
          Manuals in this atlas are ingested into a searchable corpus; outline
          and chapter drafts are written from Tier A anchors and atlas field
          statistics. Progress below is snapshotted at site build time.
        </p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PROCESS_STEPS.map((step, i) => (
          <li key={step.id} className="text-sm">
            <p className="font-medium text-ink">
              <span className="mr-1.5 font-mono text-xs text-fg-subtle">
                {i + 1}.
              </span>
              {step.title}
            </p>
            <p className="mt-1 leading-relaxed text-fg-secondary">{step.blurb}</p>
          </li>
        ))}
      </ol>

      {!status ? (
        <p className="text-sm text-fg-muted">
          No pipeline progress file found yet. Run{" "}
          <code className="rounded bg-mist px-1.5 py-0.5 text-water-deep">
            npm run pipeline:status
          </code>{" "}
          after starting the pipeline.
        </p>
      ) : (
        <div className="space-y-4 border-t border-edge pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-lg font-semibold text-ink">
              Current pipeline status
            </h3>
            <p className="text-xs text-fg-muted">
              {total} jobs · updated{" "}
              {status.updatedAt
                ? new Date(status.updatedAt).toLocaleString()
                : "—"}
            </p>
          </div>

          <div className="space-y-3">
            <StageBar
              label="Prepare"
              counts={status.stages.prepare}
              total={total}
            />
            <StageBar
              label="Corpus (full text)"
              counts={status.stages.corpus}
              total={total}
            />
            <StageBar
              label="Extract (atlas fields)"
              counts={status.stages.extract}
              total={total}
            />
            <StageBar
              label="Verify (citations)"
              counts={status.stages.verify}
              total={total}
              doneLabel="passed"
            />
            <StageBar
              label="Tier A verify"
              counts={status.tierAVerify}
              total={status.tierAVerify.total}
              doneLabel="passed"
            />
          </div>

          <p className="text-xs text-fg-muted">
            Verify bars: green = excerpts found in corpus, red = citation
            mismatches. Tier A is the ~76-manual evidence core for national
            citations. See{" "}
            <code className="rounded bg-mist px-1 text-water-deep">
              data/pipeline/VERIFY.md
            </code>{" "}
            for the field histogram.
          </p>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <p>
              <span className="text-fg-muted">Outline: </span>
              <span className={`font-medium ${statusClass(status.outline.status)}`}>
                {statusLabel(status.outline.status)}
              </span>
            </p>
            <p>
              <span className="text-fg-muted">Draft sections: </span>
              <span className={`font-medium ${statusClass(status.draft.status)}`}>
                {status.draft.done}/{status.draft.total}{" "}
                {statusLabel(status.draft.status).toLowerCase()}
              </span>
            </p>
            <p>
              <span className="text-fg-muted">Editorial review: </span>
              <span className="font-medium text-ink">
                {status.draft.reviewed}/{status.draft.total} reviewed
              </span>
            </p>
          </div>

          {status.failed.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-ink">
                Failed manuals ({status.failed.length})
              </p>
              <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-fg-secondary">
                {status.failed.map((f) => (
                  <li key={`${f.id}-${f.stage}`} className="font-mono">
                    {f.id}
                    <span className="text-fg-subtle"> — {f.stage}</span>
                    {f.error ? (
                      <span className="text-fg-muted">: {f.error}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
