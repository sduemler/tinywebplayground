import { useEffect, useState } from "react";
import type { MappedPlace } from "./types";
import styles from "./PlaceCard.module.css";

interface Props {
  place: MappedPlace;
  onClose: () => void;
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function formatDuration(sec: number | null) {
  if (!sec) return null;
  const m = Math.round(sec / 60);
  return `${m} min`;
}

export default function PlaceCard({ place, onClose }: Props) {
  const [playing, setPlaying] = useState(false);

  // Reset the player whenever a different pin is opened, otherwise the
  // previous episode keeps playing behind the new card.
  useEffect(() => setPlaying(false), [place.videoId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const meta = [formatDate(place.uploadDate), place.city, formatDuration(place.durationSec)]
    .filter(Boolean)
    .join(" · ");

  return (
    <aside className={styles.card}>
      <button
        type="button"
        className={styles.close}
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>

      <div className={styles.media}>
        {playing ? (
          <iframe
            className={styles.frame}
            src={`https://www.youtube-nocookie.com/embed/${place.videoId}?autoplay=1&rel=0`}
            title={place.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className={styles.thumb}
            onClick={() => setPlaying(true)}
            aria-label={`Play: ${place.title}`}
          >
            <img src={place.thumbnail} alt="" loading="lazy" />
            <span className={styles.play} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className={styles.body}>
        <h2 className={styles.shop}>{place.shopName ?? "Unnamed shop"}</h2>
        <p className={styles.title}>{place.title}</p>
        {meta && <p className={styles.meta}>{meta}</p>}
        <div className={styles.links}>
          <a
            href={`https://www.youtube.com/watch?v=${place.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Watch on YouTube
          </a>
          {place.mapsUrl && (
            <a href={place.mapsUrl} target="_blank" rel="noopener noreferrer">
              Open in Maps
            </a>
          )}
        </div>
      </div>
    </aside>
  );
}
