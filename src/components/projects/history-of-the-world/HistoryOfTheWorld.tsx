import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  CATEGORIES,
  ERAS,
  EVENTS,
  NOW_YEAR,
  type CategoryId,
  type Era,
  type HistoryEvent,
} from "@data/history-of-the-world/events";
import {
  buildTicks,
  formatEventDate,
  formatMoment,
  formatSpan,
  gapPx,
  isFoldable,
} from "./timeline";
import styles from "./HistoryOfTheWorld.module.css";

const COLOR = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.color])) as Record<CategoryId, string>;
const LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label])) as Record<CategoryId, string>;
const INDEX = new Map(EVENTS.map((e, i) => [e.id, i]));

interface Gap {
  key: string;
  from: number;
  to: number;
  years: number;
  approx: boolean;
  foldable: boolean;
  /** Only set when no hidden events fall inside the gap, so it stays accurate. */
  meanwhile?: string;
}

type Row =
  | { kind: "event"; ev: HistoryEvent; side: "left" | "right" }
  | { kind: "gap"; gap: Gap }
  | { kind: "era"; era: Era };

/** Where to put the viewport after a render that changes the scroll's length. */
type PendingScroll =
  | { type: "anchor"; id: string; top: number }
  | { type: "gap"; key: string };

export default function HistoryOfTheWorld() {
  const [hidden, setHidden] = useState<Set<CategoryId>>(() => new Set());
  const [unrolled, setUnrolled] = useState<Set<string>>(() => new Set());
  const [moment, setMoment] = useState<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const pending = useRef<PendingScroll | null>(null);

  const rows = useMemo<Row[]>(() => {
    const visible = EVENTS.filter((e) => !hidden.has(e.category));
    // Each era heading sits above its anchor event, or the next visible one.
    const erasBefore = new Map<string, Era[]>();
    for (const era of ERAS) {
      const anchor = INDEX.get(era.before)!;
      const host = visible.find((e) => INDEX.get(e.id)! >= anchor);
      if (host) erasBefore.set(host.id, [...(erasBefore.get(host.id) ?? []), era]);
    }
    const out: Row[] = [];
    visible.forEach((ev, i) => {
      if (i > 0) {
        const prev = visible[i - 1];
        const years = ev.year - prev.year;
        const adjacent = INDEX.get(ev.id)! - INDEX.get(prev.id)! === 1;
        out.push({
          kind: "gap",
          gap: {
            key: `${prev.id}__${ev.id}`,
            from: prev.year,
            to: ev.year,
            years,
            approx: prev.approx || ev.approx,
            foldable: isFoldable(years),
            meanwhile: adjacent ? ev.meanwhile : undefined,
          },
        });
      }
      for (const era of erasBefore.get(ev.id) ?? []) out.push({ kind: "era", era });
      out.push({ kind: "event", ev, side: i % 2 === 0 ? "left" : "right" });
    });
    return out;
  }, [hidden]);

  const foldableGaps = useMemo(
    () => rows.flatMap((r) => (r.kind === "gap" && r.gap.foldable ? [r.gap] : [])),
    [rows],
  );
  const allUnrolled = foldableGaps.length > 0 && foldableGaps.every((g) => unrolled.has(g.key));
  const unrolledScreens = useMemo(() => {
    const px = foldableGaps.reduce((s, g) => s + gapPx(g.years), 0);
    return Math.round(px / 800 / 10) * 10;
  }, [foldableGaps]);

  // Remember the event nearest the reading line so a bulk change above the
  // viewport (unroll all, filters) doesn't fling the reader somewhere else.
  const captureAnchor = useCallback((keep?: (ev: HistoryEvent) => boolean) => {
    const list = listRef.current;
    if (!list) return;
    const line = window.innerHeight * 0.35;
    let best: { id: string; top: number } | null = null;
    for (const el of list.querySelectorAll<HTMLElement>("[data-event-id]")) {
      const ev = EVENTS.find((e) => e.id === el.dataset.eventId);
      if (!ev || (keep && !keep(ev))) continue;
      const top = el.getBoundingClientRect().top;
      if (!best || Math.abs(top - line) < Math.abs(best.top - line)) best = { id: ev.id, top };
    }
    if (best) pending.current = { type: "anchor", ...best };
  }, []);

  useLayoutEffect(() => {
    const p = pending.current;
    if (!p || !listRef.current) return;
    pending.current = null;
    if (p.type === "anchor") {
      const el = listRef.current.querySelector<HTMLElement>(`[data-event-id="${p.id}"]`);
      if (el) window.scrollBy(0, el.getBoundingClientRect().top - p.top);
    } else {
      const el = listRef.current.querySelector<HTMLElement>(`[data-gap-key="${p.key}"]`);
      el?.scrollIntoView({ block: "center" });
    }
  }, [rows, unrolled]);

  const toggleCategory = (id: CategoryId) => {
    // Anchor on an event outside the toggled category: it's on screen now and
    // stays on screen after the change.
    captureAnchor((ev) => ev.category !== id);
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    captureAnchor();
    setUnrolled(allUnrolled ? new Set() : new Set(foldableGaps.map((g) => g.key)));
  };

  const unroll = (key: string) => setUnrolled((s) => new Set(s).add(key));
  const rollUp = (key: string) => {
    pending.current = { type: "gap", key };
    setUnrolled((s) => {
      const next = new Set(s);
      next.delete(key);
      return next;
    });
  };

  // ── Floating "you are here" seal ───────────────────────────────────────────
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const list = listRef.current;
      if (!list) return setMoment(null);
      const nodes = list.querySelectorAll<HTMLElement>("[data-y0]");
      if (!nodes.length) return setMoment(null);
      const line = window.innerHeight / 2;
      const first = nodes[0].getBoundingClientRect();
      const last = nodes[nodes.length - 1].getBoundingClientRect();
      if (first.top > line) return setMoment(null);
      const atPageEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
      if (last.bottom < line || atPageEnd) return setMoment(formatMoment(NOW_YEAR));
      // Binary search for the last node whose top is above the reading line.
      let lo = 0;
      let hi = nodes.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (nodes[mid].getBoundingClientRect().top <= line) lo = mid;
        else hi = mid - 1;
      }
      const el = nodes[lo];
      const r = el.getBoundingClientRect();
      const y0 = Number(el.dataset.y0);
      const y1 = Number(el.dataset.y1);
      const t = r.height > 0 ? Math.min(1, Math.max(0, (line - r.top) / r.height)) : 0;
      setMoment(formatMoment(y0 + (y1 - y0) * t));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [rows, unrolled]);

  const visibleCount = rows.filter((r) => r.kind === "event").length;

  return (
    <div className={styles.page}>
      <div className={styles.scroll}>
        <img
          className={styles.scrollTop}
          src="/images/history-of-the-world/scroll-top.webp"
          alt=""
          width={1100}
          height={152}
        />
        <div className={styles.scrollBody}>
          <h1 className={styles.title}>History of the World</h1>
          <p className={styles.subtitle}>from the first turning of the Earth to the present day</p>

          <section className={styles.intro} aria-label="How to read this scroll">
            <p>
              Unrolled before you is the whole story of our planet, some four and a half billion years of
              it. It begins with a ball of molten rock settling into orbit around a young Sun and ends with the year
              you are reading this. Each entry marks one great turning point, and the coloured line beneath it tells
              you what kind of event it was:
            </p>

            <div className={styles.legend} role="group" aria-label="Event categories. Tap to show or hide.">
              {CATEGORIES.map((c) => {
                const on = !hidden.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={styles.legendItem}
                    aria-pressed={on}
                    onClick={() => toggleCategory(c.id)}
                    style={{ "--cat": c.color } as CSSProperties}
                  >
                    <span className={styles.legendSwatch} aria-hidden="true" />
                    {c.label}
                  </button>
                );
              })}
            </div>
            <p className={styles.legendHint}>Tap a colour to hide or show that kind of event.</p>

            <p>
              Between the entries you will find <strong>folds</strong> in the scroll, each marked with how much time
              it hides. They begin folded so you can read the whole story in one sitting. Tap one to unroll it, and
              the parchment will stretch out to show the time that passed, with a note on what the world was doing in
              the meantime. Faint ink marks keep count as you scroll through, and the seal in the corner always tells
              you <em>when</em> you are. Headings along the way mark the great ages of the Earth and of people.
            </p>
            <p>
              <strong>Why?</strong> Because deep time is almost impossible to feel. If Earth's history were a single
              day, our species would appear in its last six seconds, and all of written history would fit in the
              final tenth of a second. Drawn truly to scale, everything from the first farmers onward would crowd
              into the scroll's last hair's breadth, after miles of empty parchment. Unroll a fold and keep
              scrolling. That emptiness is the point.
            </p>
            <p className={styles.scaleNote}>
              A note on dates: <em>c.</em> (circa) means approximate, and spans marked ≈ are rounded. The oldest
              dates come from measuring the slow radioactive decay of elements in rocks and fossils and can be off
              by millions of years; most dates before writing are estimates that scholars still debate. And this is
              a selection, not a complete record: {EVENTS.length} turning points out of countless others.
            </p>
            <p className={styles.scaleNote}>
              A note on scale: unrolled folds grow with the time they hold, but compressed, so a gap ten times
              longer is drawn about twice as long. Otherwise the scroll could not fit in any browser.
            </p>

            <div className={styles.controls}>
              <button type="button" className={styles.controlButton} onClick={toggleAll} disabled={!foldableGaps.length}>
                {allUnrolled
                  ? "Fold everything back up"
                  : `Unroll all ${foldableGaps.length} folds (≈ ${unrolledScreens} screens)`}
              </button>
            </div>
          </section>

          <div className={styles.flourish} aria-hidden="true">
            ❦
          </div>

          {visibleCount === 0 ? (
            <p className={styles.empty}>Every kind of event is hidden. Tap a colour above to bring some back.</p>
          ) : (
            <ol className={styles.timeline} ref={listRef}>
              {rows.map((row) =>
                row.kind === "event" ? (
                  <EventEntry key={row.ev.id} ev={row.ev} side={row.side} />
                ) : row.kind === "era" ? (
                  <EraEntry key={row.era.name} era={row.era} />
                ) : (
                  <GapEntry
                    key={row.gap.key}
                    gap={row.gap}
                    unrolled={unrolled.has(row.gap.key)}
                    onUnroll={unroll}
                    onRollUp={rollUp}
                  />
                ),
              )}
            </ol>
          )}

          <div className={styles.ending}>
            <span className={styles.endingDate}>{NOW_YEAR}</span>
            <span className={styles.endingText}>what will happen next?</span>
          </div>

          <div className={styles.tornEnd} aria-hidden="true" />
        </div>
      </div>

      <div className={styles.hud} data-visible={moment ? "true" : "false"}>
        <ul className={styles.key} aria-label="Colour key">
          {CATEGORIES.map((c) => (
            <li
              key={c.id}
              className={styles.keyItem}
              data-hidden={hidden.has(c.id) ? "true" : "false"}
              style={{ "--cat": c.color } as CSSProperties}
            >
              <span className={styles.keySwatch} aria-hidden="true" />
              {c.short}
            </li>
          ))}
        </ul>
        <div className={styles.seal} aria-live="off">
          <span className={styles.sealWax} aria-hidden="true" />
          <span className={styles.sealText}>{moment ?? ""}</span>
        </div>
      </div>
    </div>
  );
}

function EventEntry({ ev, side }: { ev: HistoryEvent; side: "left" | "right" }) {
  return (
    <li
      className={styles.event}
      data-side={side}
      data-event-id={ev.id}
      data-y0={ev.year}
      data-y1={ev.year}
      style={{ "--cat": COLOR[ev.category] } as CSSProperties}
    >
      <div className={styles.eventBody}>
        <p className={styles.eventDate}>{formatEventDate(ev)}</p>
        <h3 className={styles.eventTitle}>{ev.title}</h3>
        <div className={styles.rule} aria-hidden="true">
          <span className={styles.dot} />
        </div>
        <span className={styles.srOnly}>{LABEL[ev.category]}.</span>
        <p className={styles.eventBlurb}>{ev.blurb}</p>
      </div>
    </li>
  );
}

function EraEntry({ era }: { era: Era }) {
  return (
    <li className={styles.era}>
      <div className={styles.eraCard}>
        <h2 className={styles.eraName}>{era.name}</h2>
        <p className={styles.eraSpan}>{era.span}</p>
        <p className={styles.eraText}>{era.text}</p>
      </div>
    </li>
  );
}

function GapEntry({
  gap,
  unrolled,
  onUnroll,
  onRollUp,
}: {
  gap: Gap;
  unrolled: boolean;
  onUnroll: (key: string) => void;
  onRollUp: (key: string) => void;
}) {
  const span = formatSpan(gap.years, gap.approx);

  if (!gap.foldable) {
    return (
      <li
        className={styles.gapShort}
        data-y0={gap.from}
        data-y1={gap.to}
        style={{ height: gapPx(gap.years) }}
        aria-hidden="true"
      />
    );
  }

  if (!unrolled) {
    return (
      <li className={styles.fold} data-gap-key={gap.key} data-y0={gap.from} data-y1={gap.to}>
        <button
          type="button"
          className={styles.foldButton}
          aria-expanded="false"
          onClick={() => onUnroll(gap.key)}
        >
          <span className={styles.foldSpan}>{span}</span>
          <span className={styles.foldAction}>tap to unroll</span>
        </button>
      </li>
    );
  }

  const height = gapPx(gap.years);
  const ticks = buildTicks(gap.from, gap.to, height);
  return (
    <li
      className={styles.unrolled}
      data-gap-key={gap.key}
      data-y0={gap.from}
      data-y1={gap.to}
      style={{ height }}
    >
      {ticks.map((t) => (
        <span key={t.offset} className={styles.tick} style={{ top: t.offset }}>
          <span className={styles.tickLabel}>{t.label}</span>
        </span>
      ))}
      <div className={styles.stickyRail}>
        <button
          type="button"
          className={styles.rollUpButton}
          aria-expanded="true"
          onClick={() => onRollUp(gap.key)}
        >
          <span className={styles.foldSpan}>{span}</span>
          <span className={styles.foldAction}>tap to fold up</span>
        </button>
        {gap.meanwhile && (
          <p className={styles.meanwhile}>
            <span className={styles.meanwhileLabel}>Meanwhile…</span> {gap.meanwhile}
          </p>
        )}
      </div>
    </li>
  );
}
