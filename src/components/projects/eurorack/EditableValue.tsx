import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Eurorack.module.css";

interface EditableValueProps {
  /** Current value in the display domain (e.g. 0–100 for %, 55–880 for Hz). */
  value: number;
  /** Min of the display domain. */
  min: number;
  /** Max of the display domain. */
  max: number;
  /** Optional unit suffix appended by the default formatter (e.g. "Hz", "ms"). */
  unit?: string;
  /**
   * Custom formatter for the full display string (value + unit). When supplied
   * it is also used to render the min and max labels inside the range popover,
   * so the format should be consistent at both ends (e.g. Filter's "20k"
   * abbreviation still works because it's applied uniformly).
   */
  format?: (v: number) => string;
  /** Decimal places for the default formatter. Defaults to 0. */
  precision?: number;
  /** Called with the clamped display-domain value after the user commits. */
  onCommit: (v: number) => void;
  /** Override for the wrapper class. Defaults to `.moduleKnobValue`. */
  className?: string;
  ariaLabel?: string;
}

function roundTo(value: number, precision: number): number {
  if (precision <= 0) return Math.round(value);
  const m = 10 ** precision;
  return Math.round(value * m) / m;
}

function defaultFormat(v: number, precision: number, unit: string): string {
  const num = precision <= 0 ? Math.round(v).toString() : v.toFixed(precision);
  if (!unit) return num;
  // "%" reads better flush against the number ("50%"), word units get a
  // leading space ("220 Hz").
  const glue = unit === "%" ? "" : " ";
  return `${num}${glue}${unit}`;
}

export default function EditableValue({
  value,
  min,
  max,
  unit = "",
  format,
  precision = 0,
  onCommit,
  className,
  ariaLabel,
}: EditableValueProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  // Track whether the blur handler should commit or be swallowed (Escape
  // first sets editing=false, which blurs the input — we don't want that
  // blur to re-commit the draft).
  const cancelledRef = useRef(false);

  const formatValue = useCallback(
    (v: number) => (format ? format(v) : defaultFormat(v, precision, unit)),
    [format, precision, unit],
  );

  const display = formatValue(value);
  const rangeDisplay = `${formatValue(min)} – ${formatValue(max)}`;

  const begin = useCallback(() => {
    // Pre-populate the draft with just the numeric part (no unit) so the
    // user can type directly without deleting "Hz" etc. first.
    const raw =
      precision <= 0 ? Math.round(value).toString() : value.toFixed(precision);
    setDraft(raw);
    cancelledRef.current = false;
    setEditing(true);
  }, [value, precision]);

  const commit = useCallback(() => {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      setEditing(false);
      return;
    }
    const n = parseFloat(draft);
    if (!Number.isFinite(n)) {
      setEditing(false);
      return;
    }
    const clamped = Math.max(min, Math.min(max, n));
    onCommit(roundTo(clamped, precision));
    setEditing(false);
  }, [draft, min, max, onCommit, precision]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setEditing(false);
  }, []);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const wrapperClass = `${className ?? styles.moduleKnobValue} ${styles.editableValue}`;

  if (editing) {
    return (
      <span className={wrapperClass}>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          className={styles.editableValueInput}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          onBlur={commit}
          aria-label={ariaLabel}
        />
        <span className={styles.editableValuePopover} role="tooltip">
          {rangeDisplay}
        </span>
      </span>
    );
  }

  return (
    <span className={wrapperClass}>
      <button
        type="button"
        className={styles.editableValueButton}
        onClick={begin}
        aria-label={ariaLabel ? `${ariaLabel}, click to edit` : undefined}
      >
        {display}
      </button>
    </span>
  );
}
