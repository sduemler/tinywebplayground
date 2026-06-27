import { useMemo, useState } from "react";
import data from "@data/akeelah/pangram-actors.json";
import styles from "./AkeelahList.module.css";

const ALPHABET = [..."abcdefghijklmnopqrstuvwxyz"];

interface Entry {
  character: string;
  characterDisplay?: string;
  movieTitle: string;
  year: number | null;
  coverage: number;
  missingLetters: string[];
  // [wordsBefore, fulfillingWord, wordsAfter]
  examples: Record<string, [string, string, string]>;
  tmdbId?: number;
  posterPath?: string | null;
  actor?: string | null;
}

const entries = (data.entries as Entry[]) || [];
const counts = data.counts;
const perfect = entries.filter((e) => e.coverage === 26);
const near = entries.filter((e) => e.coverage === 25);

const posterUrl = (p?: string | null) =>
  p ? `https://image.tmdb.org/t/p/w154${p}` : null;

const charName = (e: Entry) => {
  const raw = e.characterDisplay || e.character;
  // Cornell names are ALL-CAPS; title-case them for display
  return raw
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bMc(\w)/g, (_, c) => "Mc" + c.toUpperCase());
};

function AlphabetStrip({
  entry,
  active,
  onPick,
}: {
  entry: Entry;
  active: string | null;
  onPick: (letter: string) => void;
}) {
  const missing = new Set(entry.missingLetters);
  return (
    <div className={styles.strip} role="group" aria-label="Letters spoken">
      {ALPHABET.map((l) => {
        const isMissing = missing.has(l);
        const isActive = active === l;
        return (
          <button
            key={l}
            type="button"
            className={[
              styles.tile,
              isMissing ? styles.tileMissing : styles.tileSaid,
              isActive ? styles.tileActive : "",
            ].join(" ")}
            aria-pressed={isActive}
            aria-label={
              isMissing
                ? `${l.toUpperCase()} — never said`
                : `${l.toUpperCase()} — said “${entry.examples[l]?.[1]}”`
            }
            onClick={() => onPick(l)}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

function Card({ entry }: { entry: Entry }) {
  // default the readout to the X word (the rare prize) when present
  const initial = entry.missingLetters.includes("x") ? null : "x";
  const [active, setActive] = useState<string | null>(initial);
  const poster = posterUrl(entry.posterPath);
  const snip = active && !entry.missingLetters.includes(active) ? entry.examples[active] : null;

  return (
    <article className={styles.card}>
      <div className={styles.poster}>
        {poster ? (
          <img src={poster} alt="" loading="lazy" width={64} height={96} />
        ) : (
          <span className={styles.posterFallback}>{entry.movieTitle[0] || "?"}</span>
        )}
      </div>

      <div className={styles.body}>
        <h3 className={styles.actor}>
          {entry.actor || charName(entry)}
        </h3>
        <p className={styles.meta}>
          {entry.actor && <span className={styles.role}>as {charName(entry)}</span>}
          {!entry.actor && <span className={styles.roleUnknown}>actor unidentified</span>}
          <span className={styles.movie}>
            {entry.movieTitle}
            {entry.year ? ` (${entry.year})` : ""}
          </span>
        </p>

        <AlphabetStrip entry={entry} active={active} onPick={setActive} />

        <p className={styles.readout}>
          {active && snip ? (
            <>
              <span className={styles.readoutLetter}>{active.toUpperCase()}</span>
              <span className={styles.readoutSnippet}>
                {snip[0] && <span className={styles.dim}>…{snip[0]} </span>}
                <strong className={styles.readoutWord}>{snip[1]}</strong>
                {snip[2] && <span className={styles.dim}> {snip[2]}…</span>}
              </span>
            </>
          ) : active ? (
            <span className={styles.readoutMissing}>
              never said a word starting with “{active.toUpperCase()}”
            </span>
          ) : (
            <span className={styles.readoutHint}>tap a letter to see the word in context</span>
          )}
        </p>
      </div>
    </article>
  );
}

type Filter = "all" | "x" | "z" | "q" | "other";

export default function AkeelahList() {
  const [filter, setFilter] = useState<Filter>("all");
  const [shown, setShown] = useState(24);

  const filteredNear = useMemo(() => {
    if (filter === "all") return near;
    if (filter === "other")
      return near.filter((e) => !["x", "z", "q"].includes(e.missingLetters[0]));
    return near.filter((e) => e.missingLetters.includes(filter));
  }, [filter]);

  const visibleNear = filteredNear.slice(0, shown);

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: near.length },
    { key: "x", label: "Missing X", count: near.filter((e) => e.missingLetters.includes("x")).length },
    { key: "z", label: "Missing Z", count: near.filter((e) => e.missingLetters.includes("z")).length },
    { key: "q", label: "Missing Q", count: near.filter((e) => e.missingLetters.includes("q")).length },
  ];

  return (
    <div className={styles.wrap}>
      <section className={styles.intro}>
        <h1 className={styles.title}>From Akeelah to Z</h1>
        <p className={styles.lede}>
          Somewhere in their movie, these characters said at least one word
          starting with <em>every single letter of the alphabet</em> — all the way
          from <strong>A</strong> to the famously elusive <strong>X</strong>,{" "}
          <strong>Z</strong>, and <strong>Q</strong>.
        </p>
        <p className={styles.sub}>
          {counts.perfect} perfect alphabets and {counts.near.toLocaleString()} who came
          one letter short, mined from ~{data.totalMovies.toLocaleString()} screenplays.
          Tap any letter tile to see the actual word they said.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.medal}>★</span> The Perfect Alphabet
          <span className={styles.sectionCount}>26 / 26</span>
        </h2>
        <div className={styles.grid}>
          {perfect.map((e, i) => (
            <Card key={`p${i}`} entry={e} />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          So Close
          <span className={styles.sectionCount}>25 / 26</span>
        </h2>
        <p className={styles.sectionNote}>
          One letter shy of the full set — and it’s almost always <strong>X</strong>.
          Showing the {near.length} most talkative of {counts.near.toLocaleString()}.
        </p>

        <div className={styles.filters} role="tablist" aria-label="Filter near-misses">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              className={[styles.filter, filter === f.key ? styles.filterActive : ""].join(" ")}
              onClick={() => {
                setFilter(f.key);
                setShown(24);
              }}
            >
              {f.label} <span className={styles.filterCount}>{f.count}</span>
            </button>
          ))}
        </div>

        <div className={styles.grid}>
          {visibleNear.map((e, i) => (
            <Card key={`n${i}`} entry={e} />
          ))}
        </div>

        {shown < filteredNear.length && (
          <div className={styles.moreWrap}>
            <button
              type="button"
              className={styles.moreBtn}
              onClick={() => setShown((s) => s + 24)}
            >
              Show more ({filteredNear.length - shown} left)
            </button>
          </div>
        )}
      </section>

      <p className={styles.source}>
        Dialogue from the Cornell Movie-Dialogs Corpus; actors matched via TMDB.
        Counts are based on screenplay text, not a forensic transcript of every
        word spoken on screen. Names and hyphenated words (Xavier, x-ray) count.
      </p>
    </div>
  );
}
