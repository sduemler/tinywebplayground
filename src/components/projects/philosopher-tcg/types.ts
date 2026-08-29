export type SchoolKey =
  | "ancients"
  | "eastern"
  | "shifters"
  | "enlightenment"
  | "modern";

export type Rarity = "common" | "uncommon" | "rare" | "legendary";

export interface Move {
  name: string;
  cost: number;
  passive: boolean;
  text: string;
  dmg?: string;
  tail?: string;
}

export interface PhilosopherCard {
  id: string;
  name: string;
  epithet: string;
  era: string;
  school: SchoolKey;
  schoolLabel: string;
  rarity: Rarity;
  influence: number;
  move: Move;
  quote: string;
  portraitSrc: string | null;
  portraitPos: string;
}
