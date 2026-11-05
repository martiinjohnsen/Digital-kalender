"use client";
import { correctChoices, type QuizQuestion } from "@/lib/model";
import type { DoorIssues } from "@/lib/door-validation";
import { FieldError, validationAttributes } from "./field-validation";
import { Icon } from "./icons";
export function blankQuestion(
  type: "choice" | "text" = "choice",
): QuizQuestion {
  return type === "text"
    ? {
      type,
      title: "",
      options: [],
      answerIndex: 0,
      acceptedAnswers: [""],
      explanation: "",
    }
    : {
      type,
      title: "",
      options: ["", "", ""],
      answerIndex: 0,
      correctAnswers: [],
      explanation: "",
    };
}
export function DoorQuestionsEditor({
  value,
  onChange,
  issues = {},
}: {
  value: QuizQuestion[];
  issues?: DoorIssues;
  onChange: (value: QuizQuestion[]) => void;
}) {
  function change(index: number, patch: Partial<QuizQuestion>) {
    onChange(
      value.map((question, i) =>
        i === index ? { ...question, ...patch } : question,
      ),
    );
  }
  function move(index: number, direction: number) {
    const next = [...value];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    onChange(next);
  }
  return (
    <div className="door-questions-form">
      {value.map((question, index) => {
        const correct = correctChoices(question),
          text = question.type === "text";
        return (
          <section key={index} className="question-edit-card">
            <header>
              <h4>Spørsmål {index + 1}</h4>
              <div className="question-actions">
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Flytt spørsmål ${index + 1} opp`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <Icon
                    name="back"
                    size={14}
                    style={{ transform: "rotate(90deg)" }}
                  />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Flytt spørsmål ${index + 1} ned`}
                  disabled={index === value.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <Icon
                    name="back"
                    size={14}
                    style={{ transform: "rotate(-90deg)" }}
                  />
                </button>
                <button
                  type="button"
                  className="block-remove"
                  aria-label={`Fjern spørsmål ${index + 1}`}
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </header>
            <div
              className="question-type-switch"
              aria-label={`Spørsmålstype for spørsmål ${index + 1}`}
            >
              {(
                [
                  ["choice", "Alternativer"],
                  ["text", "Skriv riktig"],
                ] as const
              ).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={(text ? "text" : "choice") === type}
                  className={
                    (text ? "text" : "choice") === type ? "selected" : ""
                  }
                  onClick={() => {
                    if ((text ? "text" : "choice") === type) return;
                    const next = blankQuestion(type);
                    onChange(
                      value.map((q, i) =>
                        i === index
                          ? {
                            ...next,
                            title: q.title,
                            explanation: q.explanation,
                          }
                          : q,
                      ),
                    );
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <label>
              Spørsmål
              <input
                {...validationAttributes(issues, `quiz-${index}-title`)}
                maxLength={200}
                placeholder="Hva vil du spørre om?"
                value={question.title}
                onChange={(event) =>
                  change(index, { title: event.target.value })
                }
              />
              <FieldError issues={issues} field={`quiz-${index}-title`} />
            </label>
            {text ? (
              <>
                <label>
                  Godkjente svar
                  <textarea
                    {...validationAttributes(issues, `quiz-${index}-answers`)}
                    rows={3}
                    maxLength={6020}
                    placeholder={"For eksempel:\nJulenissen\nNissen"}
                    value={(question.acceptedAnswers ?? [""]).join("\n")}
                    onChange={(event) =>
                      change(index, {
                        acceptedAnswers: event.target.value
                          .split("\n")
                          .slice(0, 20)
                          .map((answer) => answer.slice(0, 300)),
                      })
                    }
                  />
                  <FieldError issues={issues} field={`quiz-${index}-answers`} />
                </label>
                <p className="field-help">
                  Ett svar eller en svarvariant per linje. Store og små
                  bokstaver teller likt.
                </p>
              </>
            ) : (
              <>
                <p className="field-help">
                  Merk alle riktige svar. Du kan legge til opptil 12
                  alternativer.
                </p>
                <div className="answer-options-editor" {...validationAttributes(issues, `quiz-${index}-correct`)}>
                  {question.options.map((option, i) => (
                    <div key={i} className="answer-option-row">
                      <input
                        type="checkbox"
                        checked={correct.includes(i)}
                        aria-label={`Spørsmål ${index + 1}: Alternativ ${i + 1} er riktig`}
                        onChange={(event) => {
                          const selected = event.target.checked
                            ? [...correct, i]
                            : correct.filter((answer) => answer !== i);
                          change(index, {
                            correctAnswers: selected,
                            answerIndex: selected[0] ?? 0,
                          });
                        }}
                      />
                      <input
                        {...validationAttributes(issues, `quiz-${index}-option-${i}`)}
                        aria-label={`Spørsmål ${index + 1}, svaralternativ ${i + 1}`}
                        maxLength={180}
                        placeholder={`Svaralternativ ${i + 1}`}
                        value={option}
                        onChange={(event) =>
                          change(index, {
                            options: question.options.map((text, position) =>
                              position === i ? event.target.value : text,
                            ),
                          })
                        }
                      />

                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Fjern svaralternativ ${i + 1}`}
                        disabled={question.options.length <= 2}
                        onClick={() => {
                          const selected = correct
                            .filter((answer) => answer !== i)
                            .map((answer) =>
                              answer > i ? answer - 1 : answer,
                            );
                          change(index, {
                            options: question.options.filter(
                              (_, position) => position !== i,
                            ),
                            correctAnswers: selected,
                            answerIndex: selected[0] ?? 0,
                          });
                        }}
                      >
                        <Icon name="close" size={15} />
                      </button>
                      <FieldError issues={issues} field={`quiz-${index}-option-${i}`} />
                    </div>
                  ))}
                </div>
                <FieldError issues={issues} field={`quiz-${index}-correct`} />
                {question.options.length < 12 && (
                  <button
                    type="button"
                    className="text-link add-option"
                    onClick={() =>
                      change(index, { options: [...question.options, ""] })
                    }
                  >
                    <Icon name="plus" size={14} />
                    Legg til svaralternativ
                  </button>
                )}
              </>
            )}
            <label>
              Kommentar etter svaret<span className="optional">Valgfritt</span>
              <textarea
                maxLength={1000}
                rows={2}
                placeholder="Vises som en kommentar fra deg etter at mottakeren har svart."
                value={question.explanation}
                onChange={(event) =>
                  change(index, { explanation: event.target.value })
                }
              />
            </label>
          </section>
        );
      })}
      <button
        type="button"
        className="button secondary small-button"
        disabled={value.length >= 32}
        onClick={() => onChange([...value, blankQuestion()])}
      >
        <Icon name="plus" size={15} />
        Legg til spørsmål
      </button>
    </div>
  );
}
