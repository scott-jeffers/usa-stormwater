import type { Metadata } from "next";
import { getNationalReaderIndex } from "@/lib/national";
import { getAllPracticeSyntheses } from "@/lib/practices";
import { getPipelineStatusSummary } from "@/lib/pipeline/statusSummary";
import { NationalDraftExplorer } from "@/components/NationalDraftExplorer";
import { NationalPipelineProgress } from "@/components/NationalPipelineProgress";

export const metadata: Metadata = {
  title: "U.S. Stormwater Practice Synthesis",
  description:
    "Research synthesis of common U.S. post-construction stormwater criteria from atlas manuals — not a design manual or adopted practice.",
};

function searchSnippet(text: string | null | undefined, max = 200): string {
  if (!text) return "";
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned.toLowerCase();
  return cleaned.slice(0, max).toLowerCase();
}

export default function NationalIndexPage() {
  const { outline, sections } = getNationalReaderIndex();
  const pipelineStatus = getPipelineStatusSummary();

  if (!outline && sections.length === 0) {
    return (
      <main className="space-y-6">
        <h1 className="font-display text-3xl font-semibold text-ink">
          U.S. Stormwater Practice Synthesis
        </h1>
        <p className="text-fg-secondary">
          No outline or draft sections found yet. Run{" "}
          <code className="rounded bg-mist px-1.5 py-0.5 text-water-deep">
            npm run pipeline:outline
          </code>{" "}
          and{" "}
          <code className="rounded bg-mist px-1.5 py-0.5 text-water-deep">
            npm run pipeline:draft
          </code>
          .
        </p>
        <NationalPipelineProgress status={pipelineStatus} />
      </main>
    );
  }

  return (
    <main>
      <NationalDraftExplorer
        outlineTitle={
          outline?.title ?? "U.S. Stormwater Practice Synthesis (research draft)"
        }
        generatedAt={outline?.generated_at ?? null}
        model={outline?.model ?? null}
        pipelineStatus={pipelineStatus}
        practiceCount={getAllPracticeSyntheses().length}
        sections={sections.map((s) => ({
          id: s.id,
          title: s.title,
          level: s.level,
          parent_id: s.parent_id,
          prevalence: s.prevalence,
          summary: s.summary,
          has_draft: s.has_draft,
          editorial_status: s.editorial_status,
          citation_count: s.citation_count,
          // Short snippet only — avoid shipping full draft prose to the client.
          searchText: [
            s.title,
            s.summary,
            searchSnippet(s.draft?.practice_survey),
            searchSnippet(s.draft?.draft_recommendation),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase(),
        }))}
      />
    </main>
  );
}
