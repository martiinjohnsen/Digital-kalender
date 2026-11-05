"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  DOOR_BLOCKS,
  blockNames,
  doorBlockOrder,
  removeDoorBlock,
  isDoorComplete,
  questionsForDoor,
  type Door,
  type DoorBlockKind,
  type AdventCalendar,
  type GiftCard,
  type DoorEffect,
} from "@/lib/model";
import { validateDoor } from "@/lib/door-validation";
import { FieldError, validationAttributes } from "./field-validation";
import { compressImage } from "@/lib/storage";
import { Icon, type IconName } from "./icons";
import { Dialog } from "./dialog";
import { DoorQuestionsEditor, blankQuestion } from "./door-questions";
import { ContentStack } from "./content-stack";
import { OpeningEffectPicker } from "./opening-effect-picker";
import { Celebration } from "./door-transition";
const contentBlocks = DOOR_BLOCKS.filter((block) => block !== "effect");
const emptyGift = (): GiftCard => ({
  merchant: "",
  amount: 0,
  currency: "NOK",
  code: "",
  url: "",
  expiresOn: "",
});
function editorDraft(door: Door, calendar: AdventCalendar): Door {
  const draft = structuredClone(door);
  draft.contentOrder = doorBlockOrder(door).filter(
    (block) => block !== "effect",
  );
  draft.questions = questionsForDoor(door, calendar);
  draft.kind = "message";
  delete draft.quiz;
  delete draft.showCalendarQuiz;
  return draft;
}
const blockIcons: Record<DoorBlockKind, IconName> = {
  giftcard: "gift",
  image: "image",
  video: "video",
  quiz: "quiz",
  link: "external",
  activity: "heart",
  effect: "sparkles",
};
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
  const [validationAttempted, setValidationAttempted] = useState(false);
  const issues = validationAttempted ? validateDoor(draft) : {};
  const formRef = useRef<HTMLFormElement>(null);
  const [effectPreview, setEffectPreview] = useState<{
    effect: DoorEffect;
    replay: number;
  } | null>(null);
  const baseline = useRef(JSON.stringify(editorDraft(door, calendar))),
    alive = useRef(true),
    uploadToken = useRef(0),
    stackAnchor = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(""),
    [uploading, setUploading] = useState(false),
    [discard, setDiscard] = useState(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      uploadToken.current++;
    };
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (JSON.stringify(draft) !== baseline.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [draft]);
  const order = doorBlockOrder(draft).filter((block) => block !== "effect");
  function change(patch: Partial<Door>) {
    setError("");
    setDraft((previous) => ({ ...previous, ...patch }));
  }
  function previewEffect(effect: DoorEffect) {
    setEffectPreview((previous) => ({
      effect,
      replay: (previous?.replay ?? 0) + 1,
    }));
  }
  function validate() {
    const next = validateDoor(draft);
    setValidationAttempted(true);
    if (!Object.keys(next).length) return true;
    requestAnimationFrame(() => {
      const field = formRef.current?.querySelector<HTMLElement>('[data-validation-field][aria-invalid="true"]');
      if (!field) return;
      field.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      const control = field.matches("input:not([type=file]),textarea,select,button")
        ? field : field.querySelector<HTMLElement>("input:not([type=file]),textarea,select,button") ?? field;
      if (control === field && !field.matches("input,textarea,select,button")) field.tabIndex = -1;
      control.focus({ preventScroll: true });
    });
    return false;
  }
  function close() {
    if (JSON.stringify(draft) === baseline.current && !uploading) { onClose(); return; }
    setDiscard(true);
    if (validate())
      requestAnimationFrame(() => formRef.current?.closest(".dialog-scroll")?.scrollTo({ top: 0, behavior: "smooth" }));
  }
  function add(block: DoorBlockKind) {
    const patch: Partial<Door> = { contentOrder: [...order, block] };
    if (block === "giftcard") patch.giftCard = emptyGift();
    if (block === "quiz") patch.questions = [blankQuestion()];
    if (block === "image") patch.image = "";
    if (block === "video") patch.videoUrl = "";
    if (block === "link") patch.link = { label: "Åpne lenken", url: "" };
    if (block === "activity") patch.activity = { title: "", body: "" };
    if (block === "effect") patch.effect = "snow";
    change(patch);
    requestAnimationFrame(() =>
      stackAnchor.current
        ?.querySelector(`[data-block="${block}"]`)
        ?.scrollIntoView({
          block: "nearest",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
        }),
    );
  }
  function remove(block: DoorBlockKind) {
    if (block === "image") {
      uploadToken.current++;
      setUploading(false);
    }
    setDraft((previous) => removeDoorBlock(previous, block));
    setError("");
  }
  async function upload(file?: File) {
    if (!file) return;
    const token = ++uploadToken.current;
    setUploading(true);
    setError("");
    try {
      const image = await compressImage(file);
      if (alive.current && uploadToken.current === token)
        setDraft((previous) =>
          doorBlockOrder(previous).includes("image")
            ? { ...previous, image }
            : previous,
        );
    } catch (error) {
      if (alive.current && uploadToken.current === token)
        setError(
          error instanceof Error ? error.message : "Bildet kunne ikke åpnes.",
        );
    } finally {
      if (alive.current && uploadToken.current === token) setUploading(false);
    }
  }
  function gift(patch: Partial<GiftCard>) {
    change({ giftCard: { ...(draft.giftCard ?? emptyGift()), ...patch } });
  }
  function save() {
    if (!validate() || uploading) return;
    onSave({ ...draft, contentOrder: order, videoUrl: draft.videoUrl?.trim() });
  }
  function renderBlock(block: DoorBlockKind): ReactNode {
    switch (block) {
      case "giftcard": {
        const value = draft.giftCard ?? emptyGift();
        return (
          <>
            <p className="field-help block-intro">
              Legg inn et gavekort du allerede har. Direkte kjøp kommer senere.
            </p>
            <div className="form-row">
              <label>
                Butikk eller tjeneste
                <input
                  {...validationAttributes(issues, "gift-merchant")}
                  maxLength={100}
                  placeholder="For eksempel Foodora"
                  value={value.merchant}
                  onChange={(event) => gift({ merchant: event.target.value })}
                />
                <FieldError issues={issues} field="gift-merchant" />
              </label>
              <label>
                Beløp i kroner
                <input
                  {...validationAttributes(issues, "gift-amount")}
                  type="number"
                  min="0"
                  max="1000000"
                  step="0.01"
                  inputMode="decimal"
                  value={value.amount || ""}
                  onChange={(event) =>
                    gift({ amount: Number(event.target.value) })
                  }
                />
                <FieldError issues={issues} field="gift-amount" />
              </label>
            </div>
            <label>
              Gavekortkode
              <input
                {...validationAttributes(issues, "gift-code")}
                maxLength={500}
                autoComplete="off"
                spellCheck={false}
                value={value.code}
                onChange={(event) => gift({ code: event.target.value })}
              />
              <FieldError issues={issues} field="gift-code" />
            </label>
            <label>
              Innløsningslenke
              <span className="optional">Kode eller lenke må fylles ut</span>
              <input
                {...validationAttributes(issues, "gift-url")}
                type="url"
                maxLength={2000}
                placeholder="https://…"
                value={value.url}
                onChange={(event) => gift({ url: event.target.value })}
              />
              <FieldError issues={issues} field="gift-url" />
            </label>
            <label>
              Gyldig til<span className="optional">Valgfritt</span>
              <input
                {...validationAttributes(issues, "gift-expiry")}
                type="date"
                value={value.expiresOn}
                onChange={(event) => gift({ expiresOn: event.target.value })}
              />
              <FieldError issues={issues} field="gift-expiry" />
            </label>
          </>
        );
      }
      case "image":
        return (
          <div className="image-upload" {...validationAttributes({ ...issues, ...(error ? { image: error } : {}) }, "image")}>
            {draft.image ? (
              <>
                <img src={draft.image} alt={draft.imageAlt || "Valgt bilde"} />
                <label className="button secondary small-button">
                  {uploading ? "Behandler bildet …" : "Bytt bilde"}
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
                <label>
                  Kommentar til bildet
                  <span className="optional">Valgfritt · vises under bildet</span>
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
                <Icon name="image" size={26} />
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
            <FieldError issues={{ ...issues, ...(error ? { image: error } : {}) }} field="image" />
          </div>
        );
      case "video":
        return (
          <label>
            YouTube-lenke
            <input
              {...validationAttributes(issues, "video")}
              type="url"
              maxLength={500}
              placeholder="https://www.youtube.com/watch?v=…"
              value={draft.videoUrl ?? ""}
              onChange={(event) => change({ videoUrl: event.target.value })}
            />
            <FieldError issues={issues} field="video" />
          </label>
        );
      case "link":
        return (
          <>
            <label>
              Tekst på knappen
              <input
                maxLength={100}
                value={draft.link?.label ?? ""}
                onChange={(event) =>
                  change({
                    link: {
                      url: draft.link?.url ?? "",
                      label: event.target.value,
                    },
                  })
                }
              />
            </label>
            <label>
              Nettadresse
              <input
                {...validationAttributes(issues, "link-url")}
                type="url"
                maxLength={2000}
                placeholder="https://…"
                value={draft.link?.url ?? ""}
                onChange={(event) =>
                  change({
                    link: {
                      label: draft.link?.label ?? "Åpne lenken",
                      url: event.target.value,
                    },
                  })
                }
              />
              <FieldError issues={issues} field="link-url" />
            </label>
          </>
        );
      case "quiz":
        return (
          <div {...validationAttributes(issues, "quiz")}>
            <FieldError issues={issues} field="quiz" />
            <DoorQuestionsEditor
              issues={issues}
              value={draft.questions ?? []}
              onChange={(questions) => change({ questions })}
            />
          </div>
        );
      case "activity":
        return (
          <>
            <label>
              Navn på opplevelsen
              <input
                {...validationAttributes(issues, "activity-title")}
                maxLength={120}
                placeholder="For eksempel: Kakao og en vintertur"
                value={draft.activity?.title ?? ""}
                onChange={(event) =>
                  change({
                    activity: {
                      title: event.target.value,
                      body: draft.activity?.body ?? "",
                    },
                  })
                }
              />
              <FieldError issues={issues} field="activity-title" />
            </label>
            <label>
              Beskrivelse
              <textarea
                {...validationAttributes(issues, "activity-body")}
                rows={3}
                maxLength={3000}
                placeholder="Hva skal dere gjøre?"
                value={draft.activity?.body ?? ""}
                onChange={(event) =>
                  change({
                    activity: {
                      title: draft.activity?.title ?? "",
                      body: event.target.value,
                    },
                  })
                }
              />
              <FieldError issues={issues} field="activity-body" />
            </label>
          </>
        );
      case "effect":
        return null;
    }
  }
  return (
    <Dialog
      title={`Luke ${door.day} · ${door.day}. desember`}
      onClose={close}
      wide
      overlay={effectPreview && (
        <Celebration key={effectPreview.replay} effect={effectPreview.effect} />
      )}
    >
      <div className="door-editor block-door-editor">
        {discard && (
          <div className="discard-notice" role="alert">
            <strong>{Object.keys(issues).length
              ? "Fullfør de markerte feltene, eller forkast endringene."
              : "Du har endringer som ikke er lagret."}</strong>
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
        <form ref={formRef} noValidate
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <div className="door-fixed-fields">
            <label>
              Tekst<span className="optional">Valgfritt</span>
              <textarea
                {...validationAttributes(issues, "body")}
                autoFocus
                rows={4}
                maxLength={6000}
                placeholder="En hilsen, en forklaring eller en liten overraskelse …"
                value={draft.body}
                onChange={(event) => change({ body: event.target.value })}
              />
              <FieldError issues={issues} field="body" />
            </label>
          </div>
          <div ref={stackAnchor}>
            <ContentStack
              order={order}
              onOrderChange={(contentOrder) => change({ contentOrder })}
              onRemove={remove}
              renderBlock={renderBlock}
            />
          </div>
          <div className="add-content-menu">
            <h3>Legg til</h3>
            <div>
              {contentBlocks
                .filter((block) => !order.includes(block))
                .map((block) => (
                  <button
                    key={block}
                    type="button"
                    className="button secondary small-button"
                    onClick={() => add(block)}
                  >
                    <Icon name={blockIcons[block]} size={16} />
                    {blockNames[block]}
                  </button>
                ))}
            </div>
            {order.length === contentBlocks.length && (
              <p className="field-help">Alle innholdstypene er lagt til.</p>
            )}
          </div>
          <OpeningEffectPicker
            value={draft.effect ?? "none"}
            onChange={(effect) => {
              change({ effect });
              previewEffect(effect);
            }}
            onPreview={() => previewEffect(draft.effect ?? "none")}
          />
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
      </div>
    </Dialog>
  );
}
