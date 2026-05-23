import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./StillHere.module.css";
import type { CountryEntry, Inputs, Sex } from "./types";

interface Props {
  countries: CountryEntry[];
  initial?: Inputs;
  onSubmit: (inputs: Inputs) => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1920;
const MAX_YEAR = CURRENT_YEAR;

export default function InputForm({ countries, initial, onSubmit }: Props) {
  const [birthYearStr, setBirthYearStr] = useState(
    initial ? String(initial.birthYear) : "",
  );
  const [sex, setSex] = useState<Sex | null>(initial?.sex ?? null);
  const [countryCode, setCountryCode] = useState(
    initial?.countryCode ?? "USA",
  );
  const [error, setError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef<HTMLSpanElement>(null);

  const closeHelp = useCallback(() => setHelpOpen(false), []);

  useEffect(() => {
    if (!helpOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setHelpOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHelpOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [helpOpen]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const birthYear = parseInt(birthYearStr, 10);
    if (!Number.isFinite(birthYear) || birthYear < MIN_YEAR || birthYear > MAX_YEAR) {
      setError(`Birth year must be between ${MIN_YEAR} and ${MAX_YEAR}.`);
      return;
    }
    if (!sex) {
      setError("Pick a category — the WHO data is split into two.");
      return;
    }
    setError(null);
    onSubmit({ birthYear, sex, countryCode });
  }

  return (
    <form className={`${styles.card} ${styles.formCard}`} onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <div>
          <label className={styles.fieldLabel} htmlFor="birthYear">
            Birth year
          </label>
          <input
            id="birthYear"
            className={styles.input}
            type="number"
            inputMode="numeric"
            placeholder="e.g. 1990"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={birthYearStr}
            onChange={(e) => setBirthYearStr(e.target.value)}
          />
        </div>

        <div>
          <span className={styles.fieldLabel}>Category</span>
          <div className={styles.sexRow} role="radiogroup" aria-label="Category">
            <button
              type="button"
              role="radio"
              aria-checked={sex === "F"}
              className={`${styles.sexChip} ${sex === "F" ? styles.sexChipActive : ""}`}
              onClick={() => setSex("F")}
            >
              Female
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={sex === "M"}
              className={`${styles.sexChip} ${sex === "M" ? styles.sexChipActive : ""}`}
              onClick={() => setSex("M")}
            >
              Male
            </button>
            <span className={styles.sexChipWrap} ref={helpRef}>
              <button
                type="button"
                role="radio"
                aria-checked={sex === "B"}
                className={`${styles.sexChip} ${sex === "B" ? styles.sexChipActive : ""}`}
                onClick={() => setSex("B")}
              >
                Both / Either
              </button>
              <button
                type="button"
                className={styles.sexHelpButton}
                onClick={(e) => {
                  e.stopPropagation();
                  setHelpOpen((o) => !o);
                }}
                aria-label="About Both / Either"
                aria-expanded={helpOpen}
              >
                ?
              </button>
              {helpOpen && (
                <div
                  className={styles.sexHelpPopover}
                  role="dialog"
                  aria-label="About Both / Either"
                >
                  <div className={styles.sexHelpHeader}>
                    <h4 className={styles.sexHelpTitle}>Both / Either</h4>
                    <button
                      type="button"
                      className={styles.sexHelpClose}
                      onClick={closeHelp}
                      aria-label="Close help"
                    >
                      ×
                    </button>
                  </div>
                  <p className={styles.sexHelpDescription}>
                    Uses WHO's population-weighted average of male and female
                    data.
                  </p>
                </div>
              )}
            </span>
          </div>
        </div>

        <div>
          <label className={styles.fieldLabel} htmlFor="country">
            Country
          </label>
          <select
            id="country"
            className={styles.select}
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className={styles.formError}>{error}</p>}

        <button type="submit" className={styles.submit}>
          See the pyramid →
        </button>
      </div>
    </form>
  );
}
