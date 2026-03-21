import { useState, useEffect, useRef } from 'react';
import type { SearchResult, ShowDetails, MovieDetails } from './types';
import { apiFetch, getPosterUrl, getDisplayTitle, getYear } from './utils';
import { useWatchlist } from './store';
import SeasonModal from './SeasonModal';
import styles from './WatchTimeCalculator.module.css';

export default function SearchPane() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [seasonShow, setSeasonShow] = useState<ShowDetails | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addItem = useWatchlist((s) => s.addItem);
  const hasMedia = useWatchlist((s) => s.hasMedia);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setError('');
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiFetch<{ success: boolean; results: SearchResult[] }>(
          `/.netlify/functions/search?query=${encodeURIComponent(query)}`
        );
        setResults(data.results);
      } catch {
        setError('Search failed. Check your connection.');
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
    if (hasMedia(item.id)) return;
    setPendingId(item.id);
    try {
      if (item.media_type === 'movie') {
        const details = await apiFetch<MovieDetails>(
          `/.netlify/functions/details?id=${item.id}&type=movie`
        );
        addItem({
          mediaId: item.id,
          mediaType: 'movie',
          title: getDisplayTitle(item),
          posterPath: item.poster_path,
          totalMinutes: details.runtime,
        });
      } else {
        const details = await apiFetch<ShowDetails>(
          `/.netlify/functions/details?id=${item.id}&type=tv`
        );
        setSeasonShow(details);
      }
    } catch {
      setError('Failed to fetch details. Try again.');
    } finally {
      setPendingId(null);
    }
  };

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

      {results.length > 0 && (
        <ul className={styles.results}>
          {results.map((item) => {
            const title = getDisplayTitle(item);
            const year = getYear(item);
            const already = hasMedia(item.id);
            const pending = pendingId === item.id;

            return (
              <li key={`${item.media_type}-${item.id}`} className={styles.resultCard}>
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
                    {item.media_type === 'tv' ? 'TV Series' : 'Movie'} {year && `· ${year}`}
                  </span>
                </div>
                <button
                  className={already ? styles.addedBtn : styles.addBtn}
                  onClick={() => handleAdd(item)}
                  disabled={already || pending}
                >
                  {pending ? '…' : already ? '✓' : '+'}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {query.trim().length >= 2 && !loading && results.length === 0 && !error && (
        <p className={styles.noResults}>No results found.</p>
      )}

      {seasonShow && (
        <SeasonModal show={seasonShow} onClose={() => setSeasonShow(null)} />
      )}
    </div>
  );
}
