export const THEMES = [
  "advent",
  "forest",
  "berry",
  "night",
  "gingerbread",
] as const;
export type Theme = (typeof THEMES)[number];
export type DoorKind = "message" | "image" | "quiz" | "video" | "activity";
export type DoorEffect = "none" | "snow" | "sparkles" | "confetti";
export interface QuizQuestion {
  title: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}
export interface CalendarQuiz {
  title: string;
  description: string;
  questions: QuizQuestion[];
}
export interface Door {
  day: number;
  kind: DoorKind;
  title: string;
  body: string;
  image?: string;
  imageAlt?: string;
  videoUrl?: string;
  quiz?: { options: string[]; answerIndex: number; explanation: string };
  link?: { label: string; url: string };
  effect?: DoorEffect;
  showCalendarQuiz?: boolean;
}
export interface AdventCalendar {
  id: string;
  title: string;
  description: string;
  recipient: string;
  sender: string;
  year: number;
  theme: Theme;
  doors: Door[];
  demo?: boolean;
  quiz?: CalendarQuiz;
  createdAt: string;
  updatedAt: string;
}
export interface Preferences {
  name: string;
  snow: boolean;
}
export interface AppData {
  version: 1;
  calendars: AdventCalendar[];
  preferences: Preferences;
}
export const themeInfo: Record<
  Theme,
  { name: string; description: string; color: string }
> = {
  advent: {
    name: "Advent",
    description: "Dempet lilla og lune vinterlys",
    color: "#655078",
  },
  forest: {
    name: "Granskog",
    description: "Rolig grønt og varme lys",
    color: "#284c3e",
  },
  berry: {
    name: "Vinterbær",
    description: "Dyp rødfarge og lune toner",
    color: "#813e48",
  },
  night: {
    name: "Stjernenatt",
    description: "Midnattsblått og små stjerner",
    color: "#303e64",
  },
  gingerbread: {
    name: "Pepperkake",
    description: "Varmt, gyllent og litt nostalgisk",
    color: "#9b603e",
  },
};
export const kindInfo: Record<DoorKind, { name: string; description: string }> =
  {
    message: { name: "Hilsen", description: "Noen ord som varmer" },
    image: { name: "Bilde", description: "Et minne å ta vare på" },
    quiz: { name: "Quiz", description: "Et lite spørsmål" },
    video: { name: "Video", description: "En video fra YouTube" },
    activity: { name: "Opplevelse", description: "Noe hyggelig å gjøre" },
  };
export function emptyDoor(day: number): Door {
  return { day, kind: "message", title: "", body: "" };
}
export function hasDoorContent(door: Door): boolean {
  return Boolean(
    door.title.trim() ||
      door.body.trim() ||
      door.image ||
      door.videoUrl?.trim() ||
      door.link?.url ||
      door.showCalendarQuiz ||
      (door.effect && door.effect !== "none") ||
      door.quiz?.options.some((option) => option.trim()),
  );
}
export function safeLink(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function isDoorComplete(door: Door): boolean {
  if (!door.title.trim()) return false;
  if (door.showCalendarQuiz) return true;
  if (door.kind === "image") return Boolean(door.image);
  if (door.kind === "video") return Boolean(youtubeId(door.videoUrl ?? ""));
  if (door.kind === "quiz")
    return Boolean(
      door.quiz &&
        door.quiz.options.length >= 2 &&
        door.quiz.options.every((o) => o.trim()) &&
        door.quiz.answerIndex >= 0 &&
        door.quiz.answerIndex < door.quiz.options.length,
    );
  return Boolean(door.body.trim());
}
export function completedCount(calendar: AdventCalendar): number {
  return calendar.doors.filter(isDoorComplete).length;
}
export function createCalendar(
  input: {
    title: string;
    recipient: string;
    sender: string;
    year: number;
    theme: Theme;
  },
  doors?: Door[],
): AdventCalendar {
  const now = new Date().toISOString();
  return {
    ...input,
    id: crypto.randomUUID(),
    description: "24 små grunner til å glede seg til jul.",
    doors: doors ?? Array.from({ length: 24 }, (_, i) => emptyDoor(i + 1)),
    createdAt: now,
    updatedAt: now,
  };
}
export function youtubeId(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    let id: string | null = null;
    if (
      ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)
    ) {
      id =
        url.pathname === "/watch"
          ? url.searchParams.get("v")
          : /^\/(?:shorts|embed)\//.test(url.pathname)
            ? url.pathname.split("/")[2]
            : null;
    } else if (url.hostname === "youtu.be") id = url.pathname.slice(1);
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
// Dates are evaluated in the calendar's Norwegian time zone, including around midnight.
export function availableDay(year: number, now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const n = (name: string) => Number(parts.find((p) => p.type === name)?.value);
  const currentYear = n("year"),
    month = n("month");
  if (currentYear > year) return 24;
  if (currentYear < year || month < 12) return 0;
  return Math.min(24, n("day"));
}
export function daysUntilAdvent(year: number, now = new Date()): number {
  return Math.max(
    0,
    Math.ceil(
      (new Date(`${year}-12-01T00:00:00+01:00`).getTime() - now.getTime()) /
        86400000,
    ),
  );
}
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function string(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length <= max;
}
export function isCalendarQuiz(value: unknown): value is CalendarQuiz {
  return (
    record(value) &&
    string(value.title, 100) &&
    Boolean(value.title.trim()) &&
    string(value.description, 1000) &&
    Array.isArray(value.questions) &&
    value.questions.length >= 1 &&
    value.questions.length <= 30 &&
    value.questions.every(
      (q) =>
        record(q) &&
        string(q.title, 200) &&
        Boolean(q.title.trim()) &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        q.options.length <= 4 &&
        q.options.every((o) => string(o, 180) && Boolean(o.trim())) &&
        Number.isInteger(q.answerIndex) &&
        Number(q.answerIndex) >= 0 &&
        Number(q.answerIndex) < q.options.length &&
        string(q.explanation, 1000),
    )
  );
}
export function isCalendar(value: unknown): value is AdventCalendar {
  if (
    !record(value) ||
    !string(value.id, 80) ||
    !/^[a-zA-Z0-9-]+$/.test(value.id) ||
    !string(value.title, 100) ||
    !value.title.trim() ||
    !string(value.description, 1000) ||
    !string(value.recipient, 100) ||
    !string(value.sender, 100) ||
    !Number.isInteger(value.year) ||
    Number(value.year) < 2020 ||
    Number(value.year) > 2100 ||
    !THEMES.includes(value.theme as Theme) ||
    !string(value.createdAt, 50) ||
    !string(value.updatedAt, 50) ||
    !Number.isFinite(Date.parse(value.createdAt)) ||
    !Number.isFinite(Date.parse(value.updatedAt))
  )
    return false;
  if (value.demo !== undefined && typeof value.demo !== "boolean") return false;
  if (!Array.isArray(value.doors) || value.doors.length !== 24) return false;
  if (value.quiz !== undefined && !isCalendarQuiz(value.quiz)) return false;
  const seen = new Set<number>();
  for (const door of value.doors) {
    if (
      !record(door) ||
      !Number.isInteger(door.day) ||
      Number(door.day) < 1 ||
      Number(door.day) > 24 ||
      seen.has(Number(door.day)) ||
      !Object.hasOwn(kindInfo, String(door.kind)) ||
      !string(door.title, 120) ||
      !string(door.body, 6000)
    )
      return false;
    seen.add(Number(door.day));
    if (door.showCalendarQuiz && !value.quiz) return false;
    if (
      door.showCalendarQuiz !== undefined &&
      typeof door.showCalendarQuiz !== "boolean"
    )
      return false;
    if (
      door.image !== undefined &&
      (!string(door.image, 800000) ||
        !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(
          door.image,
        ))
    )
      return false;
    if (door.imageAlt !== undefined && !string(door.imageAlt, 300))
      return false;
    if (
      door.videoUrl !== undefined &&
      (!string(door.videoUrl, 500) ||
        (door.videoUrl !== "" && !youtubeId(door.videoUrl)))
    )
      return false;
    if (
      door.link !== undefined &&
      (!record(door.link) ||
        !string(door.link.label, 100) ||
        !string(door.link.url, 2000) ||
        !safeLink(door.link.url))
    )
      return false;
    if (
      door.effect !== undefined &&
      !["none", "snow", "sparkles", "confetti"].includes(String(door.effect))
    )
      return false;
    if (
      door.quiz !== undefined &&
      (!record(door.quiz) ||
        !Array.isArray(door.quiz.options) ||
        door.quiz.options.length < 2 ||
        door.quiz.options.length > 4 ||
        !door.quiz.options.every((o) => string(o, 180)) ||
        !Number.isInteger(door.quiz.answerIndex) ||
        Number(door.quiz.answerIndex) < 0 ||
        Number(door.quiz.answerIndex) >= door.quiz.options.length ||
        !string(door.quiz.explanation, 1000))
    )
      return false;
  }
  return true;
}
export function parseBackup(text: string): AppData {
  if (text.length > 15000000)
    throw new Error("Filen er for stor. Maksimal størrelse er 15 MB.");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("Filen er ikke en gyldig Luke-sikkerhetskopi.");
  }
  if (
    !record(value) ||
    value.version !== 1 ||
    !Array.isArray(value.calendars) ||
    value.calendars.length > 100 ||
    !value.calendars.every(isCalendar) ||
    new Set(value.calendars.map((c) => c.id)).size !== value.calendars.length ||
    !record(value.preferences) ||
    !string(value.preferences.name, 60) ||
    typeof value.preferences.snow !== "boolean"
  )
    throw new Error("Sikkerhetskopien har ugyldig eller ufullstendig innhold.");
  return value as unknown as AppData;
}
