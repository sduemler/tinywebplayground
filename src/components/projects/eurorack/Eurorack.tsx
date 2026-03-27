import { useCallback, useEffect } from "react";
import { useSynthStore } from "./store";
import { initAudio, startOscillator, stopOscillator, setWaveType, mute, unmute, dispose } from "./audio";
import Oscilloscope from "./Oscilloscope";
import WaveSelector from "./WaveSelector";
import type { WaveType } from "./types";
import styles from "./Eurorack.module.css";

export default function Eurorack() {
  const { waveType, isPlaying, isMuted, setWaveType: storeSetWave, setPlaying, setMuted } = useSynthStore();

  const handleWaveSelect = useCallback(
    async (type: WaveType) => {
      await initAudio();
      storeSetWave(type);

      if (type === "flat") {
        stopOscillator();
        setPlaying(false);
      } else {
        setWaveType(type);
        if (!isMuted) {
          startOscillator();
        }
        setPlaying(true);
      }
    },
    [storeSetWave, setPlaying, isMuted]
  );

  const handleMuteToggle = useCallback(() => {
    if (isMuted) {
      unmute();
      setMuted(false);
    } else {
      mute();
      setMuted(true);
    }
  }, [isMuted, setMuted]);

  useEffect(() => {
    return () => {
      dispose();
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <div className={styles.topBar}>
          <button
            className={`${styles.muteButton} ${isMuted ? styles.muteButtonActive : ""}`}
            onClick={handleMuteToggle}
            aria-label={isMuted ? "Unmute" : "Mute"}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M19.07 4.93a10 10 0 010 14.14" />
                <path d="M15.54 8.46a5 5 0 010 7.07" />
              </svg>
            )}
          </button>
        </div>
        <Oscilloscope isPlaying={isPlaying} />
        <WaveSelector
          activeWave={waveType}
          onSelect={handleWaveSelect}
        />
      </div>
    </div>
  );
}
