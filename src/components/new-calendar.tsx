"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCalendar, DEFAULT_SCENE } from "@/lib/model";
import { Dialog } from "./dialog";
import { useStore } from "./provider";
import { Icon } from "./icons";
import { AppearancePicker, type AppearanceValue } from "./appearance-picker";
export function startNew() {
  window.dispatchEvent(new Event("luke:new"));
}
export function NewCalendar({ onClose }: { onClose: () => void }) {
  const { add, data, toast } = useStore();
  const router = useRouter();
  const [step, setStep] = useState(0),
    [title, setTitle] = useState(""),
    [recipient, setRecipient] = useState(""),
    [sender, setSender] = useState(data.preferences.name);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [appearance, setAppearance] = useState<AppearanceValue>({
    theme: "advent",
    scene: { ...DEFAULT_SCENE },
  });
  function create() {
    const calendar = createCalendar({
      title: title.trim(),
      recipient: recipient.trim(),
      sender: sender.trim(),
      year,
      ...appearance,
    });
    if (!add(calendar)) return;
    onClose();
    router.push(`/calendar/${calendar.id}`);
    toast("Kalenderen er opprettet.");
  }
  return (
    <Dialog
      title="Opprett kalender"
      onClose={onClose}
      wide={step === 1}
      className="new-calendar-dialog"
    >
      <div className="wizard">
        <div className="step-label">
          <span className={step === 0 ? "active" : "done"}>
            1 <span>Om kalenderen</span>
          </span>
          <i />
          <span className={step === 1 ? "active" : ""}>
            2 <span>Velg utseende</span>
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
              <label>
                Navn på kalenderen
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
                Til hvem?<span className="optional">Valgfritt</span>
                <input
                  maxLength={100}
                  placeholder="Navn eller gruppe"
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                />
              </label>
              <div className="form-row">
                <label>
                  Fra
                  <input
                    maxLength={100}
                    placeholder="Ditt navn"
                    value={sender}
                    onChange={(event) => setSender(event.target.value)}
                  />
                </label>
                <label>
                  År
                  <select
                    value={year}
                    onChange={(event) => setYear(Number(event.target.value))}
                  >
                    {Array.from({ length: 6 }, (_, i) => currentYear + i).map(
                      (y) => (
                        <option key={y}>{y}</option>
                      ),
                    )}
                  </select>
                </label>
              </div>
            </>
          ) : (
            <AppearancePicker
              value={appearance}
              onChange={setAppearance}
              title={title}
            />
          )}
          <div className="dialog-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => (step === 1 ? setStep(0) : onClose())}
            >
              {step === 1 ? "Tilbake" : "Avbryt"}
            </button>
            <button
              className="button primary"
              type="submit"
              disabled={!title.trim()}
            >
              {step === 0 ? "Velg utseende" : "Opprett kalender"}
              <Icon name={step === 0 ? "arrow" : "plus"} size={17} />
            </button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
