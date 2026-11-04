"use client";
import { useState } from "react";
import type { DoorEffect } from "@/lib/model";
import { Celebration } from "./door-transition";
import { Icon } from "./icons";

const effects = [
  ["none", "Ingen"],
  ["snow", "Snøfall"],
  ["sparkles", "Stjerner"],
  ["confetti", "Konfetti"],
] as const;

export function OpeningEffectPicker({
  value,
  day,
  onChange,
}: {
  value: DoorEffect;
  day: number;
  onChange: (effect: DoorEffect) => void;
}) {
  const [replay, setReplay] = useState(0);
  return (
    <section className="opening-effect-settings" aria-label="Åpningseffekt">
      <div className="effect-settings-heading">
        <h3>Åpningseffekt</h3>
        {value !== "none" && (
          <button
            className="button secondary small-button"
            type="button"
            onClick={() => setReplay((previous) => previous + 1)}
          >
            <Icon name="video" size={15} />
            Spill igjen
          </button>
        )}
      </div>
      <div className="effect-options" aria-label="Velg åpningseffekt">
        {effects.map(([effect, label]) => (
          <button
            key={effect}
            type="button"
            className={value === effect ? "selected" : ""}
            aria-pressed={value === effect}
            onClick={() => {
              onChange(effect);
              setReplay((previous) => previous + 1);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="opening-effect-preview">
        <Celebration key={`${value}-${replay}`} effect={value} />
        <span className="effect-preview-date">{day}. desember</span>
        <span>
          {value === "none" ? "Ingen ekstra effekt" : "Forhåndsvisning"}
        </span>
      </div>
    </section>
  );
}
