"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "./provider";
import { Icon } from "./icons";
import { Artwork } from "./artwork";
import { DoorEditor } from "./door-editor";
import { Dialog } from "./dialog";
import { ShareDialog } from "./share-dialog";
import { QuizBuilder } from "./calendar-quiz";
import {
  completedCount,
  hasDoorContent,
  isDoorComplete,
  THEMES,
  themeInfo,
  kindInfo,
  type AdventCalendar,
  type Door,
} from "@/lib/model";
import { templateDoors, templates, type TemplateId } from "@/lib/templates";
export function CalendarEditor({ id }: { id: string }) {
  const store = useStore();
  const router = useRouter();
  const calendar = store.data.calendars.find((c) => c.id === id);
  const [tab, setTab] = useState("doors");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<number | null>(null);
  const [share, setShare] = useState(false);
  const [fill, setFill] = useState(false);
  const [template, setTemplate] = useState<TemplateId>("family");
  if (!calendar)
    return (
      <div className="empty-state">
        <Icon name="calendar" size={36} />
        <h1>Vi finner ikke denne kalenderen</h1>
        <p>
          Kalenderne lagres på enheten der de ble laget. Bruk en prøvelenke for
          å se en kalender fra noen andre.
        </p>
        <Link className="button primary" href="/calendars">
          Til mine kalendere
        </Link>
      </div>
    );
  const count = completedCount(calendar);
  const blank = calendar.doors.filter((d) => !hasDoorContent(d)).length;
  const doors = calendar.doors.filter(
    (door) =>
      filter === "all" ||
      (filter === "filled" && isDoorComplete(door)) ||
      (filter === "empty" && !isDoorComplete(door)),
  );
  const saveDoor = (door: Door) => {
    if (
      !store.update(id, {
        doors: calendar.doors.map((d) => (d.day === door.day ? door : d)),
      })
    )
      return;
    setEditing(null);
    store.toast(`Luke ${door.day} er oppdatert.`);
  };
  return (
    <div className="page-enter editor-page">
      <Link href="/calendars" className="back-link">
        <Icon name="back" size={15} />
        Mine kalendere
      </Link>
      <div className="page-heading editor-heading">
        <div>
          <p className="eyebrow">KALENDERVERKSTEDET · {calendar.year}</p>
          <h1>{calendar.title}</h1>
          <p>
            {calendar.recipient
              ? `Til ${calendar.recipient}`
              : "Til noen du vil gjøre desember litt finere for."}
            {calendar.sender && (
              <span className="muted"> · Fra {calendar.sender}</span>
            )}
          </p>
        </div>
        <div className="heading-actions">
          <Link className="button secondary" href={`/calendar/${id}/preview`}>
            <Icon name="eye" size={17} />
            Forhåndsvis
          </Link>
          <button className="button primary" onClick={() => setShare(true)}>
            <Icon name="share" size={17} />
            Del kalender
          </button>
        </div>
      </div>
      {calendar.demo && (
        <div className="example-notice">
          <Icon name="sparkles" size={18} />
          <span>
            Dette er en eksempelkalender. Prøv deg frem, eller lag din egen
            kopi.
          </span>
          <button
            className="text-link"
            onClick={() => {
              const copy = {
                ...structuredClone(calendar),
                id: crypto.randomUUID(),
                demo: false,
                title: `${calendar.title.slice(0, 90)} (min)`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              if (!store.add(copy)) return;
              router.push(`/calendar/${copy.id}`);
              store.toast("Nå har du din egen kopi.");
            }}
          >
            Lag en kopi <Icon name="arrow" size={15} />
          </button>
        </div>
      )}
      <div className="editor-tabs" role="tablist" aria-label="Kalenderinnhold">
        {[
          ["doors", "Luker", "gift"],
          ["appearance", "Uttrykk", "sparkles"],
          ["quiz", "Julequiz", "quiz"],
          ["settings", "Om kalenderen", "settings"],
        ].map(([value, label, icon]) => (
          <button
            key={value}
            role="tab"
            id={`tab-${value}`}
            aria-controls={`panel-${value}`}
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={tab === value ? "active" : ""}
          >
            <Icon name={icon as "gift"} size={17} />
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "doors" && (
          <div className="editor-layout">
            <section className="doors-workspace">
              <div className="section-heading">
                <div>
                  <h2>24 små muligheter.</h2>
                  <p>Trykk på en luke og legg inn noe fint.</p>
                </div>
                <span className="progress-pill">
                  <Icon name="check" size={14} />
                  {count} / 24
                </span>
              </div>
              <div className="filter-tabs compact-tabs">
                {[
                  ["all", "Alle luker"],
                  ["filled", "Fylt"],
                  ["empty", "Ikke ferdige"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    aria-pressed={filter === value}
                    className={filter === value ? "active" : ""}
                    onClick={() => setFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className={`door-grid theme-${calendar.theme}`}>
                {doors.map((door) => {
                  const complete = isDoorComplete(door);
                  const partial = hasDoorContent(door);
                  return (
                    <button
                      key={door.day}
                      className={`editor-door ${complete ? "filled" : partial ? "partial" : ""}`}
                      onClick={() => setEditing(door.day)}
                      aria-label={`Luke ${door.day}, ${complete ? "fylt" : partial ? "under arbeid" : "tom"}${door.title ? `: ${door.title}` : ""}`}
                    >
                      <span className="door-top">
                        DESEMBER {complete && <Icon name="check" size={13} />}
                      </span>
                      <strong>{door.day}</strong>
                      <span className="door-type">
                        <Icon
                          name={
                            partial
                              ? door.kind === "activity"
                                ? "gift"
                                : door.kind
                              : "plus"
                          }
                          size={15}
                        />
                        <span>
                          {partial ? kindInfo[door.kind].name : "Legg til"}
                        </span>
                      </span>
                      {door.day === 24 && (
                        <span className="door-star" aria-hidden="true">
                          ✧
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {doors.length === 0 && (
                <div className="empty-state compact-empty">
                  <Icon name="gift" size={28} />
                  <h3>
                    {filter === "empty"
                      ? "Alle lukene er fylt!"
                      : "De første små gledene venter"}
                  </h3>
                  <p>
                    {filter === "empty"
                      ? "Ta en forhåndsvisning og se hvordan kalenderen blir."
                      : "Velg Alle luker for å legge inn den første hilsenen."}
                  </p>
                </div>
              )}
              <div className="editor-bottom-note">
                <Icon name="leaf" size={16} />
                Du trenger ikke fylle alt på én gang. Ta én luke om gangen.
              </div>
            </section>
            <aside className="editor-summary">
              <div className="summary-preview">
                <Artwork theme={calendar.theme} />
                <span>{calendar.title}</span>
              </div>
              <div className="summary-content">
                <p className="eyebrow">LITT ETTER LITT</p>
                <h3>
                  {count === 24
                    ? "Se hva du har laget."
                    : count === 0
                      ? "Det begynner med én luke."
                      : "Noe fint er på vei."}
                </h3>
                <p>
                  {count === 24
                    ? "Alle 24 lukene har innhold. Ta en runde i forhåndsvisningen og sjekk at alt føles riktig."
                    : `${24 - count} luker venter på en hilsen, et minne eller noe helt annet.`}
                </p>
                <progress max={24} value={count} aria-label="Fremdrift" />
                <span className="summary-progress">
                  {count} av 24 luker er fylt
                </span>
                {count < 24 ? (
                  <button
                    className="button primary full"
                    onClick={() =>
                      setEditing(
                        calendar.doors.find((d) => !isDoorComplete(d))!.day,
                      )
                    }
                  >
                    Fortsett med neste luke <Icon name="arrow" size={16} />
                  </button>
                ) : (
                  <Link
                    className="button primary full"
                    href={`/calendar/${id}/preview`}
                  >
                    Se kalenderen <Icon name="eye" size={16} />
                  </Link>
                )}
              </div>
              <div className="summary-tip">
                <Icon name="sparkles" size={20} />
                <h4>Trenger du en liten start?</h4>
                <p>
                  Fyll de helt tomme lukene med ideer fra en mal. Dine egne
                  tekster blir beholdt.
                </p>
                <button
                  className="text-link"
                  onClick={() => setFill(true)}
                  disabled={blank === 0}
                >
                  Fyll tomme luker <Icon name="arrow" size={15} />
                </button>
              </div>
            </aside>
          </div>
        )}
        {tab === "appearance" && (
          <div className="appearance-panel">
            <div className="section-heading">
              <div>
                <h2>Finn den rette stemningen.</h2>
                <p>Velg uttrykket som passer til kalenderen din.</p>
              </div>
            </div>
            <div className="appearance-grid">
              {THEMES.map((theme) => (
                <button
                  key={theme}
                  className={
                    theme === calendar.theme
                      ? "appearance-card selected"
                      : "appearance-card"
                  }
                  aria-pressed={theme === calendar.theme}
                  onClick={() => {
                    if (!store.update(id, { theme })) return;
                    store.toast(`${themeInfo[theme].name} er valgt.`);
                  }}
                >
                  <Artwork theme={theme} />
                  <div>
                    <span>
                      <strong>{themeInfo[theme].name}</strong>
                      <small>{themeInfo[theme].description}</small>
                    </span>
                    <span className="theme-radio">
                      {calendar.theme === theme && (
                        <Icon name="check" size={17} />
                      )}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <div className="info-box inline">
              <Icon name="leaf" />
              <span>
                Fargene følger med til mottakervisningen. Alt innholdet ditt
                blir beholdt når du bytter.
              </span>
            </div>
          </div>
        )}
        {tab === "quiz" && (
          <QuizBuilder key={calendar.id} calendar={calendar} />
        )}{" "}
        {tab === "settings" && (
          <CalendarDetails key={calendar.id} calendar={calendar} />
        )}
      </div>
      {editing !== null && (
        <DoorEditor
          key={editing}
          door={calendar.doors.find((d) => d.day === editing)!}
          hasCalendarQuiz={Boolean(calendar.quiz)}
          onSave={saveDoor}
          onClose={() => setEditing(null)}
        />
      )}{" "}
      {share && (
        <ShareDialog calendar={calendar} onClose={() => setShare(false)} />
      )}{" "}
      {fill && (
        <Dialog title="Et lite forsprang" onClose={() => setFill(false)}>
          <div className="dialog-content">
            <p className="dialog-intro">
              Vi legger et forslag i {blank} helt tomme luker. Alt du allerede
              har skrevet eller lastet opp, blir beholdt.
            </p>
            <div className="template-choice">
              {templates.map((t) => (
                <button
                  key={t.id}
                  className={template === t.id ? "selected" : ""}
                  aria-pressed={template === t.id}
                  onClick={() => setTemplate(t.id)}
                >
                  <span
                    className="soft-icon"
                    style={{ color: themeInfo[t.theme].color }}
                  >
                    <Icon name={t.icon} />
                  </span>
                  <span>
                    <strong>{t.title}</strong>
                    <small>{t.label}</small>
                  </span>
                  {template === t.id && <Icon name="check" size={18} />}
                </button>
              ))}
            </div>
            <div className="dialog-actions">
              <button
                className="button secondary"
                onClick={() => setFill(false)}
              >
                Avbryt
              </button>
              <button
                className="button primary"
                disabled={!blank}
                onClick={() => {
                  const suggestions = templateDoors(template);
                  if (
                    !store.update(id, {
                      doors: calendar.doors.map((d) =>
                        hasDoorContent(d) ? d : suggestions[d.day - 1],
                      ),
                    })
                  )
                    return;
                  setFill(false);
                  store.toast(`${blank} luker har fått et lite utgangspunkt.`);
                }}
              >
                Fyll {blank} luker <Icon name="sparkles" size={17} />
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
function CalendarDetails({ calendar }: { calendar: AdventCalendar }) {
  const { update, toast } = useStore();
  const [draft, setDraft] = useState({
    title: calendar.title,
    description: calendar.description,
    recipient: calendar.recipient,
    sender: calendar.sender,
    year: calendar.year,
  });
  return (
    <form
      className="details-panel"
      onSubmit={(event) => {
        event.preventDefault();
        if (!draft.title.trim()) return;
        if (!update(calendar.id, { ...draft, title: draft.title.trim() }))
          return;
        toast("Kalenderopplysningene er oppdatert.");
      }}
    >
      <h2>En kalender med ditt preg.</h2>
      <p className="muted">Disse opplysningene vises også til mottakeren.</p>
      <label>
        Navn på kalenderen
        <input
          required
          maxLength={100}
          value={draft.title}
          onChange={(event) =>
            setDraft({ ...draft, title: event.target.value })
          }
        />
      </label>
      <label>
        En liten introduksjon
        <textarea
          maxLength={1000}
          rows={3}
          value={draft.description}
          onChange={(event) =>
            setDraft({ ...draft, description: event.target.value })
          }
        />
      </label>
      <div className="form-row">
        <label>
          Til
          <input
            maxLength={100}
            value={draft.recipient}
            onChange={(event) =>
              setDraft({ ...draft, recipient: event.target.value })
            }
          />
        </label>
        <label>
          Fra
          <input
            maxLength={100}
            value={draft.sender}
            onChange={(event) =>
              setDraft({ ...draft, sender: event.target.value })
            }
          />
        </label>
      </div>
      <label>
        Hvilken jul?
        <select
          value={draft.year}
          onChange={(event) =>
            setDraft({ ...draft, year: Number(event.target.value) })
          }
        >
          {Array.from(
            new Set([
              calendar.year,
              ...Array.from(
                { length: 6 },
                (_, i) => new Date().getFullYear() + i,
              ),
            ]),
          )
            .sort()
            .map((y) => (
              <option key={y}>{y}</option>
            ))}
        </select>
      </label>
      <div className="info-box inline">
        <Icon name="lock" />
        <span>
          I mottakervisningen åpner én luke hver dag fra 1. til 24. desember,
          etter norsk tid. Prøvelenker er en demonstrasjon og gir ikke sikker
          tilgangskontroll.
        </span>
      </div>
      <button
        type="submit"
        className="button primary"
        disabled={!draft.title.trim()}
      >
        Lagre endringer <Icon name="check" size={18} />
      </button>
    </form>
  );
}
