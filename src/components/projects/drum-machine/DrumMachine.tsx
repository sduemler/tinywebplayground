import { useEffect, useRef, useState } from "react";
import { useDrumStore, getTotalSteps } from "./store";
import Track from "./Track";
import AddTrackButton from "./AddTrackButton";
import PatternSizeControls from "./PatternSizeControls";
import SamplePickerModal from "./SamplePickerModal";
import MasterControls from "./MasterControls";
import ShareDialog from "./ShareDialog";
import { decodeFromUrlParam } from "./serialize";
import {
  initAudio,
  syncTracks,
  setMasterVolume,
  setBpm,
  setSwing,
  startTransport,
  stopTransport,
  disposeAudio,
  subdivisionToInterval,
} from "./audio";
import styles from "./DrumMachine.module.css";

type PickerMode =
  | { kind: "closed" }
  | { kind: "add" }
  | { kind: "swap"; trackId: string };

export default function DrumMachine() {
  const addTrack = useDrumStore((s) => s.addTrack);
  const setTrackSample = useDrumStore((s) => s.setTrackSample);
  const isPlaying = useDrumStore((s) => s.isPlaying);
  const setIsPlaying = useDrumStore((s) => s.setIsPlaying);
  const setCurrentStep = useDrumStore((s) => s.setCurrentStep);
  const bpm = useDrumStore((s) => s.bpm);
  const swing = useDrumStore((s) => s.swing);
  const masterVolume = useDrumStore((s) => s.masterVolume);
  const subdivision = useDrumStore((s) => s.subdivision);
  const tracks = useDrumStore((s) => s.tracks);

  const [picker, setPicker] = useState<PickerMode>({ kind: "closed" });
  const [shareOpen, setShareOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const wasPlaying = useRef(false);
  const lastSubdivision = useRef(subdivision);
  const loadPattern = useDrumStore((s) => s.loadPattern);
  const reorderTracks = useDrumStore((s) => s.reorderTracks);

  // Boot: if URL has ?p=, load it once and strip the param.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("p");
    if (!encoded) return;
    try {
      const pattern = decodeFromUrlParam(encoded);
      loadPattern(pattern);
    } catch (err) {
      console.warn("Failed to load pattern from URL:", err);
    } finally {
      params.delete("p");
      const remaining = params.toString();
      const cleanUrl =
        window.location.pathname + (remaining ? `?${remaining}` : "");
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [loadPattern]);

  useEffect(() => {
    void syncTracks(tracks);
  }, [tracks]);

  useEffect(() => {
    setBpm(bpm);
  }, [bpm]);
  useEffect(() => {
    setSwing(swing);
  }, [swing]);
  useEffect(() => {
    setMasterVolume(masterVolume);
  }, [masterVolume]);

  useEffect(() => {
    if (isPlaying && !wasPlaying.current) {
      void (async () => {
        await initAudio();
        setBpm(useDrumStore.getState().bpm);
        setSwing(useDrumStore.getState().swing);
        setMasterVolume(useDrumStore.getState().masterVolume);
        await syncTracks(useDrumStore.getState().tracks);
        await startTransport({
          getTracks: () => useDrumStore.getState().tracks,
          getTotalSteps: () => getTotalSteps(useDrumStore.getState()),
          getInterval: () =>
            subdivisionToInterval(useDrumStore.getState().subdivision),
          onStep: (step) => setCurrentStep(step),
        });
      })();
    } else if (!isPlaying && wasPlaying.current) {
      stopTransport();
      setCurrentStep(0);
    }
    wasPlaying.current = isPlaying;
  }, [isPlaying, setCurrentStep]);

  // Subdivision change while playing: stop + restart so the new interval takes effect.
  // Guarded by a ref so this only fires on actual subdivision changes, not when
  // isPlaying flips (which would otherwise double-start the transport).
  useEffect(() => {
    if (lastSubdivision.current === subdivision) return;
    lastSubdivision.current = subdivision;
    if (!isPlaying) return;
    void (async () => {
      stopTransport();
      await startTransport({
        getTracks: () => useDrumStore.getState().tracks,
        getTotalSteps: () => getTotalSteps(useDrumStore.getState()),
        getInterval: () =>
          subdivisionToInterval(useDrumStore.getState().subdivision),
        onStep: (step) => setCurrentStep(step),
      });
    })();
  }, [subdivision, isPlaying, setCurrentStep]);

  useEffect(() => {
    return () => {
      disposeAudio();
    };
  }, []);

  // Spacebar toggles play/stop unless the user is typing in an input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      setIsPlaying(!useDrumStore.getState().isPlaying);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setIsPlaying]);

  const handlePickerPick = (sampleId: string) => {
    if (picker.kind === "add") {
      addTrack(sampleId);
    } else if (picker.kind === "swap") {
      setTrackSample(picker.trackId, sampleId);
    }
  };

  const selectedSampleId =
    picker.kind === "swap"
      ? tracks.find((t) => t.id === picker.trackId)?.sampleId
      : undefined;

  return (
    <div className={styles.chassis}>
      <header className={styles.topBar}>
        <MasterControls onOpenShare={() => setShareOpen(true)} />
        <PatternSizeControls />
      </header>

      <div className={styles.gridScroller}>
        <div className={styles.grid}>
          {tracks.map((t, index) => (
            <Track
              key={t.id}
              trackId={t.id}
              index={index}
              onPickSample={(trackId) => setPicker({ kind: "swap", trackId })}
              draggingId={draggingId}
              dropTargetIndex={dropTargetIndex}
              onDragStart={(id) => setDraggingId(id)}
              onDragEnter={(i) => setDropTargetIndex(i)}
              onDragEnd={() => {
                setDraggingId(null);
                setDropTargetIndex(null);
              }}
              onDrop={(targetIndex) => {
                if (draggingId) {
                  const from = tracks.findIndex((tr) => tr.id === draggingId);
                  if (from >= 0 && from !== targetIndex) {
                    reorderTracks(from, targetIndex);
                  }
                }
                setDraggingId(null);
                setDropTargetIndex(null);
              }}
            />
          ))}
          <AddTrackButton onClick={() => setPicker({ kind: "add" })} />
        </div>
      </div>

      <SamplePickerModal
        open={picker.kind !== "closed"}
        onClose={() => setPicker({ kind: "closed" })}
        onPick={handlePickerPick}
        selectedId={selectedSampleId}
        title={picker.kind === "add" ? "Add a track" : "Swap sample"}
      />

      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
