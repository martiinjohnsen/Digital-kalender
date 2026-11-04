"use client";
import { useEffect, type CSSProperties } from "react";
import type { DoorEffect, Theme } from "@/lib/model";
export type DoorOrigin = { x: number; y: number; width: number };
export function DoorTransition({
  day,
  theme,
  origin,
  onComplete,
}: {
  day: number;
  theme: Theme;
  origin?: DoorOrigin;
  onComplete: () => void;
}) {
  useEffect(() => {
    const timeout = setTimeout(onComplete, 1100);
    return () => clearTimeout(timeout);
  }, [onComplete]);
  const style = {
    "--start-x": `${origin ? origin.x - window.innerWidth / 2 : 0}px`,
    "--start-y": `${origin ? origin.y - window.innerHeight / 2 : 0}px`,
    "--start-scale": origin ? origin.width / 180 : 0.5,
  } as CSSProperties;
  return (
    <div
      className={`door-transition theme-${theme}`}
      role="status"
      aria-label={`Åpner luke ${day}`}
    >
      <div className="opening-glow" />
      <div className="door-flight" style={style}>
        <div className="opening-frame">
          <div className="opening-light">
            <span>✧</span>
          </div>
          <div className="opening-panel opening-left">
            <span>{day}</span>
            <i />
          </div>
          <div className="opening-panel opening-right">
            <i />
          </div>
          <span className="opening-caption">EN LITEN GLEDE</span>
        </div>
      </div>
    </div>
  );
}
export function Celebration({ effect }: { effect?: DoorEffect }) {
  if (!effect || effect === "none") return null;
  return (
    <div className={`celebration effect-${effect}`} aria-hidden="true">
      {Array.from({ length: 26 }, (_, i) => (
        <span
          key={i}
          style={
            {
              "--x": `${(i * 37 + 9) % 100}%`,
              "--delay": `${(i % 7) * 0.14}s`,
              "--duration": `${2.3 + (i % 5) * 0.3}s`,
              "--rotation": `${i * 39}deg`,
              "--particle-color": ["#b99ecf", "#d5b48a", "#e4bed6", "#aebfbb"][
                i % 4
              ],
            } as CSSProperties
          }
        >
          {effect === "sparkles" ? "✧" : effect === "snow" ? "•" : ""}
        </span>
      ))}
    </div>
  );
}
