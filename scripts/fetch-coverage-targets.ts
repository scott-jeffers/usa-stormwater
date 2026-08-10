/**
 * Refresh coverage target snapshots under data/coverage/.
 *
 *   npm run coverage:fetch-targets
 *
 * Tries Census ACS for top 100 places. On failure, keeps the committed
 * top-cities.json and prints a warning. Rebuilds MS4 seed from cities +
 * capitals + any previously fetched permittees merged by name|state.
 *
 * A full EPA ICIS-NPDES dump is optional via --epa-csv=<path> if you
 * download facility/permit exports that include MS4 operators.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const COVERAGE_DIR = path.resolve(process.cwd(), "data/coverage");

const STATE_FIPS: Record<string, string> = {
  "01": "AL",
  "02": "AK",
  "04": "AZ",
  "05": "AR",
  "06": "CA",
  "08": "CO",
  "09": "CT",
  "10": "DE",
  "11": "DC",
  "12": "FL",
  "13": "GA",
  "15": "HI",
  "16": "ID",
  "17": "IL",
  "18": "IN",
  "19": "IA",
  "20": "KS",
  "21": "KY",
  "22": "LA",
  "23": "ME",
  "24": "MD",
  "25": "MA",
  "26": "MI",
  "27": "MN",
  "28": "MS",
  "29": "MO",
  "30": "MT",
  "31": "NE",
  "32": "NV",
  "33": "NH",
  "34": "NJ",
  "35": "NM",
  "36": "NY",
  "37": "NC",
  "38": "ND",
  "39": "OH",
  "40": "OK",
  "41": "OR",
  "42": "PA",
  "44": "RI",
  "45": "SC",
  "46": "SD",
  "47": "TN",
  "48": "TX",
  "49": "UT",
  "50": "VT",
  "51": "VA",
  "53": "WA",
  "54": "WV",
  "55": "WI",
  "56": "WY",
};

type CityRow = {
  rank: number;
  name: string;
  state_code: string;
  population: number;
  lat: number | null;
  lon: number | null;
};

type Permittee = {
  name: string;
  state_code: string;
  phase: "I" | "II";
  population: number | null;
  npdes_id: string | null;
};

async function loadJson<T>(filePath: string, fallback: T): Promise<T> {
  if (!existsSync(filePath)) return fallback;
  return JSON.parse(await readFile(filePath, "utf-8")) as T;
}

function parsePlaceName(raw: string): { name: string; state_code: string } | null {
  // e.g. "San Francisco city, California"
  const m = raw.match(/^(.+?)\s+(city|town|village|borough|CDP|municipality)\s*,\s*(.+)$/i);
  if (!m) {
    const parts = raw.split(",").map((s) => s.trim());
    if (parts.length < 2) return null;
    return { name: parts[0]!, state_code: "" };
  }
  let name = m[1]!.trim();
  // Drop trailing "city" already handled; also "urban county" etc.
  name = name.replace(/\s+(city|town|village)$/i, "").trim();
  const stateName = m[3]!.trim().toLowerCase();
  const stateMap: Record<string, string> = {
    alabama: "AL",
    alaska: "AK",
    arizona: "AZ",
    arkansas: "AR",
    california: "CA",
    colorado: "CO",
    connecticut: "CT",
    delaware: "DE",
    "district of columbia": "DC",
    florida: "FL",
    georgia: "GA",
    hawaii: "HI",
    idaho: "ID",
    illinois: "IL",
    indiana: "IN",
    iowa: "IA",
    kansas: "KS",
    kentucky: "KY",
    louisiana: "LA",
    maine: "ME",
    maryland: "MD",
    massachusetts: "MA",
    michigan: "MI",
    minnesota: "MN",
    mississippi: "MS",
    missouri: "MO",
    montana: "MT",
    nebraska: "NE",
    nevada: "NV",
    "new hampshire": "NH",
    "new jersey": "NJ",
    "new mexico": "NM",
    "new york": "NY",
    "north carolina": "NC",
    "north dakota": "ND",
    ohio: "OH",
    oklahoma: "OK",
    oregon: "OR",
    pennsylvania: "PA",
    "rhode island": "RI",
    "south carolina": "SC",
    "south dakota": "SD",
    tennessee: "TN",
    texas: "TX",
    utah: "UT",
    vermont: "VT",
    virginia: "VA",
    washington: "WA",
    "west virginia": "WV",
    wisconsin: "WI",
    wyoming: "WY",
  };
  const state_code = stateMap[stateName];
  if (!state_code) return null;
  return { name, state_code };
}

async function fetchTopCitiesFromCensus(): Promise<CityRow[] | null> {
  // ACS 5-year total population for all places
  const url =
    "https://api.census.gov/data/2023/acs/acs5?get=NAME,B01003_001E&for=place:*";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "stormwater-atlas-coverage/0.1 (research)",
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      console.warn(`Census API HTTP ${res.status}`);
      return null;
    }
    const text = await res.text();
    if (text.trimStart().startsWith("<")) {
      console.warn("Census API returned HTML (blocked or error page)");
      return null;
    }
    const rows = JSON.parse(text) as string[][];
    const [, ...data] = rows;
    const parsed: CityRow[] = [];
    for (const row of data) {
      const [nameRaw, popStr, stateFips] = row;
      if (!nameRaw || !popStr) continue;
      const pop = Number(popStr);
      if (!Number.isFinite(pop) || pop <= 0) continue;
      const place = parsePlaceName(nameRaw);
      if (!place?.state_code) {
        const st = STATE_FIPS[stateFips ?? ""];
        if (!st || !place) continue;
        place.state_code = st;
      }
      // Prefer incorporated cities — skip CDPs in the name when possible
      if (/CDP/i.test(nameRaw) && !/city/i.test(nameRaw)) continue;
      parsed.push({
        rank: 0,
        name: place.name,
        state_code: place.state_code,
        population: pop,
        lat: null,
        lon: null,
      });
    }
    parsed.sort((a, b) => b.population - a.population);
    const top = parsed.slice(0, 100).map((c, i) => ({ ...c, rank: i + 1 }));
    return top;
  } catch (error) {
    console.warn(
      `Census fetch failed: ${error instanceof Error ? error.message : error}`
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function mergeCoords(
  cities: CityRow[],
  previous: CityRow[]
): CityRow[] {
  const prevMap = new Map(
    previous.map((c) => [`${c.name.toLowerCase()}|${c.state_code}`, c])
  );
  return cities.map((c) => {
    const prev = prevMap.get(`${c.name.toLowerCase()}|${c.state_code}`);
    return {
      ...c,
      lat: c.lat ?? prev?.lat ?? null,
      lon: c.lon ?? prev?.lon ?? null,
    };
  });
}

function rebuildMs4(
  cities: CityRow[],
  capitals: Array<{ name: string; state_code: string }>,
  previous: Permittee[]
): Permittee[] {
  const byKey = new Map<string, Permittee>();

  function add(p: Permittee) {
    const key = `${p.name.toLowerCase()}|${p.state_code}`;
    const existing = byKey.get(key);
    if (existing) {
      if (p.phase === "I") existing.phase = "I";
      if (
        p.population != null &&
        (existing.population == null || p.population > existing.population)
      ) {
        existing.population = p.population;
      }
      if (p.npdes_id && !existing.npdes_id) existing.npdes_id = p.npdes_id;
      return;
    }
    byKey.set(key, { ...p });
  }

  for (const c of cities) {
    add({
      name: c.name,
      state_code: c.state_code,
      phase: c.population >= 100_000 ? "I" : "II",
      population: c.population,
      npdes_id: null,
    });
  }
  for (const c of capitals) {
    add({
      name: c.name,
      state_code: c.state_code,
      phase: "II",
      population: null,
      npdes_id: null,
    });
  }
  // Preserve prior curated county / extra permittees
  for (const p of previous) {
    add(p);
  }

  return [...byKey.values()].sort((a, b) => {
    if (a.phase !== b.phase) return a.phase === "I" ? -1 : 1;
    return (
      (b.population || 0) - (a.population || 0) ||
      a.name.localeCompare(b.name)
    );
  });
}

/** Optional: merge rows from a local EPA/NMSA CSV export. */
async function mergeEpaCsv(
  csvPath: string,
  permittees: Permittee[]
): Promise<Permittee[]> {
  const text = await readFile(csvPath, "utf-8");
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return permittees;

  const header = lines[0]!.split(",").map((h) =>
    h.trim().replace(/^"|"$/g, "").toLowerCase()
  );
  const nameIdx =
    header.findIndex((h) =>
      ["facility_name", "name", "permittee", "ms4_name", "organization"].includes(
        h
      )
    );
  const stateIdx = header.findIndex((h) =>
    ["state", "state_code", "state_abbr", "facility_state"].includes(h)
  );
  const phaseIdx = header.findIndex((h) =>
    ["phase", "ms4_phase", "phase_i_ii"].includes(h)
  );
  const npdesIdx = header.findIndex((h) =>
    ["npdes_id", "npdes", "permit_id", "external_permit_nmbr"].includes(h)
  );
  const popIdx = header.findIndex((h) =>
    ["population", "pop", "urbanized_population"].includes(h)
  );

  if (nameIdx < 0 || stateIdx < 0) {
    console.warn(
      `EPA CSV missing name/state columns. Found: ${header.join(", ")}`
    );
    return permittees;
  }

  const byKey = new Map(
    permittees.map((p) => [`${p.name.toLowerCase()}|${p.state_code}`, p])
  );

  for (const line of lines.slice(1)) {
    const cols = line.match(/("([^"]|"")*"|[^,]*)/g)?.map((c) =>
      c.replace(/^"|"$/g, "").replace(/""/g, '"').trim()
    );
    if (!cols) continue;
    const name = cols[nameIdx];
    const state = cols[stateIdx]?.toUpperCase();
    if (!name || !state || state.length !== 2) continue;
    const phaseRaw = phaseIdx >= 0 ? cols[phaseIdx] ?? "" : "";
    const phase: "I" | "II" = /I\b|phase\s*1|large|medium/i.test(phaseRaw)
      ? "I"
      : "II";
    const pop =
      popIdx >= 0 && cols[popIdx]
        ? Number(String(cols[popIdx]).replace(/,/g, ""))
        : null;
    const npdes = npdesIdx >= 0 ? cols[npdesIdx] || null : null;
    const key = `${name.toLowerCase()}|${state}`;
    const existing = byKey.get(key);
    if (existing) {
      if (phase === "I") existing.phase = "I";
      if (pop != null && Number.isFinite(pop)) existing.population = pop;
      if (npdes) existing.npdes_id = npdes;
    } else {
      byKey.set(key, {
        name,
        state_code: state,
        phase,
        population: pop != null && Number.isFinite(pop) ? pop : null,
        npdes_id: npdes,
      });
    }
  }

  return [...byKey.values()];
}

async function main() {
  await mkdir(COVERAGE_DIR, { recursive: true });

  const prevCitiesFile = await loadJson<{
    cities: CityRow[];
    source?: string;
  }>(path.join(COVERAGE_DIR, "top-cities.json"), { cities: [] });

  const capitals = await loadJson<{
    capitals: Array<{ name: string; state_code: string; lat?: number; lon?: number }>;
  }>(path.join(COVERAGE_DIR, "state-capitals.json"), { capitals: [] });

  const prevMs4 = await loadJson<{ permittees: Permittee[] }>(
    path.join(COVERAGE_DIR, "ms4-permittees.json"),
    { permittees: [] }
  );

  console.log("Fetching top 100 cities from Census ACS…");
  let cities = await fetchTopCitiesFromCensus();
  let citySource =
    "US Census Bureau ACS 2023 5-year estimates (B01003_001E places)";

  if (!cities || cities.length < 50) {
    console.warn(
      "Keeping committed top-cities.json (Census unavailable or incomplete)."
    );
    cities = prevCitiesFile.cities;
    citySource =
      prevCitiesFile.source ??
      "Committed snapshot (Census refresh unavailable)";
  } else {
    cities = mergeCoords(cities, prevCitiesFile.cities);
    await writeFile(
      path.join(COVERAGE_DIR, "top-cities.json"),
      JSON.stringify(
        {
          fetchedAt: new Date().toISOString(),
          source: citySource,
          cities,
        },
        null,
        2
      ) + "\n"
    );
    console.log(`Wrote top-cities.json (${cities.length} cities)`);
  }

  // Capitals are static — bump timestamp only
  await writeFile(
    path.join(COVERAGE_DIR, "state-capitals.json"),
    JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        source: "US state capitals (static reference)",
        capitals: capitals.capitals,
      },
      null,
      2
    ) + "\n"
  );

  let permittees = rebuildMs4(cities, capitals.capitals, prevMs4.permittees);

  const epaArg = process.argv.find((a) => a.startsWith("--epa-csv="));
  if (epaArg) {
    const csvPath = path.resolve(epaArg.slice("--epa-csv=".length));
    console.log(`Merging EPA/NMSA CSV: ${csvPath}`);
    permittees = await mergeEpaCsv(csvPath, permittees);
  }

  permittees.sort((a, b) => {
    if (a.phase !== b.phase) return a.phase === "I" ? -1 : 1;
    return (
      (b.population || 0) - (a.population || 0) ||
      a.name.localeCompare(b.name)
    );
  });

  await writeFile(
    path.join(COVERAGE_DIR, "ms4-permittees.json"),
    JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        source:
          "Derived from top cities (Phase I if pop>=100k) + capitals + prior curated county MS4s" +
          (epaArg ? " + EPA/NMSA CSV merge" : "") +
          ". Optional: npm run coverage:fetch-targets -- --epa-csv=path/to/export.csv",
        note: "Not a complete EPA ICIS dump unless --epa-csv is provided.",
        permittees,
      },
      null,
      2
    ) + "\n"
  );

  const phaseI = permittees.filter((p) => p.phase === "I").length;
  const phaseII = permittees.filter((p) => p.phase === "II").length;
  console.log(
    `Wrote ms4-permittees.json (${permittees.length} total; I=${phaseI}, II=${phaseII})`
  );
  console.log("Done. Run: npm run coverage:report");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
