// Planting engine for When To Plant: which crops can go in the ground in a county on a
// given day of the year. Pure functions, no React.
//
// Days are day-of-year 1–365 (Feb 29 counts as Mar 1). County frost dates are
// "unwrapped": lsf may be below 1 (a late-December last frost) and fff above 365 (an
// early-January first frost), so lsf < fff always holds.
//
// Frost counties (season under 300 days): a crop is open when the day falls inside one
// of its windows and the average high is inside the crop's `hi` range. Windows are the
// crop's frost-anchored windows from crops.ts, adjusted per county:
//   - slid later (up to 10 weeks, keeping their length) when it's still too cold at the
//     usual start, e.g. Seattle's cool spring pushes tomatoes into late May;
//   - a hardy crop's spring and fall windows merge when summer stays inside its range
//     (lettuce all summer in Seattle or Fairbanks);
//   - a tender crop's window closes early enough to harvest before the first frost.
//
// Mild counties (frost-free, or 300+ frost-free days): frost windows mean little, so
// planting follows temperature: the average high must suit the crop, hardy crops must not
// be heading into heat over the next six weeks, and tender crops need warm enough nights
// (`minLow`) and must dodge the short frost period if there is one. Indoor sowing doesn't
// apply.

import { CROPS, GROUPS, type Crop, type GroupId, type Method } from "@data/when-to-plant/crops";

export interface County {
  n: string; // name
  s: string; // state abbreviation
  lsf: number | null; // last spring frost, 50% (unwrapped day-of-year)
  fff: number | null; // first fall frost, 50%
  ff: boolean; // frost-free
  hi: number[]; // average daily high per month, °F
  lo: number[]; // average nightly low per month, °F
  c: [number, number]; // [lon, lat] of the population center
  src: number; // stations used
  est: boolean; // no station within 150 km; nearest one used
}

export type Phase = GroupId | "rest";
export type OutdoorMethod = Exclude<Method, "indoors">;

export const MILD_SEASON_DAYS = 300;
const MAX_SLIDE_DAYS = 70;
const LOOKAHEAD_DAYS = 42;
const DEFAULT_MIN_LOW = 50;

const MONTH_START = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const MONTH_MID = MONTH_START.map((s, i) => s + ((MONTH_START[i + 1] ?? 365) - s) / 2);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const wrapDay = (d: number) => ((((Math.round(d) - 1) % 365) + 365) % 365) + 1;

export function dayOfYear(date: Date): number {
  const m = date.getMonth();
  const d = date.getDate();
  // Feb 29 → Mar 1 so every date lands on a 365-day calendar.
  if (m === 1 && d === 29) return MONTH_START[2] + 1;
  return MONTH_START[m] + d;
}

function monthOf(day: number) {
  const d = wrapDay(day);
  const m = MONTH_START.findLastIndex((s) => s < d);
  return { m, date: d - MONTH_START[m] };
}

/** "Oct 18" */
export function formatDay(day: number): string {
  const { m, date } = monthOf(day);
  return `${MONTHS[m]} ${date}`;
}

/** "October 18" */
export function formatDayLong(day: number): string {
  const { m, date } = monthOf(day);
  return `${MONTHS_LONG[m]} ${date}`;
}

export const MONTH_TICKS = MONTH_START.map((s, i) => ({ day: s + 1, label: MONTHS[i] }));

/** Value on a day, interpolated between mid-month normals (wrapping Dec → Jan). */
function interpMonthly(values: number[], day: number): number {
  const d = wrapDay(day);
  const i = MONTH_MID.findLastIndex((mid) => mid <= d);
  const a = i === -1 ? 11 : i;
  const b = (a + 1) % 12;
  const aDay = i === -1 ? MONTH_MID[11] - 365 : MONTH_MID[a];
  const bDay = a === 11 ? MONTH_MID[0] + 365 : MONTH_MID[b];
  const t = (d - aDay) / (bDay - aDay);
  return values[a] + (values[b] - values[a]) * t;
}

export const avgHighOn = (county: County, day: number) => interpMonthly(county.hi, day);
export const avgLowOn = (county: County, day: number) => interpMonthly(county.lo, day);

export function seasonLength(county: County): number {
  return county.ff || county.lsf === null || county.fff === null ? 365 : county.fff - county.lsf;
}

// ---------------------------------------------------------------------------
// Per-county preparation (cached)

interface Span {
  method: Method;
  start: number; // unwrapped day
  end: number;
}

interface Prepared {
  mild: boolean;
  highs: Float32Array; // index 1–365
  lows: Float32Array;
  spans: Map<string, Span[]>; // frost counties only, by crop id
}

const cache = new WeakMap<County, Prepared>();

function prepare(county: County): Prepared {
  const hit = cache.get(county);
  if (hit) return hit;
  const highs = new Float32Array(366);
  const lows = new Float32Array(366);
  for (let d = 1; d <= 365; d++) {
    highs[d] = avgHighOn(county, d);
    lows[d] = avgLowOn(county, d);
  }
  const mild = seasonLength(county) >= MILD_SEASON_DAYS;
  const prepared: Prepared = { mild, highs, lows, spans: new Map() };
  if (!mild) for (const crop of CROPS) prepared.spans.set(crop.id, buildSpans(county, crop, highs));
  cache.set(county, prepared);
  return prepared;
}

const highOk = (highs: Float32Array, crop: Crop, day: number) => {
  const h = highs[wrapDay(day)];
  return h >= crop.hi[0] && h <= crop.hi[1];
};

function buildSpans(county: County, crop: Crop, highs: Float32Array): Span[] {
  const lsf = county.lsf!;
  const fff = county.fff!;
  const season = fff - lsf;
  const spans: Span[] = [];
  let springSlide = 0;

  for (const win of crop.windows) {
    if (win.method === "indoors") continue;
    if (win.minSeason && season < win.minSeason) continue;
    const anchor = win.anchor === "lsf" ? lsf : fff;
    let start = anchor + win.from * 7;
    const len = (win.to - win.from) * 7;
    let slide = 0;
    while (slide <= MAX_SLIDE_DAYS && !highOk(highs, crop, start + slide)) slide++;
    if (slide > MAX_SLIDE_DAYS) continue;
    start += slide;
    let end = start + len;
    if (crop.tender && crop.days) end = Math.min(end, fff - crop.days);
    if (end < start) continue;
    if (win.anchor === "lsf" && spans.every((s) => s.start > start)) springSlide = slide;
    spans.push({ method: win.method, start, end });
  }

  // Hardy crops: bridge spring and fall plantings when summer never gets too hot.
  if (!crop.tender) {
    const spring = spans.filter((s) => s.start < lsf + season / 2);
    const fall = spans.filter((s) => s.start >= lsf + season / 2);
    if (spring.length && fall.length) {
      const a = spring.reduce((x, y) => (y.end > x.end ? y : x));
      const b = fall.reduce((x, y) => (y.start < x.start ? y : x));
      let cool = true;
      for (let d = a.end; d <= b.start && cool; d++) cool = highOk(highs, crop, d);
      if (cool) spans.push({ method: a.method, start: a.start, end: b.end });
    }
  }

  // Indoor sowing shifts with the spring outdoor window it feeds.
  for (const win of crop.windows) {
    if (win.method !== "indoors") continue;
    const anchor = win.anchor === "lsf" ? lsf : fff;
    spans.push({ method: "indoors", start: anchor + win.from * 7 + springSlide, end: anchor + win.to * 7 + springSlide });
  }
  return spans;
}

const spanHas = (s: Span, day: number) =>
  [day, day + 365, day - 365].some((d) => d >= s.start && d <= s.end);

function inFrostPeriod(county: County, day: number): boolean {
  if (county.ff || county.lsf === null || county.fff === null) return false;
  const { lsf, fff } = county;
  return [day, day + 365, day - 365].some((d) => d > fff && d < lsf + 365);
}

// ---------------------------------------------------------------------------
// Queries

/** How the crop goes in outside on this day (direct sow / transplant), or null if it doesn't. */
export function outdoorMethod(county: County, crop: Crop, day: number): OutdoorMethod | null {
  const p = prepare(county);
  if (!highOk(p.highs, crop, day)) return null;

  if (p.mild) {
    // Hardy crops bolt in heat: skip them if it's getting too hot over the next six weeks.
    if (!crop.tender && p.highs[wrapDay(day + LOOKAHEAD_DAYS)] > crop.hi[1] + 3) return null;
    if (crop.tender) {
      // Tender crops need warm nights now and six weeks on (keeps tomatoes out of a cooling fall).
      const minLow = crop.minLow ?? DEFAULT_MIN_LOW;
      if (p.lows[wrapDay(day)] < minLow || p.lows[wrapDay(day + LOOKAHEAD_DAYS)] < minLow - 3) return null;
      const days = crop.days ?? 60;
      if ([0, days / 2, days].some((k) => inFrostPeriod(county, day + k))) return null;
    }
    const first = crop.windows.find((w) => w.method !== "indoors");
    return (first?.method as OutdoorMethod) ?? null;
  }

  for (const span of p.spans.get(crop.id) ?? []) {
    if (span.method !== "indoors" && spanHas(span, day)) return span.method as OutdoorMethod;
  }
  return null;
}

/** Whether it's time to start this crop's seeds indoors (frost counties only). */
export function indoorOpen(county: County, crop: Crop, day: number): boolean {
  const p = prepare(county);
  if (p.mild) return false;
  return (p.spans.get(crop.id) ?? []).some((s) => s.method === "indoors" && spanHas(s, day));
}

const GROUP_INDEX = Object.fromEntries(GROUPS.map((g, i) => [g.id, i])) as Record<GroupId, number>;
const GROUP_SIZE = GROUPS.map((g) => CROPS.filter((c) => c.group === g.id).length);

/** Open outdoor crop count per group, in GROUPS order. */
export function groupCounts(county: County, day: number): number[] {
  const counts = GROUPS.map(() => 0);
  for (const crop of CROPS) {
    if (outdoorMethod(county, crop, day)) counts[GROUP_INDEX[crop.group]]++;
  }
  return counts;
}

/**
 * The county's color: the group with the largest share of its crops open (so small
 * groups like Tomatoes & kin aren't drowned out by big ones), ties broken by count and
 * then GROUPS order. "rest" when nothing can go outside.
 */
export function phaseFromCounts(counts: number[]): Phase {
  let best = -1;
  let bestShare = 0;
  counts.forEach((n, i) => {
    if (n === 0) return;
    const share = n / GROUP_SIZE[i];
    if (share > bestShare || (share === bestShare && n > counts[best])) {
      best = i;
      bestShare = share;
    }
  });
  return best === -1 ? "rest" : GROUPS[best].id;
}

export const groupSize = (group: GroupId) => GROUP_SIZE[GROUP_INDEX[group]];
export const isMild = (county: County) => prepare(county).mild;

export interface Opening {
  crop: Crop;
  method: Method;
  /** Last day of this stretch (day-of-year), or null if it stays open all year. */
  until: number | null;
}

export interface Upcoming {
  crop: Crop;
  method: Method;
  /** Day the next window opens, and how many days away it is. */
  day: number;
  inDays: number;
}

function runEnd(open: (d: number) => boolean, day: number): number | null {
  for (let i = 1; i <= 365; i++) if (!open(day + i)) return wrapDay(day + i - 1);
  return null;
}

/** Everything for the county panel. */
export function countyReport(county: County, day: number) {
  const outdoor: Opening[] = [];
  const indoors: Opening[] = [];
  const upcoming: Upcoming[] = [];

  for (const crop of CROPS) {
    const method = outdoorMethod(county, crop, day);
    if (method) {
      outdoor.push({ crop, method, until: runEnd((d) => outdoorMethod(county, crop, d) !== null, day) });
    } else {
      for (let i = 1; i <= 120; i++) {
        const m = outdoorMethod(county, crop, day + i);
        if (m) {
          upcoming.push({ crop, method: m, day: wrapDay(day + i), inDays: i });
          break;
        }
      }
    }
    if (indoorOpen(county, crop, day)) {
      indoors.push({ crop, method: "indoors", until: runEnd((d) => indoorOpen(county, crop, d), day) });
    }
  }
  upcoming.sort((a, b) => a.inDays - b.inDays);
  return { outdoor, indoors, upcoming: upcoming.slice(0, 6) };
}
