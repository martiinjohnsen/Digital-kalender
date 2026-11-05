import { parseQuizProgress, type QuizProgress } from "./quiz-progress.ts";

export type LocalProgress = { opened: number[]; answers: QuizProgress };
type ProgressStorage = Pick<Storage, "getItem" | "setItem">;

export function readLocalProgress(
  storage: ProgressStorage,
  key: string,
  remember: boolean,
): LocalProgress {
  if (!remember) return { opened: [], answers: {} };
  let opened: number[] = [];
  let answers: QuizProgress = {};
  try {
    const value: unknown = JSON.parse(storage.getItem(`${key}:doors`) ?? "[]");
    if (Array.isArray(value))
      opened = value.filter(
        (day): day is number => Number.isInteger(day) && day >= 1 && day <= 24,
      );
    answers = parseQuizProgress(storage.getItem(`${key}:quiz`));
  } catch {
    // Keep the preview usable when browser storage is unavailable.
  }
  return { opened, answers };
}

export function writeLocalProgress(
  storage: ProgressStorage,
  key: string,
  progress: LocalProgress,
  remember: boolean,
): void {
  if (!remember) return;
  storage.setItem(`${key}:doors`, JSON.stringify(progress.opened));
  storage.setItem(`${key}:quiz`, JSON.stringify(progress.answers));
}
