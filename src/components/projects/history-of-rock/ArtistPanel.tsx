import { useRef, useEffect, useCallback } from 'react';
import type { GenreNode } from './types';
import styles from './ArtistPanel.module.css';

interface Props {
  genre: GenreNode;
  screenX: number;
  screenY: number;
  containerWidth: number;
  containerHeight: number;
  onClose: () => void;
}

export default function ArtistPanel({ genre, screenX, screenY, containerWidth, containerHeight, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    // Delay adding click listener to avoid immediate close from the same click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 50);
    document.addEventListener('keydown', handleEsc);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const isMobile = containerWidth < 640;

  if (genre.artists.length === 0) return null;

  if (isMobile) {
    return (
      <div className={styles.backdrop} onClick={onClose}>
        <div
          ref={panelRef}
          className={styles.bottomSheet}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label={`Artists in ${genre.label}`}
        >
          <div className={styles.sheetHandle} />
          <h3 className={styles.title}>{genre.label}</h3>
          <ul className={styles.artistList}>
            {genre.artists.map((artist) => (
              <li key={artist} className={styles.artist}>{artist}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Position the popover near the node, adjusting to stay in bounds
  const panelWidth = 240;
  const panelHeight = genre.artists.length * 28 + 60;
  let left = screenX + 20;
  let top = screenY - panelHeight / 2;

  if (left + panelWidth > containerWidth - 16) {
    left = screenX - panelWidth - 20;
  }
  if (top < 16) top = 16;
  if (top + panelHeight > containerHeight - 16) {
    top = containerHeight - panelHeight - 16;
  }

  return (
    <div
      ref={panelRef}
      className={styles.popover}
      style={{ left, top }}
      role="dialog"
      aria-label={`Artists in ${genre.label}`}
    >
      <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
        ×
      </button>
      <h3 className={styles.title}>{genre.label}</h3>
      <ul className={styles.artistList}>
        {genre.artists.map((artist) => (
          <li key={artist} className={styles.artist}>{artist}</li>
        ))}
      </ul>
    </div>
  );
}
