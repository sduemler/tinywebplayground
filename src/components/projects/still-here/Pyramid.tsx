import { useMemo } from "react";
import styles from "./Pyramid.module.css";
import type { PyramidRow } from "./lifespan";

interface Props {
  rows: PyramidRow[];
  /** user's exact age, in years */
  currentAge: number;
  /** band index that contains the user's current age */
  currentBandIndex: number;
  /** lx at user's exact age (interpolated) */
  lxAtCurrent: number;
  /** median projected death age */
  medianDeathAge: number;
  /** lx at median death age */
  lxAtMedian: number;
  /** caption shown under the pyramid (e.g., "United States · women · 2021 cohort") */
  caption: string;
}

const W = 760;
const H_BAND = 24;
const H_TOP_PAD = 80;
const H_BOTTOM_PAD = 152;
const BAR_CENTER = 380;
const MAX_BAR = 400;
const COHORT = 100_000;
const LABEL_X = 70;
const SCALE_TICKS = [25_000, 50_000, 75_000, 100_000];

function widthForLx(lx: number): number {
  return MAX_BAR * (lx / COHORT);
}

function yForRow(rowsLength: number, bandIndex: number): number {
  return H_TOP_PAD + (rowsLength - 1 - bandIndex) * H_BAND;
}

function yForExactAge(
  rowsLength: number,
  bandStartAges: number[],
  age: number,
): number {
  const lastIdx = bandStartAges.length - 1;
  if (age >= bandStartAges[lastIdx]) {
    const tailEnd = 105;
    const frac = Math.min(
      1,
      (age - bandStartAges[lastIdx]) / (tailEnd - bandStartAges[lastIdx]),
    );
    return yForRow(rowsLength, lastIdx) - frac * H_BAND;
  }
  for (let i = lastIdx - 1; i >= 0; i--) {
    if (age >= bandStartAges[i]) {
      const frac =
        (age - bandStartAges[i]) /
        (bandStartAges[i + 1] - bandStartAges[i]);
      return yForRow(rowsLength, i) + (1 - frac) * H_BAND;
    }
  }
  return yForRow(rowsLength, 0) + H_BAND;
}

export default function Pyramid({
  rows,
  currentAge,
  currentBandIndex,
  lxAtCurrent,
  medianDeathAge,
  lxAtMedian,
  caption,
}: Props) {
  const totalH = H_TOP_PAD + rows.length * H_BAND + H_BOTTOM_PAD;
  const bandStartAges = useMemo(() => rows.map((r) => r.startAge), [rows]);

  const youY = yForExactAge(rows.length, bandStartAges, currentAge);
  const youBarWidth = widthForLx(lxAtCurrent);

  const barBaseY = yForRow(rows.length, 0) + H_BAND;
  const scaleY = barBaseY + 28;
  const scaleNumeralY = scaleY + 14;
  const scaleLegendY = scaleY + 30;
  const captionRuleY = scaleY + 58;
  const captionTextY = scaleY + 80;

  return (
    <svg
      className={styles.svg}
      viewBox={`0 0 ${W} ${totalH}`}
      role="img"
      aria-label="Survival pyramid"
    >
      <defs>
        <pattern
          id="sh-hatch"
          patternUnits="userSpaceOnUse"
          width="5"
          height="5"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="5"
            stroke="var(--still-accent, var(--color-accent))"
            strokeWidth="0.7"
            opacity="0.55"
          />
        </pattern>

        <pattern
          id="sh-stipple"
          patternUnits="userSpaceOnUse"
          width="4"
          height="4"
        >
          <circle
            cx="2"
            cy="2"
            r="0.55"
            fill="var(--still-accent, var(--color-accent))"
            opacity="0.35"
          />
        </pattern>

        <linearGradient id="sh-livedGrad" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0"
            stopColor="var(--still-accent, var(--color-accent))"
            stopOpacity="0.88"
          />
          <stop
            offset="1"
            stopColor="var(--still-accent, var(--color-accent))"
            stopOpacity="1"
          />
        </linearGradient>

        <linearGradient id="sh-youGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c97b2e" stopOpacity="1" />
          <stop offset="1" stopColor="#a85e2e" stopOpacity="1" />
        </linearGradient>
      </defs>

      <rect
        className={styles.outerFrame}
        x="6"
        y="6"
        width={W - 12}
        height={totalH - 12}
        rx="3"
      />
      <rect
        className={styles.innerFrame}
        x="11"
        y="11"
        width={W - 22}
        height={totalH - 22}
        rx="2"
      />

      <g className={styles.titlePlate}>
        <text x={W / 2} y="32" className={styles.titleEyebrow}>
          ✦  PLATE  I  ✦
        </text>
        <text x={W / 2} y="56" className={styles.titleMain}>
          COHORT  SURVIVAL
        </text>
        <line
          className={styles.titleRule}
          x1="62"
          y1="64"
          x2={W - 62}
          y2="64"
        />
      </g>

      <line
        className={styles.centerLine}
        x1={BAR_CENTER}
        y1={H_TOP_PAD - 6}
        x2={BAR_CENTER}
        y2={barBaseY + 4}
      />

      {rows.map((row) => {
        const y = yForRow(rows.length, row.bandIndex);
        const w = widthForLx(row.lx);
        const isYou = row.bandIndex === currentBandIndex;
        const isPast = row.bandIndex < currentBandIndex;
        const fillCls = isYou
          ? styles.barYou
          : isPast
            ? styles.barLived
            : styles.barFuture;
        const delayMs = row.bandIndex * 28;

        return (
          <g key={row.bandIndex}>
            <rect
              className={`${styles.bar} ${fillCls}`}
              x={BAR_CENTER - w / 2}
              y={y + 2}
              width={w}
              height={H_BAND - 4}
              rx={1.5}
              style={{ animationDelay: `${delayMs}ms` }}
            />

            {isYou && (
              <>
                <path
                  className={styles.youBracketLeft}
                  d={`M ${BAR_CENTER - w / 2 - 3} ${y + 4}
                      L ${BAR_CENTER - w / 2 - 7} ${y + 4}
                      L ${BAR_CENTER - w / 2 - 7} ${y + H_BAND - 4}
                      L ${BAR_CENTER - w / 2 - 3} ${y + H_BAND - 4}`}
                  style={{ animationDelay: `${delayMs + 120}ms` }}
                />
                <path
                  className={styles.youBracketRight}
                  d={`M ${BAR_CENTER + w / 2 + 3} ${y + 4}
                      L ${BAR_CENTER + w / 2 + 7} ${y + 4}
                      L ${BAR_CENTER + w / 2 + 7} ${y + H_BAND - 4}
                      L ${BAR_CENTER + w / 2 + 3} ${y + H_BAND - 4}`}
                  style={{ animationDelay: `${delayMs + 120}ms` }}
                />
              </>
            )}

            <line
              className={styles.bandTick}
              x1={LABEL_X}
              y1={y + H_BAND / 2}
              x2={LABEL_X + 4}
              y2={y + H_BAND / 2}
            />
            <text
              className={`${styles.bandLabel} ${isYou ? styles.bandLabelActive : ""}`}
              x={LABEL_X - 4}
              y={y + H_BAND / 2 + 3.5}
            >
              {row.label}
            </text>
          </g>
        );
      })}

      <g className={styles.scaleGroup}>
        <line
          className={styles.scaleBaseline}
          x1={BAR_CENTER - MAX_BAR / 2}
          y1={scaleY}
          x2={BAR_CENTER + MAX_BAR / 2}
          y2={scaleY}
        />
        {SCALE_TICKS.flatMap((tick) => {
          const half = widthForLx(tick) / 2;
          const showLabel = tick === 100_000 || tick === 50_000;
          const labelText = tick === 100_000 ? "100K" : "50K";
          return [
            <line
              key={`l-${tick}`}
              className={styles.scaleTick}
              x1={BAR_CENTER - half}
              y1={scaleY - 3}
              x2={BAR_CENTER - half}
              y2={scaleY + 3}
            />,
            <line
              key={`r-${tick}`}
              className={styles.scaleTick}
              x1={BAR_CENTER + half}
              y1={scaleY - 3}
              x2={BAR_CENTER + half}
              y2={scaleY + 3}
            />,
            showLabel ? (
              <text
                key={`nl-${tick}`}
                x={BAR_CENTER - half}
                y={scaleNumeralY}
                className={styles.scaleTickLabel}
              >
                {labelText}
              </text>
            ) : null,
            showLabel ? (
              <text
                key={`nr-${tick}`}
                x={BAR_CENTER + half}
                y={scaleNumeralY}
                className={styles.scaleTickLabel}
              >
                {labelText}
              </text>
            ) : null,
          ];
        })}
        <text
          x={BAR_CENTER}
          y={scaleLegendY}
          className={styles.scaleLegend}
        >
          SURVIVORS  PER  100,000  BORN
        </text>
      </g>

      <g className={styles.youGroup}>
        <line
          className={styles.youLine}
          x1={BAR_CENTER - youBarWidth / 2 - 6}
          y1={youY}
          x2={BAR_CENTER + youBarWidth / 2 + 6}
          y2={youY}
        />
        <circle
          className={styles.youDot}
          cx={BAR_CENTER + youBarWidth / 2}
          cy={youY}
          r="2.5"
        />

        <g
          className={styles.youFlag}
          transform={`translate(${BAR_CENTER + youBarWidth / 2}, ${youY - 9})`}
        >
          <path
            className={styles.youFlagBanner}
            d="M 0 9 L 10 0 L 102 0 L 102 18 L 10 18 Z"
          />
          <text className={styles.youLabel} x="56" y="12">
            YOU  ARE  HERE
          </text>
        </g>
      </g>

      <g className={styles.captionPlate}>
        <line
          className={styles.captionRule}
          x1="62"
          y1={captionRuleY}
          x2={W - 62}
          y2={captionRuleY}
        />
        <text x={W / 2} y={captionTextY} className={styles.captionMain}>
          {caption}
        </text>
      </g>
    </svg>
  );
}
