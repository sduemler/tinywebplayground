import type { Rarity } from "./types";

const RARITY_GLYPH: Record<Rarity, string> = {
  common: "α",
  uncommon: "β",
  rare: "γ",
  legendary: "Ω",
};

const WAX_PALETTE: Record<Rarity, [string, string, string]> = {
  common: ["#b9bcc2", "#7c808a", "#454952"],
  uncommon: ["#74b24e", "#3f7330", "#173d18"],
  rare: ["#4d83d4", "#284f96", "#102544"],
  legendary: ["#f0c24e", "#bb7d1c", "#5e3a08"],
};

// Per-glyph [dx, dy] nudges so each letter's ink box sits centered in the seal.
// The shared baseline below is tuned for a cap (Ω); these correct for the
// differing x-heights/ascenders/descenders and the italic slant. Measured from
// the rendered Cormorant Garamond ink box; unknown glyphs fall back to [0, 0].
const GLYPH_OFFSET: Record<string, [number, number]> = {
  "α": [0.3, -5.6],
  "β": [2.0, -4.6],
  "γ": [-0.4, -10.5],
  "Ω": [-3.0, 0],
};

interface Props {
  rarity: Rarity;
  size?: number;
  glyph?: string;
}

export default function WaxSeal({ rarity, size = 46, glyph }: Props) {
  const [hi, mid, lo] = WAX_PALETTE[rarity] || WAX_PALETTE.common;
  const uid = `wax-${rarity}-${size}`;
  const letter = glyph || RARITY_GLYPH[rarity];
  const [ox, oy] = GLYPH_OFFSET[letter] || [0, 0];
  return (
    <svg width={size} height={size} viewBox="0 0 110 110" className="wax-seal" data-rarity={rarity}>
      <defs>
        <radialGradient id={uid} cx="0.5" cy="0.5" r="0.55">
          <stop offset="0%" stopColor={lo} />
          <stop offset="55%" stopColor={mid} />
          <stop offset="85%" stopColor={hi} />
          <stop offset="100%" stopColor={mid} />
        </radialGradient>
      </defs>
      <path d="M 55 8 C 70 6, 88 14, 92 32 C 102 42, 100 58, 92 66 C 100 80, 86 100, 70 96 C 62 104, 48 102, 42 92 C 26 100, 10 86, 16 70 C 6 60, 8 40, 22 32 C 24 14, 40 6, 55 8 Z" fill={`url(#${uid})`} />
      <circle cx="55" cy="55" r="30" fill="none" stroke="rgba(0,0,0,.55)" strokeWidth="2.5" />
      <path d="M 28 50 A 30 30 0 0 1 82 50" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="1" />
      <path d="M 28 58 A 30 30 0 0 0 82 58" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="1.2" />
      <path d="M 30 18 Q 55 6 80 18" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="1.4" strokeLinecap="round" />
      <text x={56 + ox} y={72.6 + oy} textAnchor="middle" fontFamily='"Cormorant Garamond", serif' fontSize="44" fontWeight="700" fontStyle="italic" fill="rgba(0,0,0,.5)">{letter}</text>
      <text x={55 + ox} y={71.4 + oy} textAnchor="middle" fontFamily='"Cormorant Garamond", serif' fontSize="46" fontWeight="700" fontStyle="italic" fill="rgba(255,255,255,.95)">{letter}</text>
    </svg>
  );
}
