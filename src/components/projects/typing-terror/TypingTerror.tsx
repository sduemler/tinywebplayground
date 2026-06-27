import { useEffect, useState } from "react";
import { sets } from "@data/typing-terror/passages";
import type { PromptStat, Screen, TypingSet } from "./types";
import { pickSet } from "./utils";
import { useTerrorStore } from "./store";
import TypingTest from "./TypingTest";
import Results from "./Results";
import styles from "./TypingTerror.module.css";

export default function TypingTerror() {
  const [screen, setScreen] = useState<Screen>("start");
  const [current, setCurrent] = useState<TypingSet | null>(null);
  const [promptIndex, setPromptIndex] = useState(0);
  const [stats, setStats] = useState<PromptStat[]>([]);
  const [newBests, setNewBests] = useState<boolean[]>([]);
  const [mounted, setMounted] = useState(false);

  const bestByPassage = useTerrorStore((s) => s.bestByPassage);
  const recordRun = useTerrorStore((s) => s.recordRun);

  // Avoid hydration mismatch from persisted state.
  useEffect(() => setMounted(true), []);

  function begin() {
    setCurrent(pickSet(sets, current?.id));
    setPromptIndex(0);
    setStats([]);
    setNewBests([]);
    setScreen("typing");
  }

  function handlePromptComplete(stat: PromptStat) {
    const next = [...stats, stat];
    setStats(next);
    if (current && promptIndex + 1 >= current.prompts.length) {
      finishRun(next);
    } else {
      setPromptIndex((i) => i + 1);
    }
  }

  function finishRun(all: PromptStat[]) {
    // Which passages beat the stored best (read before we update it).
    const prev = useTerrorStore.getState().bestByPassage;
    setNewBests(all.map((p, i) => p.wpm > 0 && p.wpm > (prev[i] ?? 0)));
    recordRun(all.map((p) => p.wpm));
    setScreen("results");
  }

  if (screen === "typing" && current) {
    const tier = current.prompts[promptIndex].tier;
    return (
      <div className={styles.stage} data-tier={tier}>
        <div className={styles.stageInner}>
          <TypingTest
            key={`${current.id}-${promptIndex}`}
            prompt={current.prompts[promptIndex]}
            index={promptIndex}
            total={current.prompts.length}
            onComplete={handlePromptComplete}
          />
        </div>
      </div>
    );
  }

  if (screen === "results" && current) {
    return (
      <div className={styles.stage} data-tier={3}>
        <div className={styles.stageInner}>
          <Results
            set={current}
            stats={stats}
            newBests={newBests}
            onAgain={begin}
          />
        </div>
      </div>
    );
  }

  // Start screen
  return (
    <div className={`${styles.stage} ${styles.stageStart}`} data-tier={1}>
      <div className={styles.stageInner}>
        <div className={styles.start}>
          <h1 className={styles.startTitle}>Can you become a typing terror?</h1>

          <button type="button" className={styles.beginButton} onClick={begin}>
            Begin the test
          </button>

          {mounted && bestByPassage.some((b) => b > 0) && (
            <div className={styles.startStats}>
              <p className={styles.startBest}>Your best by passage</p>
              <ul className={styles.runList}>
                {bestByPassage.map((b, i) => (
                  <li key={i} className={styles.runItem}>
                    <span className={styles.runBook}>Passage {i + 1}</span>
                    <span className={styles.runMeta}>
                      {b > 0 ? `${b} wpm` : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className={styles.startNote}>
            {sets.length} passages drawn from the public-domain weird &amp;
            gothic canon. Keep typing. Don't look away.
          </p>
        </div>
      </div>
    </div>
  );
}
