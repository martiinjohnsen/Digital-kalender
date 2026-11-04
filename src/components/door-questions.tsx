"use client";
import type { QuizQuestion } from "@/lib/model";
import { Icon } from "./icons";
export function blankQuestion(): QuizQuestion {
  return { title: "", options: ["", "", ""], answerIndex: 0, explanation: "" };
}
export function DoorQuestionsEditor({
  value,
  onChange,
}: {
  value: QuizQuestion[];
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
    <section className="door-question-editor">
      <div className="section-heading">
        <h3>Quiz i denne luka</h3>
        <span className="muted small">{value.length} av maks 32</span>
      </div>
      {value.map((question, index) => (
        <section key={index} className="question-card">
          <div className="question-card-heading">
            <span className="question-number">{index + 1}</span>
            <h4>Spørsmål {index + 1}</h4>
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
                className="icon-button"
                aria-label={`Fjern spørsmål ${index + 1}`}
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          </div>
          <label>
            Spørsmål
            <input
              maxLength={200}
              placeholder="Hva vil du spørre om?"
              value={question.title}
              onChange={(event) => change(index, { title: event.target.value })}
            />
          </label>
          <p className="field-help">Merk det riktige svaret med sirkelen.</p>
          {question.options.map((option, i) => (
            <div className="quiz-option-edit" key={i}>
              <input
                type="radio"
                name={`door-answer-${index}`}
                aria-label={`Spørsmål ${index + 1}: Alternativ ${i + 1} er riktig`}
                checked={question.answerIndex === i}
                onChange={() => change(index, { answerIndex: i })}
              />
              <input
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
              {question.options.length > 2 && (
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Fjern svaralternativ ${i + 1}`}
                  onClick={() =>
                    change(index, {
                      options: question.options.filter(
                        (_, position) => position !== i,
                      ),
                      answerIndex:
                        question.answerIndex === i
                          ? 0
                          : question.answerIndex > i
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
              Svaralternativ
            </button>
          )}
          <label>
            Forklaring etter svaret<span className="optional">Valgfritt</span>
            <textarea
              maxLength={1000}
              rows={2}
              value={question.explanation}
              onChange={(event) =>
                change(index, { explanation: event.target.value })
              }
            />
          </label>
        </section>
      ))}
      <div className="quiz-editor-footer">
        <button
          type="button"
          className="button secondary small-button"
          disabled={value.length >= 32}
          onClick={() => onChange([...value, blankQuestion()])}
        >
          <Icon name="plus" size={15} />
          Legg til spørsmål
        </button>
        {value.length > 0 && (
          <button
            type="button"
            className="button text small-button"
            onClick={() => onChange([])}
          >
            Fjern quiz
          </button>
        )}
      </div>
    </section>
  );
}
