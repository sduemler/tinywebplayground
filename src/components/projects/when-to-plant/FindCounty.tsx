import { useEffect, useState } from "react";
import { COUNTIES, STATE_SHAPES, countiesOf, loadZips, nearestCounty } from "./data";
import styles from "./WhenToPlant.module.css";

interface Props {
  selected: string | null;
  onFound: (fips: string) => void;
}

export default function FindCounty({ selected, onFound }: Props) {
  const [zip, setZip] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stateFips, setStateFips] = useState(selected?.slice(0, 2) ?? "");

  // Follow counties picked on the map.
  useEffect(() => {
    if (selected) setStateFips(selected.slice(0, 2));
  }, [selected]);

  const found = (fips: string) => {
    setMessage(null);
    setStateFips(fips.slice(0, 2));
    onFound(fips);
  };

  async function searchZip(e: React.FormEvent) {
    e.preventDefault();
    const clean = zip.trim();
    if (!/^\d{5}$/.test(clean)) {
      setMessage("Enter a 5-digit ZIP code.");
      return;
    }
    setBusy(true);
    try {
      const zips = await loadZips();
      const fips = zips[clean];
      if (fips && COUNTIES[fips]) found(fips);
      else setMessage(`We couldn't find ${clean}. Try a nearby ZIP code.`);
    } catch {
      setMessage("The ZIP code list didn't load. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function useLocation() {
    if (!navigator.geolocation) {
      setMessage("This browser can't share your location. Search by ZIP code instead.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        const fips = nearestCounty(pos.coords.latitude, pos.coords.longitude);
        if (fips) found(fips);
        else setMessage("Your location looks to be outside the US. Search by ZIP code instead.");
      },
      () => {
        setBusy(false);
        setMessage("Location wasn't shared. Search by ZIP code instead.");
      },
      { maximumAge: 600_000, timeout: 15_000 },
    );
  }

  const counties = stateFips ? countiesOf(stateFips) : [];

  return (
    <div className={styles.find}>
      <form className={styles.zipForm} onSubmit={searchZip}>
        <label htmlFor="wtp-zip" className={styles.srOnly}>
          ZIP code
        </label>
        <input
          id="wtp-zip"
          className={styles.zipInput}
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={5}
          placeholder="ZIP code"
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
          onFocus={() => void loadZips().catch(() => {})}
        />
        <button type="submit" className={styles.button} disabled={busy}>
          Find
        </button>
        <button type="button" className={styles.buttonQuiet} onClick={useLocation} disabled={busy}>
          Use my location
        </button>
      </form>

      <div className={styles.pickRow}>
        <label className={styles.srOnly} htmlFor="wtp-state">
          State
        </label>
        <select
          id="wtp-state"
          className={styles.select}
          value={stateFips}
          onChange={(e) => setStateFips(e.target.value)}
        >
          <option value="">Pick a state</option>
          {STATE_SHAPES.map((s) => (
            <option key={s.fips} value={s.fips}>
              {s.name}
            </option>
          ))}
        </select>
        <label className={styles.srOnly} htmlFor="wtp-county">
          County
        </label>
        <select
          id="wtp-county"
          className={styles.select}
          value={selected && selected.startsWith(stateFips) ? selected : ""}
          disabled={!stateFips}
          onChange={(e) => e.target.value && found(e.target.value)}
        >
          <option value="">{stateFips ? "Pick a county" : "Then a county"}</option>
          {counties.map((c) => (
            <option key={c.fips} value={c.fips}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {message && (
        <p className={styles.findMessage} role="status">
          {message}
        </p>
      )}
    </div>
  );
}
