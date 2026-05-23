import { useMemo, useState } from "react";
import styles from "./StillHere.module.css";
import InputForm from "./InputForm";
import Pyramid from "./Pyramid";
import Plate2 from "./Plate2";
import StatsCallout from "./StatsCallout";
import lifeTablesData from "../../../data/still-here/life-tables.json";
import type { Inputs, LifeTablesData } from "./types";
import {
  bandIndexForRow,
  buildPyramidRows,
  computeStats,
  lifeTableFor,
  lxAtAge,
} from "./lifespan";

const data = lifeTablesData as LifeTablesData;
const ACCENT = "#a85e2e";

export default function StillHere() {
  const [inputs, setInputs] = useState<Inputs | null>(null);

  return (
    <div className={styles.root} style={{ ["--still-accent" as string]: ACCENT }}>
      {!inputs ? (
        <>
          <div className={styles.intro}>
            <h1 className={styles.introHeadline}>Still Here</h1>
            <p className={styles.introSub}>
              Of all the people born in the same year as you, in the same place,
              of the same official census category — how many are still around?
              And how much pyramid have you got left?
            </p>
          </div>
          <InputForm countries={data.countries} onSubmit={setInputs} />
        </>
      ) : (
        <ResultView inputs={inputs} onEdit={() => setInputs(null)} />
      )}
    </div>
  );
}

function ResultView({
  inputs,
  onEdit,
}: {
  inputs: Inputs;
  onEdit: () => void;
}) {
  const country = data.countries.find((c) => c.code === inputs.countryCode);
  const countryTable = data.tables[inputs.countryCode];
  const lx = useMemo(
    () => lifeTableFor(data, inputs.countryCode, inputs.sex),
    [inputs.countryCode, inputs.sex],
  );

  if (!country || !countryTable || !lx) {
    return (
      <div className={styles.card}>
        <p>Sorry, we don't have data for that country.</p>
        <button className={styles.editButton} onClick={onEdit}>
          Change inputs
        </button>
      </div>
    );
  }

  const currentAge = new Date().getFullYear() - inputs.birthYear;
  const stats = computeStats(data.bandStartAge, lx, currentAge);
  const rows = buildPyramidRows(data, lx);
  const currentBandIndex = bandIndexForRow(rows, currentAge);
  const lxAtCurrent = lxAtAge(data.bandStartAge, lx, currentAge);
  const lxAtMedian = lxAtAge(data.bandStartAge, lx, stats.medianDeathAge);

  const sexLabel =
    inputs.sex === "F" ? "WOMEN" : inputs.sex === "M" ? "MEN" : "BOTH SEXES";
  const countryUpper = country.name.toUpperCase();
  const caption = `${countryUpper} · ${sexLabel} · ${countryTable.year} WHO LIFE TABLE`;

  return (
    <>
      <div className={styles.editBar}>
        <span className={styles.editBarLabel}>
          Born <strong>{inputs.birthYear}</strong> ·{" "}
          <strong>{sexLabel}</strong> · <strong>{countryUpper}</strong>
        </span>
        <button className={styles.editButton} onClick={onEdit}>
          Change inputs
        </button>
      </div>

      <div className={styles.resultStack}>
        <div className={styles.platesPanel}>
          <div className={styles.platesGrid}>
            <div className={styles.plateSlot}>
              <Pyramid
                rows={rows}
                currentAge={currentAge}
                currentBandIndex={currentBandIndex}
                lxAtCurrent={lxAtCurrent}
                medianDeathAge={stats.medianDeathAge}
                lxAtMedian={lxAtMedian}
                caption={caption}
              />
            </div>
            <div className={styles.plateSlot}>
              <Plate2
                lx={lx}
                bandStartAge={data.bandStartAge}
                currentAge={currentAge}
                medianDeathAge={stats.medianDeathAge}
                caption={caption}
              />
            </div>
          </div>
        </div>

        <div className={styles.statsBelow}>
          <StatsCallout
            stats={stats}
            birthYear={inputs.birthYear}
            sex={inputs.sex}
            countryName={country.name}
            dataYear={countryTable.year}
          />

          <details className={styles.disclosure}>
            <summary className={styles.disclosureSummary}>
              How is this calculated?
            </summary>
            <p>
              Based on WHO Global Health Observatory life tables (the{" "}
              <em>lx</em> survivors column, latest year per country, currently{" "}
              {countryTable.year}). These are <em>period</em> life tables —
              they describe a hypothetical cohort experiencing today's
              age-specific mortality rates at every age, not the actual future
              of any real cohort. So the pyramid above your current age is a
              projection, not a forecast. Take it as a friendly demographic
              estimate, not a prophecy.
            </p>
            <p>
              Data comes in 19 age bands (0, 1-4, 5-9, …, 80-84, 85+). Your
              exact-age numbers and the median death age are linearly
              interpolated between band boundaries. WHO publishes 85+ as a
              single open band, so the pyramid bars past 85 (and the right tail
              of Plate II) are extrapolated using a Gompertz late-life mortality
              model calibrated to each country's observed 80-84 hazard.
            </p>
            <p>
              WHO life tables are only available split by binary sex. The
              “Both / Either” option uses WHO's population-weighted average of
              male and female data. There is no global mortality data for
              nonbinary, transgender, or intersex populations specifically.
            </p>
          </details>
        </div>
      </div>
    </>
  );
}
