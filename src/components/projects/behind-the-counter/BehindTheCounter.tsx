import { useMemo, useState } from "react";
import placesData from "@data/behind-the-counter/places.json";
import EpisodeList from "./EpisodeList";
import MapView from "./MapView";
import PlaceCard from "./PlaceCard";
import type { Place } from "./types";
import { isMapped } from "./types";
import styles from "./BehindTheCounter.module.css";

const places = placesData as Place[];
const mappedPlaces = places.filter(isMapped);

export default function BehindTheCounter() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return places;
    return places.filter((p) =>
      [p.shopName, p.title, p.city].some((field) =>
        field?.toLowerCase().includes(q),
      ),
    );
  }, [query]);

  const selected = useMemo(
    () => mappedPlaces.find((p) => p.videoId === selectedId) ?? null,
    [selectedId],
  );

  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}>
        <EpisodeList
          places={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          query={query}
          onQueryChange={setQuery}
        />
      </div>

      <div className={styles.mapArea}>
        <MapView
          places={mappedPlaces}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        {selected && (
          <PlaceCard place={selected} onClose={() => setSelectedId(null)} />
        )}
      </div>

      <p className={styles.credit}>
        Every shop featured in the{" "}
        <a
          href="https://www.youtube.com/playlist?list=PLcpuu5BzmasDxcvK9jgblzzNzv3gUgcGU"
          target="_blank"
          rel="noopener noreferrer"
        >
          Behind the Counter
        </a>{" "}
        series by{" "}
        <a
          href="https://www.youtube.com/@Paolofromtokyo"
          target="_blank"
          rel="noopener noreferrer"
        >
          Paolo fromTOKYO
        </a>
        . A fan-made map — not affiliated with the channel. Locations come from
        the map links in each episode description.
      </p>
    </div>
  );
}
