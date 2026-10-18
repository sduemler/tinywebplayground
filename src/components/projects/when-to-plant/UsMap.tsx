import { memo, useMemo, useRef, useState } from "react";
import { GROUPS, type GroupId } from "@data/when-to-plant/crops";
import { COUNTIES, COUNTY_SHAPES, MAP_WIDTH, NATION_OUTLINE, STATE_BORDERS } from "./data";
import type { Phase } from "./engine";
import { GROUP_COLORS, GROUP_HATCH, MUTED_COLOR, REST_COLOR, SURFACE } from "./palette";
import styles from "./WhenToPlant.module.css";

interface Props {
  view: [number, number, number, number];
  /** Phase per county, in COUNTY_SHAPES order. */
  phases: Phase[];
  /** Filter mode: open crops of the chosen group per county (COUNTY_SHAPES order), and the group size. */
  filter: { group: GroupId; counts: number[]; size: number } | null;
  patterns: boolean;
  selected: string | null;
  onCountyClick: (fips: string) => void;
  phaseLabel: (phase: Phase) => string;
}

const GROUP_NAME = Object.fromEntries(GROUPS.map((g) => [g.id, g.name])) as Record<GroupId, string>;

function fillFor(phase: Phase, patterns: boolean): string {
  if (phase === "rest") return REST_COLOR;
  return patterns && GROUP_HATCH[phase] ? `url(#hatch-${phase})` : GROUP_COLORS[phase];
}

// The 3,000-odd county paths only re-render when their fills change.
const Counties = memo(function Counties({ fills, opacities }: { fills: string[]; opacities: number[] | null }) {
  return (
    <g className={styles.counties}>
      {COUNTY_SHAPES.map((c, i) => (
        <path
          key={c.fips}
          d={c.d}
          data-fips={c.fips}
          fill={fills[i]}
          fillOpacity={opacities ? opacities[i] : undefined}
        />
      ))}
    </g>
  );
});

export default function UsMap({ view, phases, filter, patterns, selected, onCountyClick, phaseLabel }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ fips: string; x: number; y: number } | null>(null);
  const scale = MAP_WIDTH / view[2];

  // Memoized so hovering and zoom frames don't repaint every county.
  const { fills, opacities } = useMemo(() => {
    if (filter) {
      const color = patterns && GROUP_HATCH[filter.group] ? `url(#hatch-${filter.group})` : GROUP_COLORS[filter.group];
      return {
        fills: filter.counts.map((n) => (n > 0 ? color : MUTED_COLOR)),
        // Stronger where more of the group is open.
        opacities: filter.counts.map((n) => (n > 0 ? 0.45 + 0.55 * Math.min(1, n / filter.size) : 1)),
      };
    }
    return { fills: phases.map((p) => fillFor(p, patterns)), opacities: null };
  }, [phases, filter, patterns]);

  const selectedShape = selected ? COUNTY_SHAPES.find((c) => c.fips === selected) : null;
  const hoverIndex = hover ? COUNTY_SHAPES.findIndex((c) => c.fips === hover.fips) : -1;

  const fipsFrom = (target: EventTarget) => (target as Element).getAttribute?.("data-fips") ?? null;

  return (
    <div
      ref={wrapRef}
      className={styles.mapWrap}
      onPointerLeave={() => setHover(null)}
    >
      <svg
        className={styles.map}
        viewBox={view.join(" ")}
        role="img"
        aria-label={
          filter
            ? `Map of US counties showing where ${GROUP_NAME[filter.group].toLowerCase()} can be planted`
            : "Map of US counties colored by the main group of plants that can go in the ground"
        }
        onClick={(e) => {
          const fips = fipsFrom(e.target);
          if (fips) onCountyClick(fips);
        }}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const fips = fipsFrom(e.target);
          const box = wrapRef.current?.getBoundingClientRect();
          if (!fips || !box) return setHover(null);
          setHover({ fips, x: e.clientX - box.left, y: e.clientY - box.top });
        }}
      >
        <defs>
          {GROUPS.map((g) => {
            const angle = GROUP_HATCH[g.id];
            if (!angle) return null;
            const size = 4 / scale;
            return (
              <pattern
                key={g.id}
                id={`hatch-${g.id}`}
                patternUnits="userSpaceOnUse"
                width={size}
                height={size}
                patternTransform={`rotate(${angle})`}
              >
                <rect width={size} height={size} fill={GROUP_COLORS[g.id]} />
                <line x1={0} y1={0} x2={0} y2={size} stroke={SURFACE} strokeOpacity={0.75} strokeWidth={size * 0.45} />
              </pattern>
            );
          })}
        </defs>
        <Counties fills={fills} opacities={opacities} />
        <path className={styles.stateBorders} d={STATE_BORDERS} />
        <path className={styles.nationOutline} d={NATION_OUTLINE} />
        {selectedShape && <path className={styles.selectedCounty} d={selectedShape.d} />}
        {hover && hoverIndex >= 0 && hover.fips !== selected && (
          <path className={styles.hoverCounty} d={COUNTY_SHAPES[hoverIndex].d} />
        )}
      </svg>
      {hover && hoverIndex >= 0 && (
        <div
          className={styles.tooltip}
          style={{ left: hover.x, top: hover.y }}
          aria-hidden="true"
        >
          <strong>
            {COUNTIES[hover.fips].n}, {COUNTIES[hover.fips].s}
          </strong>
          <span>
            {filter
              ? filter.counts[hoverIndex] > 0
                ? `${filter.counts[hoverIndex]} of ${filter.size} ${GROUP_NAME[filter.group].toLowerCase()} can go in`
                : `No ${GROUP_NAME[filter.group].toLowerCase()} right now`
              : phaseLabel(phases[hoverIndex])}
          </span>
        </div>
      )}
    </div>
  );
}
