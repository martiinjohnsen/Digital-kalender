"use client";
import Link from "next/link";
import { useState } from "react";
import { completedCount, type AdventCalendar } from "@/lib/model";
import { useStore } from "./provider";
import { Artwork } from "./artwork";
import { Icon } from "./icons";
import { Dialog } from "./dialog";
export function CalendarCard({ calendar }: { calendar: AdventCalendar }) {
  const { add, remove, toast } = useStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const count = completedCount(calendar);
  return (
    <article className="calendar-card">
      <Link
        href={`/calendar/${calendar.id}`}
        className={`calendar-cover theme-${calendar.theme}`}
        aria-label={`Åpne ${calendar.title}`}
      >
        <Artwork theme={calendar.theme} />
        <span className="cover-stamp">DESEMBER {calendar.year}</span>
        <span className="cover-title">{calendar.title}</span>
        <span className="cover-caption">24 små øyeblikk</span>
        <span className="card-state">
          {calendar.demo
            ? "Eksempel"
            : count === 24
              ? "Alle luker fylt"
              : "Underveis"}
        </span>
      </Link>
      <div className="calendar-card-body">
        <div className="card-title-row">
          <h3>
            <Link href={`/calendar/${calendar.id}`}>{calendar.title}</Link>
          </h3>
          <details className="card-menu">
            <summary aria-label={`Flere valg for ${calendar.title}`}>
              <Icon name="more" size={20} />
            </summary>
            <div>
              <button
                onClick={(event) => {
                  const copy = {
                    ...structuredClone(calendar),
                    id: crypto.randomUUID(),
                    title: `${calendar.title.slice(0, 90)} (kopi)`,
                    demo: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };
                  if (!add(copy)) return;
                  event.currentTarget
                    .closest("details")
                    ?.removeAttribute("open");
                  toast("En kopi av kalenderen er lagt til.");
                }}
              >
                <Icon name="copy" size={16} />
                Lag en kopi
              </button>
              <button
                className="danger-text"
                onClick={() => setConfirmDelete(true)}
              >
                <Icon name="trash" size={16} />
                Slett kalender
              </button>
            </div>
          </details>
        </div>
        <p className="card-recipient">
          <Icon name="heart" size={13} />
          {calendar.recipient || "En liten glede til noen"}
        </p>
        <div className="progress-label">
          <span>
            <strong>{count}</strong> av 24 luker fylt
          </span>
          <span>{Math.round((count / 24) * 100)} %</span>
        </div>
        <progress
          max={24}
          value={count}
          aria-label={`${count} av 24 luker fylt`}
        />
        <div className="card-bottom">
          <span>
            <span className={count === 24 ? "tiny-dot complete" : "tiny-dot"} />
            {calendar.demo
              ? "Utforsk og prøv selv"
              : count === 24
                ? "Klar for en gjennomgang"
                : "En god start"}
          </span>
          <Link
            href={`/calendar/${calendar.id}`}
            className="card-edit"
            aria-label={`Rediger ${calendar.title}`}
          >
            <Icon name="arrow" size={18} />
          </Link>
        </div>
      </div>
      {confirmDelete && (
        <Dialog
          title="Slette kalenderen?"
          onClose={() => setConfirmDelete(false)}
        >
          <div className="dialog-content">
            <p>
              «{calendar.title}» og alle lukene blir fjernet fra denne enheten.
              Last gjerne ned en sikkerhetskopi først.
            </p>
            <div className="dialog-actions">
              <button
                className="button secondary"
                onClick={() => setConfirmDelete(false)}
              >
                Behold kalenderen
              </button>
              <button
                className="button danger"
                onClick={() => {
                  remove(calendar.id);
                  setConfirmDelete(false);
                  toast("Kalenderen er slettet.");
                }}
              >
                Slett kalender
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </article>
  );
}
export function NewCalendarCard({ onClick }: { onClick: () => void }) {
  return (
    <button className="new-calendar-card" onClick={onClick}>
      <span className="new-plus">
        <Icon name="plus" size={26} />
      </span>
      <h3>Hvem vil du glede?</h3>
      <p>
        En liten kalender kan bety
        <br />
        mer enn du tror.
      </p>
      <span className="new-card-link">
        Lag en ny kalender <Icon name="arrow" size={16} />
      </span>
      <span className="card-sprig" aria-hidden="true">
        ✳
      </span>
    </button>
  );
}
