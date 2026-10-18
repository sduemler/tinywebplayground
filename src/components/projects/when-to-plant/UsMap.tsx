import { memo, useEffect, useMemo, useRef, useState } from "react";
import { GROUPS, type GroupId } from "@data/when-to-plant/crops";
import { clampView, COUNTIES, COUNTY_SHAPES, isZoomedIn, MAP_WIDTH, NATION_OUTLINE, STATE_BORDERS, zoomView } from "./data";
import type { Phase } from "./engine";
import { GROUP_COLORS, GROUP_HATCH, MUTED_COLOR, REST_COLOR, SURFACE } from "./palette";
import styles from "./WhenToPlant.module.css";

type Box = [number, number, number, number];

interface Props {
  view: Box;
  /** Called while dragging or pinching, with an already-clamped view. */
  onViewChange: (view: Box) => void;
  /** Phase per county, in COUNTY_SHAPES order. */
  phases: Phase[];
  /** Filter mode: open crops of the chosen group per county (COUNTY_SHAPES order), and the group size. */
  filter: { group: GroupId; counts: number[]; size: number } | null;
  patterns: boolean;
  selected: string | null;
  onCountyClick: (fips: string) => void;
  phaseLabel: (phase: Phase) => string;
}

// A press that moves further than this (px) is a drag, not a click.
const DRAG_THRESHOLD = 5;

interface Gesture {
  startView: Box;
  // One pointer: where it went down.
  startX: number;
  startY: number;
  dragging: boolean;
  // Two pointers: starting distance, and the map point under their midpoint.
  pinchDist?: number;
  pinchAnchor?: [number, number];
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

export default function UsMap({ view, onViewChange, phases, filter, patterns, selected, onCountyClick, phaseLabel }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{ fips: string; x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const scale = MAP_WIDTH / view[2];
  const zoomed = isZoomedIn(view);

  // Latest values for the native wheel listener and in-progress gestures.
  const viewRef = useRef(view);
  viewRef.current = view;
  const onViewChangeRef = useRef(onViewChange);
  onViewChangeRef.current = onViewChange;
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);

  /** Screen point → map coordinates under a given view. */
  const toMap = (clientX: number, clientY: number, v: Box): [number, number] => {
    const r = svgRef.current!.getBoundingClientRect();
    return [v[0] + ((clientX - r.left) / r.width) * v[2], v[1] + ((clientY - r.top) / r.height) * v[3]];
  };

  // Capture can throw if the pointer is already gone; panning still works without it.
  const capture = (id: number) => {
    try {
      svgRef.current?.setPointerCapture(id);
    } catch {
      /* ignore */
    }
  };

  const startPinch = () => {
    const [a, b] = [...pointers.current.values()];
    gesture.current = {
      startView: viewRef.current,
      startX: 0,
      startY: 0,
      dragging: true,
      pinchDist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      pinchAnchor: toMap((a.x + b.x) / 2, (a.y + b.y) / 2, viewRef.current),
    };
  };

  const startDrag = (x: number, y: number, dragging = false) => {
    gesture.current = { startView: viewRef.current, startX: x, startY: y, dragging };
  };

  // Trackpad pinches (and ctrl/⌘ + wheel) zoom the map; a plain wheel still scrolls the page.
  // Native listener because React's wheel handler is passive and can't preventDefault.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const v = viewRef.current;
      onViewChangeRef.current(zoomView(v, Math.exp(-e.deltaY * 0.01), toMap(e.clientX, e.clientY, v)));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

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

  function endPointer(id: number) {
    pointers.current.delete(id);
    if (pointers.current.size === 1) {
      // Pinch → one finger left: keep panning from where it is.
      const [p] = [...pointers.current.values()];
      startDrag(p.x, p.y, true);
    } else if (pointers.current.size === 0) {
      gesture.current = null;
      setDragging(false);
    }
  }

  const fipsFrom = (target: EventTarget) => (target as Element).getAttribute?.("data-fips") ?? null;

  return (
    <div
      ref={wrapRef}
      className={styles.mapWrap}
      onPointerLeave={() => setHover(null)}
    >
      <svg
        ref={svgRef}
        className={styles.map}
        data-zoomed={zoomed ? "" : undefined}
        data-dragging={dragging ? "" : undefined}
        viewBox={view.join(" ")}
        role="img"
        aria-label={
          filter
            ? `Map of US counties showing where ${GROUP_NAME[filter.group].toLowerCase()} can be planted`
            : "Map of US counties colored by the main group of plants that can go in the ground"
        }
        onClick={(e) => {
          if (suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          const fips = fipsFrom(e.target);
          if (fips) onCountyClick(fips);
        }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointers.current.size === 1) {
            suppressClick.current = false;
            startDrag(e.clientX, e.clientY);
          } else if (pointers.current.size === 2) {
            suppressClick.current = true;
            for (const id of pointers.current.keys()) capture(id);
            setDragging(true);
            setHover(null);
            startPinch();
          }
        }}
        onPointerMove={(e) => {
          if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          const g = gesture.current;

          if (g && pointers.current.size === 2 && g.pinchDist && g.pinchAnchor) {
            const [a, b] = [...pointers.current.values()];
            const factor = Math.hypot(a.x - b.x, a.y - b.y) / g.pinchDist;
            const w = g.startView[2] / factor;
            const h = g.startView[3] / factor;
            const r = svgRef.current!.getBoundingClientRect();
            const mx = ((a.x + b.x) / 2 - r.left) / r.width;
            const my = ((a.y + b.y) / 2 - r.top) / r.height;
            onViewChange(clampView([g.pinchAnchor[0] - mx * w, g.pinchAnchor[1] - my * h, w, h]));
            return;
          }

          if (g && pointers.current.size === 1) {
            const dx = e.clientX - g.startX;
            const dy = e.clientY - g.startY;
            // Only a zoomed-in map pans; at the whole-map view a drag does nothing (and touch scrolls the page).
            if (!g.dragging && isZoomedIn(g.startView) && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
              g.dragging = true;
              suppressClick.current = true;
              // Capture only once it's a drag, so a plain click still lands on its county.
              capture(e.pointerId);
              setDragging(true);
              setHover(null);
            }
            if (g.dragging) {
              const r = svgRef.current!.getBoundingClientRect();
              const k = g.startView[2] / r.width;
              onViewChange(clampView([g.startView[0] - dx * k, g.startView[1] - dy * k, g.startView[2], g.startView[3]]));
              return;
            }
          }

          if (e.pointerType !== "mouse" || g?.dragging) return;
          const fips = fipsFrom(e.target);
          const box = wrapRef.current?.getBoundingClientRect();
          if (!fips || !box) return setHover(null);
          setHover({ fips, x: e.clientX - box.left, y: e.clientY - box.top });
        }}
        onPointerUp={(e) => endPointer(e.pointerId)}
        onPointerCancel={(e) => endPointer(e.pointerId)}
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
