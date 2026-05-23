import type { LifeTablesData, Sex } from "./types";

// All math operates on the WHO life-table arrays: lx[i] = number of an original
// cohort of 100,000 still alive at the start of age band i (19 bands total).
// Bands are non-uniform (0-1, 1-4, 5-9, ..., 80-84, 85+).
//
// WHO data stops at the open "85+" band. To extend past it we use a Gompertz
// late-life mortality model — μ(age) = μ₀·exp(b·(age − 82.5)) — calibrated so
// that μ at age 82.5 equals the observed annual hazard across the 80–84 band.
// b = 0.09/yr is a standard value for human late-life mortality.

const TAIL_GOMPERTZ_B = 0.09;

/** Synthetic pyramid bands past WHO's open 85+ band. */
export const TAIL_BAND_STARTS_PAST_LAST = [90, 95, 100];
export const TAIL_OPEN_BAND_END = 110;

export interface PyramidRow {
  /** index 0..18 */
  bandIndex: number;
  /** human label, e.g. "35–39" */
  label: string;
  /** age at the start of this band */
  startAge: number;
  /** age at the end of this band (exclusive), or null for the open 85+ band */
  endAge: number | null;
  /** survivors at the start of this band (out of 100,000) */
  lx: number;
  /** survivors as a fraction of the original cohort (0..1) */
  pct: number;
}

export function bandLabel(band: string): string {
  if (band === "85PLUS") return "85+";
  if (band === "00-01") return "<1";
  if (band === "01-04") return "1–4";
  // "05-09" -> "5–9", "10-14" -> "10–14"
  const [a, b] = band.split("-");
  return `${parseInt(a, 10)}–${parseInt(b, 10)}`;
}

export function lifeTableFor(
  data: LifeTablesData,
  countryCode: string,
  sex: Sex,
): number[] | null {
  const t = data.tables[countryCode];
  if (!t) return null;
  if (sex === "M") return t.M;
  if (sex === "F") return t.F;
  return t.B;
}

export function buildPyramidRows(
  data: LifeTablesData,
  lx: number[],
): PyramidRow[] {
  const lastIdx = data.bandStartAge.length - 1;
  const baseRows: PyramidRow[] = data.ageBands.slice(0, lastIdx).map((band, i) => ({
    bandIndex: i,
    label: bandLabel(band),
    startAge: data.bandStartAge[i],
    endAge: data.bandStartAge[i + 1],
    lx: lx[i],
    pct: lx[i] / lx[0],
  }));

  // Replace WHO's open 85+ band with modeled sub-bands that taper toward zero.
  const tailStarts = [data.bandStartAge[lastIdx], ...TAIL_BAND_STARTS_PAST_LAST];
  const tailRows: PyramidRow[] = tailStarts.map((startAge, j) => {
    const endAge = j + 1 < tailStarts.length ? tailStarts[j + 1] : null;
    const lxHere = lxAtAge(data.bandStartAge, lx, startAge);
    const label = endAge !== null ? `${startAge}–${endAge - 1}` : `${startAge}+`;
    return {
      bandIndex: baseRows.length + j,
      label,
      startAge,
      endAge,
      lx: lxHere,
      pct: lxHere / lx[0],
    };
  });

  return [...baseRows, ...tailRows];
}

/** Returns the index of the pyramid row that contains the given age. */
export function bandIndexForRow(rows: PyramidRow[], age: number): number {
  if (age <= 0) return 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (age >= rows[i].startAge) return i;
  }
  return 0;
}

/**
 * Index of the band that contains the given age. For age >= 85 returns the
 * last band index.
 */
export function bandIndexForAge(
  bandStartAge: number[],
  age: number,
): number {
  if (age < 0) return 0;
  for (let i = bandStartAge.length - 1; i >= 0; i--) {
    if (age >= bandStartAge[i]) return i;
  }
  return 0;
}

/**
 * Linearly interpolate lx at an exact age within the WHO bands. For ages past
 * the last band start (85+), extrapolates with a Gompertz hazard calibrated to
 * the observed 80–84 annual mortality. Returns 0 once survivors are <0.5.
 */
export function lxAtAge(
  bandStartAge: number[],
  lx: number[],
  age: number,
): number {
  if (age <= 0) return lx[0];
  const lastIdx = bandStartAge.length - 1;
  const lastStart = bandStartAge[lastIdx];
  if (age >= lastStart) {
    // Annual hazard observed across the 80–84 band; reference age 82.5.
    const prev = lx[lastIdx - 1];
    const here = lx[lastIdx];
    if (here <= 0 || prev <= 0) return 0;
    const muRef = -Math.log(here / prev) / 5;
    const b = TAIL_GOMPERTZ_B;
    const k = age - lastStart;
    // ∫₀ᵏ muRef·exp(b·(2.5 + s)) ds  =  (muRef/b)·exp(2.5b)·(exp(bk) − 1)
    const integral =
      (muRef / b) * Math.exp(b * 2.5) * (Math.exp(b * k) - 1);
    const out = here * Math.exp(-integral);
    return out < 0.5 ? 0 : out;
  }
  const i = bandIndexForAge(bandStartAge, age);
  const startA = bandStartAge[i];
  const startB = bandStartAge[i + 1];
  const frac = (age - startA) / (startB - startA);
  return lx[i] + (lx[i + 1] - lx[i]) * frac;
}

export interface SurvivalStats {
  currentAge: number;
  /** % of original cohort still alive at user's current age (0..100) */
  pctOfCohortStillAlive: number;
  /** median remaining lifespan in years (rounded) */
  medianRemainingYears: number;
  /** projected median age at death */
  medianDeathAge: number;
  /** fraction of projected lifespan already lived (0..1, can exceed 1) */
  pctOfLifeLived: number;
  /** true if the user is past the original cohort's median age at death */
  pastOriginalMedian: boolean;
}

export function computeStats(
  bandStartAge: number[],
  lx: number[],
  currentAge: number,
): SurvivalStats {
  const lxNow = lxAtAge(bandStartAge, lx, currentAge);
  const pctOfCohortStillAlive = (lxNow / lx[0]) * 100;

  // Median remaining life: find the age at which lxAtAge drops to lxNow/2.
  // Walk in 1-year steps from currentAge to 105.
  const targetLx = lxNow / 2;
  let medianDeathAge = currentAge;
  for (let a = currentAge + 1; a <= TAIL_OPEN_BAND_END; a++) {
    if (lxAtAge(bandStartAge, lx, a) <= targetLx) {
      medianDeathAge = a;
      break;
    }
    medianDeathAge = a;
  }

  // Median of the original cohort (used to phrase "past the median" copy).
  const originalMedianTarget = lx[0] / 2;
  let originalMedianAge = 0;
  for (let a = 0; a <= TAIL_OPEN_BAND_END; a++) {
    if (lxAtAge(bandStartAge, lx, a) <= originalMedianTarget) {
      originalMedianAge = a;
      break;
    }
  }

  return {
    currentAge,
    pctOfCohortStillAlive,
    medianRemainingYears: Math.max(0, medianDeathAge - currentAge),
    medianDeathAge,
    pctOfLifeLived: medianDeathAge > 0 ? currentAge / medianDeathAge : 1,
    pastOriginalMedian: currentAge >= originalMedianAge,
  };
}
