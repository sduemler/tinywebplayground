import { useDrumStore, LIMITS, SUBDIVISIONS } from "./store";
import { StepIcon } from "./Icons";
import styles from "./DrumMachine.module.css";

export default function PatternSizeControls() {
  const bars = useDrumStore((s) => s.bars);
  const beatsPerBar = useDrumStore((s) => s.beatsPerBar);
  const subdivision = useDrumStore((s) => s.subdivision);
  const setBars = useDrumStore((s) => s.setBars);
  const setBeatsPerBar = useDrumStore((s) => s.setBeatsPerBar);
  const setSubdivision = useDrumStore((s) => s.setSubdivision);

  return (
    <div className={styles.sizeControls}>
      <label className={styles.sizeField}>
        <span>Bars</span>
        <div className={styles.stepper}>
          <button
            type="button"
            onClick={() => setBars(bars - 1)}
            disabled={bars <= LIMITS.MIN_BARS}
            aria-label="Decrease bars"
          >
            −
          </button>
          <input
            type="number"
            min={LIMITS.MIN_BARS}
            max={LIMITS.MAX_BARS}
            value={bars}
            onChange={(e) => setBars(parseInt(e.target.value || "1", 10))}
            aria-label="Bars"
          />
          <button
            type="button"
            onClick={() => setBars(bars + 1)}
            disabled={bars >= LIMITS.MAX_BARS}
            aria-label="Increase bars"
          >
            +
          </button>
        </div>
      </label>

      <label className={styles.sizeField}>
        <span>Beats per bar</span>
        <div className={styles.stepper}>
          <button
            type="button"
            onClick={() => setBeatsPerBar(beatsPerBar - 1)}
            disabled={beatsPerBar <= LIMITS.MIN_BEATS_PER_BAR}
            aria-label="Decrease beats per bar"
          >
            −
          </button>
          <input
            type="number"
            min={LIMITS.MIN_BEATS_PER_BAR}
            max={LIMITS.MAX_BEATS_PER_BAR}
            value={beatsPerBar}
            onChange={(e) =>
              setBeatsPerBar(parseInt(e.target.value || "1", 10))
            }
            aria-label="Beats per bar"
          />
          <button
            type="button"
            onClick={() => setBeatsPerBar(beatsPerBar + 1)}
            disabled={beatsPerBar >= LIMITS.MAX_BEATS_PER_BAR}
            aria-label="Increase beats per bar"
          >
            +
          </button>
        </div>
      </label>

      <div className={styles.sizeField}>
        <span>
          <StepIcon size={12} />
          Subdivision
        </span>
        <div className={styles.subdivisionGroup} role="group" aria-label="Subdivision">
          {SUBDIVISIONS.map((sub) => (
            <button
              key={sub}
              type="button"
              className={`${styles.subdivisionButton} ${
                sub === subdivision ? styles.subdivisionButtonActive : ""
              }`}
              onClick={() => setSubdivision(sub)}
              aria-pressed={sub === subdivision}
            >
              {sub}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
