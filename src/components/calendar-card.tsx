"use client";
import Link from "next/link";
import { useState } from "react";
import { completedCount, type AdventCalendar } from "@/lib/model";
import { useStore } from "./provider";
import { Artwork } from "./artwork";
import { Icon } from "./icons";
import { Dialog } from "./dialog";
import { isReceived, ownerCopy } from "@/lib/calendar-library";
export function CalendarCard({ calendar }: { calendar: AdventCalendar }) {
  const { add, remove, toast } = useStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const count = completedCount(calendar);
  const received = isReceived(calendar);
  const destination = `/calendar/${calendar.id}${received ? "/preview" : ""}`;
  return (
    <article className="calendar-card">
      <Link
        href={destination}
        className={`calendar-cover theme-${calendar.theme}`}
        aria-label={`Åpne ${calendar.title}`}
      >
        <Artwork theme={calendar.theme} scene={calendar.scene} />
        <span className="cover-stamp">DESEMBER {calendar.year}</span>
        <span className="cover-title">{calendar.title}</span>

        <span className="card-state">
          {received
            ? "Delt med meg"
            : calendar.demo
              ? "Eksempel"
              : count === 24
                ? "Alle luker fylt"
                : "Underveis"}
        </span>
      </Link>
      <div className="calendar-card-body">
        <div className="card-title-row">
          <h3>
            <Link href={destination}>{calendar.title}</Link>
          </h3>
          <details className="card-menu">
            <summary aria-label={`Flere valg for ${calendar.title}`}>
              <Icon name="more" size={20} />
            </summary>
            <div>
              <button
                onClick={(event) => {
                  const copy = ownerCopy(calendar);
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
          {received
            ? `Fra ${calendar.sender || "en venn"}`
            : calendar.recipient || ""}
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
            {received
              ? "Åpne kalenderen"
              : calendar.demo
                ? "Eksempel"
                : count === 24
                  ? "Klar"
                  : "Under arbeid"}
          </span>
          <Link
            href={destination}
            className="card-edit"
            aria-label={`${received ? "Åpne" : "Rediger"} ${calendar.title}`}
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
