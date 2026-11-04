"use client";
import { useEffect, useRef, useState } from "react";
import {
  kindInfo,
  youtubeId,
  safeLink,
  isDoorComplete,
  questionsForDoor,
  type Door,
  type DoorKind,
  type AdventCalendar,
  type GiftCard,
} from "@/lib/model";
import { compressImage } from "@/lib/storage";
import { Icon } from "./icons";
import { Dialog } from "./dialog";
import { DoorQuestionsEditor, blankQuestion } from "./door-questions";
const emptyGift = (): GiftCard => ({
  merchant: "",
  amount: 100,
  currency: "NOK",
  code: "",
  url: "",
  expiresOn: "",
});
function editorDraft(door: Door, calendar: AdventCalendar): Door {
  const draft = structuredClone(door);
  draft.questions = questionsForDoor(door, calendar);
  delete draft.quiz;
  delete draft.showCalendarQuiz;
  return draft;
}
export function DoorEditor({
  door,
  calendar,
  onSave,
  onClose,
}: {
  door: Door;
  calendar: AdventCalendar;
  onSave: (door: Door) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(() => editorDraft(door, calendar));
  const baseline = useRef(JSON.stringify(editorDraft(door, calendar)));
  const [error, setError] = useState(""),
    [uploading, setUploading] = useState(false),
    [discard, setDiscard] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (JSON.stringify(draft) !== baseline.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [draft]);
  function change(value: Partial<Door>) {
    setError("");
    setDraft((previous) => ({ ...previous, ...value }));
  }
  function kind(value: DoorKind) {
    change({
      kind: value,
      ...(value === "giftcard" && !draft.giftCard
        ? { giftCard: emptyGift() }
        : {}),
      ...(value === "quiz" && !draft.questions?.length
        ? { questions: [blankQuestion()] }
        : {}),
    });
  }
  function close() {
    if (JSON.stringify(draft) !== baseline.current) setDiscard(true);
    else onClose();
  }
  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const image = await compressImage(file);
      if (alive.current) change({ image });
    } catch (err) {
      if (alive.current)
        setError(
          err instanceof Error ? err.message : "Bildet kunne ikke åpnes.",
        );
    } finally {
      if (alive.current) setUploading(false);
    }
  }
  function gift(patch: Partial<GiftCard>) {
    change({ giftCard: { ...(draft.giftCard ?? emptyGift()), ...patch } });
  }
  function save() {
    if (draft.videoUrl?.trim() && !youtubeId(draft.videoUrl.trim())) {
      setError("Bruk en gyldig HTTPS-lenke til en YouTube-video.");
      return;
    }
    if (draft.link?.url.trim() && !safeLink(draft.link.url)) {
      setError("Lenken må begynne med https:// og være en gyldig nettadresse.");
      return;
    }
    if (draft.giftCard?.url.trim() && !safeLink(draft.giftCard.url)) {
      setError(
        "Innløsningslenken på gavekortet må være en gyldig HTTPS-adresse.",
      );
      return;
    }
    const cleaned = { ...draft };
    if (!cleaned.image) delete cleaned.image;
    if (cleaned.link && !cleaned.link.url.trim()) delete cleaned.link;
    if (cleaned.videoUrl) cleaned.videoUrl = cleaned.videoUrl.trim();
    if (!cleaned.questions?.length) delete cleaned.questions;
    onSave(cleaned);
  }
  return (
    <Dialog
      title={`Luke ${door.day} · ${door.day}. desember`}
      onClose={close}
      wide
    >
      <div className="door-editor">
        <div className="kind-picker" aria-label="Velg innholdstype">
          {(Object.keys(kindInfo) as DoorKind[]).map((value) => (
            <button
              type="button"
              key={value}
              className={draft.kind === value ? "selected" : ""}
              aria-pressed={draft.kind === value}
              onClick={() => kind(value)}
            >
              <Icon
                name={
                  value === "activity" || value === "giftcard" ? "gift" : value
                }
                size={21}
              />
              <span>{kindInfo[value].name}</span>
            </button>
          ))}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <label>
            Overskrift
            <input
              autoFocus
              maxLength={120}
              placeholder={
                draft.kind === "giftcard"
                  ? "For eksempel: Middagen er på meg"
                  : "Hva ligger bak luka?"
              }
              value={draft.title}
              onChange={(event) => change({ title: event.target.value })}
            />
          </label>
          {draft.giftCard && (
            <section className="gift-card-editor">
              <div className="gift-editor-heading">
                <Icon name="gift" size={22} />
                <h3>Gavekort</h3>
                {draft.kind !== "giftcard" && (
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Fjern gavekort"
                    onClick={() => change({ giftCard: undefined })}
                  >
                    <Icon name="close" size={16} />
                  </button>
                )}
              </div>
              <p className="field-help">
                Legg inn et gavekort du allerede har. Direkte kjøp i Luke kommer
                senere.
              </p>
              <div className="form-row">
                <label>
                  Butikk eller tjeneste
                  <input
                    maxLength={100}
                    placeholder="For eksempel Foodora"
                    value={draft.giftCard.merchant}
                    onChange={(event) => gift({ merchant: event.target.value })}
                  />
                </label>
                <label>
                  Beløp i kroner
                  <input
                    type="number"
                    min="0"
                    max="1000000"
                    step="0.01"
                    inputMode="decimal"
                    value={draft.giftCard.amount}
                    onChange={(event) =>
                      gift({
                        amount:
                          event.target.value === ""
                            ? 0
                            : Number(event.target.value),
                      })
                    }
                  />
                </label>
              </div>
              <label>
                Gavekortkode
                <span className="optional">Kode eller lenke må fylles ut</span>
                <input
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={500}
                  placeholder="Koden på gavekortet"
                  value={draft.giftCard.code}
                  onChange={(event) => gift({ code: event.target.value })}
                />
              </label>
              <label>
                Innløsningslenke
                <input
                  type="url"
                  maxLength={2000}
                  placeholder="https://…"
                  value={draft.giftCard.url}
                  onChange={(event) => gift({ url: event.target.value })}
                />
              </label>
              <label>
                Gyldig til<span className="optional">Valgfritt</span>
                <input
                  type="date"
                  value={draft.giftCard.expiresOn}
                  onChange={(event) => gift({ expiresOn: event.target.value })}
                />
              </label>
            </section>
          )}
          {(draft.kind === "image" || draft.image !== undefined) && (
            <div className="image-upload">
              {draft.image ? (
                <>
                  <img
                    src={draft.image}
                    alt={draft.imageAlt || "Valgt bilde"}
                  />
                  <div>
                    <label className="button secondary small-button">
                      Bytt bilde
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploading}
                        onChange={(event) => {
                          void upload(event.target.files?.[0]);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="button text small-button"
                      onClick={() => change({ image: undefined, imageAlt: "" })}
                    >
                      Fjern bilde
                    </button>
                  </div>
                  <label>
                    Bildebeskrivelse
                    <span className="optional">For skjermlesere</span>
                    <input
                      maxLength={300}
                      value={draft.imageAlt ?? ""}
                      onChange={(event) =>
                        change({ imageAlt: event.target.value })
                      }
                    />
                  </label>
                </>
              ) : (
                <label className="upload-drop">
                  <Icon name="image" size={28} />
                  <strong>
                    {uploading ? "Behandler bildet …" : "Velg bilde"}
                  </strong>
                  <span>JPG, PNG eller WebP · maks 20 MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploading}
                    onChange={(event) => {
                      void upload(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
          )}
          {(draft.kind === "video" || draft.videoUrl !== undefined) && (
            <label>
              YouTube-lenke
              <input
                type="url"
                maxLength={500}
                placeholder="https://www.youtube.com/watch?v=…"
                value={draft.videoUrl ?? ""}
                onChange={(event) => change({ videoUrl: event.target.value })}
              />
            </label>
          )}
          <label>
            Tekst<span className="optional">Valgfritt</span>
            <textarea
              rows={4}
              maxLength={6000}
              placeholder="En hilsen, en forklaring eller en liten overraskelse …"
              value={draft.body}
              onChange={(event) => change({ body: event.target.value })}
            />
          </label>
          <div className="attachment-buttons">
            {draft.kind !== "image" && draft.image === undefined && (
              <button
                className="button secondary small-button"
                type="button"
                onClick={() => change({ image: "" })}
              >
                <Icon name="image" size={15} />
                Bilde
              </button>
            )}
            {draft.kind !== "video" && draft.videoUrl === undefined && (
              <button
                className="button secondary small-button"
                type="button"
                onClick={() => change({ videoUrl: "" })}
              >
                <Icon name="video" size={15} />
                Video
              </button>
            )}
            {!draft.link && (
              <button
                className="button secondary small-button"
                type="button"
                onClick={() =>
                  change({ link: { label: "Åpne lenken", url: "" } })
                }
              >
                <Icon name="external" size={15} />
                Lenke
              </button>
            )}
            {!draft.questions?.length && (
              <button
                className="button secondary small-button"
                type="button"
                onClick={() => change({ questions: [blankQuestion()] })}
              >
                <Icon name="quiz" size={15} />
                Legg til quiz
              </button>
            )}
          </div>
          {draft.link && (
            <section className="link-editor">
              <label>
                Tekst på knappen
                <input
                  maxLength={100}
                  value={draft.link.label}
                  onChange={(event) =>
                    change({
                      link: { ...draft.link!, label: event.target.value },
                    })
                  }
                />
              </label>
              <label>
                Nettadresse
                <input
                  type="url"
                  maxLength={2000}
                  placeholder="https://…"
                  value={draft.link.url}
                  onChange={(event) =>
                    change({
                      link: { ...draft.link!, url: event.target.value },
                    })
                  }
                />
              </label>
              <button
                type="button"
                className="text-link"
                onClick={() => change({ link: undefined })}
              >
                Fjern lenke
              </button>
            </section>
          )}
          {Boolean(draft.questions?.length) && (
            <DoorQuestionsEditor
              value={draft.questions!}
              onChange={(questions) => change({ questions })}
            />
          )}
          <details className="effect-disclosure">
            <summary>
              <Icon name="sparkles" size={17} />
              Effekt når luka åpnes
              <span>
                {draft.effect === "snow"
                  ? "Snø"
                  : draft.effect === "sparkles"
                    ? "Stjerner"
                    : draft.effect === "confetti"
                      ? "Konfetti"
                      : "Ingen"}
              </span>
            </summary>
            <label>
              Velg effekt
              <select
                value={draft.effect ?? "none"}
                onChange={(event) =>
                  change({ effect: event.target.value as Door["effect"] })
                }
              >
                <option value="none">Ingen</option>
                <option value="sparkles">Stjerner</option>
                <option value="snow">Snøfall</option>
                <option value="confetti">Konfetti</option>
              </select>
            </label>
          </details>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div className="dialog-actions sticky-actions">
            <button type="button" className="button secondary" onClick={close}>
              Avbryt
            </button>
            <span className="pill">
              {isDoorComplete(draft) ? "Klar" : "Under arbeid"}
            </span>
            <button
              type="submit"
              className="button primary"
              disabled={uploading}
            >
              Lagre luke
              <Icon name="check" size={17} />
            </button>
          </div>
        </form>
        {discard && (
          <div className="discard-notice" role="alert">
            <strong>Du har endringer som ikke er lagret.</strong>
            <div>
              <button
                className="button secondary small-button"
                onClick={() => setDiscard(false)}
              >
                Fortsett å redigere
              </button>
              <button className="button danger small-button" onClick={onClose}>
                Forkast endringer
              </button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
