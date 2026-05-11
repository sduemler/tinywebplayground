import { useMemo, useState } from "react";
import styles from "./CompletionOverlay.module.css";
import type { EntryData } from "./types";

interface Props {
  solveCount: number;
  entries: Map<string, EntryData>;
  onPlayTimelapse: () => void;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function CompletionOverlay({
  solveCount,
  entries,
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

  return (
    <div className={styles.overlay}>
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
        <div className={styles.comingSoon}>
          <p className={styles.comingSoonText}>Coming Soon</p>
          <p className={styles.comingSoonSub}>
            A new puzzle is being prepared. Check back or get notified when it's
            ready!
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
