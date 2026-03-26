import { useState, useEffect, useRef } from "react";
import type { SearchResult, ShowDetails, MovieDetails, Preset } from "./types";
import { PRESETS } from "./presets-data";
import { PRESET_POSTERS } from "./presets-posters";
import {
  apiFetch,
  getPosterUrl,
  getDisplayTitle,
  getYear,
  formatTime,
} from "./utils";
import { useWatchlist } from "./store";
import SeasonModal from "./SeasonModal";
import styles from "./WatchTimeCalculator.module.css";

function PresetCard({ preset }: { preset: Preset }) {
  const [index, setIndex] = useState(0);
  // posterUrls stores fully-resolved image URLs (local paths or TMDB CDN)
  const [posterUrls, setPosterUrls] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    preset.movies.forEach((m) => {
      if (PRESET_POSTERS[m.id]) map[m.id] = PRESET_POSTERS[m.id];
    });
    return map;
  });
  const addItem = useWatchlist((s) => s.addItem);
  const hasMedia = useWatchlist((s) => s.hasMedia);
  const allAdded = preset.movies.every((m) => hasMedia(m.id));

  const handleAdd = () => {
    preset.movies.forEach((movie) => {
      addItem({
        mediaId: movie.id,
        mediaType: "movie",
        title: movie.title,
        posterPath: PRESET_POSTERS[movie.id] ?? null,
        totalMinutes: movie.runtime,
      });
    });
  };

  useEffect(() => {
    const missingIds = preset.movies
      .filter((m) => !PRESET_POSTERS[m.id])
      .map((m) => m.id);
    if (missingIds.length === 0) return;

    apiFetch<{ success: boolean; posters: { id: number; poster_path: string | null }[] }>(
      `/api/posters?ids=${missingIds.join(',')}`
    )
      .then((data) => {
        const updates: Record<number, string> = {};
        data.posters.forEach((p) => {
          if (p.poster_path) updates[p.id] = getPosterUrl(p.poster_path, "w342");
        });
        if (Object.keys(updates).length > 0) {
          setPosterUrls((prev) => ({ ...prev, ...updates }));
        }
      })
      .catch(() => {});
  }, [preset.id]);

  const posters = preset.movies.filter((m) => posterUrls[m.id]);

  useEffect(() => {
    if (posters.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % posters.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [posters.length]);

  return (
    <div className={styles.dvdCard}>
      <div className={styles.dvdPosters}>
        {posters.map((movie, i) => (
          <img
            key={movie.id}
            src={posterUrls[movie.id]}
            alt={movie.title}
            className={styles.dvdPoster}
            style={{ opacity: i === index ? 1 : 0 }}
          />
        ))}
        {posters.length === 0 && (
          <div className={styles.dvdPosterPlaceholder}>🎬</div>
        )}
      </div>
      <div className={styles.dvdOverlay}>
        <h3 className={styles.dvdTitle}>{preset.title}</h3>
        <p className={styles.dvdMeta}>
          {preset.movies.length} films · {formatTime(preset.totalMinutes)}
        </p>
        <button
          className={allAdded ? styles.dvdAddedBtn : styles.dvdAddBtn}
          onClick={handleAdd}
          disabled={allAdded}
        >
          {allAdded ? "✓ Added" : "Add All"}
        </button>
      </div>
    </div>
  );
}

export default function SearchPane() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [seasonShow, setSeasonShow] = useState<ShowDetails | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addItem = useWatchlist((s) => s.addItem);
  const watchlistItems = useWatchlist((s) => s.items);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setError("");
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch<{
          success: boolean;
          results: SearchResult[];
        }>(`/api/search?query=${encodeURIComponent(query)}`);
        setResults(data.results);
      } catch {
        setError("Search failed. Check your connection.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleAdd = async (item: SearchResult) => {
    if (item.media_type === "movie" && watchlistItems.some((w) => w.mediaId === item.id)) return;
    setPendingId(item.id);
    try {
      if (item.media_type === "movie") {
        const details = await apiFetch<MovieDetails>(
          `/api/details?id=${item.id}&type=movie`,
        );
        addItem({
          mediaId: item.id,
          mediaType: "movie",
          title: getDisplayTitle(item),
          posterPath: item.poster_path,
          totalMinutes: details.runtime,
        });
      } else {
        const details = await apiFetch<ShowDetails>(
          `/api/details?id=${item.id}&type=tv`,
        );
        setSeasonShow(details);
      }
    } catch {
      setError("Failed to fetch details. Try again.");
    } finally {
      setPendingId(null);
    }
  };

  const isSearching = query.trim().length >= 2;

  return (
    <div className={styles.searchPane}>
      <div className={styles.searchInputWrap}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search movies or TV shows…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {loading && <span className={styles.spinner} />}
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}

      {isSearching && results.length > 0 && (
        <ul className={styles.results}>
          {results.map((item) => {
            const title = getDisplayTitle(item);
            const year = getYear(item);
            const already =
              item.media_type === "movie" &&
              watchlistItems.some((w) => w.mediaId === item.id);
            const pending = pendingId === item.id;

            return (
              <li
                key={`${item.media_type}-${item.id}`}
                className={styles.resultCard}
              >
                {item.poster_path ? (
                  <img
                    src={getPosterUrl(item.poster_path)}
                    alt={title}
                    className={styles.resultPoster}
                  />
                ) : (
                  <div className={styles.resultPosterPlaceholder}>🎬</div>
                )}
                <div className={styles.resultInfo}>
                  <span className={styles.resultTitle}>{title}</span>
                  <span className={styles.resultMeta}>
                    {item.media_type === "tv" ? "TV Series" : "Movie"}{" "}
                    {year && `· ${year}`}
                  </span>
                </div>
                <button
                  className={already ? styles.addedBtn : styles.addBtn}
                  onClick={() => handleAdd(item)}
                  disabled={already || pending}
                >
                  {pending ? "…" : already ? "✓" : "+"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {isSearching && !loading && results.length === 0 && !error && (
        <p className={styles.noResults}>No results found.</p>
      )}

      {PRESETS.length > 0 && (
        <div className={styles.presetDivider}>
          <span>Or quick-add an entire popular series!</span>
        </div>
      )}

      {PRESETS.length > 0 && (
        <div className={styles.presetGrid}>
          {PRESETS.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
            />
          ))}
        </div>
      )}

      {seasonShow && (
        <SeasonModal show={seasonShow} onClose={() => setSeasonShow(null)} />
      )}
    </div>
  );
}
