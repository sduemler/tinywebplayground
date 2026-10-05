import { PRESET_PLAYLISTS } from './presets';
import styles from './PlaylistPicker.module.css';
import ui from './ui.module.css';

interface PlaylistPickerProps {
  onPick: (playlistId: string, label: string) => void;
  onBack: () => void;
}

// Each tape case gets its own label stripe so the stack reads like a real shelf.
const SPINE_COLORS = ['#e8a93a', '#d9622b', '#8aa84a', '#9c3b22', '#c9b37a', '#b5652e', '#5d6b2a', '#e0b86a'];

export default function PlaylistPicker({ onPick, onBack }: PlaylistPickerProps) {
  return (
    <div className={styles.root}>
      <button type="button" className={ui.quiet} onClick={onBack}>
        Back to start
      </button>
      <h2 className={styles.heading}>Pick a tape</h2>

      <ul className={styles.shelf}>
        {PRESET_PLAYLISTS.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              className={styles.spine}
              style={{ ['--spine' as string]: SPINE_COLORS[i % SPINE_COLORS.length] }}
              onClick={() => onPick(p.id, p.label)}
            >
              <span className={styles.spineLabel}>{p.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
