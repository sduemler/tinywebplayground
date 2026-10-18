import { GROUPS, type GroupId, type Method } from "@data/when-to-plant/crops";
import { COUNTIES } from "./data";
import {
  avgHighOn,
  countyReport,
  formatDay,
  groupCounts,
  isMild,
  phaseFromCounts,
  type Opening,
} from "./engine";
import { GROUP_COLORS, REST_COLOR } from "./palette";
import styles from "./WhenToPlant.module.css";

interface Props {
  fips: string;
  day: number;
  onClose: () => void;
}

const METHOD_LABEL: Record<Method, string> = {
  direct: "sow seeds",
  transplant: "set out plants",
  indoors: "start indoors",
};

function untilText(o: Opening) {
  return o.until === null ? "all year" : `until ~${formatDay(o.until)}`;
}

function frostLine(fips: string) {
  const c = COUNTIES[fips];
  if (c.ff || c.lsf === null || c.fff === null) return "Frost-free in an average year";
  return `Last frost ~${formatDay(c.lsf)}, first frost ~${formatDay(c.fff)}`;
}

export default function CountyPanel({ fips, day, onClose }: Props) {
  const county = COUNTIES[fips];
  const report = countyReport(county, day);
  const phase = phaseFromCounts(groupCounts(county, day));
  const phaseGroup = GROUPS.find((g) => g.id === phase);
  const high = Math.round(avgHighOn(county, day));

  const byGroup = GROUPS.map((g) => ({
    group: g,
    items: report.outdoor.filter((o) => o.crop.group === g.id),
  })).filter((x) => x.items.length > 0);

  return (
    <article className={styles.packet} aria-labelledby="wtp-county-name">
      <header
        className={styles.packetBand}
        style={{ background: phaseGroup ? GROUP_COLORS[phaseGroup.id as GroupId] : REST_COLOR }}
        data-rest={phaseGroup ? undefined : ""}
      >
        <span>{phaseGroup ? `Mostly ${phaseGroup.name.toLowerCase()} this week` : "Resting this week"}</span>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close county details">
          ×
        </button>
      </header>
      <div className={styles.packetBody}>
        <h2 id="wtp-county-name" className={styles.countyName}>
          {county.n}
          <span className={styles.countyState}>, {county.s}</span>
        </h2>
        <p className={styles.countyFacts}>
          {frostLine(fips)}
          <br />
          Average high around {formatDay(day)}: {high}°F
        </p>

        <section className={styles.packetSection}>
          <h3>Plant outside now</h3>
          {byGroup.length === 0 ? (
            <p className={styles.emptyNote}>
              Nothing goes in the ground here right now. Use the time to plan beds, order seeds and build soil.
            </p>
          ) : (
            byGroup.map(({ group, items }) => (
              <div key={group.id} className={styles.cropGroup}>
                <h4>
                  <span className={styles.swatch} style={{ background: GROUP_COLORS[group.id] }} aria-hidden="true" />
                  {group.name}
                </h4>
                <ul>
                  {items.map((o) => (
                    <li key={o.crop.id}>
                      <span className={styles.cropName}>{o.crop.name}</span>
                      <span className={styles.cropMeta}>
                        {METHOD_LABEL[o.method]}, {untilText(o)}
                      </span>
                      {o.crop.note && <span className={styles.cropNote}>{o.crop.note}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>

        {report.indoors.length > 0 && (
          <section className={styles.packetSection}>
            <h3>Start seeds indoors now</h3>
            <ul className={styles.plainList}>
              {report.indoors.map((o) => (
                <li key={o.crop.id}>
                  <span className={styles.cropName}>{o.crop.name}</span>
                  <span className={styles.cropMeta}>{untilText(o)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {report.upcoming.length > 0 && (
          <section className={styles.packetSection}>
            <h3>Coming up</h3>
            <ul className={styles.plainList}>
              {report.upcoming.map((u) => (
                <li key={u.crop.id}>
                  <span className={styles.cropName}>{u.crop.name}</span>
                  <span className={styles.cropMeta}>
                    {METHOD_LABEL[u.method]} from ~{formatDay(u.day)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className={styles.dataNote}>
          {isMild(county)
            ? "Frost is rare here, so planting times follow the average temperatures instead of frost dates. "
            : ""}
          Based on 1991–2020 NOAA averages from {county.src} weather station{county.src === 1 ? "" : "s"}
          {county.est ? " (the nearest is more than 150 km away, so treat this as rough)" : ""}. Frost comes later
          than the average date about half the time, so check your local forecast before setting out tender plants.
        </p>
      </div>
    </article>
  );
}
