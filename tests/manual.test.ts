import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadManual, parseManual } from "../lib/manual/parse";
import { CONV_CRITERION_CLAUSE, CRITERION_CLAUSE, DET_CRITERION_CLAUSE, ESC_CRITERION_CLAUSE, HYD_CRITERION_CLAUSE, loadConvCriteria, loadHydCriteria, loadCriteria, loadDetCriteria, loadEscCriteria } from "../lib/national/modelManual";
import { csvCell } from "../scripts/export-research";
import { parseCsv } from "../components/ValuesTable";

test("the downloadable PDF was made from the current manual version (run npm run build && npm run manual:pdf)", () => {
  const rec = JSON.parse(readFileSync("public/downloads/model-manual.json", "utf-8")) as { version: string; pages: number };
  assert.equal(rec.version, loadManual().version);
  assert.ok(rec.pages > 10);
});

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
  for (const [k, n] of Object.entries(ESC_CRITERION_CLAUSE)) {
    const c = m.clauses.find((x) => x.number === n);
    assert.ok(c, `Part B clause ${n} for ${k} missing`);
    assert.equal(c!.grade, "E1", `${n} should be E1`);
    assert.ok(loadEscCriteria()?.criteria.some((x) => x.key === k), `${k} missing from esc-classification.json`);
  }
  for (const [map, load, name] of [[DET_CRITERION_CLAUSE, loadDetCriteria, "det"], [CONV_CRITERION_CLAUSE, loadConvCriteria, "conv"], [HYD_CRITERION_CLAUSE, loadHydCriteria, "hyd"]] as const) {
    for (const [k, n] of Object.entries(map)) {
      const c = m.clauses.find((x) => x.number === n);
      assert.ok(c, `${name} clause ${n} for ${k} missing`);
      if (name !== "det") assert.equal(c!.grade, "E1", `${n} should be E1`);
      assert.ok(load()?.criteria.some((x) => x.key === k), `${k} missing from ${name}-classification.json`);
    }
  }
});

test("CSV cells round-trip through the parser", () => {
  const cells = ["a", 'he said "hi"', "x, y", "line\nbreak", [1, 2]];
  const line = cells.map(csvCell).join(",");
  assert.deepEqual(parseCsv(line + "\n")[0], ["a", 'he said "hi"', "x, y", "line\nbreak", "1; 2"]);
});

test("archive classifier: a drawing caption page is a drawing; a prose page is not", async () => {
  const { classifyDrawing, topicOf } = await import("../scripts/archive/build-archive");
  assert.equal(classifyDrawing("Figure 3.12 Typical Section of a Bioretention Cell 6\" MIN. MULCH 18\" MEDIA").isDrawing, true);
  assert.equal(classifyDrawing("Bioretention cells shall be sized for the water quality volume. ".repeat(40)).isDrawing, false);
  assert.equal(classifyDrawing("TABLE OF CONTENTS Figure 3.12 Typical Section .......... 45").isDrawing, false);
  assert.equal(topicOf("Design a concrete box culvert for the 50-year flow"), "culverts");
});
