"use client";
import { useState } from "react";
import { useStore } from "./provider";
import { CalendarCard } from "./calendar-card";
import { startNew } from "./new-calendar";
import { Artwork } from "./artwork";
import { Icon } from "./icons";
import { completedCount, daysUntilAdvent } from "@/lib/model";
import {
  isReceived,
  libraryCalendars,
  type LibraryFilter,
} from "@/lib/calendar-library";
export function CalendarLibrary() {
  const { data } = useStore();
  const [filter, setFilter] = useState<LibraryFilter>("all"),
    [search, setSearch] = useState(""),
    [sort, setSort] = useState("newest");
  const own = data.calendars.filter((calendar) => !isReceived(calendar));
  const received = data.calendars.filter(isReceived);
  const calendars = libraryCalendars(data.calendars, filter, search).sort(
    (a, b) =>
      sort === "name"
        ? a.title.localeCompare(b.title, "nb")
        : b.updatedAt.localeCompare(a.updatedAt),
  );
  const tabs: { value: LibraryFilter; label: string; count: number }[] = [
    { value: "all", label: "Alle", count: data.calendars.length },
    { value: "owner", label: "Laget av meg", count: own.length },
    { value: "received", label: "Delt med meg", count: received.length },
  ];
  return (
    <div className="library-page page-enter">
      <div className="page-heading">
        <h1>Mine kalendere</h1>
      </div>
      <section className="hero library-hero" aria-label="Opprett kalender">
        <div className="hero-copy">
          <h2>
            Små luker.
            <br />
            Stor glede.
          </h2>
          <p>
            Lag en personlig kalender med hilsener, gavekort og overraskelser.
          </p>
          <button className="button primary" onClick={() => startNew()}>
            <Icon name="plus" size={18} />
            Opprett kalender
          </button>
        </div>
        <div className="hero-scene">
          <Artwork
            scene={{
              house: "classic",
              sky: "stars",
              snowman: true,
              reindeer: false,
              trees: true,
              lights: true,
              snowfall: false,
            }}
          />
        </div>
      </section>
      <div className="dashboard-stats library-stats">
        <div>
          <span className="stat-icon">
            <Icon name="calendar" size={19} />
          </span>
          <p>
            <strong>{own.length}</strong>
            <span>laget av meg</span>
          </p>
        </div>
        <div>
          <span className="stat-icon peach">
            <Icon name="gift" size={19} />
          </span>
          <p>
            <strong>
              {own.reduce((count, c) => count + completedCount(c), 0)}
            </strong>
            <span>luker klare</span>
          </p>
        </div>
        <div>
          <span className="stat-icon sand">
            <Icon name="star" size={19} />
          </span>
          <p>
            <strong>{daysUntilAdvent(new Date().getFullYear())}</strong>
            <span>dager til 1. desember</span>
          </p>
        </div>
      </div>
      <div className="library-controls">
        <div className="filter-tabs library-filters" aria-label="Vis kalendere">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              className={filter === tab.value ? "active" : ""}
              aria-pressed={filter === tab.value}
              onClick={() => setFilter(tab.value)}
            >
              {tab.label}
              <span>{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="collection-toolbar">
          <div className="search-field">
            <Icon name="search" size={17} />
            <input
              aria-label="Søk i kalendere"
              placeholder="Søk i kalendere"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button
                className="icon-button"
                aria-label="Tøm søk"
                onClick={() => setSearch("")}
              >
                <Icon name="close" size={15} />
              </button>
            )}
          </div>
          <select
            aria-label="Sorter kalendere"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="newest">Sist endret</option>
            <option value="name">Navn A–Å</option>
          </select>
        </div>
      </div>
      <div className="calendar-grid">
        {calendars.map((calendar) => (
          <CalendarCard key={calendar.id} calendar={calendar} />
        ))}
      </div>
      {!calendars.length && (
        <div className="empty-state library-empty">
          <Icon
            name={
              filter === "received" ? "share" : search ? "search" : "calendar"
            }
            size={29}
          />
          <h2>
            {search
              ? "Ingen treff"
              : filter === "received"
                ? "Ingen delte kalendere ennå"
                : "Her kommer kalenderne dine"}
          </h2>
          <p>
            {search
              ? "Prøv et annet søk."
              : filter === "received"
                ? "Kalendere du lagrer fra en delingslenke, vises her."
                : "Opprett en kalender for å begynne."}
          </p>
        </div>
      )}
    </div>
  );
}
