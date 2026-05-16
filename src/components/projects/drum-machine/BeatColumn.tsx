import { Fragment } from "react";
import BeatPad from "./BeatPad";
import styles from "./DrumMachine.module.css";

interface Props {
  steps: boolean[];
  beatsPerBar: number;
  subdivision: number;
  currentStep: number;
  isPlaying: boolean;
  onToggleStep: (stepIndex: number) => void;
  trackLabel: string;
}

export default function BeatColumn({
  steps,
  beatsPerBar,
  subdivision,
  currentStep,
  isPlaying,
  onToggleStep,
  trackLabel,
}: Props) {
  const cellsPerBar = beatsPerBar * subdivision;

  return (
    <div className={styles.beatColumn}>
      {steps.map((on, i) => {
        const cellInBar = i % cellsPerBar;
        const barIndex = Math.floor(i / cellsPerBar);
        const beatInBar = Math.floor(cellInBar / subdivision);
        const subInBeat = cellInBar % subdivision;
        const isFirstOfBar = cellInBar === 0;
        const isFirstOfBeat = subInBeat === 0;
        const showBarDivider = isFirstOfBar && i !== 0;
        const showBeatDivider = !showBarDivider && isFirstOfBeat && i !== 0;
        return (
          <Fragment key={i}>
            {showBarDivider && <div className={styles.barDivider} aria-hidden />}
            {showBeatDivider && <div className={styles.beatDivider} aria-hidden />}
            <BeatPad
              on={on}
              isCurrent={i === currentStep}
              isPlaying={isPlaying}
              isFirstOfBar={isFirstOfBar}
              onToggle={() => onToggleStep(i)}
              ariaLabel={`${trackLabel} bar ${barIndex + 1} beat ${
                beatInBar + 1
              } sub ${subInBeat + 1}`}
            />
          </Fragment>
        );
      })}
    </div>
  );
}
