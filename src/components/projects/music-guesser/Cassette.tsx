import styles from './Cassette.module.css';

interface CassetteProps {
  /** Handwritten line on the label. */
  label: string;
  /** Smaller handwritten line under it. */
  note?: string;
  side?: 'A' | 'B';
  spinning?: boolean;
  /** 0–1: how far through the tape we are. Moves tape from the left reel to the right. */
  progress?: number;
  /** Stripe colours differ per tape so a shelf of them doesn't look cloned. */
  stripes?: [string, string, string];
}

const DEFAULT_STRIPES: [string, string, string] = ['#e8a93a', '#d9622b', '#9c3b22'];

function Reel({ cx, packRadius }: { cx: number; packRadius: number }) {
  return (
    <g>
      <circle cx={cx} cy={122} r={packRadius} className={styles.tapePack} />
      <g className={styles.hub} style={{ transformOrigin: `${cx}px 122px` }}>
        <circle cx={cx} cy={122} r={12} className={styles.hubRing} />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <rect
            key={deg}
            x={cx - 1.6}
            y={122 - 12}
            width={3.2}
            height={5}
            className={styles.hubTooth}
            transform={`rotate(${deg} ${cx} 122)`}
          />
        ))}
        <circle cx={cx} cy={122} r={4.5} className={styles.hubHole} />
      </g>
    </g>
  );
}

export default function Cassette({
  label,
  note,
  side = 'A',
  spinning = false,
  progress = 0,
  stripes = DEFAULT_STRIPES,
}: CassetteProps) {
  const p = Math.max(0, Math.min(1, progress));
  const leftPack = 26 - 11 * p;
  const rightPack = 15 + 11 * p;

  return (
    <svg
      className={styles.cassette}
      viewBox="0 0 400 252"
      data-spinning={spinning}
      role="img"
      aria-label={note ? `${label}, ${note}` : label}
    >
      {/* shell */}
      <rect x="3" y="3" width="394" height="246" rx="16" className={styles.shell} />
      <rect x="3" y="3" width="394" height="246" rx="16" className={styles.shellEdge} />
      {[
        [18, 18],
        [382, 18],
        [18, 234],
        [382, 234],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={5.5} className={styles.screw} />
          <path d={`M${x - 3} ${y}h6`} className={styles.screwSlot} />
        </g>
      ))}

      {/* paper label */}
      <rect x="28" y="16" width="344" height="164" rx="7" className={styles.label} />
      <rect x="28" y="92" width="344" height="12" fill={stripes[0]} />
      <rect x="28" y="104" width="344" height="12" fill={stripes[1]} />
      <rect x="28" y="116" width="344" height="12" fill={stripes[2]} />
      <path d="M40 60h320M40 84h320" className={styles.ruling} />

      <rect x="36" y="24" width="26" height="30" rx="3" className={styles.sideBox} />
      <text x="49" y="46" textAnchor="middle" className={styles.sideLetter}>
        {side}
      </text>
      <text x="74" y="54" className={styles.labelText}>
        {label}
      </text>
      {note && (
        <text x="42" y="80" className={styles.noteText}>
          {note}
        </text>
      )}

      {/* reel window */}
      <rect x="92" y="94" width="216" height="56" rx="12" className={styles.window} />
      <Reel cx={150} packRadius={leftPack} />
      <Reel cx={250} packRadius={rightPack} />
      <rect x="92" y="94" width="216" height="56" rx="12" className={styles.windowGlass} />

      {/* head opening */}
      <path d="M92 249 L110 196 H290 L308 249 Z" className={styles.headPlate} />
      {[140, 176, 224, 260].map((x) => (
        <rect key={x} x={x - 6} y={214} width={12} height={12} rx={2} className={styles.headHole} />
      ))}
      <circle cx={200} cy={220} r={6} className={styles.headHole} />
    </svg>
  );
}
