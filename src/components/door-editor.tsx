"use client";
import { useEffect, useRef, useState } from "react";
import {
  kindInfo,
  youtubeId,
  safeLink,
  isDoorComplete,
  type Door,
  type DoorKind,
} from "@/lib/model";
import { compressImage } from "@/lib/storage";
import { Icon } from "./icons";
import { Dialog } from "./dialog";
export function DoorEditor({
  door,
  onSave,
  onClose,
  hasCalendarQuiz = false,
}: {
  door: Door;
  hasCalendarQuiz?: boolean;
  onSave: (door: Door) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Door>(() => structuredClone(door));
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [discard, setDiscard] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (JSON.stringify(draft) !== JSON.stringify(door))
        event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [draft, door]);
  function change(value: Partial<Door>) {
    setError("");
    setDraft((previous) => ({ ...previous, ...value }));
  }
  function close() {
    if (JSON.stringify(draft) !== JSON.stringify(door)) setDiscard(true);
    else onClose();
  }
  function kind(value: DoorKind) {
    change({
      kind: value,
      ...(value === "quiz" && !draft.quiz
        ? { quiz: { options: ["", "", ""], answerIndex: 0, explanation: "" } }
        : {}),
    });
  }
  function save() {
    if (draft.videoUrl?.trim() && !youtubeId(draft.videoUrl.trim())) {
      setError("Lim inn en gyldig HTTPS-lenke til en YouTube-video.");
      return;
    }
    if (draft.link?.url && !safeLink(draft.link.url)) {
      setError(
        "Lenken må være en gyldig HTTPS-adresse, for eksempel https://eksempel.no.",
      );
      return;
    }
    const cleaned = { ...draft };
    if (!cleaned.image) delete cleaned.image;
    if (cleaned.link && !cleaned.link.url.trim()) delete cleaned.link;
    if (cleaned.videoUrl) cleaned.videoUrl = cleaned.videoUrl.trim();
    onSave(cleaned);
  }
  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const image = await compressImage(file);
      if (alive.current) change({ image });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bildet kunne ikke åpnes.");
    } finally {
      setUploading(false);
    }
  }
  return (
    <Dialog title={`${door.day}. desember`} onClose={close} wide>
      <div className="door-editor">
        <div className="door-editor-heading">
          <span className="date-tile">
            {door.day}
            <small>DES</small>
          </span>
          <div>
            <h3>En liten glede bak luke {door.day}</h3>
            <p>Hva vil du dele denne dagen?</p>
          </div>
          <span className={isDoorComplete(draft) ? "pill complete" : "pill"}>
            {isDoorComplete(draft) ? "Klar" : "Underveis"}
          </span>
        </div>
        <div className="kind-picker" aria-label="Velg innholdstype">
          {(Object.keys(kindInfo) as DoorKind[]).map((value) => (
            <button
              key={value}
              type="button"
              className={draft.kind === value ? "selected" : ""}
              aria-pressed={draft.kind === value}
              onClick={() => kind(value)}
            >
              <Icon name={value === "activity" ? "gift" : value} size={22} />
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
            {draft.kind === "quiz"
              ? "Hva vil du spørre om?"
              : "En liten overskrift"}
            <input
              autoFocus
              maxLength={120}
              placeholder={
                draft.kind === "quiz"
                  ? "Hva er vår beste juletradisjon?"
                  : "Noen ord som varmer …"
              }
              value={draft.title}
              onChange={(event) => change({ title: event.target.value })}
            />
          </label>
          {(draft.kind === "image" || draft.image !== undefined) && (
            <div className="image-upload">
              {draft.image ? (
                <>
                  <img
                    src={draft.image}
                    alt={draft.imageAlt || "Ditt valgte bilde"}
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
                      className="button text danger-text small-button"
                      type="button"
                      onClick={() => change({ image: undefined, imageAlt: "" })}
                    >
                      Fjern bilde
                    </button>
                  </div>
                </>
              ) : (
                <label className="upload-drop">
                  <Icon name="image" size={28} />
                  <strong>
                    {uploading
                      ? "Gjør bildet klart …"
                      : "Velg et bilde som betyr noe"}
                  </strong>
                  <span>JPG, PNG eller WebP · Maks 20 MB</span>
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
              {draft.image && (
                <label>
                  Beskriv bildet{" "}
                  <span className="optional">For skjermlesere</span>
                  <input
                    maxLength={300}
                    placeholder="For eksempel: Oss på hyttetur i sommer"
                    value={draft.imageAlt ?? ""}
                    onChange={(event) =>
                      change({ imageAlt: event.target.value })
                    }
                  />
                </label>
              )}
            </div>
          )}
          {(draft.kind === "video" || draft.videoUrl !== undefined) && (
            <>
              <label>
                Lenke til en YouTube-video
                <input
                  type="url"
                  maxLength={500}
                  placeholder="https://www.youtube.com/watch?v=…"
                  value={draft.videoUrl ?? ""}
                  onChange={(event) => change({ videoUrl: event.target.value })}
                />
              </label>
              <p className="field-help">
                Bruk en vanlig YouTube-lenke eller youtu.be-lenke. Videoen
                lastes først når mottakeren trykker på den.
              </p>
              {youtubeId(draft.videoUrl ?? "") && (
                <div className="video-valid">
                  <Icon name="check" size={17} />
                  Videolenken ser riktig ut.
                </div>
              )}
            </>
          )}
          <label>
            {draft.kind === "quiz"
              ? "En liten introduksjon"
              : draft.kind === "activity"
                ? "Hva skal dere gjøre?"
                : draft.kind === "image"
                  ? "Historien bak bildet"
                  : "Hilsenen din"}
            <span className="optional">
              {draft.kind === "quiz" ||
              draft.kind === "image" ||
              draft.kind === "video"
                ? "Valgfritt"
                : ""}
            </span>
            <textarea
              rows={draft.kind === "quiz" ? 2 : 5}
              maxLength={6000}
              placeholder={
                draft.kind === "activity"
                  ? "Beskriv den lille opplevelsen du vil gi bort …"
                  : "Skriv som du ville sagt det. Det enkle er ofte det fineste."
              }
              value={draft.body}
              onChange={(event) => change({ body: event.target.value })}
            />
          </label>
          <div className="character-count">{draft.body.length} / 6000</div>
          {draft.kind === "quiz" && draft.quiz && (
            <div className="quiz-editor">
              <h4>Svaralternativer</h4>
              <p className="field-help">
                Merk det riktige svaret med sirkelen til venstre.
              </p>
              {draft.quiz.options.map((option, i) => (
                <div className="quiz-option-edit" key={i}>
                  <input
                    type="radio"
                    name="correct-answer"
                    aria-label={`Alternativ ${i + 1} er riktig`}
                    checked={draft.quiz!.answerIndex === i}
                    onChange={() =>
                      change({ quiz: { ...draft.quiz!, answerIndex: i } })
                    }
                  />
                  <input
                    maxLength={180}
                    aria-label={`Svaralternativ ${i + 1}`}
                    placeholder={`Alternativ ${i + 1}`}
                    value={option}
                    onChange={(event) =>
                      change({
                        quiz: {
                          ...draft.quiz!,
                          options: draft.quiz!.options.map((text, index) =>
                            index === i ? event.target.value : text,
                          ),
                        },
                      })
                    }
                  />
                  {draft.quiz!.options.length > 2 && (
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Fjern alternativ ${i + 1}`}
                      onClick={() => {
                        const q = draft.quiz!;
                        change({
                          quiz: {
                            ...q,
                            options: q.options.filter(
                              (_, index) => index !== i,
                            ),
                            answerIndex:
                              q.answerIndex === i
                                ? 0
                                : q.answerIndex > i
                                  ? q.answerIndex - 1
                                  : q.answerIndex,
                          },
                        });
                      }}
                    >
                      <Icon name="close" size={15} />
                    </button>
                  )}
                </div>
              ))}
              {draft.quiz.options.length < 4 && (
                <button
                  type="button"
                  className="text-link add-option"
                  onClick={() =>
                    change({
                      quiz: {
                        ...draft.quiz!,
                        options: [...draft.quiz!.options, ""],
                      },
                    })
                  }
                >
                  <Icon name="plus" size={15} />
                  Legg til et alternativ
                </button>
              )}
              <label>
                Forklaring etter svaret{" "}
                <span className="optional">Valgfritt</span>
                <textarea
                  rows={2}
                  maxLength={1000}
                  placeholder="Hvorfor var dette riktig?"
                  value={draft.quiz.explanation}
                  onChange={(event) =>
                    change({
                      quiz: { ...draft.quiz!, explanation: event.target.value },
                    })
                  }
                />
              </label>
            </div>
          )}
          <div className="door-extras">
            <h4>Det lille ekstra</h4>
            {hasCalendarQuiz && (
              <label className="quiz-attach">
                <input
                  type="checkbox"
                  checked={draft.showCalendarQuiz ?? false}
                  onChange={(event) =>
                    change({ showCalendarQuiz: event.target.checked })
                  }
                />
                <span>
                  <strong>Legg kalenderens julequiz i denne luka</strong>
                  <small>Mottakeren kan starte den samme quizen herfra.</small>
                </span>
              </label>
            )}
            <div className="attachment-buttons">
              {draft.kind !== "image" && draft.image === undefined && (
                <button
                  className="button secondary small-button"
                  type="button"
                  onClick={() => change({ image: "" })}
                >
                  <Icon name="image" size={16} />
                  Legg til bilde
                </button>
              )}
              {draft.kind !== "video" && draft.videoUrl === undefined && (
                <button
                  className="button secondary small-button"
                  type="button"
                  onClick={() => change({ videoUrl: "" })}
                >
                  <Icon name="video" size={16} />
                  Legg til video
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
                  <Icon name="external" size={16} />
                  Legg til lenke
                </button>
              )}
            </div>
            {draft.link && (
              <div className="link-editor">
                <label>
                  Tekst på lenkeknappen
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
                  className="text-link danger-text"
                  onClick={() => change({ link: undefined })}
                >
                  Fjern lenke
                </button>
                <p className="field-help">
                  Lenker åpnes i en ny fane. Bruk HTTPS.
                </p>
              </div>
            )}
            <label>
              En liten effekt når luka åpnes
              <select
                value={draft.effect ?? "none"}
                onChange={(event) =>
                  change({ effect: event.target.value as Door["effect"] })
                }
              >
                <option value="none">Rolig og enkelt</option>
                <option value="sparkles">Små glitrende stjerner</option>
                <option value="snow">Et lite snødryss</option>
                <option value="confetti">Litt festlig konfetti</option>
              </select>
            </label>
            <p className="field-help">
              Effektene følger enhetens innstilling for redusert bevegelse.
            </p>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions sticky-actions">
            <button className="button secondary" type="button" onClick={close}>
              Avbryt
            </button>
            <span className="save-hint">Du kan fylle på mer senere.</span>
            <button
              className="button primary"
              type="submit"
              disabled={uploading}
            >
              Lagre luke <Icon name="check" size={18} />
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
                Fortsett å skrive
              </button>
              <button
                className="button danger small-button"
                onClick={() => {
                  alive.current = false;
                  onClose();
                }}
              >
                Forkast endringer
              </button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
