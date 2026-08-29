import type { ReactNode } from "react";
import CornerOrnament from "./CornerOrnament";

interface Props {
  onOpen: () => void;
  state: string;
  children?: ReactNode;
}

export default function Pack({ onOpen, state, children }: Props) {
  return (
    <div
      className={`pack-wrap ${state}`}
      role="button"
      tabIndex={0}
      onClick={state === "idle" ? onOpen : undefined}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && state === "idle") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="pack">
        <div className="pack-inside">
          <div className="pocket"></div>
        </div>
        {children}
        <div className="pocket-front">
          <div className="pocket-label">First Principles · Vol. I</div>
        </div>
        <div className="pack-face">
          <span className="pack-corner tl">
            <CornerOrnament />
          </span>
          <span className="pack-corner tr">
            <CornerOrnament />
          </span>
          <span className="pack-corner bl">
            <CornerOrnament />
          </span>
          <span className="pack-corner br">
            <CornerOrnament />
          </span>
          <div className="pack-plate">
            <div className="pack-logo">
              <svg className="glyph" viewBox="0 0 100 100">
                <polygon points="50,8 88,28 12,28" fill="none" stroke="#d4b476" strokeWidth="1.5" />
                <line x1="20" y1="28" x2="20" y2="78" stroke="#d4b476" strokeWidth="1.5" />
                <line x1="50" y1="28" x2="50" y2="78" stroke="#d4b476" strokeWidth="1.5" />
                <line x1="80" y1="28" x2="80" y2="78" stroke="#d4b476" strokeWidth="1.5" />
                <rect x="8" y="78" width="84" height="6" fill="none" stroke="#d4b476" strokeWidth="1.5" />
                <rect x="4" y="84" width="92" height="6" fill="none" stroke="#d4b476" strokeWidth="1.5" />
                <circle cx="50" cy="18" r="2" fill="#d4b476" />
              </svg>
              <div className="title">
                <span className="l1">First</span>
                <span className="l2">Principles</span>
              </div>
              <div className="sub">A Philosopher TCG</div>
              <div className="rule"></div>
              <div className="vol">Vol. I</div>
            </div>
          </div>
          <div className="pack-bottom">
            <span>EN · FIRST EDITION</span>
            <span className="count">3 CARDS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
