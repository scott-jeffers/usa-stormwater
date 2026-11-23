import Link from "next/link";
import type { ReactNode } from "react";
import { clauseId, type Block, type Clause } from "@/lib/manual/parse";

/** Minimal inline Markdown: **bold**, *italic*, `code`, [text](url). */
export function inline(text: string, key = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${n++}`;
    if (m[1] != null) out.push(<strong key={k} className="font-semibold text-foreground">{inline(m[1], k)}</strong>);
    else if (m[2] != null) out.push(<em key={k}>{inline(m[2], k)}</em>);
    else if (m[3] != null) out.push(<code key={k} className="rounded bg-surface-muted px-1 text-[0.9em]">{m[3]}</code>);
    else {
      const href = m[5]!;
      out.push(
        href.startsWith("/") ? (
          <Link key={k} href={href} className="text-water-link underline underline-offset-2 hover:decoration-2">{m[4]}</Link>
        ) : (
          <a key={k} href={href} className="text-water-link underline underline-offset-2 hover:decoration-2">{m[4]}</a>
        )
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export const TAG_STYLE: Record<string, string> = {
  Default: "status-neutral",
  Regional: "status-regional",
  Open: "status-open",
};
export const GRADE_STYLE: Record<string, string> = {
  E1: "status-strong",
  E2: "status-good",
  E3: "status-neutral",
  E0: "status-placeholder",
};
export const GRADE_MEANING: Record<string, string> = {
  E1: "Read by hand in state manuals",
  E2: "Machine-checked atlas values",
  E3: "How often manuals state the rule",
  E0: "Placeholder: no atlas evidence yet",
};

export function Chip({ kind, label, title }: { kind: string; label: string; title?: string }) {
  return (
    <span title={title} className={`status-chip ${kind}`}>
      {label}
    </span>
  );
}

function ClauseHead({ c }: { c: Clause }) {
  return (
    <>
      <a href={`#${clauseId(c.number)}`} className="clause-num" aria-label={`Clause ${c.number}`}>
        {c.number}
      </a>{" "}
      {c.title ? <strong className="font-semibold text-foreground">{c.title}.</strong> : null}{" "}
      {c.tags.map((t) => (
        <Chip key={t} kind={TAG_STYLE[t]!} label={t} />
      ))}
      {c.grade ? (
        <Chip kind={GRADE_STYLE[c.grade]!} label={c.thin ? `${c.grade} thin` : c.grade} title={GRADE_MEANING[c.grade]} />
      ) : null}{" "}
    </>
  );
}

export function ManualBlock({ b, k }: { b: Block; k: string }) {
  switch (b.kind) {
    case "p":
      return b.clause ? (
        <p id={clauseId(b.clause.number)} className="clause scroll-mt-20">
          <ClauseHead c={b.clause} />
          {inline(b.clause.text, k)}
        </p>
      ) : (
        <p>{inline(b.text, k)}</p>
      );
    case "list": {
      const Tag = b.ordered ? "ol" : "ul";
      return (
        <Tag className={b.ordered ? "list-decimal space-y-1 pl-6" : b.items.some((x) => x.clause) ? "space-y-2" : "list-disc space-y-1 pl-6"}>
          {b.items.map((it, i) =>
            it.clause ? (
              <li key={i} id={clauseId(it.clause.number)} className="clause scroll-mt-20 list-none">
                <ClauseHead c={it.clause} />
                {inline(it.clause.text, `${k}-${i}`)}
              </li>
            ) : (
              <li key={i}>{inline(it.text, `${k}-${i}`)}</li>
            )
          )}
        </Tag>
      );
    }
    case "table":
      return (
        <div className="overflow-x-auto" tabIndex={0}>
          <table className="data-table">
            <thead>
              <tr>{b.head.map((h, i) => <th key={i}>{inline(h, `${k}-h${i}`)}</th>)}</tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j}>{inline(c, `${k}-${i}-${j}`)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "code":
      return <pre tabIndex={0} className="overflow-x-auto rounded-md bg-surface-muted px-4 py-3 font-mono text-sm text-foreground">{b.text}</pre>;
    case "why":
      return (
        <p className="why">
          <span className="why-label">Rationale{b.for ? ` · ${b.for}` : ""}</span> {inline(b.text, k)}
        </p>
      );
  }
}
