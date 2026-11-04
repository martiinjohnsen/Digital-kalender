"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCalendar, THEMES, themeInfo, type Theme } from "@/lib/model";
import { templates, templateDoors, type TemplateId } from "@/lib/templates";
import { Dialog } from "./dialog";
import { Artwork } from "./artwork";
import { useStore } from "./provider";
import { Icon } from "./icons";
export function startNew(templateId?: TemplateId) {
  window.dispatchEvent(new CustomEvent("luke:new", { detail: templateId }));
}
export function NewCalendar({
  onClose,
  templateId,
}: {
  onClose: () => void;
  templateId?: TemplateId;
}) {
  const { add, data, toast } = useStore();
  const router = useRouter();
  const template = templates.find((t) => t.id === templateId);
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(template?.title ?? "");
  const [recipient, setRecipient] = useState("");
  const [sender, setSender] = useState(data.preferences.name);
  const [theme, setTheme] = useState<Theme>(template?.theme ?? "advent");
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  function create() {
    const calendar = createCalendar(
      {
        title: title.trim(),
        recipient: recipient.trim(),
        sender: sender.trim(),
        year,
        theme,
      },
      templateId ? templateDoors(templateId) : undefined,
    );
    if (!add(calendar)) return;
    onClose();
    router.push(`/calendar/${calendar.id}`);
    toast(
      template
        ? "Kalenderen er klar. Gjør den til din egen!"
        : "En ny kalender, full av muligheter.",
    );
  }
  return (
    <Dialog title="Lag noe å glede seg til" onClose={onClose}>
      <div className="wizard">
        <div className="step-label">
          <span className={step === 0 ? "active" : "done"}>
            1 <span>Om kalenderen</span>
          </span>
          <i />
          <span className={step === 1 ? "active" : ""}>
            2 <span>Velg uttrykk</span>
          </span>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (step === 0) setStep(1);
            else create();
          }}
        >
          {step === 0 ? (
            <>
              <p className="dialog-intro">
                Til én du er glad i, eller en hel gjeng. Hvem vil du glede i
                desember?
              </p>
              <label>
                Hva skal kalenderen hete?
                <input
                  autoFocus
                  required
                  maxLength={100}
                  placeholder="For eksempel: Desember med gjengen"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
              <label>
                Hvem er den til? <span className="optional">Valgfritt</span>
                <input
                  maxLength={100}
                  placeholder="Familien, teamet eller en favorittperson"
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                />
              </label>
              <div className="form-row">
                <label>
                  Fra hvem?
                  <input
                    maxLength={100}
                    placeholder="Ditt navn"
                    value={sender}
                    onChange={(event) => setSender(event.target.value)}
                  />
                </label>
                <label>
                  Julen
                  <select
                    value={year}
                    onChange={(event) => setYear(Number(event.target.value))}
                  >
                    {Array.from({ length: 6 }, (_, i) => currentYear + i).map(
                      (value) => (
                        <option key={value}>{value}</option>
                      ),
                    )}
                  </select>
                </label>
              </div>
              {template && (
                <div className="info-box inline">
                  <Icon name="sparkles" />
                  <span>
                    Du starter med 24 ferdige forslag fra «{template.title}».
                    Alt kan endres.
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="dialog-intro">
                Velg en stemning som passer. Du kan alltid bytte senere.
              </p>
              <div className="wizard-art theme-forest">
                <Artwork theme={theme} />
                <span>{title}</span>
              </div>
              <div className="theme-picker">
                {THEMES.map((t) => (
                  <button
                    type="button"
                    key={t}
                    className={
                      theme === t ? "theme-option selected" : "theme-option"
                    }
                    aria-pressed={theme === t}
                    onClick={() => setTheme(t)}
                  >
                    <span style={{ background: themeInfo[t].color }}>
                      {theme === t && <Icon name="check" size={17} />}
                    </span>
                    {themeInfo[t].name}
                  </button>
                ))}
              </div>
              <p className="muted small">
                {themeInfo[theme].description}. Innholdet er det som gjør
                kalenderen personlig.
              </p>
            </>
          )}
          <div className="dialog-actions">
            {step === 1 ? (
              <button
                type="button"
                className="button text"
                onClick={() => setStep(0)}
              >
                <Icon name="back" size={17} />
                Tilbake
              </button>
            ) : (
              <button type="button" className="button text" onClick={onClose}>
                Avbryt
              </button>
            )}
            <button
              className="button primary"
              type="submit"
              disabled={!title.trim()}
            >
              {step === 0 ? "Velg uttrykk" : "Opprett kalender"}
              <Icon name={step === 0 ? "arrow" : "plus"} size={18} />
            </button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
