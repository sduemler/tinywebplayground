import styles from "./PlayerStatsModal.module.css";
import { usePlayerStats, type RankedName } from "./usePlayerStats";
import type { EntryData, SolveEvent } from "./types";

interface Props {
  puzzleId: string;
  uid: string | null;
  entries: Map<string, EntryData>;
  solveHistory: SolveEvent[];
  onClose: () => void;
}

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) {
    const rs = s % 60;
    return rs ? `${m}m ${rs}s` : `${m}m`;
  }
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}m` : `${h}h`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function RankList({ title, rows }: { title: string; rows: RankedName[] }) {
  return (
    <div className={styles.rankBlock}>
      <div className={styles.rankTitle}>{title}</div>
      {rows.length === 0 ? (
        <div className={styles.rankEmpty}>Nobody yet</div>
      ) : (
        <ul className={styles.rankList}>
          {rows.map((r) => (
            <li key={r.name} className={styles.rankRow}>
              <span className={styles.rankName}>{r.name}</span>
              <span className={styles.rankCount}>{r.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PlayerStatsModal({
  puzzleId,
  uid,
  entries,
  solveHistory,
  onClose,
}: Props) {
  const stats = usePlayerStats(puzzleId, uid, entries, solveHistory);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Your Stats</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {!stats || stats.totalSolves === 0 ? (
          <p className={styles.empty}>
            Solve a few clues and your stats will show up here.
          </p>
        ) : (
          <div className={styles.body}>
            <section className={styles.section}>
              <div className={styles.sectionTitle}>Summary</div>
              <div className={styles.statGrid}>
                <Stat value={`${stats.totalSolves}`} label="Clues solved" />
                <Stat
                  value={`${stats.totalLetters}`}
                  label="Letters filled"
                />
                <Stat
                  value={`${stats.acrossCount} / ${stats.downCount}`}
                  label="Across / Down"
                />
              </div>
              {stats.firstSolveAt && stats.lastSolveAt && (
                <div className={styles.note}>
                  Solving since {formatDate(stats.firstSolveAt)} · last solve{" "}
                  {formatDate(stats.lastSolveAt)}
                </div>
              )}
            </section>

            <section className={styles.section}>
              <div className={styles.sectionTitle}>Timing</div>
              <div className={styles.statGrid}>
                <Stat
                  value={
                    stats.avgSolveMs != null
                      ? formatDuration(stats.avgSolveMs)
                      : "—"
                  }
                  label="Avg. solve time"
                />
                <Stat
                  value={
                    stats.quickestSolveMs != null
                      ? formatDuration(stats.quickestSolveMs)
                      : "—"
                  }
                  label="Fastest solve"
                />
                <Stat
                  value={
                    stats.longestSolveMs != null
                      ? formatDuration(stats.longestSolveMs)
                      : "—"
                  }
                  label="Longest a clue waited"
                />
              </div>
              <div className={styles.note}>
                {stats.firstResponderCount} solved within a minute of unlocking.
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionTitle}>Accuracy</div>
              <div className={styles.statGrid}>
                <Stat
                  value={`${stats.totalWrongAttempts}`}
                  label="Wrong guesses"
                />
                <Stat
                  value={
                    stats.accuracy != null
                      ? `${Math.round(stats.accuracy * 100)}%`
                      : "—"
                  }
                  label="Accuracy"
                />
                <Stat
                  value={stats.favoriteCategory ?? "—"}
                  label="Favourite category"
                />
              </div>
              {stats.hardestClue && (
                <div className={styles.note}>
                  Hardest clue you cracked:{" "}
                  <strong>{stats.hardestClue.word}</strong> — took the crowd{" "}
                  {stats.hardestClue.wrongAttempts} wrong guess
                  {stats.hardestClue.wrongAttempts === 1 ? "" : "es"}.
                </div>
              )}
            </section>

            <section className={styles.section}>
              <div className={styles.sectionTitle}>Teamwork</div>
              <div className={styles.rankGrid}>
                <RankList
                  title="Unlocked clues for you"
                  rows={stats.topUnlockPartners}
                />
                <RankList
                  title="Solved clues you unlocked"
                  rows={stats.handedOffTo}
                />
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
