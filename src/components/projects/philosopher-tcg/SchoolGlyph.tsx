import type { SchoolKey } from "./types";

interface Props {
  school: SchoolKey;
  size?: number;
}

export default function SchoolGlyph({ school, size = 28 }: Props) {
  const c = "currentColor";
  const sw = "1.4";
  if (school === "ancients")
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round">
        <path d="M6 8 H26" />
        <path d="M7 24 H25" />
        <path d="M10 8 V24 M16 8 V24 M22 8 V24" />
      </svg>
    );
  if (school === "eastern")
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round">
        <path d="M21 6.4 A11 11 0 1 0 25.6 14" />
      </svg>
    );
  if (school === "shifters")
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={c} strokeWidth="1.2">
        <ellipse cx="16" cy="16" rx="12" ry="6" />
        <ellipse cx="16" cy="16" rx="12" ry="6" transform="rotate(60 16 16)" />
        <circle cx="16" cy="16" r="2.4" fill={c} />
      </svg>
    );
  if (school === "enlightenment")
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round">
        <circle cx="16" cy="16" r="5.5" />
        <path d="M16 3 V6 M16 26 V29 M3 16 H6 M26 16 H29 M6.8 6.8 L9 9 M23 23 L25.2 25.2 M25.2 6.8 L23 9 M9 23 L6.8 25.2" />
      </svg>
    );
  if (school === "modern")
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={c} strokeWidth={sw}>
        <rect x="6" y="6" width="13" height="13" />
        <rect x="13" y="13" width="13" height="13" />
      </svg>
    );
  return null;
}
