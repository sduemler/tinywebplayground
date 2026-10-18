import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GROUPS, type GroupId } from "@data/when-to-plant/crops";
import CountyPanel from "./CountyPanel";
import { COUNTIES, COUNTY_SHAPES, FULL_VIEW, isZoomedIn, MIN_VIEW_WIDTH, viewForState, zoomView } from "./data";
import {
  dayOfYear,
  formatDayLong,
  groupCounts,
  MONTH_TICKS,
  phaseFromCounts,
  type Phase,
} from "./engine";
import FindCounty from "./FindCounty";
import { GROUP_COLORS, GROUP_HATCH, REST_COLOR } from "./palette";
import UsMap from "./UsMap";
import styles from "./WhenToPlant.module.css";

type Box = [number, number, number, number];

const STORE_KEY = "when-to-plant";
const PLAY_STEP_DAYS = 3;
const PLAY_TICK_MS = 90;
const ZOOM_MS = 450;
const ZOOM_STEP = 1.8;

function readStore(): { county?: string; patterns?: boolean } {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeStore(value: { county: string | null; patterns: boolean }) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(value));
  } catch {
    // Private mode or storage blocked: nothing to remember, nothing breaks.
  }
}

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function phaseLabel(phase: Phase) {
  if (phase === "rest") return "Resting: nothing to plant outside";
  const g = GROUPS.find((x) => x.id === phase)!;
  return `Mostly ${g.name.toLowerCase()}`;
}

export default function WhenToPlant() {
  const today = useMemo(() => dayOfYear(new Date()), []);
  const [day, setDay] = useState(today);
  const [playing, setPlaying] = useState(false);
  // Chosen groups (GROUPS order); empty = the normal "main group" map.
  const [filter, setFilter] = useState<GroupId[]>([]);
  const [patterns, setPatterns] = useState(() => readStore().patterns ?? false);
  const [selected, setSelected] = useState<string | null>(() => {
    const saved = readStore().county;
    return saved && COUNTIES[saved] ? saved : null;
  });
  const [view, setView] = useState<Box>(() => (selected ? viewForState(selected.slice(0, 2)) : FULL_VIEW));
  const [canPlay] = useState(() => !reducedMotion());
  const [coarsePointer] = useState(() => window.matchMedia?.("(pointer: coarse)").matches ?? false);
  const viewRef = useRef(view);
  const animRef = useRef<number | null>(null);

  useEffect(() => writeStore({ county: selected, patterns }), [selected, patterns]);

  // Play through the year.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setDay((d) => (d + PLAY_STEP_DAYS > 365 ? 1 : d + PLAY_STEP_DAYS)), PLAY_TICK_MS);
    return () => window.clearInterval(id);
  }, [playing]);

  // Open crop counts per group for every county on this day.
  const counts = useMemo(() => COUNTY_SHAPES.map((c) => groupCounts(COUNTIES[c.fips], day)), [day]);
  const phases = useMemo(() => counts.map(phaseFromCounts), [counts]);
  const filterData = useMemo(() => (filter.length ? { groups: filter, counts } : null), [filter, counts]);

  const toggleGroup = (id: GroupId) =>
    setFilter((f) => (f.includes(id) ? f.filter((g) => g !== id) : GROUPS.map((g) => g.id).filter((g) => g === id || f.includes(g))));

  const animateTo = useCallback((to: Box) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const from = viewRef.current;
    if (reducedMotion()) {
      viewRef.current = to;
      setView(to);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ZOOM_MS);
      const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      const next = from.map((v, i) => v + (to[i] - v) * e) as Box;
      viewRef.current = next;
      setView(next);
      if (t < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  }, []);

  // Dragging and pinching set the view directly (and stop any zoom animation).
  const setViewNow = useCallback((v: Box) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    viewRef.current = v;
    setView(v);
  }, []);

  const zoomed = isZoomedIn(view);

  // From the ZIP search or the lists: select the county and frame its state.
  const focusCounty = useCallback(
    (fips: string) => {
      setSelected(fips);
      animateTo(viewForState(fips.slice(0, 2)));
    },
    [animateTo],
  );

  // From the map. At the whole-map view a click also frames the county's state; on touch
  // screens counties are too small to aim at from there, so the first tap only zooms.
  // Once zoomed in (maybe dragged somewhere else), a click just selects.
  const onMapClick = useCallback(
    (fips: string) => {
      if (isZoomedIn(viewRef.current)) setSelected(fips);
      else if (coarsePointer) animateTo(viewForState(fips.slice(0, 2)));
      else focusCounty(fips);
    },
    [coarsePointer, animateTo, focusCounty],
  );

  const zoomBy = (factor: number) => animateTo(zoomView(viewRef.current, factor));
  const zoomOut = () => animateTo(FULL_VIEW);

  const isToday = day === today;

  return (
    <div className={styles.root} data-sheet={selected ? "" : undefined}>
      <header className={styles.masthead}>
        <h1 className={styles.date}>{formatDayLong(day)}</h1>
        <p className={styles.lede}>
          {isToday
            ? "What can go in the ground this week by county."
            : "What can go in the ground around this date in an average year."}
        </p>
        <div className={styles.timeline}>
          {canPlay && (
            <button
              type="button"
              className={styles.playButton}
              onClick={() => setPlaying((p) => !p)}
              aria-pressed={playing}
              aria-label={playing ? "Pause" : "Play through the year"}
            >
              {playing ? (
                <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="5" y="4" width="3.5" height="12" rx="1" /><rect x="11.5" y="4" width="3.5" height="12" rx="1" /></svg>
              ) : (
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4l10 6-10 6z" /></svg>
              )}
            </button>
          )}
          <div className={styles.sliderWrap}>
            <label htmlFor="wtp-day" className={styles.srOnly}>
              Date
            </label>
            <input
              id="wtp-day"
              className={styles.slider}
              type="range"
              min={1}
              max={365}
              value={day}
              aria-valuetext={formatDayLong(day)}
              onChange={(e) => {
                setPlaying(false);
                setDay(Number(e.target.value));
              }}
            />
            <div className={styles.ticks} aria-hidden="true">
              {MONTH_TICKS.map((m) => (
                <span key={m.label} style={{ left: `${((m.day - 1) / 364) * 100}%` }}>
                  <span className={styles.tickLong}>{m.label}</span>
                  <span className={styles.tickShort}>{m.label[0]}</span>
                </span>
              ))}
              <span className={styles.todayTick} style={{ left: `${((today - 1) / 364) * 100}%` }} />
            </div>
          </div>
          <button
            type="button"
            className={styles.buttonQuiet}
            onClick={() => {
              setPlaying(false);
              setDay(today);
            }}
            disabled={isToday}
          >
            Today
          </button>
        </div>
      </header>

      <div className={styles.chips} role="group" aria-label="Choose plant groups to show">
        <button
          type="button"
          className={styles.chip}
          aria-pressed={filter.length === 0}
          onClick={() => setFilter([])}
        >
          All groups
        </button>
        {GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            className={styles.chip}
            aria-pressed={filter.includes(g.id)}
            onClick={() => toggleGroup(g.id)}
          >
            <span
              className={styles.swatch}
              data-hatch={patterns && GROUP_HATCH[g.id] ? GROUP_HATCH[g.id] : undefined}
              style={{ background: GROUP_COLORS[g.id] }}
              aria-hidden="true"
            />
            {g.name}
          </button>
        ))}
        <span className={styles.legendRest}>
          <span className={styles.swatch} style={{ background: REST_COLOR }} aria-hidden="true" />
          Resting
        </span>
        <label className={styles.patternToggle}>
          <input type="checkbox" checked={patterns} onChange={(e) => setPatterns(e.target.checked)} />
          Patterns
        </label>
      </div>

      <div className={styles.mapArea}>
        {zoomed && (
          <button type="button" className={styles.zoomOut} onClick={zoomOut}>
            ← All states
          </button>
        )}
        <div className={styles.zoomControls}>
          <button
            type="button"
            onClick={() => zoomBy(ZOOM_STEP)}
            disabled={view[2] <= MIN_VIEW_WIDTH + 0.5}
            aria-label="Zoom in"
          >
            +
          </button>
          <button type="button" onClick={() => zoomBy(1 / ZOOM_STEP)} disabled={!zoomed} aria-label="Zoom out">
            −
          </button>
        </div>
        <UsMap
          view={view}
          onViewChange={setViewNow}
          phases={phases}
          filter={filterData}
          patterns={patterns}
          selected={selected}
          onCountyClick={onMapClick}
          phaseLabel={phaseLabel}
        />
        <p className={styles.mapHint}>
          {filter.length > 1 && "Where more than one chosen group is ready, the county shows the one with the most crops ready. "}
          {zoomed
            ? `Drag to move around. ${coarsePointer ? "Tap" : "Click"} a county for its planting list.`
            : coarsePointer
              ? "Tap a state to zoom in, then a county for its planting list."
              : "Click a county for its planting list, or zoom in with + and drag to look around."}
        </p>
      </div>

      <aside className={styles.side}>
        <FindCounty selected={selected} onFound={focusCounty} />
        {selected ? (
          <div className={styles.panelSlot}>
            <CountyPanel fips={selected} day={day} onClose={() => setSelected(null)} />
          </div>
        ) : (
          <div className={styles.intro}>
            <h2>Find your county</h2>
            <p>
              Search a ZIP code, pick from the lists, or tap the map. You'll get what to sow or set out now, what to
              start indoors, and what's coming up next.
            </p>
            <p>
              Colors show the group with the most crops ready in each county. Pick one or more groups above to see
              everywhere they can go in.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
