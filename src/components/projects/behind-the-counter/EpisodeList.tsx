import type { Place } from "./types";
import { isMapped } from "./types";
import styles from "./EpisodeList.module.css";

interface Props {
  places: Place[];
  selectedId: string | null;
  onSelect: (videoId: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
}

export default function EpisodeList({
  places,
  selectedId,
  onSelect,
  query,
  onQueryChange,
}: Props) {
  return (
    <div className={styles.panel}>
      <input
        type="search"
        className={styles.search}
        placeholder="Search shops, dishes, cities…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        aria-label="Search episodes"
      />

      <p className={styles.count}>
        {places.length} {places.length === 1 ? "episode" : "episodes"}
      </p>

      <ul className={styles.list}>
        {places.map((place) => {
          const mapped = isMapped(place);
          return (
            <li key={place.videoId}>
              <button
                type="button"
                className={`${styles.item} ${
                  place.videoId === selectedId ? styles.itemActive : ""
                }`}
                onClick={() => onSelect(place.videoId)}
                disabled={!mapped}
                title={mapped ? undefined : "Location unknown"}
              >
                <img
                  className={styles.thumb}
                  src={place.thumbnail}
                  alt=""
                  loading="lazy"
                />
                <span className={styles.text}>
                  <span className={styles.shop}>
                    {place.shopName ?? "Unnamed shop"}
                  </span>
                  <span className={styles.city}>
                    {place.city ?? (mapped ? "Japan" : "Location unknown")}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        {places.length === 0 && (
          <li className={styles.empty}>No episodes match that search.</li>
        )}
      </ul>
    </div>
  );
}
