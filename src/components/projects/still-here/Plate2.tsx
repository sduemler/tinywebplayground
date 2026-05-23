import { useMemo } from "react";
import styles from "./Pyramid.module.css";
import { lxAtAge } from "./lifespan";

interface Props {
  lx: number[];
  bandStartAge: number[];
  currentAge: number;
  medianDeathAge: number;
  caption: string;
}

const W = 760;
const PLOT_LEFT = 90;
const PLOT_RIGHT = W - 60;
const PLOT_TOP = 110;
const PLOT_BOTTOM = 640;
const AGE_MIN = 0;
const AGE_MAX = 105;
const TOTAL_H = 760;

function xForAge(age: number): number {
  return (
    PLOT_LEFT + ((age - AGE_MIN) / (AGE_MAX - AGE_MIN)) * (PLOT_RIGHT - PLOT_LEFT)
  );
}

export default function Plate2({
  lx,
  bandStartAge,
  currentAge,
  medianDeathAge,
  caption,
}: Props) {
  const dxYearly = useMemo(() => {
    const arr: number[] = [];
    for (let age = AGE_MIN; age < AGE_MAX; age++) {
      const top = lxAtAge(bandStartAge, lx, age);
      const bot = lxAtAge(bandStartAge, lx, age + 1);
      arr.push(Math.max(0, top - bot));
    }
    return arr;
  }, [bandStartAge, lx]);

  const maxDx = useMemo(() => Math.max(...dxYearly, 1), [dxYearly]);
  const niceMax = Math.ceil(maxDx / 500) * 500;
  const yScale = (PLOT_BOTTOM - PLOT_TOP) / niceMax;
  const barWidth = (PLOT_RIGHT - PLOT_LEFT) / dxYearly.length;

  const currentAgeX = xForAge(Math.min(Math.max(currentAge, 0), AGE_MAX));
  const medianX = xForAge(Math.min(Math.max(medianDeathAge, 0), AGE_MAX));

  const baselineY = PLOT_BOTTOM;
  const xAxisLegendY = baselineY + 38;
  const captionRuleY = baselineY + 70;
  const captionTextY = captionRuleY + 22;

  const yTicks = [0, niceMax / 4, niceMax / 2, (3 * niceMax) / 4, niceMax];

  const fmtTick = (v: number): string => {
    if (v === 0) return "0";
    if (v >= 1000) {
      const k = v / 1000;
      return Number.isInteger(k) ? `${k}K` : `${k.toFixed(1)}K`;
    }
    return String(Math.round(v));
  };

  return (
    <svg
      className={styles.svg}
      viewBox={`0 0 ${W} ${TOTAL_H}`}
      role="img"
      aria-label="Age-at-death distribution"
    >
      <defs>
        <pattern
          id="sh-hatch2"
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
            opacity="0.5"
          />
        </pattern>

        <linearGradient id="sh-deathGrad" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0"
            stopColor="var(--still-accent, var(--color-accent))"
            stopOpacity="0.85"
          />
          <stop
            offset="1"
            stopColor="var(--still-accent, var(--color-accent))"
            stopOpacity="1"
          />
        </linearGradient>
      </defs>

      <rect
        className={styles.outerFrame}
        x="6"
        y="6"
        width={W - 12}
        height={TOTAL_H - 12}
        rx="3"
      />
      <rect
        className={styles.innerFrame}
        x="11"
        y="11"
        width={W - 22}
        height={TOTAL_H - 22}
        rx="2"
      />

      <g className={styles.titlePlate}>
        <text x={W / 2} y="32" className={styles.titleEyebrow}>
          ✦  PLATE  II  ✦
        </text>
        <text x={W / 2} y="56" className={styles.titleMain}>
          AGES  AT  DEATH
        </text>
        <line
          className={styles.titleRule}
          x1="62"
          y1="64"
          x2={W - 62}
          y2="64"
        />
      </g>

      <g className={styles.scaleGroup}>
        {yTicks.map((tick, i) => {
          const y = baselineY - tick * yScale;
          return (
            <g key={i}>
              <line
                className={styles.gridLine}
                x1={PLOT_LEFT}
                y1={y}
                x2={PLOT_RIGHT}
                y2={y}
              />
              <text
                className={styles.scaleTickLabel}
                x={PLOT_LEFT - 8}
                y={y + 3}
                textAnchor="end"
              >
                {fmtTick(tick)}
              </text>
            </g>
          );
        })}
        <text
          x={PLOT_LEFT - 56}
          y={(PLOT_TOP + PLOT_BOTTOM) / 2}
          className={styles.scaleLegend}
          transform={`rotate(-90 ${PLOT_LEFT - 56} ${
            (PLOT_TOP + PLOT_BOTTOM) / 2
          })`}
        >
          DEATHS  PER  YEAR  (PER  100K  BORN)
        </text>
      </g>

      <g className={styles.deathBars}>
        {dxYearly.map((dx, i) => {
          const age = AGE_MIN + i;
          const h = dx * yScale;
          const x = xForAge(age);
          const isPast = age < Math.floor(currentAge);
          const fillCls = isPast
            ? styles.deathBarPast
            : styles.deathBarFuture;
          const delayMs = i * 8;
          return (
            <rect
              key={i}
              className={`${styles.bar} ${fillCls}`}
              x={x}
              y={baselineY - h}
              width={Math.max(0.5, barWidth - 0.3)}
              height={h}
              style={{ animationDelay: `${delayMs}ms`, transformOrigin: `${x}px ${baselineY}px` }}
            />
          );
        })}
      </g>

      <line
        className={styles.scaleBaseline}
        x1={PLOT_LEFT - 2}
        y1={baselineY}
        x2={PLOT_RIGHT + 2}
        y2={baselineY}
      />

      {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((age) => (
        <g key={age}>
          <line
            className={styles.scaleTick}
            x1={xForAge(age)}
            y1={baselineY}
            x2={xForAge(age)}
            y2={baselineY + 4}
          />
          <text
            x={xForAge(age)}
            y={baselineY + 16}
            className={styles.scaleTickLabel}
          >
            {age}
          </text>
        </g>
      ))}
      <text
        x={(PLOT_LEFT + PLOT_RIGHT) / 2}
        y={xAxisLegendY}
        className={styles.scaleLegend}
      >
        AGE  AT  DEATH  (YEARS)
      </text>

      {currentAge > 0 && currentAge < AGE_MAX && (
        <g className={styles.youGroup}>
          <line
            className={styles.currentAgeLine}
            x1={currentAgeX}
            y1={PLOT_TOP - 4}
            x2={currentAgeX}
            y2={baselineY}
          />
          <text
            x={currentAgeX}
            y={PLOT_TOP - 10}
            className={styles.currentAgeLabel}
            textAnchor="middle"
          >
            AGE  {Math.round(currentAge)}
          </text>
        </g>
      )}

      <g className={styles.youGroup}>
        <line
          className={styles.medianLine}
          x1={medianX}
          y1={PLOT_TOP - 4}
          x2={medianX}
          y2={baselineY}
        />
        <g
          className={styles.youFlag}
          transform={`translate(${medianX}, ${PLOT_TOP - 28})`}
        >
          <path
            className={styles.youFlagBanner}
            d="M -56 9 L -46 0 L 46 0 L 46 18 L -46 18 Z"
          />
          <text className={styles.youLabel} x="0" y="12" textAnchor="middle">
            MEDIAN  {medianDeathAge}
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
