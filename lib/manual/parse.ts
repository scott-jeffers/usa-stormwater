/**
 * Parser for the model manual source (content/manual/model-manual.md).
 *
 * The file is plain Markdown with three conventions:
 *   **3.2 Title.** [Default, E1] text     a numbered clause with tag and grade
 *   - **6.1.1** [Open, E1] text           a numbered sub-clause in a list
 *   > Why: text                           rationale for the clause above it
 * The manual is the single source of truth; the site renders it at /manual/.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

export type Tag = "Default" | "Regional" | "Open";
export type Grade = "E0" | "E1" | "E2" | "E3";

export interface Clause {
  number: string;
  title?: string;
  tags: Tag[];
  grade?: Grade;
  thin?: boolean;
  text: string;
}

export type Block =
  | { kind: "p"; text: string; clause?: Clause }
  | { kind: "list"; ordered: boolean; items: Array<{ text: string; clause?: Clause }> }
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "code"; text: string }
  | { kind: "why"; text: string; for?: string };

export interface Section {
  id: string;
  number?: string;
  title: string;
  blocks: Block[];
}

export interface Manual {
  title: string;
  version: string;
  date: string;
  status: string;
  sections: Section[];
  clauses: Clause[];
}

const CLAUSE = /^\*\*(\d+(?:\.\d+)+)(?:\s+([^*]+?))?\.?\*\*\s*(?:\[([^\]]+)\])?\s*(.*)$/;

export const clauseId = (n: string) => `c-${n.replace(/\./g, "-")}`;

function parseClause(line: string): Clause | undefined {
  const m = CLAUSE.exec(line.trim());
  if (!m) return undefined;
  const [, number, title, tagStr, rest] = m;
  const parts = (tagStr ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const tags = parts.filter((p): p is Tag => p === "Default" || p === "Regional" || p === "Open");
  const g = parts.map((p) => /^(E[0-3])(\s*\(thin\))?$/.exec(p)).find(Boolean);
  return {
    number: number!,
    title: title?.replace(/\.$/, "").trim() || undefined,
    tags,
    grade: g ? (g[1] as Grade) : undefined,
    thin: g ? Boolean(g[2]) : undefined,
    text: rest ?? "",
  };
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function parseManual(src: string): Manual {
  const fm: Record<string, string> = {};
  let body = src.replace(/\r\n/g, "\n");
  const f = /^---\n([\s\S]*?)\n---\n/.exec(body);
  if (f) {
    for (const l of f[1]!.split("\n")) {
      const i = l.indexOf(":");
      if (i > 0) fm[l.slice(0, i).trim()] = l.slice(i + 1).trim();
    }
    body = body.slice(f[0].length);
  }
  const sections: Section[] = [];
  const clauses: Clause[] = [];
  let cur: Section | undefined;
  let lastClause: string | undefined;
  const lines = body.split("\n");
  const push = (b: Block) => cur?.blocks.push(b);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (!line.trim()) continue;
    const h = /^##\s+(.*)$/.exec(line);
    if (h) {
      const t = h[1]!.trim();
      const n = /^(\d+)\s+(.*)$/.exec(t);
      cur = { id: n ? `s-${n[1]}` : slug(t), number: n?.[1], title: n ? n[2]! : t, blocks: [] };
      sections.push(cur);
      lastClause = undefined;
      continue;
    }
    if (line.startsWith("```")) {
      const buf: string[] = [];
      while (++i < lines.length && !lines[i]!.startsWith("```")) buf.push(lines[i]!);
      push({ kind: "code", text: buf.join("\n") });
      continue;
    }
    if (line.startsWith("> ")) {
      // "> Why (6.0.1): ..." names its clause; "> Why: ..." belongs to the clause just above,
      // unless that clause was inside a list (then the rationale is for the group).
      const w = /^Why(?:\s*\(([^)]+)\))?:\s*/.exec(line.slice(2));
      const prev = cur?.blocks[cur.blocks.length - 1];
      const target = w?.[1] ?? (prev?.kind === "list" ? undefined : lastClause);
      push({ kind: "why", text: line.slice(2).slice(w?.[0].length ?? 0), for: target });
      continue;
    }
    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i]!.startsWith("|")) {
        rows.push(lines[i]!.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
        i++;
      }
      i--;
      const [head, , ...rest] = rows;
      push({ kind: "table", head: head ?? [], rows: rest });
      continue;
    }
    const li = /^(-|\d+\.)\s+(.*)$/;
    if (li.test(line)) {
      const ordered = /^\d+\./.test(line);
      const items: Array<{ text: string; clause?: Clause }> = [];
      while (i < lines.length && li.test(lines[i]!)) {
        const t = li.exec(lines[i]!)![2]!;
        const c = parseClause(t);
        if (c) {
          clauses.push(c);
          lastClause = c.number;
        }
        items.push({ text: t, clause: c });
        i++;
      }
      i--;
      push({ kind: "list", ordered, items });
      continue;
    }
    const c = parseClause(line);
    if (c) {
      clauses.push(c);
      lastClause = c.number;
    }
    push({ kind: "p", text: line, clause: c });
  }
  return {
    title: fm.title ?? "Model manual",
    version: fm.version ?? "",
    date: fm.date ?? "",
    status: fm.status ?? "",
    sections,
    clauses,
  };
}

export const MANUAL_FILE = path.resolve(process.cwd(), "content/manual/model-manual.md");

export function loadManual(): Manual {
  return parseManual(readFileSync(MANUAL_FILE, "utf-8"));
}
