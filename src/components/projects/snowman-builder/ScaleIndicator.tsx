import styles from "./SnowmanBuilder.module.css";

interface Props {
  totalCm: number;
  totalInches: number;
  pixelsPerCm: number;
}

function pickScaleUnit(totalCm: number): { value: number; label: string } {
  if (totalCm >= 20) return { value: 10, label: "10 cm" };
  if (totalCm >= 10) return { value: 5, label: "5 cm" };
  if (totalCm >= 4) return { value: 2, label: "2 cm" };
  return { value: 1, label: "1 cm" };
}

export default function ScaleIndicator({
  totalCm,
  totalInches,
  pixelsPerCm,
}: Props) {
  const unit = pickScaleUnit(totalCm);
  const barWidth = Math.max(20, unit.value * pixelsPerCm);

  return (
    <div
      style={{
        position: "absolute",
        bottom: "12px",
        left: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        background: "rgba(255,255,255,0.75)",
        backdropFilter: "blur(4px)",
        padding: "6px 10px",
        borderRadius: "8px",
        fontFamily: "var(--font-body)",
        fontSize: "0.7rem",
        color: "#3b4a5a",
        pointerEvents: "none",
      }}
    >
      <div style={{ fontWeight: 600 }}>
        {totalCm.toFixed(1)} cm ({totalInches.toFixed(1)} in) in 24h
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div
          style={{
            width: `${barWidth}px`,
            height: "4px",
            background: "#3b4a5a",
            borderRadius: "2px",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "-3px",
              width: "1px",
              height: "10px",
              background: "#3b4a5a",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "-3px",
              width: "1px",
              height: "10px",
              background: "#3b4a5a",
            }}
          />
        </div>
        <span>{unit.label}</span>
      </div>
    </div>
  );
}
