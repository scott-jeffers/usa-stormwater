import { test } from "node:test";
import assert from "node:assert/strict";
import { loadManual, parseManual } from "../lib/manual/parse";
import { CRITERION_CLAUSE, loadCriteria } from "../lib/national/modelManual";
import { csvCell } from "../scripts/export-research";
import { parseCsv } from "../components/ValuesTable";

test("parses numbered clauses with tags, grades and rationale", () => {
  const m = parseManual("---\ntitle: T\nversion: V\n---\n## 3 Std\n\n**3.2 WQ.** [Default, E1] Text **bold**.\n\n> Why: because.\n\n- **6.0.1 Max.** [Open, E1 (thin)] Drain.\n");
  assert.equal(m.title, "T");
  assert.equal(m.sections[0]!.number, "3");
  assert.deepEqual(m.clauses.map((c) => c.number), ["3.2", "6.0.1"]);
  assert.deepEqual(m.clauses[0]!.tags, ["Default"]);
  assert.equal(m.clauses[0]!.grade, "E1");
  assert.equal(m.clauses[1]!.thin, true);
  const why = m.sections[0]!.blocks.find((b) => b.kind === "why");
  assert.ok(why && why.kind === "why" && why.for === "3.2");
});

test("the real manual: unique clause numbers, every criterion's clause exists and is E1", () => {
  const m = loadManual();
  const nums = m.clauses.map((c) => c.number);
  assert.equal(new Set(nums).size, nums.length, "duplicate clause numbers");
  for (const [k, n] of Object.entries(CRITERION_CLAUSE)) {
    const c = m.clauses.find((x) => x.number === n);
    assert.ok(c, `clause ${n} for ${k} missing`);
    const crit = loadCriteria()?.criteria.find((x) => x.key === k);
    if (crit && crit.class !== "insufficient") assert.equal(c!.grade, "E1", `${n} should be E1`);
  }
});

test("CSV cells round-trip through the parser", () => {
  const cells = ["a", 'he said "hi"', "x, y", "line\nbreak", [1, 2]];
  const line = cells.map(csvCell).join(",");
  assert.deepEqual(parseCsv(line + "\n")[0], ["a", 'he said "hi"', "x, y", "line\nbreak", "1; 2"]);
});
