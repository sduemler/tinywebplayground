import { useMemo, useState } from "react";
import type { PhilosopherCard, SchoolKey } from "./types";
import { PHILOSOPHERS } from "./data/cards";
import { FACTIONS } from "./data/factions";
import { ACHIEVEMENTS } from "./data/achievements";
import { useTcgStore } from "./store";
import Card from "./Card";
import WaxSeal from "./WaxSeal";

interface Props {
  onFocus: (card: PhilosopherCard) => void;
}

type Filter = "all" | SchoolKey;

function LockGlyph() {
  return (
    <svg className="tcg-lock" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="10" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="15" r="1.4" fill="currentColor" />
    </svg>
  );
}

export default function Collection({ onFocus }: Props) {
  const owned = useTcgStore((s) => s.owned);
  const packsOpened = useTcgStore((s) => s.packsOpened);
  const achievements = useTcgStore((s) => s.achievements);
  const reset = useTcgStore((s) => s.reset);
  const [filter, setFilter] = useState<Filter>("all");

  const achievementsUnlocked = useMemo(
    () => ACHIEVEMENTS.filter((a) => achievements[a.id]).length,
    [achievements],
  );

  const uniqueCount = useMemo(
    () => PHILOSOPHERS.filter((c) => (owned[c.id] || 0) > 0).length,
    [owned],
  );
  const totalCards = useMemo(
    () => Object.values(owned).reduce((a, b) => a + b, 0),
    [owned],
  );

  const cards = useMemo(
    () => (filter === "all" ? PHILOSOPHERS : PHILOSOPHERS.filter((c) => c.school === filter)),
    [filter],
  );

  const onReset = () => {
    if (window.confirm("Reset your collection? This clears all owned cards and stats.")) {
      reset();
    }
  };

  return (
    <div className="tcg-collection">
      <div className="tcg-stats">
        <div className="tcg-stat">
          <span className="n">
            {uniqueCount}
            <span className="of"> / {PHILOSOPHERS.length}</span>
          </span>
          <span className="l">Collected</span>
        </div>
        <div className="tcg-stat">
          <span className="n">{totalCards}</span>
          <span className="l">Total Cards</span>
        </div>
        <div className="tcg-stat">
          <span className="n">{packsOpened}</span>
          <span className="l">Packs Opened</span>
        </div>
        <div className="tcg-stat">
          <span className="n">
            {achievementsUnlocked}
            <span className="of"> / {ACHIEVEMENTS.length}</span>
          </span>
          <span className="l">Achievements</span>
        </div>
        <button className="btn tcg-reset" onClick={onReset}>
          Reset
        </button>
      </div>

      <div className="tcg-filters">
        <button
          className={`tcg-filter ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        {FACTIONS.map((f) => (
          <button
            key={f.key}
            data-school={f.key}
            className={`tcg-filter ${filter === f.key ? "active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="tcg-grid">
        {cards.map((card) => {
          const count = owned[card.id] || 0;
          if (count > 0) {
            return (
              <div className="tcg-thumb" key={card.id} onClick={() => onFocus(card)}>
                <div className="tcg-thumb-scale">
                  <Card data={card} />
                </div>
                <span
                  className="tcg-count"
                  title={`Pulled from a pack ${count} ${count === 1 ? "time" : "times"}`}
                >
                  ×{count}
                </span>
              </div>
            );
          }
          return (
            <div
              className="tcg-locked"
              key={card.id}
              data-school={card.school}
              data-rarity={card.rarity}
            >
              <div className="tcg-locked-seal">
                <WaxSeal rarity={card.rarity} size={40} />
              </div>
              <LockGlyph />
              <span className="tcg-locked-id">{card.id}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
