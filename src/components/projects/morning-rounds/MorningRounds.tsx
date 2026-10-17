import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { GAMES, GROUPS, GROUP_COLORS, type Game, type Group } from "@data/morning-rounds/games";
import iconIds from "@data/morning-rounds/icons.json";
import { useRoundsStore } from "./store";
import { formatToday, hostOf, normalizeUrl, todayKey } from "./utils";
import styles from "./MorningRounds.module.css";

/** Games with a downloaded favicon (`npm run build-morning-rounds-icons`); the rest show a letter. */
const HAS_ICON = new Set<string>(iconIds);

function GameIcon({ game, played }: { game: Game; played: boolean }) {
  const [broken, setBroken] = useState(false);
  if (played) {
    return (
      <span className={`${styles.tile} ${styles.tileDone}`} aria-hidden="true">
        ✓
      </span>
    );
  }
  if (HAS_ICON.has(game.id) && !broken) {
    return (
      <span className={`${styles.tile} ${styles.tileIcon}`} aria-hidden="true">
        <img
          src={`/images/morning-rounds/icons/${game.id}.png`}
          alt=""
          width={48}
          height={48}
          loading="lazy"
          onError={() => setBroken(true)}
        />
      </span>
    );
  }
  return (
    <span className={styles.tile} aria-hidden="true">
      {game.monogram}
    </span>
  );
}

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
  const markPlayed = useRoundsStore((s) => s.markPlayed);
  const unmarkPlayed = useRoundsStore((s) => s.unmarkPlayed);
  const resetToday = useRoundsStore((s) => s.resetToday);
  const toggleHidden = useRoundsStore((s) => s.toggleHidden);

  const [editing, setEditing] = useState(false);
  const [blocked, setBlocked] = useState(0);

  const played = new Set(day === today ? playedRaw : []);
  const visible = GAMES.filter((g) => !hidden.includes(g.id));
  const remaining = visible.filter((g) => !played.has(g.id));
  const doneCount = visible.length - remaining.length;
  const shown = editing ? GAMES : visible;

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

      {GROUPS.map((group) => {
        const games = shown.filter((g) => g.group === group);
        if (games.length === 0) return null;
        const inPlay = games.filter((g) => !hidden.includes(g.id));
        const groupDone = inPlay.filter((g) => played.has(g.id)).length;
        return (
          <section
            key={group}
            className={styles.group}
            aria-labelledby={`group-${group}`}
            style={{ "--group": GROUP_COLORS[group] } as CSSProperties}
          >
            <h2 id={`group-${group}`} className={styles.groupLabel}>
              {group}
              <span className={styles.groupCount}>
                {groupDone}/{inPlay.length}
              </span>
            </h2>
            <button
              className={styles.groupOpen}
              onClick={() => openGames(inPlay)}
              disabled={inPlay.length === 0 || editing}
              aria-label={`Open all ${inPlay.length} ${group} games`}
            >
              Open all ↗
            </button>
            <ul className={styles.grid}>
              {games.map((g) => {
                const isPlayed = played.has(g.id);
                const isHidden = hidden.includes(g.id);
                return (
                  <li
                    key={g.id}
                    className={styles.card}
                    data-played={isPlayed || undefined}
                    data-hidden={isHidden || undefined}
                  >
                    <a
                      className={styles.link}
                      href={g.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => markPlayed([g.id])}
                      onAuxClick={(e) => e.button === 1 && markPlayed([g.id])}
                    >
                      <GameIcon game={g} played={isPlayed} />
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
                        <button className={styles.small} onClick={() => toggleHidden(g.id)}>
                          {isHidden ? "Show" : "Hide"}
                        </button>
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
          </section>
        );
      })}

      {editing && (
        <section className={`${styles.editPanel} ${styles.editFooter}`}>
          <span className={styles.hint}>
            Hidden games stay off your list and out of the counts. Your list is saved on this
            device.
          </span>
          <button className={styles.ghost} onClick={resetToday}>
            Reset today's progress
          </button>
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

      <RequestGame />
    </div>
  );
}

type RequestState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; prUrl?: string }
  | { kind: "error"; message: string };

/** Sends a game suggestion to /api/morning-rounds/request, which opens a pull request for review. */
function RequestGame() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [group, setGroup] = useState<Group | "">("");
  const [blurb, setBlurb] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<RequestState>({ kind: "idle" });

  async function submit(e: FormEvent) {
    e.preventDefault();
    const clean = normalizeUrl(url);
    if (name.trim().length < 2) return setState({ kind: "error", message: "Give the game a name." });
    if (!clean) return setState({ kind: "error", message: "That doesn't look like a web address." });
    if (!group) return setState({ kind: "error", message: "Pick a group for the game." });

    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/morning-rounds/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url: clean, group, blurb, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return setState({ kind: "error", message: data.error ?? "Something went wrong. Please try again." });
      }
      setState({ kind: "sent", prUrl: data.prUrl });
      setName("");
      setUrl("");
      setGroup("");
      setBlurb("");
    } catch {
      setState({ kind: "error", message: "Couldn't send the request. Check your connection." });
    }
  }

  if (!open) {
    return (
      <section className={styles.requestTeaser}>
        <span>Know a daily game that belongs here?</span>
        <button className={styles.secondary} onClick={() => setOpen(true)}>
          Request a game
        </button>
      </section>
    );
  }

  if (state.kind === "sent") {
    return (
      <section className={styles.requestPanel} role="status">
        <h2 className={styles.requestTitle}>Thanks for the suggestion!</h2>
        <p className={styles.hint}>
          It's waiting for review and will show up here once it's approved.
          {state.prUrl && (
            <>
              {" "}
              <a href={state.prUrl} target="_blank" rel="noopener noreferrer">
                See the request on GitHub ↗
              </a>
            </>
          )}
        </p>
        <button className={styles.ghost} onClick={() => setState({ kind: "idle" })}>
          Request another
        </button>
      </section>
    );
  }

  return (
    <form className={styles.requestPanel} onSubmit={submit}>
      <h2 className={styles.requestTitle}>Request a game</h2>
      <div className={styles.requestFields}>
        <label className={styles.field}>
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Krillion" />
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
        <label className={`${styles.field} ${styles.groupField}`}>
          <span>Group</span>
          <select value={group} onChange={(e) => setGroup(e.target.value as Group)}>
            <option value="" disabled>
              Choose…
            </option>
            {GROUPS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <label className={`${styles.field} ${styles.wideField}`}>
          <span>What is it? (optional)</span>
          <input
            value={blurb}
            onChange={(e) => setBlurb(e.target.value)}
            maxLength={120}
            placeholder="Guess the movie one still frame at a time."
          />
        </label>
        <label className={styles.honeypot} aria-hidden="true">
          Website
          <input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {state.kind === "error" && (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      )}
      <div className={styles.requestFooter}>
        <span className={styles.hint}>
          Requests are reviewed before they're added, as a public pull request on GitHub.
        </span>
        <div className={styles.requestButtons}>
          <button type="button" className={styles.ghost} onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button className={styles.primary} type="submit" disabled={state.kind === "sending"}>
            {state.kind === "sending" ? "Sending…" : "Send request"}
          </button>
        </div>
      </div>
    </form>
  );
}
