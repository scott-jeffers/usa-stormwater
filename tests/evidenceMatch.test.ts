import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SourceIndex,
  canonicalNumber,
  matchExcerpt,
  tokenize,
  valueAppearsIn,
} from "../lib/qa/evidenceMatch";

const pages = [
  {
    page: 1,
    text: "GEORGIA STORMWATER MANAGEMENT MANUAL\n2016 EDITION",
  },
  {
    page: 12,
    text:
      "The water quality volume (WQv) is the storage needed to capture and treat " +
      "the runoff from 85% of the storms that occur in an average year. This equates " +
      "to providing water quality treatment for the runoff resulting from a rainfall " +
      "depth of 1.2 inches. Bioretention areas should be designed to drain within " +
      "48 hours. Detention ponds shall be sized for the 100-year storm.",
  },
  {
    page: 40,
    text:
      "Underground sand filters are acceptable in ultra-urban settings. The filter " +
      "bed shall have a minimum depth of 18 inches and the infil-\ntration rate " +
      "shall be at least 0.5 inches per hour.",
  },
];
const index = new SourceIndex(pages);

test("exact verbatim excerpt matches and reports its page", () => {
  const r = matchExcerpt(index, "a rainfall depth of 1.2 inches");
  assert.equal(r.status, "exact");
  assert.equal(r.page, 12);
});

test("case, quotes, whitespace and line-break hyphenation are tolerated", () => {
  const r = matchExcerpt(index, "the INFILTRATION   rate shall be at least 0.5 inches per hour");
  assert.equal(r.status, "exact");
  assert.equal(r.page, 40);
});

test("wrong number in an otherwise-verbatim sentence fails (old checker passed this)", () => {
  const r = matchExcerpt(
    index,
    "This equates to providing water quality treatment for the runoff resulting from a rainfall depth of 2.5 inches."
  );
  assert.equal(r.status, "fail");
  assert.deepEqual(r.segments[0]!.missingNumbers, ["2.5"]);
});

test("invented sentence built from source vocabulary fails (old checker passed this)", () => {
  const r = matchExcerpt(
    index,
    "Detention ponds shall be designed for the 500-year storm using HEC-RAS software"
  );
  assert.equal(r.status, "fail");
});

test("invented prohibition reusing source words fails (old checker passed this)", () => {
  const r = matchExcerpt(index, "Underground sand filters are prohibited within the jurisdiction");
  assert.equal(r.status, "fail");
});

test("minor PDF-extraction noise passes as fuzzy when numbers still match", () => {
  const r = matchExcerpt(
    index,
    "The water quality volume (WQv) is the storage needed to capture and treat the runoff from 85% of storms that occur in an average year."
  );
  assert.equal(r.status, "fuzzy");
});

test("each ellipsis segment is checked on its own", () => {
  const ok = matchExcerpt(index, "The water quality volume (WQv) is the storage needed ... rainfall depth of 1.2 inches");
  assert.equal(ok.status, "exact");
  const bad = matchExcerpt(index, "The water quality volume (WQv) is the storage needed … rainfall depth of 1.5 inches");
  assert.equal(bad.status, "fail");
});

test("number dropped by the PDF text layer → unverifiable, not passed or failed", () => {
  const broken = new SourceIndex([
    {
      page: 77,
      text:
        "A minimum 2ft of separation is recommended and a minimum ft of separation " +
        "required between the water table and the bioretention practice.",
    },
  ]);
  const r = matchExcerpt(
    broken,
    "a minimum 4ft of separation required between the water table and the bioretention practice"
  );
  assert.equal(r.status, "unverifiable");
  assert.equal(r.page, 77);
});

test("source showing a different number at that spot → fail with the source number", () => {
  const r = matchExcerpt(index, "Bioretention areas should be designed to drain within 72 hours.");
  assert.equal(r.status, "fail");
  assert.deepEqual(r.segments[0]!.contradictingNumbers, ["48"]);
});

test("page markers copied from prepared text are ignored", () => {
  const r = matchExcerpt(index, "--- page 12 --- a rainfall depth of 1.2 inches");
  assert.equal(r.status, "exact");
});

test("number canonicalization", () => {
  assert.equal(canonicalNumber("1,000"), "1000");
  assert.equal(canonicalNumber(".50"), "0.5");
  assert.equal(canonicalNumber("3/8"), "3/8");
  assert.deepEqual(tokenize("1.20-inch WQv"), ["1.2", "inch", "wqv"]);
});

test("value-in-excerpt check understands common unit spellings", () => {
  assert.ok(valueAppearsIn(72, "max_drawdown_hours", ["drain within 72 hours"]));
  assert.ok(valueAppearsIn(72, "max_drawdown_hours", ["drain within 3 days"]));
  assert.ok(valueAppearsIn(24, "bioretention_media_depth_min_inches", ["minimum of 2 feet of media"]));
  assert.ok(valueAppearsIn(0.75, "wqv_depth_inches", ["3/4 inch of rainfall"]));
  // Port St. Lucie case: 288 h derived from "3/8 inch per day" — not stated
  assert.ok(!valueAppearsIn(288, "max_drawdown_hours", ["discharge at least 3/8 inch per day"]));
});

test("leading-digit dropout in the source ('8' for '48') is unverifiable, not a contradiction", () => {
  const broken = new SourceIndex([
    { page: 40, text: "draw down the extended detention volume over a 8-hour period to settle solids" },
  ]);
  const r = matchExcerpt(broken, "draw down the extended detention volume over a 48-hour period");
  assert.equal(r.status, "unverifiable");
});

test("table-style excerpts fail without claiming a specific contradicting number", () => {
  const t = new SourceIndex([
    { page: 3, text: "Table 1.1.2 Storm Event Return Interval (years) 1 2 5 37 Bioretention Design Checklist" },
  ]);
  const r = matchExcerpt(t, "Storm Event Return Interval (years) 2 5 10 25 50 100");
  assert.equal(r.status, "fail");
  assert.equal(r.segments[0]!.contradictingNumbers, undefined);
});

test("a footnote digit merged into a year is not a contradiction", () => {
  const t = new SourceIndex([
    { page: 9, text: "peak discharges were estimated using empirical equations developed by the U.S. Geological Survey (Sherwood, 19861) for small streams" },
  ]);
  const r = matchExcerpt(t, "peak discharges were estimated using empirical equations developed by the U.S. Geological Survey (Sherwood, 1986)");
  assert.notEqual(r.segments[0]!.contradictingNumbers?.[0], "19861");
});

test("a quote running across a page footer passes sentence by sentence", () => {
  const t = new SourceIndex([
    { page: 37, text: "The BMPs listed on the Virginia Stormwater BMP Clearinghouse are approved for use. PAGE 5-32 Revised 2024" },
    { page: 38, text: "Where a BMP listed on the Clearinghouse contains Coastal Plain design considerations, these shall be employed." },
  ]);
  const r = matchExcerpt(t, "The BMPs listed on the Virginia Stormwater BMP Clearinghouse are approved for use. Where a BMP listed on the Clearinghouse contains Coastal Plain design considerations, these shall be employed.");
  assert.equal(r.status, "fuzzy");
});

test("unicode fractions match their slash spelling", () => {
  const t = new SourceIndex([{ page: 2, text: "treat the first ½ inch of runoff from impervious surfaces" }]);
  assert.equal(matchExcerpt(t, "treat the first 1/2 inch of runoff from impervious surfaces").status, "exact");
});

test("displayQuote tidies page markers and marks clipped quotes", async () => {
  const { displayQuote } = await import("../lib/displayExcerpt");
  assert.equal(displayQuote("ting centerline is above grade"), "…ting centerline is above grade…");
  assert.equal(displayQuote("Ponds shall drain in 72 hours."), "Ponds shall drain in 72 hours.");
  assert.equal(displayQuote("Intro --- page 2 --- Chapter 3 ........ 5"), "Intro … Chapter 3 … 5…");
});

test("a contradiction in one text reading beats 'couldn't check' in another", async () => {
  const { SourceIndex, matchExcerpt, bestAcrossSources } = await import("../lib/qa/evidenceMatch");
  const quote = "leave at least 4 feet between the seasonal high-water table or bedrock and the trench bottom";
  // reading 1 lost the digit (control char); reading 2 shows a different number
  const lost = new SourceIndex([{ page: 51, text: "shallow enough to leave at least \u0018 feet between the seasonal high-water table or bedrock and the trench bottom." }]);
  const clear = new SourceIndex([{ page: 51, text: "shallow enough to leave at least 3 feet between the seasonal high-water table or bedrock and the trench bottom." }]);
  const a = matchExcerpt(lost, quote);
  const b = matchExcerpt(clear, quote);
  assert.equal(a.status, "unverifiable");
  assert.equal(bestAcrossSources([a, b]).status, "fail");
  // the right number passes
  const ok = quote.replace("4 feet", "3 feet");
  assert.equal(bestAcrossSources([matchExcerpt(lost, ok), matchExcerpt(clear, ok)]).status, "exact");
});

test("value check reads spelled-out numbers, mixed fractions and ft/ft slopes", async () => {
  const { valueAppearsIn } = await import("../lib/qa/evidenceMatch");
  assert.ok(valueAppearsIn(60, "permanent_pool_depth_inches", ["Permanent pool should be a minimum of five feet deep."]));
  assert.ok(valueAppearsIn(24, "shwt_separation_inches", ["at least two feet above the seasonal high ground water table"]));
  assert.ok(valueAppearsIn(2.5, "green_roof_media_depth_inches", ["a minimum media depth of 2½ inches."]));
  assert.ok(valueAppearsIn(30, "bioretention_media_depth_min_inches", ["A 2½ to 4 foot deep planting soil bed"]));
  assert.ok(valueAppearsIn(1, "wqv_depth_inches", ["the runoff from the first inch of precipitation"]));
  assert.ok(valueAppearsIn(0.05, "swale_longitudinal_slope_percent", ["a minimum physical slope of 0.0005 feet/feet"]));
  // still catches a value the quote doesn't state
  assert.ok(!valueAppearsIn(48, "shwt_separation_inches", ["at least two feet above the water table"]));
});

test("value check reads hyphenated number words and 'twice as long'", async () => {
  const { valueAppearsIn } = await import("../lib/qa/evidenceMatch");
  assert.ok(valueAppearsIn(10, "years", ["referred to as the ten-year storm"]));
  assert.ok(valueAppearsIn(12, "shwt_separation_inches", ["a minimum one-foot separation from the bottom"]));
  assert.ok(valueAppearsIn(1, "wqv_depth_inches", ["all storms up to and including a one-inch storm"]));
  assert.ok(valueAppearsIn(2, "length_to_width_ratio", ["at least twice as long as it is wide."]));
});
