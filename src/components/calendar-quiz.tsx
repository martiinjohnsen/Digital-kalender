"use client";
import { useState } from "react";
import {
  type AdventCalendar,
  type CalendarQuiz,
  type QuizQuestion,
  isCalendarQuiz,
} from "@/lib/model";
import { questions as sampleQuestions } from "@/lib/templates";
import { useStore } from "./provider";
import { Dialog } from "./dialog";
import { Icon } from "./icons";
function blankQuestion(): QuizQuestion {
  return { title: "", options: ["", "", ""], answerIndex: 0, explanation: "" };
}
export function QuizBuilder({ calendar }: { calendar: AdventCalendar }) {
  const { update, toast } = useStore();
  const [draft, setDraft] = useState<CalendarQuiz>(() =>
    structuredClone(
      calendar.quiz ?? {
        title: "En liten julequiz",
        description: "Hvor mye kan du om julen? Prøv deg på noen små spørsmål.",
        questions: [blankQuestion()],
      },
    ),
  );
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [remove, setRemove] = useState(false);
  function change(index: number, values: Partial<QuizQuestion>) {
    setError("");
    setDraft((previous) => ({
      ...previous,
      questions: previous.questions.map((q, i) =>
        i === index ? { ...q, ...values } : q,
      ),
    }));
  }
  function move(index: number, direction: number) {
    const next = [...draft.questions];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    setDraft({ ...draft, questions: next });
  }
  function save() {
    if (!isCalendarQuiz(draft)) {
      setError(
        "Gi quizen en tittel. Hvert spørsmål trenger en overskrift, minst to utfylte svaralternativer og ett riktig svar.",
      );
      return;
    }
    if (!update(calendar.id, { quiz: structuredClone(draft) })) return;
    toast("Julequizen er lagret på kalenderen.");
    setError("");
  }
  return (
    <section className="quiz-builder">
      <div className="quiz-builder-intro">
        <span className="large-icon">
          <Icon name="quiz" size={30} />
        </span>
        <div>
          <p className="eyebrow">LITT JULEMORO</p>
          <h2>En quiz dere kan dele.</h2>
          <p>
            Lag en egen julequiz til kalenderen. Den vises ved siden av lukene,
            og kan spilles når som helst.
          </p>
        </div>
      </div>
      <div className="quiz-builder-toolbar">
        <button
          className="button secondary"
          type="button"
          onClick={() => {
            const existing = draft.questions.filter(
              (q) => q.title.trim() || q.options.some((o) => o.trim()),
            );
            setDraft({
              ...draft,
              questions: [
                ...existing,
                ...structuredClone(sampleQuestions),
              ].slice(0, 30),
            });
            setError("");
            toast("Fire julespørsmål er lagt til. Gjør dem gjerne til dine.");
          }}
        >
          <Icon name="sparkles" size={17} />
          Legg til ferdige julespørsmål
        </button>
        <span className="pill">
          {draft.questions.length} av maks 30 spørsmål
        </span>
      </div>
      <label>
        Navn på quizen
        <input
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
          rows={2}
          maxLength={1000}
          value={draft.description}
          onChange={(event) =>
            setDraft({ ...draft, description: event.target.value })
          }
        />
      </label>
      <div className="quiz-question-list">
        {draft.questions.map((question, index) => (
          <section className="question-card" key={index}>
            <div className="question-card-heading">
              <span className="question-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>Spørsmål {index + 1}</h3>
              <div>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Flytt spørsmål ${index + 1} opp`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <Icon
                    name="back"
                    size={15}
                    style={{ transform: "rotate(90deg)" }}
                  />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Flytt spørsmål ${index + 1} ned`}
                  disabled={index === draft.questions.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <Icon
                    name="back"
                    size={15}
                    style={{ transform: "rotate(-90deg)" }}
                  />
                </button>
                <button
                  type="button"
                  className="icon-button danger-text"
                  aria-label={`Slett spørsmål ${index + 1}`}
                  disabled={draft.questions.length === 1}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      questions: draft.questions.filter((_, i) => i !== index),
                    })
                  }
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </div>
            <label>
              Hva vil du spørre om?
              <input
                maxLength={200}
                placeholder="For eksempel: Hvilken julefilm ser vi hvert år?"
                value={question.title}
                onChange={(event) =>
                  change(index, { title: event.target.value })
                }
              />
            </label>
            <p className="field-help">
              Velg det riktige svaret med sirkelen til venstre.
            </p>
            {question.options.map((option, optionIndex) => (
              <div className="quiz-option-edit" key={optionIndex}>
                <input
                  type="radio"
                  name={`question-${index}`}
                  aria-label={`Spørsmål ${index + 1}: Alternativ ${optionIndex + 1} er riktig`}
                  checked={question.answerIndex === optionIndex}
                  onChange={() => change(index, { answerIndex: optionIndex })}
                />
                <input
                  maxLength={180}
                  aria-label={`Spørsmål ${index + 1}, svaralternativ ${optionIndex + 1}`}
                  placeholder={`Svaralternativ ${optionIndex + 1}`}
                  value={option}
                  onChange={(event) =>
                    change(index, {
                      options: question.options.map((value, i) =>
                        i === optionIndex ? event.target.value : value,
                      ),
                    })
                  }
                />
                {question.options.length > 2 && (
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Fjern svaralternativ ${optionIndex + 1}`}
                    onClick={() =>
                      change(index, {
                        options: question.options.filter(
                          (_, i) => i !== optionIndex,
                        ),
                        answerIndex:
                          question.answerIndex === optionIndex
                            ? 0
                            : question.answerIndex > optionIndex
                              ? question.answerIndex - 1
                              : question.answerIndex,
                      })
                    }
                  >
                    <Icon name="close" size={14} />
                  </button>
                )}
              </div>
            ))}
            {question.options.length < 4 && (
              <button
                type="button"
                className="text-link add-option"
                onClick={() =>
                  change(index, { options: [...question.options, ""] })
                }
              >
                <Icon name="plus" size={14} />
                Et svaralternativ til
              </button>
            )}
            <label>
              Forklaring etter svaret{" "}
              <span className="optional">Valgfritt</span>
              <textarea
                maxLength={1000}
                rows={2}
                placeholder="En liten forklaring eller en morsom opplysning …"
                value={question.explanation}
                onChange={(event) =>
                  change(index, { explanation: event.target.value })
                }
              />
            </label>
          </section>
        ))}
      </div>
      <button
        type="button"
        className="button secondary full"
        disabled={draft.questions.length >= 30}
        onClick={() =>
          setDraft({
            ...draft,
            questions: [...draft.questions, blankQuestion()],
          })
        }
      >
        <Icon name="plus" size={17} />
        Legg til et spørsmål
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="quiz-builder-actions">
        <button
          className="button secondary"
          disabled={!isCalendarQuiz(draft)}
          onClick={() => setPreview(true)}
        >
          <Icon name="eye" size={17} />
          Prøv quizen
        </button>
        <button className="button primary" onClick={save}>
          Lagre julequiz <Icon name="check" size={17} />
        </button>
      </div>
      {calendar.quiz && (
        <button
          className="button text danger-text"
          onClick={() => setRemove(true)}
        >
          <Icon name="trash" size={15} />
          Fjern quizen fra kalenderen
        </button>
      )}
      {preview && (
        <QuizPlayer quiz={draft} onClose={() => setPreview(false)} />
      )}{" "}
      {remove && (
        <Dialog title="Fjerne julequizen?" onClose={() => setRemove(false)}>
          <div className="dialog-content">
            <p>Quizen fjernes fra kalenderen. Lukene dine blir beholdt.</p>
            <div className="dialog-actions">
              <button
                className="button secondary"
                onClick={() => setRemove(false)}
              >
                Behold quizen
              </button>
              <button
                className="button danger"
                onClick={() => {
                  update(calendar.id, {
                    quiz: undefined,
                    doors: calendar.doors.map((door) => ({
                      ...door,
                      showCalendarQuiz: false,
                    })),
                  });
                  setRemove(false);
                  toast("Quizen er fjernet fra kalenderen.");
                }}
              >
                Fjern quiz
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </section>
  );
}
export function QuizPlayer({
  quiz,
  onClose,
}: {
  quiz: CalendarQuiz;
  onClose: () => void;
}) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const question = quiz.questions[index];
  const selected = answers[index];
  const score = answers.filter(
    (answer, i) => answer === quiz.questions[i].answerIndex,
  ).length;
  return (
    <Dialog title={quiz.title} onClose={onClose}>
      <div className="quiz-player">
        {!started ? (
          <>
            <span className="large-icon">
              <Icon name="quiz" size={32} />
            </span>
            <p className="eyebrow">EN LITEN UTFORDRING</p>
            <h2>{quiz.title}</h2>
            <p>{quiz.description}</p>
            <div className="quiz-facts">
              <span>
                <Icon name="quiz" size={16} />
                {quiz.questions.length} spørsmål
              </span>
              <span>
                <Icon name="heart" size={16} />
                Helt uhøytidelig
              </span>
            </div>
            <button
              className="button primary full"
              onClick={() => setStarted(true)}
            >
              Jeg er klar <Icon name="arrow" size={17} />
            </button>
          </>
        ) : finished ? (
          <div className="quiz-result" role="status">
            <span className="large-icon">
              <Icon name="star" size={34} />
            </span>
            <p className="eyebrow">SÅ FINT Å HA DEG MED</p>
            <h2>
              {score === quiz.questions.length
                ? "Du kan din jul!"
                : score >= quiz.questions.length / 2
                  ? "Mye julekunnskap her!"
                  : "Det viktigste er å være med."}
            </h2>
            <div className="quiz-score">
              <strong>{score}</strong>
              <span>av {quiz.questions.length} riktige</span>
            </div>
            <p>
              {score === quiz.questions.length
                ? "Full pott. Ta deg en pepperkake med god samvittighet."
                : "Litt moro, og kanskje noe nytt å ta med seg inn i desember."}
            </p>
            <div className="quiz-result-actions">
              <button
                className="button secondary"
                onClick={() => {
                  setStarted(false);
                  setIndex(0);
                  setAnswers([]);
                  setFinished(false);
                }}
              >
                Prøv igjen
              </button>
              <button className="button primary" onClick={onClose}>
                Til kalenderen <Icon name="arrow" size={16} />
              </button>
            </div>
            <small>Resultatet vises bare for deg i denne spillrunden.</small>
          </div>
        ) : (
          <>
            <div className="quiz-game-progress">
              <span>
                SPØRSMÅL {index + 1} AV {quiz.questions.length}
              </span>
              <span>{score} riktige</span>
            </div>
            <progress
              max={quiz.questions.length}
              value={index + (selected !== undefined ? 1 : 0)}
              aria-label="Fremdrift i quizen"
            />
            <h2 className="quiz-game-question">{question.title}</h2>
            <div className="recipient-quiz">
              {question.options.map((option, i) => (
                <button
                  key={i}
                  disabled={selected !== undefined}
                  className={`quiz-answer ${selected !== undefined && i === question.answerIndex ? "correct" : selected === i ? "incorrect" : ""}`}
                  onClick={() => setAnswers((previous) => [...previous, i])}
                >
                  <span>{String.fromCharCode(65 + i)}</span>
                  {option}
                  {selected !== undefined && i === question.answerIndex && (
                    <Icon name="check" size={17} />
                  )}
                </button>
              ))}
            </div>
            {selected !== undefined && (
              <div className="quiz-feedback" role="status">
                <strong>
                  {selected === question.answerIndex
                    ? "Helt riktig!"
                    : `Riktig svar: ${question.options[question.answerIndex]}`}
                </strong>
                {question.explanation && <p>{question.explanation}</p>}
              </div>
            )}
            <button
              className="button primary full quiz-next"
              disabled={selected === undefined}
              onClick={() => {
                if (index === quiz.questions.length - 1) setFinished(true);
                else setIndex(index + 1);
              }}
            >
              {index === quiz.questions.length - 1
                ? "Se resultatet"
                : "Neste spørsmål"}
              <Icon name="arrow" size={17} />
            </button>
          </>
        )}
      </div>
    </Dialog>
  );
}
