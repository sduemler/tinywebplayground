import { useState, useMemo } from "react";
import { GENRES, CONNECTIONS } from "./data";
import type { Genre, Connection } from "./types";
import styles from "./GenreTimeline.module.css";

interface Props {
  selectedGenre: string | null;
  onSelect: (id: string | null) => void;
}

interface Era {
  label: string;
  genres: Genre[];
}

const ERAS: { label: string; maxX: number }[] = [
  { label: "Roots", maxX: -500 },
  { label: "Early Rock & Roll", maxX: -150 },
  { label: "Classic Rock", maxX: 150 },
  { label: "Genre Explosion", maxX: 450 },
  { label: "Modern Rock", maxX: Infinity },
];

function buildEras(): Era[] {
  const sorted = [...GENRES].sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
  const eras: Era[] = ERAS.map((e) => ({ label: e.label, genres: [] }));
  for (const genre of sorted) {
    const x = genre.x ?? 0;
    const idx = ERAS.findIndex((e) => x <= e.maxX);
    eras[idx >= 0 ? idx : ERAS.length - 1].genres.push(genre);
  }
  return eras.filter((e) => e.genres.length > 0);
}

interface GenreLineage {
  influencedBy: { genre: Genre; bridge?: string }[];
  influenced: { genre: Genre; bridge?: string }[];
}

function buildLineageMap(): Map<string, GenreLineage> {
  const map = new Map<string, GenreLineage>();
  const genreById = new Map(GENRES.map((g) => [g.id, g]));

  for (const g of GENRES) {
    map.set(g.id, { influencedBy: [], influenced: [] });
  }

  for (const conn of CONNECTIONS) {
    const src = genreById.get(conn.source);
    const tgt = genreById.get(conn.target);
    if (!src || !tgt) continue;
    map.get(conn.target)!.influencedBy.push({ genre: src, bridge: conn.bridgeArtist });
    map.get(conn.source)!.influenced.push({ genre: tgt, bridge: conn.bridgeArtist });
  }

  return map;
}

export default function GenreTimeline({ selectedGenre, onSelect }: Props) {
  const eras = useMemo(buildEras, []);
  const lineageMap = useMemo(buildLineageMap, []);

  const toggle = (id: string) => {
    onSelect(selectedGenre === id ? null : id);
  };

  return (
    <div className={styles.timeline}>
      {eras.map((era) => (
        <section key={era.label} className={styles.era}>
          <h2 className={styles.eraTitle}>{era.label}</h2>
          <div className={styles.genreList}>
            {era.genres.map((genre) => {
              const isOpen = selectedGenre === genre.id;
              const lineage = lineageMap.get(genre.id)!;
              return (
                <div key={genre.id} className={styles.genreCard}>
                  <button
                    className={`${styles.genreHeader} ${isOpen ? styles.genreHeaderOpen : ""}`}
                    onClick={() => toggle(genre.id)}
                  >
                    <span className={styles.genreName}>{genre.label}</span>
                    {genre.artists.length > 0 && (
                      <span className={styles.artistCount}>
                        {genre.artists.length}
                      </span>
                    )}
                  </button>
                  {isOpen && (
                    <div className={styles.genreBody}>
                      {genre.artists.length > 0 && (
                        <div className={styles.artists}>
                          {genre.artists.map((a) => (
                            <span key={a} className={styles.artistTag}>
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                      {lineage.influencedBy.length > 0 && (
                        <div className={styles.lineageSection}>
                          <span className={styles.lineageLabel}>Influenced by</span>
                          {lineage.influencedBy.map(({ genre: g, bridge }) => (
                            <span key={g.id} className={styles.lineageItem}>
                              {g.label}
                              {bridge && (
                                <span className={styles.bridge}>
                                  via {bridge}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                      {lineage.influenced.length > 0 && (
                        <div className={styles.lineageSection}>
                          <span className={styles.lineageLabel}>Led to</span>
                          {lineage.influenced.map(({ genre: g, bridge }) => (
                            <span key={g.id} className={styles.lineageItem}>
                              {g.label}
                              {bridge && (
                                <span className={styles.bridge}>
                                  via {bridge}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
