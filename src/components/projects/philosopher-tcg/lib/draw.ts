import type { PhilosopherCard, Rarity } from "../types";

export const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 60,
  uncommon: 28,
  rare: 10,
  legendary: 3,
};

// Pick `n` distinct cards from the pool, weighted by rarity.
export function drawPack(
  pool: PhilosopherCard[],
  n = 3,
): PhilosopherCard[] {
  const avail = [...pool];
  const picks: PhilosopherCard[] = [];
  for (let k = 0; k < n && avail.length; k++) {
    const weights = avail.map((c) => RARITY_WEIGHT[c.rarity] || 1);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < avail.length - 1; idx++) {
      r -= weights[idx];
      if (r <= 0) break;
    }
    picks.push(avail[idx]);
    avail.splice(idx, 1);
  }
  return picks;
}
