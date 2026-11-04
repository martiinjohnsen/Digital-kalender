import {
  isQuestionComplete,
  questionsForDoor,
  type AdventCalendar,
  type QuizQuestion,
} from "./model.ts";
export interface QuizAttempt {
  answer: number;
}
export type QuizProgress = Record<string, QuizAttempt>;
export function questionKey(
  day: number,
  index: number,
  question: QuizQuestion,
): string {
  const value = JSON.stringify([
    day,
    index,
    question.title,
    question.options,
    question.answerIndex,
  ]);
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${day}-${index}-${(hash >>> 0).toString(36)}`;
}
export function parseQuizProgress(raw: string | null): QuizProgress {
  if (!raw || raw.length > 40000) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        ([key, attempt]) =>
          /^\d{1,2}-\d{1,2}-[a-z0-9]+$/.test(key) &&
          attempt &&
          typeof attempt === "object" &&
          Number.isInteger(attempt.answer) &&
          attempt.answer >= 0 &&
          attempt.answer < 4,
      ),
    );
  } catch {
    return {};
  }
}
export function quizSummary(
  calendar: AdventCalendar,
  progress: QuizProgress,
  available = 24,
) {
  let total = 0,
    answered = 0,
    correct = 0,
    unlocked = 0;
  const days = calendar.doors
    .slice()
    .sort((a, b) => a.day - b.day)
    .map((door) => {
      const questions = questionsForDoor(door, calendar).filter(
        isQuestionComplete,
      );
      let dayAnswered = 0,
        dayCorrect = 0;
      questions.forEach((question, index) => {
        total++;
        if (door.day > available) return;
        unlocked++;
        const attempt = progress[questionKey(door.day, index, question)];
        if (!attempt || attempt.answer >= question.options.length) return;
        answered++;
        dayAnswered++;
        if (attempt.answer === question.answerIndex) {
          correct++;
          dayCorrect++;
        }
      });
      return {
        day: door.day,
        total: questions.length,
        answered: dayAnswered,
        correct: dayCorrect,
        locked: door.day > available,
      };
    })
    .filter((day) => day.total > 0);
  return { total, answered, correct, unlocked, days };
}
