import { useWatchlist } from './store';
import { formatTime, getPosterUrl } from './utils';
import styles from './WatchTimeCalculator.module.css';

export default function WatchlistPane() {
  const items = useWatchlist((s) => s.items);
  const removeItem = useWatchlist((s) => s.removeItem);
  const clearAll = useWatchlist((s) => s.clearAll);
  const totalMinutes = useWatchlist((s) => s.totalMinutes);

  const total = totalMinutes();

  return (
    <div className={styles.watchlistPane}>
      <div className={styles.watchlistHeader}>
        <h2 className={styles.watchlistTitle}>My Watchlist</h2>
        {items.length > 0 && (
          <button className={styles.clearBtn} onClick={clearAll}>
            Clear all
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🎬</span>
          <p>Add movies or shows to see your total watch time.</p>
        </div>
      ) : (
        <>
          <ul className={styles.watchlistItems}>
            {items.map((item) => (
              <li key={item.id} className={styles.watchlistItem}>
                {item.posterPath ? (
                  <img
                    src={getPosterUrl(item.posterPath, 'w92')}
                    alt={item.title}
                    className={styles.itemPoster}
                  />
                ) : (
                  <div className={styles.itemPosterPlaceholder}>🎬</div>
                )}
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>{item.title}</span>
                  {item.seasonNumbers && (
                    <span className={styles.itemSeasons}>
                      S{item.seasonNumbers.join(', S')}
                    </span>
                  )}
                  <span className={styles.itemTime}>{formatTime(item.totalMinutes)}</span>
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.title}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <div className={styles.totalBlock}>
            <span className={styles.totalLabel}>Total time</span>
            <span className={styles.totalTime}>{formatTime(total)}</span>
          </div>
        </>
      )}
    </div>
  );
}
