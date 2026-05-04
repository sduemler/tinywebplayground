import { useState, useCallback, useEffect } from "react";
import type { Phase, SnowLayer } from "./types";
import { useSnowfallData } from "./useSnowfallData";
import { useGameLoop } from "./useGameLoop";
import { createSnowLayer, getPixelsPerCm } from "./canvas/snow-layer";
import { MIN_SNOW_THRESHOLD_CM } from "./canvas/constants";
import LocationSearch from "./LocationSearch";
import ScaleIndicator from "./ScaleIndicator";
import NoSnowFallback from "./NoSnowFallback";
import styles from "./SnowmanBuilder.module.css";

export default function SnowmanBuilder() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [isComplete, setIsComplete] = useState(false);
  const [snowballCount, setSnowballCount] = useState(0);
  const [snowLayer, setSnowLayer] = useState<SnowLayer | null>(null);
  const [debugCm, setDebugCm] = useState<number | null>(null);
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);

  const canvasRef = useCallback((el: HTMLCanvasElement | null) => {
    setCanvasEl(el);
  }, []);

  const { snowfall, loading, error, fetchByCoords, searchLocations } =
    useSnowfallData();

  const handleComplete = useCallback(() => setIsComplete(true), []);
  const handleCountChange = useCallback(
    (count: number) => setSnowballCount(count),
    [],
  );

  const { addSnowball, reset } = useGameLoop({
    canvas: canvasEl,
    snowLayer,
    onComplete: handleComplete,
    onSnowballCountChange: handleCountChange,
  });

  const effectiveCm = debugCm ?? snowfall?.totalCm ?? null;
  const effectiveSnowfall = debugCm
    ? {
        totalCm: debugCm,
        totalInches: debugCm / 2.54,
        locationName: `Debug (${debugCm} cm)`,
        latitude: 0,
        longitude: 0,
      }
    : snowfall;

  useEffect(() => {
    if (effectiveCm === null) return;

    if (effectiveCm < MIN_SNOW_THRESHOLD_CM) {
      setPhase("no-snow");
      return;
    }

    setPhase("playing");
  }, [effectiveCm]);

  useEffect(() => {
    if (effectiveCm === null || effectiveCm < MIN_SNOW_THRESHOLD_CM) return;
    if (!canvasEl) return;

    setIsComplete(false);
    setSnowballCount(0);

    const rect = canvasEl.getBoundingClientRect();
    const layer = createSnowLayer(
      Math.round(rect.width),
      Math.round(rect.height),
      effectiveCm,
    );
    setSnowLayer(layer);
  }, [effectiveCm, canvasEl]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const debugSnow = params.get("debug");
    if (debugSnow) {
      const cm = parseFloat(debugSnow);
      if (cm > 0) {
        setDebugCm(cm);
        return;
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchByCoords(
            pos.coords.latitude,
            pos.coords.longitude,
            "Your Location",
          );
        },
        () => {
          setPhase("location-prompt");
        },
        { timeout: 5000 },
      );
    } else {
      setPhase("location-prompt");
    }
  }, [fetchByCoords]);

  function handleLocationSelect(lat: number, lon: number, name: string) {
    fetchByCoords(lat, lon, name);
  }

  function handleGeolocate() {
    if (!navigator.geolocation) return;
    setPhase("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchByCoords(
          pos.coords.latitude,
          pos.coords.longitude,
          "Your Location",
        );
      },
      () => {
        setPhase("location-prompt");
      },
      { timeout: 5000 },
    );
  }

  function handleReset() {
    reset();
    setIsComplete(false);
    setSnowballCount(0);
  }

  if ((phase === "loading" && !debugCm) || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Finding snow near you...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <LocationSearch
        locationName={effectiveSnowfall?.locationName ?? null}
        onSelect={handleLocationSelect}
        onGeolocate={handleGeolocate}
        searchLocations={searchLocations}
      />

      {error && (
        <div
          style={{
            color: "#c0392b",
            fontFamily: "var(--font-body)",
            fontSize: "0.85rem",
          }}
        >
          {error}
        </div>
      )}

      {phase === "location-prompt" && !effectiveSnowfall && (
        <div className={styles.loadingState}>
          <span>Search for a city to check for snow</span>
        </div>
      )}

      {phase === "no-snow" && <NoSnowFallback />}

      {phase === "playing" && (
        <>
          <div className={styles.canvasWrapper}>
            <canvas ref={canvasRef} className={styles.canvas} />
            {effectiveSnowfall && canvasEl && (
              <ScaleIndicator
                totalCm={effectiveSnowfall.totalCm}
                totalInches={effectiveSnowfall.totalInches}
                pixelsPerCm={getPixelsPerCm(
                  canvasEl.getBoundingClientRect().height,
                  effectiveSnowfall.totalCm,
                )}
              />
            )}
          </div>

          <div className={styles.toolbar}>
            <button
              className={styles.newBallBtn}
              onClick={addSnowball}
              disabled={isComplete}
            >
              + New Snowball
            </button>
            <button className={styles.resetBtn} onClick={handleReset}>
              Reset
            </button>
            {snowballCount > 0 && (
              <span className={styles.snowInfo}>
                {snowballCount} snowball{snowballCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {isComplete && (
            <div className={styles.completionBanner}>You built a snowman!</div>
          )}
        </>
      )}

      <div className={styles.credit}>~idea inspiration from maddy~</div>
    </div>
  );
}
