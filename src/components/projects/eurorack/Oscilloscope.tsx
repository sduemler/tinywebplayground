import { useRef, useEffect, useCallback } from "react";
import { getAnalyser } from "./audio";
import styles from "./Eurorack.module.css";

interface OscilloscopeProps {
  isPlaying: boolean;
}

export default function Oscilloscope({ isPlaying }: OscilloscopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    const w = rect.width;
    const h = rect.height;

    // Dark background
    ctx.fillStyle = "#1a0f08";
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = "rgba(200, 160, 80, 0.08)";
    ctx.lineWidth = 1;
    const gridCols = 10;
    const gridRows = 6;
    for (let i = 1; i < gridCols; i++) {
      const x = (w / gridCols) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let i = 1; i < gridRows; i++) {
      const y = (h / gridRows) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Center line
    ctx.strokeStyle = "rgba(200, 160, 80, 0.15)";
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Waveform
    const analyser = getAnalyser();
    if (analyser && isPlaying) {
      const data = analyser.getValue() as Float32Array;

      // Trigger: find a rising zero-crossing to lock the waveform in place
      let triggerIndex = 0;
      for (let i = 1; i < data.length - 1; i++) {
        if (data[i - 1] <= 0 && data[i] > 0) {
          triggerIndex = i;
          break;
        }
      }

      // Show ~3 cycles worth of samples from the trigger point
      const cycleSamples = Math.floor(data.length * 0.6);
      const end = Math.min(triggerIndex + cycleSamples, data.length);

      // Glow effect
      ctx.shadowColor = "#e8a840";
      ctx.shadowBlur = 12;

      ctx.strokeStyle = "#e8a840";
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      const drawLength = end - triggerIndex;
      for (let i = 0; i < drawLength; i++) {
        const x = (i / drawLength) * w;
        const y = ((1 - data[triggerIndex + i]) / 2) * h;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      // Flat line when idle
      ctx.shadowColor = "#e8a840";
      ctx.shadowBlur = 6;
      ctx.strokeStyle = "rgba(232, 168, 64, 0.3)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [isPlaying]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return (
    <div className={styles.oscilloscopeContainer}>
      <canvas ref={canvasRef} className={styles.oscilloscopeCanvas} />
    </div>
  );
}
