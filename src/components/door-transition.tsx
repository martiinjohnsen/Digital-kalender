"use client";
import { useEffect, useState, type CSSProperties } from "react";
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
  return <ParticleBurst key={effect} effect={effect} />;
}

type ActiveEffect = Exclude<DoorEffect, "none">;
const particleCounts: Record<ActiveEffect, number> = {
  snow: 150,
  sparkles: 85,
  confetti: 150,
  hearts: 60,
  fireworks: 144,
  glow: 50,
};
const particleSizes: Record<ActiveEffect, [number, number]> = {
  snow: [3, 10],
  sparkles: [15, 36],
  confetti: [5, 12],
  hearts: [15, 36],
  fireworks: [3, 7],
  glow: [28, 76],
};
const colors = ["#d9ae65", "#f4d28c", "#cb82a5", "#71b9ac", "#a293dd", "#e58f73"];
const random = (min: number, max: number) => min + Math.random() * (max - min);

function createParticles(effect: ActiveEffect): CSSProperties[] {
  // Each replay gets fresh positions, speeds and three independent firework bursts.
  const bursts = Array.from({ length: 3 }, () => ({
    x: random(22, 78),
    y: random(23, 65),
    color: colors[Math.floor(random(0, colors.length))],
  }));
  const [minSize, maxSize] = particleSizes[effect];
  return Array.from({ length: particleCounts[effect] }, (_, index) => {
    const burstIndex = Math.floor(index / 48);
    const burst = bursts[burstIndex % bursts.length];
    const angle = random(0, Math.PI * 2);
    const distance = random(70, 240);
    const color = effect === "fireworks"
      ? burst.color
      : effect === "hearts"
        ? ["#c15e87", "#e593af", "#bd78a4"][index % 3]
        : colors[index % colors.length];
    return {
      "--x": `${effect === "fireworks" ? burst.x : random(0, 100)}%`,
      "--y": `${effect === "fireworks" ? burst.y : random(3, 97)}%`,
      "--size": `${random(minSize, maxSize)}px`,
      "--delay": `${effect === "fireworks" ? burstIndex * 0.65 + random(0, 0.12) : random(0, 1.5)}s`,
      "--duration": `${effect === "fireworks" ? random(1.6, 2.4) : random(2.8, 4.6)}s`,
      "--drift": `${random(-150, 150)}px`,
      "--rotation": `${random(-720, 720)}deg`,
      "--burst-x": `${Math.cos(angle) * distance}px`,
      "--burst-y": `${Math.sin(angle) * distance}px`,
      "--particle-color": color,
    } as CSSProperties;
  });
}

function ParticleBurst({ effect }: { effect: ActiveEffect }) {
  const [particles] = useState(() => createParticles(effect));
  return (
    <div className={`celebration effect-${effect}`} aria-hidden="true">
      {particles.map((style, index) => (
        <span key={index} style={style}>
          {effect === "sparkles" && <Icon name="sparkles" size={28} />}
          {effect === "hearts" && <Icon name="heart" size={28} />}
        </span>
      ))}
    </div>
  );
}
