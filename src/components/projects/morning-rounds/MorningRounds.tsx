import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { GAMES, TAG_COLORS, FALLBACK_COLOR, type Game } from "@data/morning-rounds/games";
import { useRoundsStore } from "./store";
import { formatToday, hostOf, normalizeUrl, todayKey } from "./utils";
import styles from "./MorningRounds.module.css";

/** Re-reads the date when the tab comes back into view, so a page left open overnight starts fresh. */
function useToday() {
  const [today, setToday] = useState(todayKey);
  useEffect(() => {
    const check = () => setToday(todayKey());
    const id = window.setInterval(check, 60_000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, []);
  return today;
}

export default function MorningRounds() {
  const today = useToday();
  const day = useRoundsStore((s) => s.day);
  const playedRaw = useRoundsStore((s) => s.played);
  const hidden = useRoundsStore((s) => s.hidden);
  const customGames = useRoundsStore((s) => s.customGames);
  const markPlayed = useRoundsStore((s) => s.markPlayed);
  const unmarkPlayed = useRoundsStore((s) => s.unmarkPlayed);
  const resetToday = useRoundsStore((s) => s.resetToday);
  const toggleHidden = useRoundsStore((s) => s.toggleHidden);
  const removeCustom = useRoundsStore((s) => s.removeCustom);

  const [editing, setEditing] = useState(false);
  const [blocked, setBlocked] = useState(0);

  const played = new Set(day === today ? playedRaw : []);
  const allGames = [...GAMES, ...customGames];
  const visible = allGames.filter((g) => !hidden.includes(g.id));
  const remaining = visible.filter((g) => !played.has(g.id));
  const doneCount = visible.length - remaining.length;
  const shown = editing ? allGames : visible;

  // Browsers allow one new tab per click unless pop-ups are allowed for the site;
  // window.open returns null for each one it blocks.
  function openGames(list: Game[]) {
    const opened: string[] = [];
    for (const g of list) {
      const w = window.open(g.url, "_blank");
      if (w) {
        w.opener = null;
        opened.push(g.id);
      }
    }
    markPlayed(opened);
    setBlocked(list.length - opened.length);
  }

  return (
    <div className={styles.wrapper}>
      <section className={styles.masthead}>
        <p className={styles.date}>{formatToday()}</p>
        <div className={styles.progressRow}>
          <span className={styles.count}>
            {visible.length === 0
              ? "No games on your list"
              : remaining.length === 0
                ? "That's the round. See you tomorrow."
                : `${doneCount} of ${visible.length} played today`}
          </span>
          <div
            className={styles.bar}
            role="progressbar"
            aria-label="Games played today"
            aria-valuemin={0}
            aria-valuemax={visible.length}
            aria-valuenow={doneCount}
          >
            <span style={{ width: `${visible.length ? (doneCount / visible.length) * 100 : 0}%` }} />
          </div>
        </div>

        <div className={styles.toolbar}>
          <button
            className={styles.primary}
            onClick={() => openGames(remaining)}
            disabled={remaining.length === 0 || editing}
          >
            Open remaining ({remaining.length})
          </button>
          <button
            className={styles.secondary}
            onClick={() => openGames(visible)}
            disabled={visible.length === 0 || editing}
          >
            Open all
          </button>
          <button
            className={styles.ghost}
            onClick={() => setEditing((e) => !e)}
            aria-pressed={editing}
          >
            {editing ? "Done editing" : "Edit list"}
          </button>
        </div>

        {blocked > 0 ? (
          <p className={styles.blocked} role="status">
            Your browser blocked {blocked} {blocked === 1 ? "tab" : "tabs"}. Allow pop-ups for this
            site (look for the icon at the end of the address bar), then press the button again.
            <button className={styles.dismiss} onClick={() => setBlocked(0)} aria-label="Dismiss">
              ×
            </button>
          </p>
        ) : (
          <p className={styles.hint}>
            Each game opens in a new tab and counts as played. Opening several at once needs
            pop-ups allowed for this site.
          </p>
        )}
      </section>

      <ul className={styles.grid}>
        {shown.map((g) => {
          const isPlayed = played.has(g.id);
          const isHidden = hidden.includes(g.id);
          const tile = { "--tile": TAG_COLORS[g.tag] ?? FALLBACK_COLOR } as CSSProperties;
          return (
            <li
              key={g.id}
              className={styles.card}
              data-played={isPlayed || undefined}
              data-hidden={isHidden || undefined}
              style={tile}
            >
              <a
                className={styles.link}
                href={g.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => markPlayed([g.id])}
                onAuxClick={(e) => e.button === 1 && markPlayed([g.id])}
              >
                <span className={styles.tile} aria-hidden="true">
                  {isPlayed ? "✓" : g.monogram}
                </span>
                <span className={styles.body}>
                  <span className={styles.name}>{g.name}</span>
                  <span className={styles.meta}>
                    {isPlayed ? "Played" : g.tag} · {hostOf(g.url)}
                  </span>
                  {g.blurb && <span className={styles.blurb}>{g.blurb}</span>}
                </span>
              </a>
              <div className={styles.actions}>
                {editing ? (
                  <>
                    <button className={styles.small} onClick={() => toggleHidden(g.id)}>
                      {isHidden ? "Show" : "Hide"}
                    </button>
                    {g.custom && (
                      <button className={styles.small} onClick={() => removeCustom(g.id)}>
                        Remove
                      </button>
                    )}
                  </>
                ) : (
                  isPlayed && (
                    <button
                      className={styles.small}
                      onClick={() => unmarkPlayed(g.id)}
                      aria-label={`Mark ${g.name} as not played`}
                    >
                      Undo
                    </button>
                  )
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {editing && (
        <section className={styles.editPanel}>
          <AddGameForm />
          <div className={styles.editFooter}>
            <span className={styles.hint}>
              Hidden games stay off your list and out of the counts. Your list is saved on this
              device.
            </span>
            <button className={styles.ghost} onClick={resetToday}>
              Reset today's progress
            </button>
          </div>
        </section>
      )}

      {!editing && hidden.length > 0 && (
        <p className={styles.hint}>
          {hidden.length} hidden ·{" "}
          <button className={styles.linkButton} onClick={() => setEditing(true)}>
            edit list
          </button>
        </p>
      )}
    </div>
  );
}

function AddGameForm() {
  const addCustom = useRoundsStore((s) => s.addCustom);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const clean = normalizeUrl(url);
    if (!name.trim()) return setError("Give the game a name.");
    if (!clean) return setError("That doesn't look like a web address.");
    addCustom(name, clean);
    setName("");
    setUrl("");
    setError("");
  }

  return (
    <form className={styles.addForm} onSubmit={submit}>
      <h2 className={styles.addTitle}>Add your own game</h2>
      <div className={styles.addFields}>
        <label className={styles.field}>
          <span>Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="Krillion"
          />
        </label>
        <label className={styles.field}>
          <span>Link</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="example.com/daily"
          />
        </label>
        <button className={styles.primary} type="submit">
          Add
        </button>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
