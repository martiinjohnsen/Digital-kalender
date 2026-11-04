"use client";
import { useEffect, type CSSProperties } from "react";
import { Icon } from "./icons";
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
          <div className="opening-light" />
          <div className="opening-panel opening-left">
            <i />
          </div>
          <div className="opening-panel opening-right">
            <i />
          </div>
          <strong className="opening-number">{day}</strong>
        </div>
      </div>
    </div>
  );
}
export function Celebration({ effect }: { effect?: DoorEffect }) {
  if (!effect || effect === "none") return null;
  return (
    <div className={`celebration effect-${effect}`} aria-hidden="true">
      {Array.from({ length: effect === "sparkles" ? 34 : 58 }, (_, i) => (
        <span
          key={i}
          style={
            {
              "--x": `${(i * 37 + 9) % 100}%`,
              "--y": `${8 + ((i * 43) % 80)}%`,
              "--delay": `${(i % 13) * 0.065}s`,
              "--duration": `${2.2 + (i % 7) * 0.16}s`,
              "--drift": `${(i % 2 ? 1 : -1) * (20 + ((i * 13) % 65))}px`,
              "--rotation": `${180 + i * 73}deg`,
              "--particle-color": [
                "var(--primary)",
                "#d5b48a",
                "#d6a6bb",
                "#8fb5ad",
              ][i % 4],
            } as CSSProperties
          }
        >
          {effect === "sparkles" ? (
            <Icon name="sparkles" size={i % 3 ? 19 : 28} />
          ) : (
            ""
          )}
        </span>
      ))}
    </div>
  );
}
