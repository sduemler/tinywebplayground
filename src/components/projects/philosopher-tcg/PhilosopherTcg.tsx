import { useEffect, useState } from "react";
import "./philosopher-tcg.css";
import type { PhilosopherCard } from "./types";
import PackOpener from "./PackOpener";
import Collection from "./Collection";
import Achievements from "./Achievements";
import AchievementToast from "./AchievementToast";
import Card from "./Card";
import { useTcgStore } from "./store";

type Tab = "open" | "collection" | "achievements";

export default function PhilosopherTcg() {
  const [tab, setTab] = useState<Tab>("open");
  const [focused, setFocused] = useState<PhilosopherCard | null>(null);
  const syncAchievements = useTcgStore((s) => s.syncAchievements);
  const setDevMode = useTcgStore((s) => s.setDevMode);

  // Credit completionist achievements already satisfied by a saved collection
  // (e.g. progress made before achievements existed).
  useEffect(() => {
    syncAchievements();
  }, [syncAchievements]);

  // Admin/testing bypass: visit /projects/philosopher-tcg?dev to unlock
  // unlimited pack-opening (skips the daily limit). Off on a normal visit.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).has("dev")) {
      setDevMode(true);
    }
  }, [setDevMode]);

  // Load the display + mono fonts this project uses (the rest of the site uses
  // different families). Injected as a <link> and cleaned up on unmount.
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(link);
    return () => {
      try {
        document.head.removeChild(link);
      } catch {
        /* noop */
      }
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocused(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="tcg-root">
      <div className="app">
        <div className="topbar">
          <div className="brand">
            <a href="/" className="tcg-back" aria-label="Back to hub">
              ← Hub
            </a>
            <span className="mark">First Principles</span>
            <span className="set">A Philosopher TCG · Set 01</span>
          </div>
          <nav className="tcg-tabs" aria-label="Views">
            <button
              className={`tcg-tab ${tab === "open" ? "active" : ""}`}
              onClick={() => setTab("open")}
            >
              Open Packs
            </button>
            <button
              className={`tcg-tab ${tab === "collection" ? "active" : ""}`}
              onClick={() => setTab("collection")}
            >
              Collection
            </button>
            <button
              className={`tcg-tab ${tab === "achievements" ? "active" : ""}`}
              onClick={() => setTab("achievements")}
            >
              Achievements
            </button>
          </nav>
        </div>

        {tab === "open" ? (
          <PackOpener onFocus={setFocused} />
        ) : tab === "collection" ? (
          <Collection onFocus={setFocused} />
        ) : (
          <Achievements />
        )}
      </div>

      <AchievementToast />

      <div
        className={`focus-veil ${focused ? "open" : ""}`}
        onClick={(e) => {
          if ((e.target as HTMLElement).classList.contains("focus-veil")) setFocused(null);
        }}
      >
        <button className="close" onClick={() => setFocused(null)}>
          ✕ Close
        </button>
        {focused && <Card data={focused} onClick={() => setFocused(null)} />}
      </div>
    </div>
  );
}
