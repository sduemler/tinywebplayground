// Builds the data behind When To Plant:
//
//   src/data/when-to-plant/counties.json   per-county frost dates + monthly average highs/lows
//   src/data/when-to-plant/map.topo.json   simplified county/state map (Albers, AK/HI inset)
//   public/data/when-to-plant/zips.json    ZIP → county FIPS, lazy-loaded by the search box
//
// Run with: npm run build-when-to-plant
//
// Sources (downloaded once into scripts/.cache/when-to-plant/, gitignored):
//   - NOAA NCEI U.S. Climate Normals 1991–2020, annual/seasonal (frost-date probabilities)
//     and monthly (average daily high and low) bulk archives, one CSV per station. Public domain.
//   - us-atlas 3 county shapes (npm), from the Census cartographic boundary files.
//   - Census 2020 ZCTA ↔ county relationship file, and 2020 county centers of population.
//     Public domain.
//
// Station → county: inverse-distance weighting from the county's center of population
// (where people actually garden, not the geometric middle), using the stations inside
// the county, else the 4 nearest within 150 km, else the nearest station at any distance
// (flagged `est`). Weighting by distance from the population center keeps e.g. Boulder
// County on the city's frost dates instead of averaging in the mountain stations. Frost dates and monthly temperatures come from
// different station sets, so each is interpolated on its own.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { geoBounds, geoCentroid, geoContains } from "d3-geo";
import { feature, quantize } from "topojson-client";
import { presimplify, quantile, simplify } from "topojson-simplify";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CACHE = resolve(__dirname, ".cache", "when-to-plant");
const OUT_DATA = resolve(ROOT, "src", "data", "when-to-plant");
const OUT_PUBLIC = resolve(ROOT, "public", "data", "when-to-plant");

const SOURCES = {
  annual: {
    url: "https://www.ncei.noaa.gov/data/normals-annualseasonal/1991-2020/archive/us-climate-normals_1991-2020_v1.0.1_annualseasonal_multivariate_by-station_c20230404.tar.gz",
    file: "annual.tar.gz",
    dir: "annual",
  },
  monthly: {
    url: "https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/archive/us-climate-normals_1991-2020_v1.0.1_monthly_multivariate_by-station_c20230404.tar.gz",
    file: "monthly.tar.gz",
    dir: "monthly",
  },
  zcta: {
    url: "https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_county20_natl.txt",
    file: "zcta-county.txt",
  },
  popCenters: {
    url: "https://www2.census.gov/geo/docs/reference/cenpop2020/county/CenPop2020_Mean_CO.txt",
    file: "cenpop-county.txt",
  },
};

const IDW_RADIUS_KM = 150;
// Floor on station distance so a station sitting on the population center doesn't take all the weight.
const IDW_MIN_KM = 5;
const IDW_K = 4;
// Chance the map simplification keeps a point; tuned by eye at state zoom.
const SIMPLIFY_QUANTILE = 0.12;

// 2020 county codes the Census file uses that us-atlas (older boundaries) doesn't have.
const FIPS_ALIASES = {
  "02063": "02261", // Chugach Census Area      → Valdez-Cordova (split in 2019)
  "02066": "02261", // Copper River Census Area → Valdez-Cordova
};

const STATE_ABBR = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT",
  "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL",
  "18": "IN", "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD",
  "25": "MA", "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT", "31": "NE",
  "32": "NV", "33": "NH", "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
  "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA", "54": "WV",
  "55": "WI", "56": "WY",
};

// ---------------------------------------------------------------------------
// Downloads

function ensureSources() {
  mkdirSync(CACHE, { recursive: true });
  for (const src of Object.values(SOURCES)) {
    const path = resolve(CACHE, src.file);
    if (!existsSync(path)) {
      console.log(`Downloading ${src.url}`);
      execFileSync("curl", ["-sSfL", "-o", path, src.url], { stdio: "inherit" });
    }
    if (src.dir) {
      const dir = resolve(CACHE, src.dir);
      if (!existsSync(dir) || readdirSync(dir).length === 0) {
        mkdirSync(dir, { recursive: true });
        console.log(`Extracting ${src.file}`);
        execFileSync("tar", ["-xzf", path, "-C", dir], { stdio: "inherit" });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// NOAA station CSVs

// Quote-aware CSV line split (NAME fields contain commas, e.g. "BOULDER, CO US").
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function readCsv(path) {
  const lines = readFileSync(path, "utf8").split(/\r?\n/).filter(Boolean);
  const header = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row = {};
    header.forEach((h, i) => (row[h] = cells[i]));
    return row;
  });
}

// NOAA special values (-9999 missing, -8888/-7777/-6666/-5555 flags) mean "no number".
function num(v) {
  if (v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= -5555) return null;
  return n;
}

const MONTH_START = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
function mmddToDoy(v) {
  const m = /^(\d\d)\/(\d\d)$/.exec(v ?? "");
  if (!m) return null;
  return MONTH_START[Number(m[1]) - 1] + Number(m[2]);
}

function loadFrostStations() {
  const dir = resolve(CACHE, SOURCES.annual.dir);
  const stations = [];
  let alwaysFrost = 0;
  for (const name of readdirSync(dir)) {
    const [row] = readCsv(resolve(dir, name));
    if (!row || !("ANN-TMIN-PRBLST-T32FP50" in row)) continue;
    const lat = num(row.LATITUDE);
    const lon = num(row.LONGITUDE);
    if (lat === null || lon === null) continue;
    const lsf = mmddToDoy(row["ANN-TMIN-PRBLST-T32FP50"]);
    const fff = mmddToDoy(row["ANN-TMIN-PRBFST-T32FP50"]);
    const gsl = num(row["ANN-TMIN-PRBGSL-T32FP50"]);
    if (lsf !== null && fff !== null) {
      // Near-frost-free stations can have their last "spring" frost in late December or
      // their first "fall" frost in early January. Unwrap so lsf < fff always holds and
      // averaging works: lsf may go below 1 (previous December), fff above 365 (next January).
      const lsfU = lsf > 200 ? lsf - 365 : lsf;
      const fffU = fff < lsfU + 30 ? fff + 365 : fff;
      stations.push({ id: row.STATION, lat, lon, ff: false, lsf: lsfU, fff: fffU });
    } else if (gsl === 365) {
      // No dates + a full-year growing season = frost-free (Miami, Honolulu, San Diego…).
      stations.push({ id: row.STATION, lat, lon, ff: true, lsf: null, fff: null });
    } else if (gsl === 0) {
      alwaysFrost++;
    }
  }
  console.log(`Frost stations: ${stations.length} (${stations.filter((s) => s.ff).length} frost-free, ${alwaysFrost} skipped for frost in every month)`);
  return stations;
}

function loadHighStations() {
  const dir = resolve(CACHE, SOURCES.monthly.dir);
  const stations = [];
  for (const name of readdirSync(dir)) {
    const rows = readCsv(resolve(dir, name));
    if (!rows.length || !("MLY-TMAX-NORMAL" in rows[0]) || !("MLY-TMIN-NORMAL" in rows[0])) continue;
    const hi = new Array(12).fill(null);
    const lo = new Array(12).fill(null);
    for (const r of rows) {
      const m = Number(r.month);
      if (m < 1 || m > 12) continue;
      hi[m - 1] = num(r["MLY-TMAX-NORMAL"]);
      lo[m - 1] = num(r["MLY-TMIN-NORMAL"]);
    }
    if (hi.some((v) => v === null) || lo.some((v) => v === null)) continue;
    const lat = num(rows[0].LATITUDE);
    const lon = num(rows[0].LONGITUDE);
    if (lat === null || lon === null) continue;
    stations.push({ id: rows[0].STATION, lat, lon, hi, lo });
  }
  console.log(`Monthly temperature stations: ${stations.length}`);
  return stations;
}

// ---------------------------------------------------------------------------
// Geometry helpers

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

function inBounds([[x0, y0], [x1, y1]], lon, lat) {
  if (lat < y0 || lat > y1) return false;
  // Bounds that cross the antimeridian (Aleutians) have x0 > x1.
  return x0 <= x1 ? lon >= x0 && lon <= x1 : lon >= x0 || lon <= x1;
}

// Picks the stations that speak for a county and how to weight them.
// Returns { picks: [{ station, w }], mode: "inside" | "idw" | "nearest" }.
function pickStations(county, stations) {
  const [alon, alat] = county.anchor;
  const weigh = (station) => ({
    station,
    w: 1 / Math.max(haversineKm(alat, alon, station.lat, station.lon), IDW_MIN_KM) ** 2,
  });
  const inside = stations.filter(
    (s) => inBounds(county.bounds, s.lon, s.lat) && geoContains(county.feature, [s.lon, s.lat]),
  );
  if (inside.length) return { picks: inside.map(weigh), mode: "inside" };

  const byDist = stations
    .map((station) => ({ station, d: haversineKm(alat, alon, station.lat, station.lon) }))
    .sort((a, b) => a.d - b.d);
  const near = byDist.slice(0, IDW_K).filter((p) => p.d <= IDW_RADIUS_KM);
  if (near.length) return { picks: near.map((p) => weigh(p.station)), mode: "idw" };
  return { picks: [{ station: byDist[0].station, w: 1 }], mode: "nearest" };
}

function weightedMean(values, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  return values.reduce((sum, v, i) => sum + v * weights[i], 0) / total;
}

// ---------------------------------------------------------------------------
// Build

function loadPopCenters() {
  const lines = readFileSync(resolve(CACHE, SOURCES.popCenters.file), "utf8").replace(/^\uFEFF/, "").split(/\r?\n/);
  const centers = new Map();
  for (const line of lines.slice(1)) {
    const [st, co, , , , lat, lon] = line.split(",");
    if (st && co) centers.set(st + co, [Number(lon), Number(lat)]);
  }
  return centers;
}

function buildCounties(frostStations, highStations) {
  const popCenters = loadPopCenters();
  const geo = JSON.parse(readFileSync(resolve(ROOT, "node_modules/us-atlas/counties-10m.json"), "utf8"));
  const albers = JSON.parse(readFileSync(resolve(ROOT, "node_modules/us-atlas/counties-albers-10m.json"), "utf8"));
  const onMap = new Set(albers.objects.counties.geometries.map((g) => g.id));

  const features = feature(geo, geo.objects.counties).features.filter((f) => onMap.has(f.id));
  const out = {};
  const tally = { inside: 0, idw: 0, nearest: 0, ff: 0 };

  for (const f of features) {
    // Population center, falling back to the shape's middle (e.g. Valdez-Cordova, split in 2019).
    const anchor = popCenters.get(f.id) ?? geoCentroid(f);
    const county = { feature: f, bounds: geoBounds(f), anchor };

    // Frost dates
    const frost = pickStations(county, frostStations);
    const ffWeight = frost.picks.filter((p) => p.station.ff).reduce((a, p) => a + p.w, 0);
    const allWeight = frost.picks.reduce((a, p) => a + p.w, 0);
    const ff = ffWeight > allWeight / 2;
    let lsf = null;
    let fff = null;
    if (!ff) {
      const dated = frost.picks.filter((p) => !p.station.ff);
      const w = dated.map((p) => p.w);
      lsf = Math.round(weightedMean(dated.map((p) => p.station.lsf), w));
      fff = Math.round(weightedMean(dated.map((p) => p.station.fff), w));
    }

    // Monthly average highs and lows
    const temps = pickStations(county, highStations);
    const tw = temps.picks.map((p) => p.w);
    const monthly = (key) =>
      Array.from({ length: 12 }, (_, m) => Math.round(weightedMean(temps.picks.map((p) => p.station[key][m]), tw)));
    const hi = monthly("hi");
    const lo = monthly("lo");

    tally[frost.mode]++;
    if (ff) tally.ff++;
    out[f.id] = {
      n: f.properties.name,
      s: STATE_ABBR[f.id.slice(0, 2)] ?? "",
      lsf,
      fff,
      ff,
      hi,
      lo,
      c: anchor.map((v) => Math.round(v * 100) / 100),
      src: frost.picks.length,
      est: frost.mode === "nearest",
    };
  }

  console.log(
    `Counties: ${features.length} — frost data from in-county stations ${tally.inside}, ` +
      `nearby IDW ${tally.idw}, nearest-only ${tally.nearest}; frost-free ${tally.ff}`,
  );
  return { counties: out, albers };
}

function buildMap(albers) {
  // County names live in counties.json, so county shapes only need ids. States keep their names.
  for (const g of albers.objects.counties.geometries) delete g.properties;
  const pre = presimplify(albers);
  // simplify() leaves absolute coordinates; quantize again (~0.1px at 975px wide) for delta encoding.
  return quantize(simplify(pre, quantile(pre, SIMPLIFY_QUANTILE)), 1e4);
}

function buildZips(counties) {
  const lines = readFileSync(resolve(CACHE, SOURCES.zcta.file), "utf8").replace(/^﻿/, "").split(/\r?\n/);
  const header = lines[0].split("|");
  const iZip = header.indexOf("GEOID_ZCTA5_20");
  const iCounty = header.indexOf("GEOID_COUNTY_20");
  const iLand = header.indexOf("AREALAND_PART");
  const iWater = header.indexOf("AREAWATER_PART");

  const best = new Map(); // zip → { fips, land, water }
  for (const line of lines.slice(1)) {
    const c = line.split("|");
    const zip = c[iZip];
    if (!zip) continue;
    const land = Number(c[iLand]) || 0;
    const water = Number(c[iWater]) || 0;
    const cur = best.get(zip);
    if (!cur || land > cur.land || (land === cur.land && water > cur.water)) {
      best.set(zip, { fips: c[iCounty], land, water });
    }
  }

  const zips = {};
  const missing = new Set();
  let offMap = 0;
  for (const [zip, { fips: raw }] of [...best].sort(([a], [b]) => a.localeCompare(b))) {
    const fips = FIPS_ALIASES[raw] ?? raw;
    if (counties[fips]) zips[zip] = fips;
    else if (STATE_ABBR[fips.slice(0, 2)]) missing.add(fips);
    else offMap++; // Puerto Rico and other territories aren't on the map
  }
  if (missing.size) {
    throw new Error(`ZIPs point at counties missing from the map: ${[...missing].join(", ")} — add them to FIPS_ALIASES`);
  }
  console.log(`ZIPs: ${Object.keys(zips).length} (skipped ${offMap} outside the 50 states + DC)`);
  return zips;
}

function spotCheck(counties, zips) {
  const fmt = (raw) => {
    if (raw === null) return "—";
    const doy = ((raw - 1 + 365) % 365) + 1;
    const m = MONTH_START.findLastIndex((s) => s < doy);
    return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m]} ${doy - MONTH_START[m]}`;
  };
  const checks = [
    ["80301", "Boulder CO (expect ~May 6 / ~Oct 5)"],
    ["33101", "Miami FL (expect frost-free)"],
    ["99701", "Fairbanks AK (expect late May / late Aug)"],
    ["30303", "Atlanta GA (expect late Mar / early Nov)"],
    ["85004", "Phoenix AZ (expect frost-free-ish, hot)"],
    ["96813", "Honolulu HI (expect frost-free)"],
    ["55401", "Minneapolis MN (expect ~early May / early Oct)"],
    ["98101", "Seattle WA (expect early Mar / mid Nov)"],
    ["10001", "New York NY (expect early Apr / mid Nov)"],
    ["81611", "Aspen CO (expect mid Jun / early Sep)"],
  ];
  console.log("\nSpot checks:");
  for (const [zip, label] of checks) {
    const c = counties[zips[zip]];
    if (!c) {
      console.log(`  ${zip} ${label}: NOT FOUND`);
      continue;
    }
    console.log(
      `  ${zip} → ${c.n}, ${c.s}: ${c.ff ? "frost-free" : `${fmt(c.lsf)} / ${fmt(c.fff)}`}; ` +
        `Jan ${c.hi[0]}/${c.lo[0]} Jul ${c.hi[6]}/${c.lo[6]}; ${c.src} stn${c.est ? " (est)" : ""} — ${label}`,
    );
  }
}

function main() {
  ensureSources();
  const frostStations = loadFrostStations();
  const highStations = loadHighStations();
  const { counties, albers } = buildCounties(frostStations, highStations);
  const map = buildMap(albers);
  const zips = buildZips(counties);

  mkdirSync(OUT_DATA, { recursive: true });
  mkdirSync(OUT_PUBLIC, { recursive: true });
  const write = (path, data) => {
    const json = JSON.stringify(data);
    writeFileSync(path, json);
    console.log(`Wrote ${path.replace(ROOT + "/", "")} (${(json.length / 1024).toFixed(0)} KB)`);
  };
  write(resolve(OUT_DATA, "counties.json"), counties);
  write(resolve(OUT_DATA, "map.topo.json"), map);
  write(resolve(OUT_PUBLIC, "zips.json"), zips);
  spotCheck(counties, zips);
}

main();
