import { useState } from 'react';
import { PRESET_PLAYLISTS, parsePlaylistInput } from './presets';
import styles from './PlaylistPicker.module.css';

interface PlaylistPickerProps {
  onPick: (playlistId: string, label: string) => void;
  onBack: () => void;
}

export default function PlaylistPicker({ onPick, onBack }: PlaylistPickerProps) {
  const [customInput, setCustomInput] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  const handleCustomSubmit = () => {
    const id = parsePlaylistInput(customInput);
    if (!id) {
      setCustomError('Paste a Spotify playlist URL or ID (looks like 37i9dQZF1DX…).');
      return;
    }
    setCustomError(null);
    onPick(id, 'Custom playlist');
  };

  return (
    <div className={styles.root}>
      <button type="button" className={styles.backButton} onClick={onBack}>
        ← Back
      </button>
      <h2 className={styles.heading}>Pick a playlist</h2>
      <p className={styles.subline}>
        Choose a curated set or paste a Spotify playlist URL.
      </p>

      <div className={styles.presetGrid}>
        {PRESET_PLAYLISTS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={styles.presetCard}
            onClick={() => onPick(p.id, p.label)}
          >
            <span className={styles.presetLabel}>{p.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.customSection}>
        <label className={styles.customLabel} htmlFor="custom-playlist">
          Or paste your own
        </label>
        <div className={styles.customRow}>
          <input
            id="custom-playlist"
            type="text"
            className={styles.customInput}
            placeholder="https://open.spotify.com/playlist/…"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCustomSubmit();
            }}
          />
          <button
            type="button"
            className={styles.customSubmit}
            onClick={handleCustomSubmit}
          >
            Go
          </button>
        </div>
        {customError && <div className={styles.customError}>{customError}</div>}
      </div>
    </div>
  );
}
