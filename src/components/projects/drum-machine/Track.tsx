import { useDrumStore } from "./store";
import { findSample } from "./drum-packs";
import TrackHeader from "./TrackHeader";
import BeatColumn from "./BeatColumn";
import styles from "./DrumMachine.module.css";

interface Props {
  trackId: string;
  index: number;
  onPickSample: (trackId: string) => void;
  draggingId: string | null;
  dropTargetIndex: number | null;
  onDragStart: (trackId: string) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
  onDrop: (index: number) => void;
}

export default function Track({
  trackId,
  index,
  onPickSample,
  draggingId,
  dropTargetIndex,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop,
}: Props) {
  const track = useDrumStore((s) => s.tracks.find((t) => t.id === trackId));
  const beatsPerBar = useDrumStore((s) => s.beatsPerBar);
  const subdivision = useDrumStore((s) => s.subdivision);
  const currentStep = useDrumStore((s) => s.currentStep);
  const isPlaying = useDrumStore((s) => s.isPlaying);
  const toggleStep = useDrumStore((s) => s.toggleStep);
  const anySolo = useDrumStore((s) => s.tracks.some((t) => t.solo));

  if (!track) return null;
  const sample = findSample(track.sampleId);
  const trackLabel = sample?.name ?? "Track";

  const isDragging = draggingId === trackId;
  const isDropTarget = dropTargetIndex === index && draggingId !== trackId;
  const isInactive = track.mute || (anySolo && !track.solo);

  const classes = [
    styles.track,
    isDragging ? styles.trackDragging : "",
    isDropTarget ? styles.trackDropTarget : "",
    isInactive ? styles.trackInactive : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      onDragEnter={() => onDragEnter(index)}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(index);
      }}
    >
      <TrackHeader
        trackId={track.id}
        onPickSample={onPickSample}
        onHandleDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", trackId);
          onDragStart(trackId);
        }}
        onHandleDragEnd={onDragEnd}
      />
      <BeatColumn
        steps={track.steps}
        beatsPerBar={beatsPerBar}
        subdivision={subdivision}
        currentStep={currentStep}
        isPlaying={isPlaying}
        onToggleStep={(i) => toggleStep(track.id, i)}
        trackLabel={trackLabel}
      />
    </div>
  );
}
