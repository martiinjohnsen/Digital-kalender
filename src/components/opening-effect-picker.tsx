"use client";
import type { DoorEffect } from "@/lib/model";
import { Icon } from "./icons";

const effects = [
  ["none", "Ingen"],
  ["snow", "Snøfall"],
  ["sparkles", "Stjerner"],
  ["confetti", "Konfetti"],
  ["hearts", "Hjerter"],
  ["fireworks", "Fyrverkeri"],
  ["glow", "Juleglød"],
] as const;

export function OpeningEffectPicker({
  value,
  onChange,
  onPreview,
}: {
  value: DoorEffect;
  onChange: (effect: DoorEffect) => void;
  onPreview: () => void;
}) {
  return (
    <section className="opening-effect-settings" aria-label="Åpningseffekt">
      <div className="effect-settings-heading">
        <h3>Åpningseffekt</h3>
        {value !== "none" && (
          <button
            className="button secondary small-button"
            type="button"
            onClick={onPreview}
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
            onClick={() => onChange(effect)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="field-help">Velg en effekt for å se den over luka, slik mottakeren ser den.</p>
    </section>
  );
}
