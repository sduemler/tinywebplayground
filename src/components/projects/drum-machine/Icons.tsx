import type { SVGProps, ReactElement } from "react";
import type { DrumSample } from "./types";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function KickIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8" fill="currentColor" />
    </Svg>
  );
}

export function SnareIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <line x1="5" y1="9.5" x2="19" y2="9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="5" y1="14.5" x2="19" y2="14.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </Svg>
  );
}

export function HhClosedIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="10" width="18" height="1.7" rx="0.85" fill="currentColor" />
      <rect x="3" y="12.3" width="18" height="1.7" rx="0.85" fill="currentColor" />
    </Svg>
  );
}

export function HhOpenIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="7" width="18" height="1.7" rx="0.85" fill="currentColor" />
      <rect x="3" y="15.3" width="18" height="1.7" rx="0.85" fill="currentColor" />
      <line x1="7" y1="11.2" x2="7" y2="12.8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="12" y1="11.2" x2="12" y2="12.8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="17" y1="11.2" x2="17" y2="12.8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </Svg>
  );
}

export function CrashIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <g fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <line x1="12" y1="2.5" x2="12" y2="6.5" />
        <line x1="12" y1="17.5" x2="12" y2="21.5" />
        <line x1="2.5" y1="12" x2="6.5" y2="12" />
        <line x1="17.5" y1="12" x2="21.5" y2="12" />
        <line x1="5" y1="5" x2="7.8" y2="7.8" />
        <line x1="16.2" y1="16.2" x2="19" y2="19" />
        <line x1="19" y1="5" x2="16.2" y2="7.8" />
        <line x1="7.8" y1="16.2" x2="5" y2="19" />
      </g>
      <circle cx="12" cy="12" r="2.75" fill="currentColor" />
    </Svg>
  );
}

export function RideIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="12" cy="12" r="5.75" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </Svg>
  );
}

export function ClapIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 17 L12 12 L7 7" />
        <path d="M17 17 L12 12 L17 7" />
      </g>
    </Svg>
  );
}

export function TomLoIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="10.5" r="7" fill="currentColor" />
      <path d="M9 18.5 L12 21 L15 18.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TomMidIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="6.5" fill="currentColor" />
      <line x1="3.5" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="18" y1="12" x2="20.5" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function TomHiIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="13.5" r="6" fill="currentColor" />
      <path d="M9 5.5 L12 3 L15 5.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CongaIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path
        fillRule="evenodd"
        fill="currentColor"
        d="M7.5 3 h9 a1.5 1.5 0 0 1 1.5 1.5 v15 a1.5 1.5 0 0 1 -1.5 1.5 h-9 a1.5 1.5 0 0 1 -1.5 -1.5 v-15 a1.5 1.5 0 0 1 1.5 -1.5 z M7.5 6.25 h9 v1.2 h-9 z M7.5 17 h9 v1.2 h-9 z"
      />
    </Svg>
  );
}

export function CowbellIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M8.5 4.5 L15.5 4.5 L17.5 19.5 L6.5 19.5 Z" fill="currentColor" />
    </Svg>
  );
}

export function ShakerIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="9" y="3" width="6" height="18" rx="3" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <line x1="2.5" y1="8" x2="5.5" y2="6.5" />
        <line x1="2.5" y1="12" x2="5.5" y2="12" />
        <line x1="2.5" y1="16" x2="5.5" y2="17.5" />
        <line x1="18.5" y1="8" x2="21.5" y2="6.5" />
        <line x1="18.5" y1="12" x2="21.5" y2="12" />
        <line x1="18.5" y1="16" x2="21.5" y2="17.5" />
      </g>
    </Svg>
  );
}

export function TambourineIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="3.25" r="1.15" fill="currentColor" />
      <circle cx="12" cy="20.75" r="1.15" fill="currentColor" />
      <circle cx="3.25" cy="12" r="1.15" fill="currentColor" />
      <circle cx="20.75" cy="12" r="1.15" fill="currentColor" />
      <circle cx="5.85" cy="5.85" r="1.15" fill="currentColor" />
      <circle cx="18.15" cy="18.15" r="1.15" fill="currentColor" />
      <circle cx="18.15" cy="5.85" r="1.15" fill="currentColor" />
      <circle cx="5.85" cy="18.15" r="1.15" fill="currentColor" />
    </Svg>
  );
}

export function RimshotIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="7.25" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <line x1="6.5" y1="17.5" x2="17.5" y2="6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

/* --- Controls --- */

export function PlayIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7 4 L20 12 L7 20 Z" fill="currentColor" />
    </Svg>
  );
}

export function PauseIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="6" y="4" width="4.5" height="16" rx="0.6" fill="currentColor" />
      <rect x="13.5" y="4" width="4.5" height="16" rx="0.6" fill="currentColor" />
    </Svg>
  );
}

export function StopIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="5" y="5" width="14" height="14" rx="1" fill="currentColor" />
    </Svg>
  );
}

export function TempoIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M8 20.5 L16 20.5 L13.5 3.5 L10.5 3.5 Z" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <line x1="10" y1="14" x2="16.5" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function SwingIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 16 Q 7 4 12 12 Q 17 20 21 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function VolumeIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 9 L4 15 L9 15 L14 19 L14 5 L9 9 Z" fill="currentColor" />
      <path d="M17 8.5 Q 20 12 17 15.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M19.5 5.5 Q 23.5 12 19.5 18.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function PanIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <line x1="12" y1="12" x2="16.5" y2="7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function MuteIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 9 L4 15 L9 15 L14 19 L14 5 L9 9 Z" fill="currentColor" />
      <line x1="17" y1="9" x2="21" y2="15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <line x1="21" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </Svg>
  );
}

export function SoloIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="12" y="15.8" textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor" fontFamily="Inter, sans-serif">S</text>
    </Svg>
  );
}

export function StepIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="4.5" cy="12" r="1.5" fill="currentColor" opacity="0.35" />
      <circle cx="9.5" cy="12" r="2.4" fill="currentColor" />
      <circle cx="14.5" cy="12" r="1.5" fill="currentColor" opacity="0.35" />
      <circle cx="19.5" cy="12" r="1.5" fill="currentColor" opacity="0.35" />
    </Svg>
  );
}

export function SaveIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path fillRule="evenodd" fill="currentColor" d="M5 3.5 L15.5 3.5 L20.5 8.5 L20.5 20.5 L5 20.5 Z M8 4.5 h7 v4.5 h-7 z M8 13 h8 v6 h-8 z M9.5 14.5 h5 v3 h-5 z" />
    </Svg>
  );
}

export function LoadIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 7.5 L10 7.5 L12 9.5 L21 9.5 L21 19 L3 19 Z" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M12 16.5 L12 11.5 M9 14 L12 11 L15 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronDownIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path
        d="M6 9 L12 15 L18 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type IconComponent = (p: IconProps) => ReactElement;

// Resolve a sample to its icon by category + name heuristics so every pack
// gets sensible icons without needing a hand-maintained per-id map.
export function iconForSample(sample: DrumSample): IconComponent | undefined {
  const suffix = sample.id.includes(":")
    ? sample.id.split(":").slice(1).join(":")
    : sample.id;
  const hay = `${suffix} ${sample.name}`.toLowerCase();

  switch (sample.category) {
    case "kick":
      return KickIcon;
    case "snare":
      return SnareIcon;
    case "clap":
      return ClapIcon;
    case "hat":
      return hay.includes("open") ? HhOpenIcon : HhClosedIcon;
    case "cymbal":
      return hay.includes("ride") ? RideIcon : CrashIcon;
    case "tom":
      if (hay.includes("low") || hay.includes("floor") || hay.includes("flr")) return TomLoIcon;
      if (hay.includes("high") || /\bhi\b/.test(hay)) return TomHiIcon;
      return TomMidIcon;
    case "perc":
      if (hay.includes("cowbell")) return CowbellIcon;
      if (hay.includes("conga")) return CongaIcon;
      if (hay.includes("tamb")) return TambourineIcon;
      if (
        hay.includes("rim") ||
        hay.includes("side") ||
        hay.includes("clave") ||
        hay.includes("snap")
      )
        return RimshotIcon;
      return ShakerIcon;
    case "fx":
      if (hay.includes("click")) return RimshotIcon;
      return undefined;
    default:
      return undefined;
  }
}
