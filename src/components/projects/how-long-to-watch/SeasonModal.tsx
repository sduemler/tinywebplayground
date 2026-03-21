import { useState } from 'react';
import type { ShowDetails } from './types';
import { formatTime, getPosterUrl } from './utils';
import { useWatchlist } from './store';
import styles from './WatchTimeCalculator.module.css';

interface Props {
  show: ShowDetails;
  onClose: () => void;
}

export default function SeasonModal({ show, onClose }: Props) {
  const [selected, setSelected] = useState<Set<number>>(
    new Set(show.seasons.map((s) => s.season_number))
  );
  const addItem = useWatchlist((s) => s.addItem);

  const toggle = (n: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });

  const selectedSeasons = show.seasons.filter((s) => selected.has(s.season_number));
  const totalMinutes = selectedSeasons.reduce((sum, s) => sum + s.totalMinutes, 0);

  const handleAdd = () => {
    if (selected.size === 0) return;
    addItem({
      mediaId: show.id,
      mediaType: 'tv',
      title: show.name,
      posterPath: show.poster_path,
      totalMinutes,
      seasonNumbers: [...selected].sort((a, b) => a - b),
    });
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          {show.poster_path && (
            <img
              src={getPosterUrl(show.poster_path, 'w92')}
              alt={show.name}
              className={styles.modalPoster}
            />
          )}
          <div>
            <h3 className={styles.modalTitle}>{show.name}</h3>
            <p className={styles.modalSubtitle}>{show.seasons.length} seasons</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.selectAllRow}>
          <button
            className={styles.selectAllBtn}
            onClick={() => setSelected(new Set(show.seasons.map((s) => s.season_number)))}
          >
            Select All
          </button>
          <button className={styles.selectAllBtn} onClick={() => setSelected(new Set())}>
            Deselect All
          </button>
        </div>

        <ul className={styles.seasonList}>
          {show.seasons.map((season) => (
            <li key={season.season_number} className={styles.seasonItem}>
              <label className={styles.seasonLabel}>
                <input
                  type="checkbox"
                  checked={selected.has(season.season_number)}
                  onChange={() => toggle(season.season_number)}
                  className={styles.seasonCheck}
                />
                <span className={styles.seasonName}>{season.name}</span>
                <span className={styles.seasonMeta}>
                  {season.episode_count} ep · {formatTime(season.totalMinutes)}
                </span>
              </label>
            </li>
          ))}
        </ul>

        <div className={styles.modalFooter}>
          <div className={styles.modalTotal}>
            {selected.size > 0 ? (
              <>
                <span className={styles.modalTotalLabel}>Selected:</span>
                <span className={styles.modalTotalTime}>{formatTime(totalMinutes)}</span>
              </>
            ) : (
              <span className={styles.modalTotalLabel}>No seasons selected</span>
            )}
          </div>
          <button
            className={styles.addModalBtn}
            onClick={handleAdd}
            disabled={selected.size === 0}
          >
            Add to Watchlist
          </button>
        </div>
      </div>
    </div>
  );
}
