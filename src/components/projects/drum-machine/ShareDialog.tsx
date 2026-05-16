import { useMemo, useState } from "react";
import { useDrumStore } from "./store";
import {
  buildShareUrl,
  encodePattern,
  importFromText,
} from "./serialize";
import { exportPatternAsWav } from "./exportWav";
import { SaveIcon, LoadIcon } from "./Icons";
import styles from "./DrumMachine.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ShareDialog({ open, onClose }: Props) {
  const bars = useDrumStore((s) => s.bars);
  const beatsPerBar = useDrumStore((s) => s.beatsPerBar);
  const subdivision = useDrumStore((s) => s.subdivision);
  const bpm = useDrumStore((s) => s.bpm);
  const swing = useDrumStore((s) => s.swing);
  const masterVolume = useDrumStore((s) => s.masterVolume);
  const defaultPackSlug = useDrumStore((s) => s.defaultPackSlug);
  const tracks = useDrumStore((s) => s.tracks);
  const loadPattern = useDrumStore((s) => s.loadPattern);

  const pattern = useMemo(
    () => ({
      bars,
      beatsPerBar,
      subdivision,
      bpm,
      swing,
      masterVolume,
      defaultPackSlug,
      tracks,
    }),
    [bars, beatsPerBar, subdivision, bpm, swing, masterVolume, defaultPackSlug, tracks]
  );

  const shareUrl = useMemo(
    () => (open ? buildShareUrl(pattern) : ""),
    [open, pattern]
  );
  const json = useMemo(
    () => (open ? encodePattern(pattern) : ""),
    [open, pattern]
  );

  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"url" | "json" | null>(null);
  const [loops, setLoops] = useState(1);
  const [rendering, setRendering] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!open) return null;

  const handleCopy = (text: string, kind: "url" | "json") => {
    if (!navigator.clipboard) return;
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1500);
    });
  };

  const handleExport = async () => {
    setExportError(null);
    setRendering(true);
    try {
      await exportPatternAsWav(pattern, { loops });
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setRendering(false);
    }
  };

  const handleImport = () => {
    setImportError(null);
    try {
      const pat = importFromText(importText);
      loadPattern(pat);
      setImportText("");
      onClose();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Could not import.");
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Share pattern"
    >
      <div className={`${styles.modalCard} ${styles.shareCard}`}>
        <header className={styles.modalHeader}>
          <h3>Share &amp; export</h3>
          <button
            type="button"
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className={styles.shareBody}>
          <section className={styles.shareSection}>
            <label className={styles.shareLabel}>Share link</label>
            <div className={styles.shareRow}>
              <input
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className={styles.shareInput}
              />
              <button
                type="button"
                className={styles.masterAction}
                onClick={() => handleCopy(shareUrl, "url")}
              >
                {copied === "url" ? "Copied!" : "Copy"}
              </button>
            </div>
          </section>

          <section className={styles.shareSection}>
            <label className={styles.shareLabel}>Raw JSON</label>
            <textarea
              readOnly
              value={json}
              onFocus={(e) => e.currentTarget.select()}
              className={styles.shareTextarea}
              rows={4}
            />
            <button
              type="button"
              className={styles.masterAction}
              onClick={() => handleCopy(json, "json")}
            >
              {copied === "json" ? "Copied!" : "Copy JSON"}
            </button>
          </section>

          <section className={styles.shareSection}>
            <label className={styles.shareLabel}>Export WAV</label>
            <div className={styles.shareRow}>
              <label className={styles.shareInlineLabel}>
                Loops
                <input
                  type="number"
                  min={1}
                  max={32}
                  value={loops}
                  onChange={(e) =>
                    setLoops(
                      Math.max(
                        1,
                        Math.min(32, parseInt(e.target.value || "1", 10))
                      )
                    )
                  }
                  className={styles.loopsInput}
                />
              </label>
              <button
                type="button"
                className={styles.masterAction}
                onClick={handleExport}
                disabled={rendering}
              >
                <SaveIcon size={14} />
                {rendering ? "Rendering…" : "Download .wav"}
              </button>
            </div>
            {exportError && (
              <p className={styles.shareError}>{exportError}</p>
            )}
          </section>

          <section className={styles.shareSection}>
            <label className={styles.shareLabel}>Import (URL or JSON)</label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste a share URL or JSON here…"
              className={styles.shareTextarea}
              rows={4}
            />
            {importError && (
              <p className={styles.shareError}>{importError}</p>
            )}
            <button
              type="button"
              className={styles.masterAction}
              onClick={handleImport}
              disabled={!importText.trim()}
            >
              <LoadIcon size={14} />
              Import
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
