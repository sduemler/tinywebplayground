import { useEffect, useMemo, useState } from "react";
import { PACKS } from "./drum-packs";
import type { DrumSample, SampleCategory } from "./types";
import styles from "./DrumMachine.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (sampleId: string) => void;
  selectedId?: string | null;
  title?: string;
}

const CATEGORY_ORDER: SampleCategory[] = [
  "kick",
  "snare",
  "clap",
  "hat",
  "cymbal",
  "tom",
  "perc",
  "fx",
  "other",
];

export default function SamplePickerModal({
  open,
  onClose,
  onPick,
  selectedId,
  title = "Choose a sample",
}: Props) {
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const grouped = useMemo(() => {
    const lower = filter.trim().toLowerCase();
    return PACKS.map((pack) => {
      const samples = pack.samples
        .filter((s) =>
          lower
            ? s.name.toLowerCase().includes(lower) ||
              s.category.toLowerCase().includes(lower) ||
              pack.name.toLowerCase().includes(lower)
            : true
        )
        .slice()
        .sort((a, b) => {
          const ai = CATEGORY_ORDER.indexOf(a.category);
          const bi = CATEGORY_ORDER.indexOf(b.category);
          if (ai !== bi) return ai - bi;
          return a.name.localeCompare(b.name);
        });
      return { pack, samples };
    }).filter((g) => g.samples.length > 0);
  }, [filter]);

  if (!open) return null;

  return (
    <div
      className={styles.modalOverlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={styles.modalCard}>
        <header className={styles.modalHeader}>
          <h3>{title}</h3>
          <button
            type="button"
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter samples…"
          className={styles.modalSearch}
          autoFocus
        />
        <div className={styles.modalBody}>
          {grouped.length === 0 && (
            <p className={styles.modalEmpty}>No samples match.</p>
          )}
          {grouped.map(({ pack, samples }) => (
            <section key={pack.slug} className={styles.modalPack}>
              <div className={styles.modalPackHeader}>
                <h4>{pack.name}</h4>
                <p>{pack.description}</p>
              </div>
              <ul className={styles.modalSampleList}>
                {samples.map((sample: DrumSample) => {
                  const active = sample.id === selectedId;
                  return (
                    <li key={sample.id}>
                      <button
                        type="button"
                        className={`${styles.modalSample} ${
                          active ? styles.modalSampleActive : ""
                        }`}
                        onClick={() => {
                          onPick(sample.id);
                          onClose();
                        }}
                      >
                        <span className={styles.modalSampleName}>
                          {sample.name}
                        </span>
                        <span className={styles.modalSampleCat}>
                          {sample.category}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
