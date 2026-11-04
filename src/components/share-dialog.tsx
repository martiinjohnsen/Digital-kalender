"use client";
import { useState } from "react";
import { type AdventCalendar, completedCount } from "@/lib/model";
import { encodeCalendar } from "@/lib/share";
import { downloadJson } from "@/lib/storage";
import { useStore } from "./provider";
import { Dialog } from "./dialog";
import { Icon } from "./icons";
export function ShareDialog({
  calendar,
  onClose,
}: {
  calendar: AdventCalendar;
  onClose: () => void;
}) {
  const { data, toast } = useStore();
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  function generate() {
    try {
      setLink(`${location.origin}/receive#${encodeCalendar(calendar)}`);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lenken kunne ikke lages.");
    }
  }
  return (
    <Dialog title="Del kalender" onClose={onClose}>
      <div className="share-content">
        <span className="large-icon">
          <Icon name="gift" size={30} />
        </span>
        <h3>{calendar.title}</h3>
        <p className="muted">{completedCount(calendar)} av 24 luker er fylt.</p>
        <div className="info-box">
          <strong>En prøvelenke til denne versjonen</strong>
          <p>
            Lenken inneholder en kopi av kalenderen. Endringer etterpå følger
            ikke med. Den som har lenken, kan lese innholdet i alle lukene, også
            før desember. Bruk den til å prøve, og unngå private opplysninger.
            Ikke del ekte gavekortkoder i prøvelenker.
          </p>
        </div>
        {!link ? (
          <button className="button primary full" onClick={generate}>
            <Icon name="share" size={17} />
            Lag prøvelenke
          </button>
        ) : (
          <>
            <label>
              Prøvelenken din
              <input
                className="share-url"
                readOnly
                value={link}
                onFocus={(event) => event.target.select()}
              />
            </label>
            <button
              className="button primary full"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(link);
                  toast("Prøvelenken er kopiert.");
                } catch {
                  setError(
                    "Nettleseren tillot ikke kopiering. Marker og kopier lenken i feltet over.",
                  );
                }
              }}
            >
              <Icon name="copy" size={17} />
              Kopier lenke
            </button>
            <p className="field-help">
              Lenken må starte med en publisert nettadresse for å fungere på
              andre enheter. localhost er bare denne Macen.
            </p>
          </>
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button
          className="button secondary full"
          onClick={() => {
            downloadJson(
              {
                version: 1,
                calendars: [calendar],
                preferences: data.preferences,
              },
              `luke-kalender-${calendar.year}.json`,
            );
            toast("Kalenderfilen er lastet ned.");
          }}
        >
          <Icon name="download" size={17} />
          Last ned kalenderfil
        </button>
        <p className="small muted">
          Kalenderfiler kan importeres i Innstillinger. Vanlig publisering og
          mottakerkontoer kommer med neste del av prosjektet.
        </p>
      </div>
    </Dialog>
  );
}
