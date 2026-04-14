import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Eurorack.module.css";

export interface HelpControl {
  name: string;
  description: string;
}

interface ModuleHelpProps {
  title: string;
  description: string;
  controls: HelpControl[];
}

export default function ModuleHelp({ title, description, controls }: ModuleHelpProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={styles.moduleHelp} ref={rootRef}>
      <button
        type="button"
        className={styles.moduleHelpButton}
        onClick={() => setOpen((o) => !o)}
        aria-label={`${title} help`}
        aria-expanded={open}
      >
        ?
      </button>
      {open && (
        <div
          className={styles.moduleHelpPopover}
          role="dialog"
          aria-label={`${title} help`}
        >
          <div className={styles.moduleHelpHeader}>
            <h4 className={styles.moduleHelpTitle}>{title}</h4>
            <button
              type="button"
              className={styles.moduleHelpClose}
              onClick={close}
              aria-label="Close help"
            >
              ×
            </button>
          </div>
          <p className={styles.moduleHelpDescription}>{description}</p>
          {controls.length > 0 && (
            <ul className={styles.moduleHelpList}>
              {controls.map((c) => (
                <li key={c.name}>
                  <strong>{c.name}</strong>
                  <span>{c.description}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
