"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  availableDay,
  isDoorComplete,
  youtubeId,
  safeLink,
  kindInfo,
  type AdventCalendar,
  type CalendarQuiz,
  type Door,
} from "@/lib/model";
import { Artwork } from "./artwork";
import { BrandMark, Icon } from "./icons";
import { useStore } from "./provider";
import { Dialog } from "./dialog";
import { QuizPlayer } from "./calendar-quiz";
import {
  DoorTransition,
  Celebration,
  type DoorOrigin,
} from "./door-transition";
export function RecipientView({
  calendar,
  owner = false,
}: {
  calendar: AdventCalendar;
  owner?: boolean;
}) {
  const { data, toast } = useStore();
  const [testMode, setTestMode] = useState(owner);
  const [day, setDay] = useState<number | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [opened, setOpened] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [transitionDay, setTransitionDay] = useState<number | null>(null);
  const [origin, setOrigin] = useState<DoorOrigin | undefined>();
  const finishOpening = useCallback(() => {
    setDay(transitionDay);
    setTransitionDay(null);
  }, [transitionDay]);
  const key = `luke:opened:${calendar.id}:${calendar.year}:${calendar.updatedAt}`;
  useEffect(() => {
    try {
      const previous: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
      setOpened(
        Array.isArray(previous)
          ? previous.filter(
              (d: unknown): d is number =>
                Number.isInteger(d) && Number(d) >= 1 && Number(d) <= 24,
            )
          : [],
      );
    } catch {
      setOpened([]);
    }
    setLoaded(true);
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, [key]);
  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem(key, JSON.stringify(opened));
      } catch {
        /* Opening doors still works when small preference storage is unavailable. */
      }
    }
  }, [opened, loaded, key]);
  const limit = testMode ? 24 : availableDay(calendar.year, now);
  function open(door: Door, element?: HTMLElement) {
    if (transitionDay !== null) return;
    if (door.day > limit) {
      toast(
        `Luke ${door.day} åpner ${door.day}. desember ${calendar.year}. Litt mer å glede seg til!`,
      );
      return;
    }
    if (
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      day === null
    ) {
      const rect = element?.getBoundingClientRect();
      setOrigin(
        rect
          ? {
              x: rect.x + rect.width / 2,
              y: rect.y + rect.height / 2,
              width: rect.width,
            }
          : undefined,
      );
      setTransitionDay(door.day);
    } else setDay(door.day);
    if (isDoorComplete(door))
      setOpened((previous) =>
        previous.includes(door.day) ? previous : [...previous, door.day],
      );
  }
  return (
    <div
      className={`recipient-view theme-${calendar.theme} ${data.preferences.snow ? "with-snow" : ""}`}
    >
      <header className="recipient-topbar">
        <Link
          href={owner ? `/calendar/${calendar.id}` : "/"}
          className="recipient-brand"
        >
          <BrandMark />
          <span>luke.</span>
        </Link>
        {owner ? (
          <>
            <span className="preview-label">FORHÅNDSVISNING</span>
            <Link
              className="button recipient-back"
              href={`/calendar/${calendar.id}`}
            >
              <Icon name="back" size={16} />
              <span>Til verkstedet</span>
            </Link>
          </>
        ) : (
          <span className="recipient-made">En liten kalender med omtanke.</span>
        )}
      </header>
      {owner && (
        <div className="preview-controls">
          <span>
            <Icon name="eye" size={16} />
            Slik ser kalenderen ut for mottakeren.
          </span>
          <label className="switch-label">
            <input
              type="checkbox"
              checked={testMode}
              onChange={(event) => setTestMode(event.target.checked)}
            />
            <span className="switch" />
            Åpne alle luker
          </label>
        </div>
      )}
      <div className="recipient-content">
        <div className="recipient-title">
          <span className="recipient-kicker">
            EN LITEN GLEDE, HVER DAG · {calendar.year}
          </span>
          <h1>{calendar.title}</h1>
          <p>{calendar.description}</p>
          {calendar.recipient && (
            <span className="recipient-to">
              Til {calendar.recipient} <Icon name="heart" size={13} />
            </span>
          )}
        </div>
        <div className="recipient-illustration">
          <Artwork theme={calendar.theme} />
        </div>
        {calendar.quiz && (
          <button
            className="recipient-quiz-card"
            onClick={() => setQuizOpen(true)}
          >
            <span className="quiz-card-icon">
              <Icon name="quiz" size={25} />
            </span>
            <span>
              <small>LITT JULEMORO</small>
              <strong>{calendar.quiz.title}</strong>
              <span>
                {calendar.quiz.questions.length} spørsmål · Spill i ditt eget
                tempo
              </span>
            </span>
            <span className="quiz-card-play">
              <Icon name="arrow" size={19} />
            </span>
          </button>
        )}
        <div className="recipient-grid-intro">
          <span>
            {testMode
              ? "Alle lukene er åpne i prøvemodus"
              : limit === 0
                ? "Vi åpner den første luka 1. desember"
                : limit === 24
                  ? "24 små øyeblikk. God jul!"
                  : `I dag kan du åpne luke ${limit}`}
          </span>
          <span>{opened.length} av 24 åpnet</span>
        </div>
        <div className="recipient-door-grid">
          {calendar.doors
            .slice()
            .sort((a, b) => a.day - b.day)
            .map((door) => (
              <button
                key={door.day}
                aria-label={`${door.day}. desember${door.day > limit ? ", låst" : opened.includes(door.day) ? ", allerede åpnet" : ", åpne luke"}`}
                aria-disabled={door.day > limit}
                className={`recipient-door ${opened.includes(door.day) ? "opened" : ""} ${door.day > limit ? "locked" : ""} ${door.day === 24 ? "christmas-door" : ""}`}
                onClick={(event) => open(door, event.currentTarget)}
              >
                <span className="door-snow" aria-hidden="true">
                  {door.day % 4 === 0 ? "✧" : door.day % 3 === 0 ? "✳" : ""}
                </span>
                <strong>{door.day}</strong>
                <span>
                  {opened.includes(door.day) ? (
                    <Icon name="check" size={15} />
                  ) : door.day > limit ? (
                    <Icon name="lock" size={13} />
                  ) : (
                    <Icon name="gift" size={15} />
                  )}
                </span>
              </button>
            ))}
        </div>
        <div className="recipient-signature">
          <Icon name="heart" size={22} />
          <p>
            {calendar.sender
              ? `Med omtanke, fra ${calendar.sender}`
              : "Laget med omtanke, bare for deg."}
          </p>
          <small>Det fineste ligger i det lille.</small>
        </div>
        {!owner && (
          <div className="shared-note">
            Dette er en prøvedeling av en kalender. Innholdet er en kopi fra da
            lenken ble laget.
          </div>
        )}
      </div>
      <footer className="recipient-footer">
        <Link href="/">
          Lag din egen lille adventsglede <Icon name="arrow" size={14} />
        </Link>
        <span>luke.</span>
      </footer>
      {transitionDay !== null && (
        <DoorTransition
          day={transitionDay}
          theme={calendar.theme}
          origin={origin}
          onComplete={finishOpening}
        />
      )}{" "}
      {quizOpen && calendar.quiz && (
        <QuizPlayer quiz={calendar.quiz} onClose={() => setQuizOpen(false)} />
      )}{" "}
      {day !== null && (
        <DoorViewer
          key={day}
          door={calendar.doors.find((d) => d.day === day)!}
          sender={calendar.sender}
          calendarQuiz={calendar.quiz}
          onClose={() => setDay(null)}
          onPrevious={
            day > 1
              ? () => open(calendar.doors.find((d) => d.day === day - 1)!)
              : undefined
          }
          onNext={
            day < Math.min(24, limit)
              ? () => open(calendar.doors.find((d) => d.day === day + 1)!)
              : undefined
          }
        />
      )}
    </div>
  );
}
function DoorViewer({
  door,
  sender,
  calendarQuiz,
  onClose,
  onPrevious,
  onNext,
}: {
  door: Door;
  sender: string;
  calendarQuiz?: CalendarQuiz;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  const [answer, setAnswer] = useState<number | null>(null);
  const [play, setPlay] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const complete = isDoorComplete(door);
  const id = youtubeId(door.videoUrl ?? "");
  return (
    <Dialog title={`${door.day}. desember`} onClose={onClose}>
      <div className="door-reveal">
        <Celebration effect={door.effect} />
        <div className="reveal-decoration" aria-hidden="true">
          <span>✧</span>
          <Icon
            name={door.kind === "activity" ? "gift" : door.kind}
            size={32}
          />
          <span>✧</span>
        </div>
        <p className="eyebrow">
          {kindInfo[door.kind].name} · LUKE {door.day}
        </p>
        <h2>{door.title || "En liten glede er på vei"}</h2>
        {!complete && (
          <p className="empty-door-message">
            Denne luka er ikke helt ferdig ennå. Her kommer det noe fint.
          </p>
        )}
        {door.image && (
          <img
            className="reveal-image"
            src={door.image}
            alt={door.imageAlt || door.title || "Et bilde i kalenderen"}
          />
        )}
        <p className="reveal-body">{door.body}</p>
        {id &&
          (play ? (
            <div className="video-frame">
              <iframe
                title={door.title}
                src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ) : (
            <button className="video-consent" onClick={() => setPlay(true)}>
              <Icon name="video" size={37} />
              <strong>Spill av videoen</strong>
              <small>Videoen lastes fra YouTube når du trykker.</small>
            </button>
          ))}
        {door.kind === "quiz" && door.quiz && (
          <div className="recipient-quiz">
            {door.quiz.options.map((option, index) => (
              <button
                key={index}
                disabled={answer !== null}
                className={`quiz-answer ${answer !== null && index === door.quiz!.answerIndex ? "correct" : answer === index ? "incorrect" : ""}`}
                onClick={() => setAnswer(index)}
              >
                <span>{String.fromCharCode(65 + index)}</span>
                {option || `Alternativ ${index + 1}`}
                {answer !== null && index === door.quiz!.answerIndex && (
                  <Icon name="check" size={18} />
                )}
              </button>
            ))}
            {answer !== null && (
              <div className="quiz-feedback" role="status">
                <strong>
                  {answer === door.quiz.answerIndex
                    ? "Helt riktig!"
                    : "Nesten! Det riktige svaret er markert."}
                </strong>
                {door.quiz.explanation && <p>{door.quiz.explanation}</p>}
              </div>
            )}
          </div>
        )}
        {door.link && safeLink(door.link.url) && (
          <a
            className="button secondary reveal-link"
            href={safeLink(door.link.url)!}
            target="_blank"
            rel="noopener noreferrer"
          >
            {door.link.label || "Åpne lenken"}
            <Icon name="external" size={16} />
          </a>
        )}
        {door.showCalendarQuiz && calendarQuiz && (
          <button
            className="button secondary full reveal-link"
            onClick={() => setQuizOpen(true)}
          >
            <Icon name="quiz" size={19} />
            {calendarQuiz.title}
            <Icon name="arrow" size={17} />
          </button>
        )}
        {quizOpen && calendarQuiz && (
          <QuizPlayer quiz={calendarQuiz} onClose={() => setQuizOpen(false)} />
        )}
        {sender && (
          <p className="reveal-sender">
            Fra {sender} <Icon name="heart" size={12} />
          </p>
        )}
        <div className="reveal-navigation">
          <button
            className="icon-button"
            aria-label="Forrige luke"
            disabled={!onPrevious}
            onClick={onPrevious}
          >
            <Icon name="back" />
          </button>
          <button className="button secondary" onClick={onClose}>
            Tilbake til kalenderen
          </button>
          <button
            className="icon-button"
            aria-label="Neste luke"
            disabled={!onNext}
            onClick={onNext}
          >
            <Icon name="arrow" />
          </button>
        </div>
      </div>
    </Dialog>
  );
}
