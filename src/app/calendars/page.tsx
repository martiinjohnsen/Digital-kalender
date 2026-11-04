"use client";
import { useState } from "react";
import { useStore } from "@/components/provider";
import { CalendarCard, NewCalendarCard } from "@/components/calendar-card";
import { startNew } from "@/components/new-calendar";
import { Icon } from "@/components/icons";
import { completedCount } from "@/lib/model";
export default function CalendarsPage() {
  const { data } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const calendars = data.calendars
    .filter(
      (c) =>
        `${c.title} ${c.recipient}`
          .toLocaleLowerCase("nb")
          .includes(search.toLocaleLowerCase("nb")) &&
        (filter === "all" ||
          (filter === "own" && !c.demo) ||
          (filter === "draft" && completedCount(c) < 24) ||
          (filter === "ready" && completedCount(c) === 24)),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.title.localeCompare(b.title, "nb")
        : sort === "progress"
          ? completedCount(b) - completedCount(a)
          : b.updatedAt.localeCompare(a.updatedAt),
    );
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <p className="eyebrow">DITT LILLE VERKSTED</p>
          <h1>Mine kalendere</h1>
          <p>Alle de små gledene du holder på med, samlet på ett sted.</p>
        </div>
        <button className="button primary" onClick={() => startNew()}>
          <Icon name="plus" size={18} />
          Ny kalender
        </button>
      </div>
      <div className="collection-toolbar">
        <div className="search-field">
          <Icon name="search" size={18} />
          <input
            aria-label="Søk i kalendere"
            placeholder="Finn en kalender …"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <button
              className="icon-button"
              aria-label="Tøm søk"
              onClick={() => setSearch("")}
            >
              <Icon name="close" size={16} />
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
          <option value="progress">Flest luker fylt</option>
        </select>
      </div>
      <div className="filter-tabs" aria-label="Filtrer kalendere">
        {[
          ["all", "Alle"],
          ["own", "Mine egne"],
          ["draft", "Underveis"],
          ["ready", "Alle luker fylt"],
        ].map(([value, label]) => (
          <button
            key={value}
            aria-pressed={filter === value}
            className={filter === value ? "active" : ""}
            onClick={() => setFilter(value)}
          >
            {label}
            {value === "all" && <span>{data.calendars.length}</span>}
          </button>
        ))}
      </div>
      <div className="calendar-grid">
        {calendars.map((calendar) => (
          <CalendarCard key={calendar.id} calendar={calendar} />
        ))}
        {!search && filter === "all" && (
          <NewCalendarCard onClick={() => startNew()} />
        )}
      </div>
      {!calendars.length && (
        <div className="empty-state">
          <span className="large-icon">
            <Icon name={search ? "search" : "calendar"} size={32} />
          </span>
          <h2>
            {search
              ? "Ingen kalendere med det navnet"
              : "Her er det plass til noe fint"}
          </h2>
          <p>
            {search
              ? "Prøv et annet søk, eller se alle kalenderne dine."
              : "Lag en ny kalender, eller velg et annet filter."}
          </p>
          <button
            className="button secondary"
            onClick={() => {
              setSearch("");
              setFilter("all");
            }}
          >
            Vis alle kalendere
          </button>
        </div>
      )}
    </div>
  );
}
