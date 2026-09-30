import { useEffect, useId, useRef, useState } from 'react';
import styles from './Cassette.module.css';

export const LINES_PER_SIDE = 5;

export interface TapeLine {
  text: string;
  tone: 'right' | 'wrong';
  /** Write the line out pen-style when it first appears (otherwise it's just there). */
  animate?: boolean;
  onWritten?: () => void;
}

interface CassetteProps {
  /** Handwritten name across the top of the label. */
  title: string;
  side?: 'A' | 'B';
  /** One slot per numbered line; null leaves the line blank. */
  lines?: Array<TapeLine | null>;
  /** Slot of the song playing now; its number gets circled. */
  currentLine?: number | null;
  /** Numbering for the first line (6 on side B of a ten-song tape). */
  firstNumber?: number;
  spinning?: boolean;
  /** 0–1: how far through the tape we are. Moves tape from the left reel to the right. */
  progress?: number;
  /** Stripe colours differ per tape so a shelf of them doesn't look cloned. */
  stripes?: [string, string, string];
}

const DEFAULT_STRIPES: [string, string, string] = ['#e8a93a', '#d9622b', '#9c3b22'];
const FIRST_BASELINE = 72;
const LINE_GAP = 21;
const TEXT_X = 58;
const TEXT_WIDTH = 304;
const LINE_FONT_SIZE = 19;
const REEL_Y = 185;

function fit(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

let measureCtx: CanvasRenderingContext2D | null = null;

/** Cuts a title to fit the label line, measured in the label's own font and units. */
function fitToLabel(text: string): string {
  if (typeof document === 'undefined') return text;
  measureCtx ??= document.createElement('canvas').getContext('2d');
  if (!measureCtx) return text;
  measureCtx.font = `${LINE_FONT_SIZE}px 'Gochi Hand', cursive`;
  if (measureCtx.measureText(text).width <= TEXT_WIDTH) return text;
  let cut = text;
  while (cut.length > 1 && measureCtx.measureText(`${cut.trimEnd()}…`).width > TEXT_WIDTH) {
    cut = cut.slice(0, -1);
  }
  return `${cut.trimEnd()}…`;
}

/** A title in ink, revealed left to right like a pen moving across the label. */
function WrittenLine({ line, baseline }: { line: TapeLine; baseline: number }) {
  const clipId = useId();
  const animRef = useRef<SVGAnimateElement>(null);
  // Decided once on mount so later re-renders never restart or cancel the stroke.
  const [animate] = useState(() => !!line.animate && !prefersReducedMotion());
  const [text, setText] = useState(() => fitToLabel(line.text));
  const seconds = Math.min(1.8, Math.max(0.6, text.length * 0.055));

  // Re-fit once the handwriting font has loaded, in case we measured the fallback.
  useEffect(() => {
    let live = true;
    document.fonts?.ready.then(() => live && setText(fitToLabel(line.text)));
    return () => {
      live = false;
    };
  }, [line.text]);

  useEffect(() => {
    if (animate) animRef.current?.beginElement();
    line.onWritten?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <g>
      <clipPath id={clipId}>
        <rect x={TEXT_X - 2} y={baseline - 20} height={27} width={animate ? 0 : TEXT_WIDTH + 4}>
          {animate && (
            <animate
              ref={animRef}
              attributeName="width"
              from="0"
              to={TEXT_WIDTH + 4}
              dur={`${seconds}s`}
              begin="indefinite"
              fill="freeze"
            />
          )}
        </rect>
      </clipPath>
      <text
        x={TEXT_X}
        y={baseline}
        className={styles.lineText}
        data-tone={line.tone}
        clipPath={`url(#${clipId})`}
      >
        {text}
        {text !== line.text && <title>{line.text}</title>}
      </text>
    </g>
  );
}

function Reel({ cx, packRadius }: { cx: number; packRadius: number }) {
  return (
    <g>
      <circle cx={cx} cy={REEL_Y} r={packRadius} className={styles.tapePack} />
      <g className={styles.hub} style={{ transformOrigin: `${cx}px ${REEL_Y}px` }}>
        <circle cx={cx} cy={REEL_Y} r={9} className={styles.hubRing} />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <rect
            key={deg}
            x={cx - 1.4}
            y={REEL_Y - 9}
            width={2.8}
            height={4}
            className={styles.hubTooth}
            transform={`rotate(${deg} ${cx} ${REEL_Y})`}
          />
        ))}
        <circle cx={cx} cy={REEL_Y} r={3.5} className={styles.hubHole} />
      </g>
    </g>
  );
}

export default function Cassette({
  title,
  side = 'A',
  lines = [],
  currentLine = null,
  firstNumber = 1,
  spinning = false,
  progress = 0,
  stripes = DEFAULT_STRIPES,
}: CassetteProps) {
  const p = Math.max(0, Math.min(1, progress));
  const leftPack = 18 - 7 * p;
  const rightPack = 11 + 7 * p;
  const written = lines.filter((l): l is TapeLine => !!l).map((l) => l.text);

  return (
    <svg
      className={styles.cassette}
      viewBox="0 0 400 272"
      data-spinning={spinning}
      role="img"
      aria-label={`${title}, side ${side}${written.length ? `: ${written.join(', ')}` : ''}`}
    >
      {/* shell */}
      <rect x="3" y="3" width="394" height="266" rx="16" className={styles.shell} />
      <rect x="3" y="3" width="394" height="266" rx="16" className={styles.shellEdge} />
      {[
        [18, 18],
        [382, 18],
        [18, 254],
        [382, 254],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={5.5} className={styles.screw} />
          <path d={`M${x - 3} ${y}h6`} className={styles.screwSlot} />
        </g>
      ))}

      {/* paper label */}
      <rect x="28" y="14" width="344" height="196" rx="7" className={styles.label} />
      <rect x="28" y="168" width="344" height="10" fill={stripes[0]} />
      <rect x="28" y="178" width="344" height="10" fill={stripes[1]} />
      <rect x="28" y="188" width="344" height="10" fill={stripes[2]} />

      <rect x="36" y="22" width="22" height="26" rx="3" className={styles.sideBox} />
      <text x="47" y="42" textAnchor="middle" className={styles.sideLetter}>
        {side}
      </text>
      <text x="68" y="42" className={styles.titleText}>
        {fit(title, 28)}
      </text>
      <path d="M36 50h328" className={styles.headerRule} />

      {/* tracklist */}
      {Array.from({ length: LINES_PER_SIDE }, (_, i) => {
        const baseline = FIRST_BASELINE + i * LINE_GAP;
        const line = lines[i];
        return (
          <g key={i}>
            <path d={`M36 ${baseline + 4}h328`} className={styles.ruling} />
            {i === currentLine && (
              <ellipse cx={44} cy={baseline - 5} rx={10} ry={9} className={styles.currentCircle} />
            )}
            <text x={44} y={baseline} textAnchor="middle" className={styles.lineNumber}>
              {firstNumber + i}
            </text>
            {line && <WrittenLine key={`${side}-${i}-${line.text}`} line={line} baseline={baseline} />}
          </g>
        );
      })}

      {/* reel window */}
      <rect x="100" y="166" width="200" height="38" rx="10" className={styles.window} />
      <Reel cx={155} packRadius={leftPack} />
      <Reel cx={245} packRadius={rightPack} />
      <rect x="100" y="166" width="200" height="38" rx="10" className={styles.windowGlass} />

      {/* head opening */}
      <path d="M92 269 L108 222 H292 L308 269 Z" className={styles.headPlate} />
      {[140, 174, 226, 260].map((x) => (
        <rect key={x} x={x - 5.5} y={236} width={11} height={11} rx={2} className={styles.headHole} />
      ))}
      <circle cx={200} cy={242} r={5.5} className={styles.headHole} />
    </svg>
  );
}
