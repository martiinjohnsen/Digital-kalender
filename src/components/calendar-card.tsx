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
  const { add, remove, toast, progress, cloud } = useStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const received = isReceived(calendar);
  const count =
    received && calendar.remote
      ? (progress[calendar.id]?.opened.length ?? 0)
      : completedCount(calendar);
  const destination = `/calendar/${calendar.id}${received ? "/preview" : ""}`;
  return (
    <article className="calendar-card">
      <div className="calendar-card-visual">
        <Link
          href={destination}
          className={`calendar-cover theme-${calendar.theme}`}
          aria-label={`Åpne ${calendar.title}`}
        >
          <Artwork theme={calendar.theme} scene={calendar.scene} fit="cover" />
          <span className="cover-stamp">DESEMBER {calendar.year}</span>

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
        <details
          className="card-menu"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.currentTarget.removeAttribute("open");
              event.currentTarget.querySelector("summary")?.focus();
            }
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              event.currentTarget.removeAttribute("open");
          }}
        >
          <summary aria-label={`Flere valg for ${calendar.title}`}>
            <Icon name="more" size={20} />
          </summary>
          <div>
            {(!received || !calendar.remote) && (
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
                Dupliser kalender
              </button>
            )}
            <button
              className="danger-text"
              onClick={(event) => {
                const menu = event.currentTarget.closest("details");
                menu?.removeAttribute("open");
                menu?.querySelector("summary")?.focus();
                setConfirmDelete(true);
              }}
            >
              <Icon name="trash" size={16} />
              {received ? "Fjern fra mine kalendere" : "Slett kalender"}
            </button>
          </div>
        </details>
      </div>
      <div className="calendar-card-body">
        <div className="card-title-row">
          <h3>
            <Link href={destination}>{calendar.title}</Link>
          </h3>
        </div>
        <p className="card-recipient">
          <Icon name="heart" size={13} />
          {received
            ? `Fra ${calendar.sender || "en venn"}`
            : calendar.recipient || ""}
        </p>
        <div className="progress-label">
          <span>
            <strong>{count}</strong> av 24 luker{" "}
            {received && calendar.remote ? "åpnet" : "fylt"}
          </span>
          <span>{Math.round((count / 24) * 100)} %</span>
        </div>
        <progress
          max={24}
          value={count}
          aria-label={`${count} av 24 luker ${received && calendar.remote ? "åpnet" : "fylt"}`}
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
            className="button secondary card-edit"
            aria-label={`${received ? "Åpne" : "Rediger"} ${calendar.title}`}
          >
            <Icon name="arrow" size={22} />
          </Link>
        </div>
      </div>
      {confirmDelete && (
        <Dialog
          title={received ? "Fjerne kalenderen?" : "Slette kalenderen?"}
          onClose={() => setConfirmDelete(false)}
        >
          <div className="dialog-content">
            <p>
              {received
                ? `«${calendar.title}» blir fjernet fra listen din. Avsenderen beholder kalenderen.`
                : cloud
                  ? `«${calendar.title}» blir slettet fra kontoen din. Mottakerne mister også tilgangen. Last ned en sikkerhetskopi hvis du vil beholde innholdet.`
                  : `«${calendar.title}» blir fjernet fra denne enheten. Last gjerne ned en sikkerhetskopi først.`}
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
                  if (!remove(calendar.id)) return;
                  setConfirmDelete(false);
                  toast(received ? "Kalenderen er fjernet fra dine kalendere." : "Kalenderen er slettet.");
                }}
              >
                {received ? "Fjern kalender" : "Slett kalender"}
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </article>
  );
}
