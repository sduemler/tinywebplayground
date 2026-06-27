import { useMemo, useState } from "react";
import styles from "./CompletionOverlay.module.css";
import type { EntryData } from "./types";

interface Props {
  solveCount: number;
  entries: Map<string, EntryData>;
  launchAt: Date | null;
  onPlayTimelapse: () => void;
}

const MEDALS = ["🥇", "🥈", "🥉"];

// "2 days, 5 hours and 13 minutes" — friendly elapsed-time phrasing.
function formatElapsed(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days} day${days === 1 ? "" : "s"}`);
  if (hours) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (mins || parts.length === 0) {
    parts.push(`${mins} minute${mins === 1 ? "" : "s"}`);
  }
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

export default function CompletionOverlay({
  solveCount,
  entries,
  launchAt,
  onPlayTimelapse,
}: Props) {
  const [showAllContributors, setShowAllContributors] = useState(false);

  const allSolvers = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries.values()) {
      if (entry.solvedBy) {
        counts.set(entry.solvedBy, (counts.get(entry.solvedBy) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({ rank: i + 1, name, count }));
  }, [entries]);

  const topSolvers = allSolvers.slice(0, 3);

  const lastSolve = useMemo(() => {
    let best: EntryData | null = null;
    for (const entry of entries.values()) {
      if (entry.solveSequence != null) {
        if (!best || entry.solveSequence > best.solveSequence!) {
          best = entry;
        }
      }
    }
    return best;
  }, [entries]);

  // A few whole-puzzle totals, summed from the (now fully solved) entries.
  const worldStats = useMemo(() => {
    let letters = 0;
    let wrong = 0;
    let across = 0;
    let down = 0;
    for (const entry of entries.values()) {
      wrong += entry.wrongAttempts || 0;
      if (entry.solvedBy) {
        letters += entry.length;
        if (entry.direction === "across") across++;
        else down++;
      }
    }
    return { letters, wrong, across, down };
  }, [entries]);

  const contributors = allSolvers.length;

  // Time from launch to the final solve.
  const timeText = useMemo(() => {
    const end = lastSolve?.solvedAt ?? null;
    if (!end || !launchAt) return "record time";
    return formatElapsed(end.getTime() - launchAt.getTime());
  }, [lastSolve, launchAt]);

  return (
    <div className={styles.overlay}>
      <a href="/" className={styles.backLink} aria-label="Back to projects">
        <span aria-hidden="true">←</span> Back to projects
      </a>
      <div className={styles.card}>
        <h1 className={styles.title}>Congratulations!</h1>
        <p className={styles.stat}>
          All <strong>{solveCount}</strong> clues solved
        </p>

        <div className={styles.columns}>
          {topSolvers.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Top Solvers</h2>
              <ol className={styles.podium}>
                {topSolvers.map(({ name, count }, i) => (
                  <li key={name} className={styles.podiumRow}>
                    <span className={styles.medal}>{MEDALS[i]}</span>
                    <span className={styles.solverName}>{name}</span>
                    <span className={styles.solverCount}>{count}</span>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                className={styles.sectionBtn}
                onClick={() => setShowAllContributors(true)}
              >
                All contributors
              </button>
            </div>
          )}

          {lastSolve && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Final Clue</h2>
              <p className={styles.finalClue}>{lastSolve.clue}</p>
              <p className={styles.finalAnswer}>
                {lastSolve.word}
                <span className={styles.finalSolver}>
                  solved by {lastSolve.solvedBy}
                </span>
              </p>
              <button className={styles.sectionBtn} onClick={onPlayTimelapse}>
                <span className={styles.playIcon}>▶</span>
                Watch timelapse
              </button>
            </div>
          )}
        </div>

        <div className={styles.worldStats}>
          <div className={styles.worldStat}>
            <span className={styles.worldStatValue}>{contributors}</span>
            <span className={styles.worldStatLabel}>Contributors</span>
          </div>
          <div className={styles.worldStat}>
            <span className={styles.worldStatValue}>
              {worldStats.letters.toLocaleString()}
            </span>
            <span className={styles.worldStatLabel}>Letters filled</span>
          </div>
          <div className={styles.worldStat}>
            <span className={styles.worldStatValue}>
              {worldStats.across} / {worldStats.down}
            </span>
            <span className={styles.worldStatLabel}>Across / Down</span>
          </div>
          <div className={styles.worldStat}>
            <span className={styles.worldStatValue}>
              {worldStats.wrong.toLocaleString()}
            </span>
            <span className={styles.worldStatLabel}>Wrong guesses</span>
          </div>
        </div>

        <div className={styles.comingSoon}>
          <p className={styles.comingSoonSub}>
            Wow, that was fast! This one was two and a half times the size of the
            first crossword, but you all managed to finish it in {timeText}. I'm
            already hard at work on the next one, but if you have any suggestions
            for categories I overlooked or game mechanics that would be fun, let
            me know! You can email me at{" "}
            <a
              className={styles.comingSoonLink}
              href="mailto:samduemler@protonmail.com"
            >
              samduemler@protonmail.com
            </a>
            .
          </p>
          <p className={styles.comingSoonSub}>
            If you want to join in on the next one, make sure to add your email
            to the subscribe list!
          </p>
          <SubscribeForm />
        </div>
      </div>

      {showAllContributors && (
        <div
          className={styles.contributorsOverlay}
          onClick={() => setShowAllContributors(false)}
        >
          <div
            className={styles.contributorsLightbox}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.contributorsClose}
              onClick={() => setShowAllContributors(false)}
            >
              &times;
            </button>
            <h3 className={styles.contributorsTitle}>Contributors</h3>
            <ol className={styles.contributorsList}>
              {allSolvers.map(({ rank, name, count }) => (
                <li key={name} className={styles.contributorsRow}>
                  <span className={styles.contributorsRank}>{rank}</span>
                  <span className={styles.contributorsName}>{name}</span>
                  <span className={styles.contributorsCount}>{count}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setState("success");
        setMessage("You're subscribed! Check your email to confirm.");
      } else {
        setState("error");
        setMessage(data.error || "Something went wrong.");
      }
    } catch {
      setState("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className={styles.subscribe}>
      <form className={styles.subscribeForm} onSubmit={handleSubmit}>
        <input
          type="email"
          className={styles.subscribeInput}
          placeholder="your@email.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={state === "success" || state === "loading"}
          aria-label="Email address"
        />
        <button
          type="submit"
          className={`${styles.subscribeBtn} ${state === "success" ? styles.subscribeBtnSuccess : ""}`}
          disabled={state === "success" || state === "loading"}
        >
          {state === "success" ? "\u{1F44D}" : "Subscribe"}
        </button>
      </form>
      {message && (
        <p
          className={`${styles.subscribeMsg} ${styles[`subscribeMsg_${state}`]}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
