import type { SchoolKey } from "../types";

export interface Faction {
  key: SchoolKey;
  label: string;
  color: string; // matches the --faction value in philosopher-tcg.css
}

// Faction colors are also encoded in `.card[data-school=...]` rules in
// philosopher-tcg.css — keep the two in sync if a color changes.
export const FACTIONS: Faction[] = [
  { key: "ancients", label: "The Ancients", color: "#8a3a2a" },
  { key: "eastern", label: "The Sages", color: "#2f6f5e" },
  { key: "shifters", label: "The Revolutionaries", color: "#2b4a86" },
  { key: "enlightenment", label: "The Enlightened", color: "#9a6a18" },
  { key: "modern", label: "The Moderns", color: "#5a4665" },
];

export const FACTION_BY_KEY: Record<SchoolKey, Faction> = Object.fromEntries(
  FACTIONS.map((f) => [f.key, f]),
) as Record<SchoolKey, Faction>;
