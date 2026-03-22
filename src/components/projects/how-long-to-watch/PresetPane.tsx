import { useEffect, useState } from 'react';
import type { Preset } from './types';
import { formatTime, apiFetch } from './utils';
import { useWatchlist } from './store';
import styles from './WatchTimeCalculator.module.css';

export default function PresetPane() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const addItem = useWatchlist((s) => s.addItem);
  const hasMedia = useWatchlist((s) => s.hasMedia);

  useEffect(() => {
    apiFetch<{ success: boolean; presets: Preset[] }>('/api/presets')
      .then((data) => setPresets(data.presets))
      .catch(() => setError('Failed to load presets.'))
      .finally(() => setLoading(false));
  }, []);

  const addPreset = (preset: Preset) => {
    preset.movies.forEach((movie) => {
      addItem({
        mediaId: movie.id,
        mediaType: 'movie',
        title: movie.title,
        posterPath: null,
        totalMinutes: movie.runtime,
      });
    });
  };

  if (loading) return <div className={styles.loadingMsg}>Loading presets…</div>;
  if (error) return <div className={styles.errorMsg}>{error}</div>;

  return (
    <div className={styles.presetGrid}>
      {presets.map((preset) => {
        const allAdded = preset.movies.every((m) => hasMedia(m.id));
        return (
          <div key={preset.id} className={styles.presetCard}>
            <div className={styles.presetTop}>
              <span className={styles.presetCategory}>{preset.category}</span>
              <h3 className={styles.presetTitle}>{preset.title}</h3>
              <p className={styles.presetDesc}>{preset.description}</p>
            </div>
            <div className={styles.presetBottom}>
              <div className={styles.presetMeta}>
                <span className={styles.presetTime}>{formatTime(preset.totalMinutes)}</span>
                <span className={styles.presetCount}>{preset.movies.length} films</span>
              </div>
              <button
                className={allAdded ? styles.addedBtn : styles.presetAddBtn}
                onClick={() => !allAdded && addPreset(preset)}
                disabled={allAdded}
              >
                {allAdded ? '✓ Added' : 'Add All'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
