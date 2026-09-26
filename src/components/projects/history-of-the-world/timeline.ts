import { NOW_YEAR, type HistoryEvent } from "@data/history-of-the-world/events";

// ── Scale ────────────────────────────────────────────────────────────────────
// An unrolled gap's length grows as a power of the years it spans:
//   px = SCALE_K · years^SCALE_P
// With P = 0.3, a gap ten times longer is drawn about twice as long, so
// 100 yrs ≈ 290px, 10,000 yrs ≈ 1,150px, 1M yrs ≈ 4,500px, 1B yrs ≈ 36,000px.
// Every gap unrolled at once is still only a few hundred screens.
export const SCALE_K = 72;
export const SCALE_P = 0.3;

/** Gaps shorter than this always show at their scaled length (no fold). */
export const FOLD_THRESHOLD_YEARS = 50;

/** Whole pixels, so server- and client-rendered heights match exactly. */
export function gapPx(years: number) {
  return years <= 0 ? 0 : Math.round(SCALE_K * Math.pow(years, SCALE_P));
}

export const isFoldable = (years: number) => years >= FOLD_THRESHOLD_YEARS;

// ── Formatting ───────────────────────────────────────────────────────────────

/** Round to `n` significant figures and drop trailing zeros. */
function sig(x: number, n = 3) {
  return String(Number(x.toPrecision(n)));
}

function groupDigits(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

/** "4.54 billion years ago" / "66 million years ago" / "74,000 years ago". */
export function formatAgo(ago: number, digits = 3) {
  if (ago >= 1e9) return `${sig(ago / 1e9, digits)} billion years ago`;
  if (ago >= 1e6) return `${sig(ago / 1e6, digits)} million years ago`;
  return `${groupDigits(Number(ago.toPrecision(digits)))} years ago`;
}

/** Like formatAgo, but with just enough decimals to tell `step`-spaced ticks apart. */
function formatAgoTick(ago: number, step: number) {
  const unit = ago >= 1e9 ? 1e9 : ago >= 1e6 ? 1e6 : 1;
  if (unit === 1) return `${groupDigits(ago)} years ago`;
  const decimals = Math.max(0, Math.ceil(-Math.log10(step / unit) - 1e-9));
  const n = Number((ago / unit).toFixed(decimals)).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return `${n} ${unit === 1e9 ? "billion" : "million"} years ago`;
}

/** A calendar year: "9500 BCE", "79 CE", "1492". */
export function formatYear(year: number) {
  const y = Math.round(year);
  if (y < 0) return `${Math.abs(y) >= 10000 ? groupDigits(-y) : -y} BCE`;
  if (y < 1000) return `${Math.max(1, y)} CE`;
  return String(y);
}

export function formatEventDate(ev: HistoryEvent) {
  const prefix = ev.approx ? "c. " : "";
  return ev.deep ? `${prefix}${formatAgo(NOW_YEAR - ev.year)}` : `${prefix}${formatYear(ev.year)}`;
}

/** Any moment on the scroll (used by the floating "you are here" seal). */
export function formatMoment(year: number) {
  const ago = NOW_YEAR - year;
  // One more significant figure than the event labels so the seal visibly
  // ticks over while you scroll through deep time.
  if (ago > 12000) return formatAgo(ago, ago >= 1e6 ? 4 : 3);
  return formatYear(year);
}

/** "≈ 1.08 billion years", "≈ 3,700 years", "12 years". */
export function formatSpan(years: number, approx: boolean) {
  let s: string;
  if (years >= 1e9) s = `${sig(years / 1e9)} billion years`;
  else if (years >= 1e6) s = `${sig(years / 1e6)} million years`;
  else if (years >= 1e4) s = `${groupDigits(Number(years.toPrecision(3)))} years`;
  else s = `${groupDigits(years)} ${Math.round(years) === 1 ? "year" : "years"}`;
  return approx || years >= 1e4 ? `≈ ${s}` : s;
}

// ── Ticks inside an unrolled gap ─────────────────────────────────────────────

export interface Tick {
  /** Distance from the top of the gap, px. */
  offset: number;
  label: string;
}

const TICK_SPACING_PX = 170;

function niceStep(raw: number) {
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  for (const m of [1, 2, 5, 10]) if (m * pow >= raw) return m * pow;
  return 10 * pow;
}

/**
 * Round-numbered ticks spaced roughly TICK_SPACING_PX apart. Deep-time gaps
 * are ticked in "years ago" (so labels read "3.2 billion years ago"), later
 * ones in calendar years.
 */
export function buildTicks(fromYear: number, toYear: number, heightPx: number): Tick[] {
  const span = toYear - fromYear;
  const want = Math.floor(heightPx / TICK_SPACING_PX);
  if (span <= 0 || want < 1) return [];
  const step = niceStep(span / want);
  const margin = step * 0.35;
  const ticks: Tick[] = [];
  const agoFrom = NOW_YEAR - fromYear;

  if (agoFrom > 12000) {
    const agoTo = NOW_YEAR - toYear;
    for (let a = Math.floor(agoFrom / step) * step; a > agoTo; a -= step) {
      if (a >= agoFrom - margin || a <= agoTo + margin) continue;
      const year = NOW_YEAR - a;
      ticks.push({ offset: ((year - fromYear) / span) * heightPx, label: formatAgoTick(a, step) });
    }
  } else {
    for (let y = Math.ceil(fromYear / step) * step; y < toYear; y += step) {
      if (y <= fromYear + margin || y >= toYear - margin) continue;
      ticks.push({ offset: ((y - fromYear) / span) * heightPx, label: formatYear(y) });
    }
  }
  return ticks;
}
