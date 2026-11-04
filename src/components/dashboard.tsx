"use client";
import Link from "next/link";
import { useStore } from "./provider";
import { Artwork } from "./artwork";
import { Icon } from "./icons";
import { CalendarCard, NewCalendarCard } from "./calendar-card";
import { startNew } from "./new-calendar";
import { completedCount, daysUntilAdvent } from "@/lib/model";
import { ideas } from "@/lib/templates";
export function Dashboard() {
  const { data } = useStore();
  const own = data.calendars.filter((c) => !c.demo);
  const filled = own.reduce(
    (sum, calendar) => sum + completedCount(calendar),
    0,
  );
  const days = daysUntilAdvent(new Date().getFullYear());
  return (
    <div className="dashboard page-enter">
      <div className="page-heading">
        <div>
          <p className="eyebrow">LITT Å GLEDE SEG TIL</p>
          <h1>
            {data.preferences.name
              ? `Hei, ${data.preferences.name}.`
              : "Gjør ventetiden litt finere."}
          </h1>
          <p>Her begynner de små øyeblikkene som betyr noe.</p>
        </div>
        <div className="season-label">
          <Icon name="leaf" size={18} />
          <span>Advent {new Date().getFullYear()}</span>
        </div>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-pill">
            <span />
            EN LITEN GLEDE, HVER DAG
          </span>
          <h2>
            Små luker.
            <br />
            Stor glede<span>.</span>
          </h2>
          <p>
            En hilsen. Et minne. En liten overraskelse.
            <br className="desktop-break" /> Lag en adventskalender til noen du
            er glad i.
          </p>
          <button className="button primary" onClick={() => startNew()}>
            Lag en julekalender <Icon name="arrow" size={18} />
          </button>
          <span className="hero-footnote">
            <Icon name="heart" size={13} />
            Personlig er finere enn perfekt.
          </span>
        </div>
        <div className="hero-scene">
          <Artwork />
          <span className="scene-note">
            <span className="note-star">✧</span>
            <span>
              24 dager.
              <br />
              <strong>Litt nærmere.</strong>
            </span>
          </span>
          <span className="scene-scribble">det fineste ligger i det lille</span>
        </div>
      </section>
      <div className="dashboard-stats">
        <div>
          <span className="stat-icon">
            <Icon name="calendar" size={19} />
          </span>
          <p>
            <strong>{own.length.toString().padStart(2, "0")}</strong>
            <span>
              {own.length === 1 ? "din egen kalender" : "egne kalendere"}
            </span>
          </p>
        </div>
        <div>
          <span className="stat-icon peach">
            <Icon name="gift" size={19} />
          </span>
          <p>
            <strong>{filled.toString().padStart(2, "0")}</strong>
            <span>luker med omtanke</span>
          </p>
        </div>
        <div>
          <span className="stat-icon sand">
            <Icon name="sparkles" size={19} />
          </span>
          <p>
            <strong>{days}</strong>
            <span>
              {days === 0 ? "desember er her" : "dager til første luke"}
            </span>
          </p>
        </div>
      </div>
      <section className="section calendars-section">
        <div className="section-heading">
          <div>
            <h2>
              Mine kalendere{" "}
              <span className="count-badge">{data.calendars.length}</span>
            </h2>
            <p>
              {own.length
                ? "Litt etter litt blir noe fint til."
                : "Utforsk et eksempel, eller start med dine egne små gleder."}
            </p>
          </div>
          <Link href="/calendars" className="text-link">
            Se alle <Icon name="arrow" size={16} />
          </Link>
        </div>
        <div className="calendar-grid dashboard-grid">
          {data.calendars.slice(0, 2).map((c) => (
            <CalendarCard key={c.id} calendar={c} />
          ))}
          <NewCalendarCard onClick={() => startNew()} />
        </div>
      </section>
      <section className="section inspiration-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">NÅR DU TRENGER ET LITE DYTT</p>
            <h2>Det trenger ikke være så stort.</h2>
          </div>
          <Link href="/inspiration" className="text-link">
            Mer inspirasjon <Icon name="arrow" size={16} />
          </Link>
        </div>
        <div className="idea-mini-grid">
          {ideas.slice(0, 3).map((idea, index) => (
            <Link
              href={`/inspiration#idea-${index}`}
              className="idea-mini"
              key={idea.title}
            >
              <span className={`idea-icon tone-${index}`}>
                <Icon name={idea.icon} size={23} />
              </span>
              <div>
                <h3>{idea.title}</h3>
                <p>{idea.body}</p>
              </div>
              <Icon name="chevron" size={16} />
            </Link>
          ))}
        </div>
      </section>
      <div className="gentle-note">
        <Icon name="heart" size={16} />
        <p>
          De beste gavene kan være små. Litt tid, noen fine ord eller et minne
          dere deler.
        </p>
        <span aria-hidden="true">✧</span>
      </div>
    </div>
  );
}
