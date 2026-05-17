import { useEffect, useMemo, useState } from "react";
import { PACKS, findSample } from "./drum-packs";
import { useDrumStore } from "./store";
import type { DrumSample, SampleCategory } from "./types";
import { ChevronDownIcon } from "./Icons";
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
  const defaultPackSlug = useDrumStore((s) => s.defaultPackSlug);
  // The active pack — for "swap" this is the existing sample's pack;
  // for "add" it's the user's currently selected default pack.
  const activePackSlug =
    (selectedId && findSample(selectedId)?.packSlug) || defaultPackSlug;
  // Active pack is expanded; all others start collapsed.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const togglePack = (slug: string) =>
    setCollapsed((prev) => ({ ...prev, [slug]: !prev[slug] }));

  // When the modal opens, collapse every pack except the active one.
  useEffect(() => {
    if (!open) return;
    const next: Record<string, boolean> = {};
    for (const pack of PACKS) {
      next[pack.slug] = pack.slug !== activePackSlug;
    }
    setCollapsed(next);
  }, [open, activePackSlug]);

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
    const groups = PACKS.map((pack) => {
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
    // Float the active pack to the top.
    const activeIdx = groups.findIndex((g) => g.pack.slug === activePackSlug);
    if (activeIdx > 0) {
      const [active] = groups.splice(activeIdx, 1);
      groups.unshift(active);
    }
    return groups;
  }, [filter, activePackSlug]);

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
          {grouped.map(({ pack, samples }) => {
            const isCollapsed = !!collapsed[pack.slug];
            return (
              <section key={pack.slug} className={styles.modalPack}>
                <button
                  type="button"
                  className={styles.modalPackHeader}
                  onClick={() => togglePack(pack.slug)}
                  aria-expanded={!isCollapsed}
                  aria-controls={`pack-${pack.slug}-list`}
                >
                  <span
                    className={`${styles.modalPackChevron} ${
                      isCollapsed ? styles.modalPackChevronCollapsed : ""
                    }`}
                    aria-hidden
                  >
                    <ChevronDownIcon size={14} />
                  </span>
                  <span className={styles.modalPackHeaderText}>
                    <h4>{pack.name}</h4>
                    <p>{pack.description}</p>
                  </span>
                  <span className={styles.modalPackCount}>
                    {samples.length}
                  </span>
                </button>
                {!isCollapsed && (
                  <ul
                    id={`pack-${pack.slug}-list`}
                    className={styles.modalSampleList}
                  >
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
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
