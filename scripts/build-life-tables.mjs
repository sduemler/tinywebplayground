// Fetches WHO GHO life-table lx values (number of survivors out of an
// original cohort of 100,000) for a curated set of countries × sex, latest
// available year per country. Writes the result to
// src/data/still-here/life-tables.json for the Still Here project to import.
//
// Run with: node scripts/build-life-tables.mjs
//
// Source: https://www.who.int/data/gho/info/gho-odata-api
// Indicator: LIFE_0000000031 (lx — number of people left alive at age x)
// Data comes in 19 age bands: 00-01, 01-04, 05-09, 10-14, ..., 80-84, 85+

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(
  __dirname,
  "..",
  "src",
  "data",
  "still-here",
  "life-tables.json",
);

const INDICATOR = "LIFE_0000000031";
const API_BASE = "https://ghoapi.azureedge.net/api";

// Curated, recognizable set spanning regions. Add more as needed.
const COUNTRIES = [
  { code: "USA", name: "United States" },
  { code: "CAN", name: "Canada" },
  { code: "MEX", name: "Mexico" },
  { code: "BRA", name: "Brazil" },
  { code: "ARG", name: "Argentina" },
  { code: "GBR", name: "United Kingdom" },
  { code: "IRL", name: "Ireland" },
  { code: "FRA", name: "France" },
  { code: "DEU", name: "Germany" },
  { code: "ITA", name: "Italy" },
  { code: "ESP", name: "Spain" },
  { code: "PRT", name: "Portugal" },
  { code: "NLD", name: "Netherlands" },
  { code: "SWE", name: "Sweden" },
  { code: "NOR", name: "Norway" },
  { code: "FIN", name: "Finland" },
  { code: "CHE", name: "Switzerland" },
  { code: "POL", name: "Poland" },
  { code: "RUS", name: "Russia" },
  { code: "JPN", name: "Japan" },
  { code: "KOR", name: "South Korea" },
  { code: "CHN", name: "China" },
  { code: "IND", name: "India" },
  { code: "ISR", name: "Israel" },
  { code: "TUR", name: "Türkiye" },
  { code: "AUS", name: "Australia" },
  { code: "NZL", name: "New Zealand" },
  { code: "ZAF", name: "South Africa" },
  { code: "NGA", name: "Nigeria" },
  { code: "EGY", name: "Egypt" },
];

// Age-band order. The 19 bands the WHO API returns, in age order. We strip
// the "AGEGROUP_YEARS" prefix in output for readability.
const AGE_BANDS = [
  "00-01",
  "01-04",
  "05-09",
  "10-14",
  "15-19",
  "20-24",
  "25-29",
  "30-34",
  "35-39",
  "40-44",
  "45-49",
  "50-54",
  "55-59",
  "60-64",
  "65-69",
  "70-74",
  "75-79",
  "80-84",
  "85PLUS",
];

// Starting age of each band, used to map a user's current age into a band.
export const BAND_START_AGE = [
  0, 1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85,
];

async function fetchCountry(code) {
  const filter = `SpatialDim eq '${code}'`;
  const url = `${API_BASE}/${INDICATOR}?$filter=${encodeURIComponent(filter)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${code}: HTTP ${res.status}`);
  const data = await res.json();
  return data.value;
}

function extractLatestTables(rows) {
  // Find latest year that has both sexes (and ideally BTSX) with all 19 bands.
  const byYear = new Map();
  for (const r of rows) {
    if (
      r.Dim1 !== "SEX_MLE" &&
      r.Dim1 !== "SEX_FMLE" &&
      r.Dim1 !== "SEX_BTSX"
    )
      continue;
    const band = r.Dim2?.replace("AGEGROUP_YEARS", "");
    if (!AGE_BANDS.includes(band)) continue;
    const year = r.TimeDim;
    if (!byYear.has(year)) byYear.set(year, { M: {}, F: {}, B: {} });
    const sexKey =
      r.Dim1 === "SEX_MLE" ? "M" : r.Dim1 === "SEX_FMLE" ? "F" : "B";
    byYear.get(year)[sexKey][band] = r.NumericValue;
  }

  const candidateYears = [...byYear.keys()].sort((a, b) => b - a);
  for (const year of candidateYears) {
    const { M, F, B } = byYear.get(year);
    const mComplete = AGE_BANDS.every((b) => typeof M[b] === "number");
    const fComplete = AGE_BANDS.every((b) => typeof F[b] === "number");
    if (mComplete && fComplete) {
      const bComplete = AGE_BANDS.every((b) => typeof B[b] === "number");
      return {
        year,
        M: AGE_BANDS.map((b) => Math.round(M[b])),
        F: AGE_BANDS.map((b) => Math.round(F[b])),
        B: bComplete
          ? AGE_BANDS.map((b) => Math.round(B[b]))
          : AGE_BANDS.map((b) => Math.round((M[b] + F[b]) / 2)),
      };
    }
  }
  return null;
}

async function main() {
  console.log(`Fetching WHO life tables for ${COUNTRIES.length} countries...`);

  const tables = {};
  const skipped = [];
  let latestYear = 0;

  // Fetch in batches of 5 to be polite to the API.
  for (let i = 0; i < COUNTRIES.length; i += 5) {
    const batch = COUNTRIES.slice(i, i + 5);
    const results = await Promise.all(
      batch.map(async ({ code, name }) => {
        try {
          const rows = await fetchCountry(code);
          const extracted = extractLatestTables(rows);
          if (!extracted) return { code, name, error: "no complete year" };
          return { code, name, ...extracted };
        } catch (err) {
          return { code, name, error: err.message };
        }
      }),
    );
    for (const r of results) {
      if (r.error) {
        skipped.push(`${r.code} (${r.name}): ${r.error}`);
        console.warn(`  skip ${r.code}: ${r.error}`);
      } else {
        tables[r.code] = { year: r.year, M: r.M, F: r.F, B: r.B };
        if (r.year > latestYear) latestYear = r.year;
        console.log(`  ✓ ${r.code} ${r.name} (${r.year})`);
      }
    }
  }

  const out = {
    source: "WHO Global Health Observatory (LIFE_0000000031, lx)",
    fetchedAt: new Date().toISOString().slice(0, 10),
    latestYear,
    ageBands: AGE_BANDS,
    bandStartAge: BAND_START_AGE,
    countries: COUNTRIES.filter((c) => tables[c.code]),
    tables,
  };

  await writeFile(OUT_PATH, JSON.stringify(out, null, 2));
  console.log(`\nWrote ${OUT_PATH}`);
  console.log(`  ${out.countries.length} countries, latest year ${latestYear}`);
  if (skipped.length) console.log(`  ${skipped.length} skipped`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
