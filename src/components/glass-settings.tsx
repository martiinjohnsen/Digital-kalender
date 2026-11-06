"use client";
import { useId } from "react";
import { DEFAULT_GLASS } from "@/lib/glass";
import { useGlass } from "./glass-provider";
import { Icon } from "./icons";
export function GlassSettings() {
  const glass = useGlass();
  const id = useId();
  return (
    <section className="settings-card glass-settings" aria-labelledby={`${id}-title`}>
      <div className="settings-card-heading"><span className="soft-icon"><Icon name="sparkles" size={24} /></span><div><h2 id={`${id}-title`}>Knapputseende</h2><p>Velg hvor gjennomsiktige knappene og mobilmenyen skal være.</p></div></div>
      <div className="glass-demo" aria-hidden="true"><span className="button primary">Handlingsknapp <Icon name="check" size={16} /></span><span className="glass-choice">Valgt fane</span></div>
      <label className="glass-slider-label" htmlFor={id}>Gjennomsiktighet</label>
      <input id={id} className="glass-slider" type="range" min="0" max="100" step="1" value={glass.level} disabled={!glass.ready} onChange={event=>glass.setLevel(Number(event.target.value))} onPointerUp={glass.flush} onKeyUp={glass.flush} onBlur={glass.flush} />
      <div className="glass-slider-ends"><span>Mer gjennomsiktig</span><span>Mer dekkende</span></div>
      <div className="glass-settings-bottom"><button className="button secondary small-button" disabled={!glass.ready || glass.level === DEFAULT_GLASS} onClick={()=>{ glass.setLevel(DEFAULT_GLASS); glass.flush(); }}>Tilbakestill</button><span role="status">{glass.status === "loading" ? "Henter innstillingen …" : glass.status === "saving" ? "Lagrer …" : glass.status === "saved" ? "Lagret på kontoen" : "Kunne ikke lagre"}</span></div>
      {glass.error && <div className="form-error" role="alert">{glass.error} <button type="button" className="text-link" onClick={glass.retry}>Prøv igjen</button></div>}
    </section>
  );
}
