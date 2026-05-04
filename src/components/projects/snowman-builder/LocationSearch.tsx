import { useState, useRef, useEffect } from "react";
import type { GeocodingResult } from "./types";
import styles from "./LocationSearch.module.css";

interface Props {
  locationName: string | null;
  onSelect: (lat: number, lon: number, name: string) => void;
  onGeolocate: () => void;
  searchLocations: (query: string) => Promise<GeocodingResult[]>;
}

export default function LocationSearch({
  locationName,
  onSelect,
  onGeolocate,
  searchLocations,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isEditing, setIsEditing] = useState(!locationName);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  function handleInput(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const res = await searchLocations(value);
      setResults(res);
    }, 300);
  }

  function handleSelect(r: GeocodingResult) {
    const name = r.admin1
      ? `${r.name}, ${r.admin1}, ${r.country}`
      : `${r.name}, ${r.country}`;
    onSelect(r.latitude, r.longitude, name);
    setQuery("");
    setResults([]);
    setIsEditing(false);
  }

  if (!isEditing && locationName) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.currentLocation}>
          <span>{locationName}</span>
          <button
            className={styles.changeBtn}
            onClick={() => setIsEditing(true)}
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.inputRow}>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="Search for a city..."
          value={query}
          onChange={(e) => handleInput(e.target.value)}
        />
        <button
          className={styles.geoBtn}
          onClick={onGeolocate}
          title="Use my location"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </button>
      </div>
      {results.length > 0 && (
        <div className={styles.dropdown}>
          {results.map((r) => (
            <button
              key={r.id}
              className={styles.result}
              onClick={() => handleSelect(r)}
            >
              <div>{r.name}</div>
              <div className={styles.resultSub}>
                {[r.admin1, r.country].filter(Boolean).join(", ")}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
