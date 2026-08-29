import { useMemo } from "react";
import { useTcgStore } from "./store";
import {
  ACHIEVEMENTS,
  type Achievement,
  type AchievementCtx,
} from "./data/achievements";

function SealGlyph() {
  return (
    <svg className="ach-seal" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.18" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <path
        d="M8.2 12.3l2.6 2.5 5-5.2"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockGlyph() {
  return (
    <svg className="ach-lock" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="9.5" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function AchievementRow({
  ach,
  unlockedAt,
  ctx,
}: {
  ach: Achievement;
  unlockedAt: number | undefined;
  ctx: AchievementCtx;
}) {
  const unlocked = Boolean(unlockedAt);
  const prog = ach.progress?.(ctx);
  return (
    <div className={`ach-card ${unlocked ? "unlocked" : "locked"}`}>
      <div className="ach-icon">{unlocked ? <SealGlyph /> : <LockGlyph />}</div>
      <div className="ach-body">
        <div className="ach-name">{ach.name}</div>
        <div className="ach-desc">{ach.description}</div>
        {prog && !unlocked && prog.target > 1 ? (
          <div className="ach-progress">
            <div className="ach-bar">
              <span
                style={{ width: `${Math.round((prog.value / prog.target) * 100)}%` }}
              />
            </div>
            <span className="ach-progress-num">
              {prog.value} / {prog.target}
            </span>
          </div>
        ) : null}
      </div>
      {unlocked ? <span className="ach-stamp">Unlocked</span> : null}
    </div>
  );
}

export default function Achievements() {
  const owned = useTcgStore((s) => s.owned);
  const packsOpened = useTcgStore((s) => s.packsOpened);
  const achievements = useTcgStore((s) => s.achievements);

  const ctx: AchievementCtx = useMemo(
    () => ({ owned, prevOwned: owned, packsOpened, pack: [] }),
    [owned, packsOpened],
  );

  const completionist = ACHIEVEMENTS.filter((a) => a.kind === "completionist");
  const luck = ACHIEVEMENTS.filter((a) => a.kind === "luck");
  const unlockedCount = ACHIEVEMENTS.filter((a) => achievements[a.id]).length;

  const sections: { label: string; blurb: string; items: Achievement[] }[] = [
    {
      label: "Mastery",
      blurb: "Earned through dedication — keep collecting.",
      items: completionist,
    },
    {
      label: "Fortune",
      blurb: "Earned by chance — you'll know them when they happen.",
      items: luck,
    },
  ];

  return (
    <div className="tcg-achievements">
      <div className="tcg-stats">
        <div className="tcg-stat">
          <span className="n">
            {unlockedCount}
            <span className="of"> / {ACHIEVEMENTS.length}</span>
          </span>
          <span className="l">Achievements</span>
        </div>
      </div>

      {sections.map((sec) => (
        <section className="ach-section" key={sec.label}>
          <div className="ach-section-head">
            <h2 className="ach-section-title">{sec.label}</h2>
            <span className="ach-section-blurb">{sec.blurb}</span>
          </div>
          <div className="ach-grid">
            {sec.items.map((ach) => (
              <AchievementRow
                key={ach.id}
                ach={ach}
                unlockedAt={achievements[ach.id]}
                ctx={ctx}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
