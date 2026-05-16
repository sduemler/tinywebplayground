import { useDrumStore } from "./store";
import { PACKS } from "./drum-packs";
import { ChevronDownIcon } from "./Icons";
import styles from "./DrumMachine.module.css";

export default function PackSelector() {
  const defaultPackSlug = useDrumStore((s) => s.defaultPackSlug);
  const setDefaultPack = useDrumStore((s) => s.setDefaultPack);

  // If only one pack is registered, the selector is informational only.
  const onlyOne = PACKS.length <= 1;

  return (
    <div className={styles.sizeField}>
      <span>Pack</span>
      <div className={styles.packSelectWrap}>
        <select
          className={styles.packSelect}
          value={defaultPackSlug}
          onChange={(e) => setDefaultPack(e.target.value)}
          disabled={onlyOne}
          aria-label="Sound pack"
        >
          {PACKS.map((pack) => (
            <option key={pack.slug} value={pack.slug}>
              {pack.name}
            </option>
          ))}
        </select>
        <span className={styles.packSelectChevron} aria-hidden>
          <ChevronDownIcon size={14} />
        </span>
      </div>
    </div>
  );
}
