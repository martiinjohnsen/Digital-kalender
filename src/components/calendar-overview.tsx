"use client";
import { useState } from "react";
import type { AdventCalendar } from "@/lib/model";
import {
  calendarCollection,
  type CollectedItem,
  type CollectedKind,
} from "@/lib/calendar-collection";
import type { quizSummary } from "@/lib/quiz-progress";
import { Dialog } from "./dialog";
import { GiftCardView, VideoBlock } from "./door-content";
import { Icon, type IconName } from "./icons";
import { QuizOverview } from "./quiz-overview";

const contentLabels: Record<CollectedKind, { label: string; icon: IconName }> = {
  message: { label: "Hilsener", icon: "message" },
  giftcard: { label: "Gavekort", icon: "gift" },
  image: { label: "Bilder", icon: "image" },
  video: { label: "Video", icon: "video" },
  link: { label: "Lenker", icon: "external" },
  activity: { label: "Opplevelser", icon: "heart" },
};

export function CalendarOverview({
  calendar, opened, available, summary, testMode, cloud, rememberProgress, onClose, onOpenDoor,
}: {
  calendar: AdventCalendar;
  opened: readonly number[];
  available: number;
  summary: ReturnType<typeof quizSummary>;
  testMode: boolean;
  cloud: boolean;
  rememberProgress: boolean;
  onClose: () => void;
  onOpenDoor: (day: number) => void;
}) {
  const [section, setSection] = useState<"content" | "quiz">("content");
  const [filter, setFilter] = useState<"all" | CollectedKind>("all");
  const items = calendarCollection(calendar, opened, available);
  const kinds = Object.keys(contentLabels) as CollectedKind[];
  return (
    <Dialog title="Kalenderoversikt" onClose={onClose} wide>
      <div className="calendar-overview">
        <p className="overview-intro">Her finner du alt du har fått fra de åpnede lukene dine, samlet på ett sted.</p>
        <div className="overview-sections" role="group" aria-label="Velg oversikt">
          <button type="button" aria-pressed={section === "content"} onClick={() => setSection("content")}>
            <Icon name="gift" size={17} />Innhold <span>{items.length}</span>
          </button>
          <button type="button" aria-pressed={section === "quiz"} onClick={() => setSection("quiz")}>
            <Icon name="quiz" size={17} />Quizoversikt
          </button>
        </div>
        {section === "quiz" ? (
          <section aria-label="Quizoversikt">
            {summary.total > 0 ? (
              <QuizOverview summary={summary} testMode={testMode} cloud={cloud} rememberProgress={rememberProgress} />
            ) : (
              <div className="overview-empty"><Icon name="quiz" size={28} /><h3>Ingen quiz i denne kalenderen ennå</h3><p>Hvis avsender legger til spørsmål, finner du framdrift og resultater her.</p></div>
            )}
          </section>
        ) : (
          <section aria-label="Innhold fra åpnede luker">
            {items.length > 0 ? (
              <>
                <div className="collection-filters" role="group" aria-label="Vis innholdstype">
                  <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Alt</button>
                  {kinds.filter((kind) => items.some((item) => item.kind === kind)).map((kind) => (
                    <button key={kind} type="button" aria-pressed={filter === kind} onClick={() => setFilter(kind)}>{contentLabels[kind].label}</button>
                  ))}
                </div>
                <div className="collection-grid">
                  {items.filter((item) => filter === "all" || item.kind === filter).map((item) => (
                    <article className={`collection-item collection-${item.kind}`} key={item.id}>
                      <header>
                        <span><Icon name={contentLabels[item.kind].icon} size={15} />{contentLabels[item.kind].label}</span>
                        <button type="button" onClick={() => onOpenDoor(item.day)} aria-label={`Åpne luka fra ${item.day}. desember`}>{item.day}. desember<Icon name="arrow" size={13} /></button>
                      </header>
                      <CollectedContent item={item} />
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="overview-empty"><Icon name="gift" size={30} /><h3>Overraskelsene dine samles her</h3><p>Når du åpner luker med hilsener, gavekort, bilder eller annet innhold, finner du dem igjen her.</p></div>
            )}
          </section>
        )}
      </div>
    </Dialog>
  );
}

function CollectedContent({ item }: { item: CollectedItem }) {
  switch (item.kind) {
    case "message":
      return <p className="collection-message">{item.body}</p>;
    case "giftcard":
      return <GiftCardView gift={item.gift} />;
    case "video":
      return <VideoBlock url={item.url} title={item.title} />;
    case "image":
      return <img className="collection-image" src={item.src} alt={item.alt} loading="lazy" />;
    case "link":
      return <a className="button secondary collection-link" href={item.url} target="_blank" rel="noopener noreferrer">{item.label}<Icon name="external" size={17} /></a>;
    case "activity":
      return <div className="collection-activity"><h3>{item.title || "En opplevelse"}</h3><p>{item.body}</p></div>;
  }
}
