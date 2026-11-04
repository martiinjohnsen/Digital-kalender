export const THEMES = [
  "advent",
  "forest",
  "berry",
  "night",
  "gingerbread",
  "ice",
  "rose",
  "champagne",
  "aurora",
] as const;
export type Theme = (typeof THEMES)[number];
export type DoorKind =
  | "message"
  | "image"
  | "quiz"
  | "video"
  | "activity"
  | "giftcard";
export type DoorEffect = "none" | "snow" | "sparkles" | "confetti";
export interface SceneSettings {
  house: "classic" | "cabin" | "townhouse";
  sky: "stars" | "moon" | "clear";
  snowman: boolean;
  reindeer: boolean;
  trees: boolean;
  lights: boolean;
  snowfall: boolean;
}
export const DEFAULT_SCENE: SceneSettings = {
  house: "classic",
  sky: "stars",
  snowman: false,
  reindeer: false,
  trees: true,
  lights: true,
  snowfall: false,
};
export interface GiftCard {
  merchant: string;
  amount: number;
  currency: "NOK";
  code: string;
  url: string;
  expiresOn: string;
}
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
  questions?: QuizQuestion[];
  giftCard?: GiftCard;
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
  scene?: SceneSettings;
  access?: "owner" | "received";
  receivedSourceId?: string;
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
  ice: { name: "Isblå", description: "Klar vinterhimmel", color: "#718a9e" },
  rose: { name: "Vinterrosa", description: "Myke rosatoner", color: "#a67b8b" },
  champagne: {
    name: "Champagne",
    description: "Lyst og gyllent",
    color: "#9f8a60",
  },
  aurora: {
    name: "Nordlys",
    description: "Grønt, blått og natt",
    color: "#436c70",
  },
};
export const kindInfo: Record<DoorKind, { name: string; description: string }> =
  {
    giftcard: { name: "Gavekort", description: "En gave å bruke senere" },
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
      door.giftCard?.merchant ||
      door.questions?.some(
        (question) =>
          question.title.trim() ||
          question.options.some((option) => option.trim()),
      ) ||
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
  if (door.questions?.some((question) => !isQuestionComplete(question)))
    return false;
  if (
    door.giftCard &&
    !(
      door.giftCard.merchant.trim() &&
      door.giftCard.amount > 0 &&
      (door.giftCard.code.trim() || safeLink(door.giftCard.url))
    )
  )
    return false;
  if (door.showCalendarQuiz) return true;
  if (door.kind === "giftcard")
    return Boolean(
      door.giftCard?.merchant.trim() &&
        door.giftCard.amount > 0 &&
        (door.giftCard.code.trim() || safeLink(door.giftCard.url)),
    );
  if (door.kind === "image") return Boolean(door.image);
  if (door.kind === "video") return Boolean(youtubeId(door.videoUrl ?? ""));
  if (door.kind === "quiz")
    return Boolean(
      door.questions?.length
        ? door.questions.every(isQuestionComplete)
        : door.quiz &&
            door.quiz.options.length >= 2 &&
            door.quiz.options.every((o) => o.trim()) &&
            door.quiz.answerIndex >= 0 &&
            door.quiz.answerIndex < door.quiz.options.length,
    );
  return Boolean(
    door.body.trim() ||
      door.image ||
      youtubeId(door.videoUrl ?? "") ||
      door.link?.url ||
      (door.questions?.length && door.questions.every(isQuestionComplete)),
  );
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
    scene?: SceneSettings;
  },
  doors?: Door[],
): AdventCalendar {
  const now = new Date().toISOString();
  return {
    ...input,
    scene: input.scene ?? { ...DEFAULT_SCENE },
    access: "owner",
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
export function isQuestionComplete(question: QuizQuestion): boolean {
  return Boolean(
    question.title.trim() &&
      question.options.length >= 2 &&
      question.options.every((option) => option.trim()) &&
      question.answerIndex >= 0 &&
      question.answerIndex < question.options.length,
  );
}
function isQuestion(value: unknown): value is QuizQuestion {
  return (
    record(value) &&
    string(value.title, 200) &&
    Array.isArray(value.options) &&
    value.options.length >= 2 &&
    value.options.length <= 4 &&
    value.options.every((option) => string(option, 180)) &&
    Number.isInteger(value.answerIndex) &&
    Number(value.answerIndex) >= 0 &&
    Number(value.answerIndex) < value.options.length &&
    string(value.explanation, 1000)
  );
}
export function isScene(value: unknown): value is SceneSettings {
  return (
    record(value) &&
    ["classic", "cabin", "townhouse"].includes(String(value.house)) &&
    ["stars", "moon", "clear"].includes(String(value.sky)) &&
    ["snowman", "reindeer", "trees", "lights", "snowfall"].every(
      (key) => typeof value[key] === "boolean",
    )
  );
}
export function sceneFor(
  calendar: Pick<AdventCalendar, "scene">,
): SceneSettings {
  return { ...DEFAULT_SCENE, ...calendar.scene };
}
export function questionsForDoor(
  door: Door,
  calendar?: AdventCalendar,
): QuizQuestion[] {
  if (door.questions !== undefined) return door.questions;
  const questions: QuizQuestion[] = door.quiz
    ? [{ title: door.title, ...door.quiz, options: [...door.quiz.options] }]
    : [];
  if (door.showCalendarQuiz && calendar?.quiz)
    questions.push(...structuredClone(calendar.quiz.questions));
  return questions;
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
  if (value.scene !== undefined && !isScene(value.scene)) return false;
  if (
    value.access !== undefined &&
    !["owner", "received"].includes(String(value.access))
  )
    return false;
  if (
    value.receivedSourceId !== undefined &&
    (!string(value.receivedSourceId, 80) ||
      !/^[a-zA-Z0-9-]+$/.test(value.receivedSourceId))
  )
    return false;
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
    if (
      door.questions !== undefined &&
      (!Array.isArray(door.questions) ||
        door.questions.length > 32 ||
        !door.questions.every(isQuestion))
    )
      return false;
    if (door.giftCard !== undefined) {
      const gift = door.giftCard;
      if (
        !record(gift) ||
        !string(gift.merchant, 100) ||
        typeof gift.amount !== "number" ||
        !Number.isFinite(gift.amount) ||
        gift.amount < 0 ||
        gift.amount > 1000000 ||
        gift.currency !== "NOK" ||
        !string(gift.code, 500) ||
        !string(gift.url, 2000) ||
        (gift.url !== "" && !safeLink(gift.url)) ||
        !string(gift.expiresOn, 10) ||
        (gift.expiresOn !== "" &&
          (!/^\d{4}-\d{2}-\d{2}$/.test(gift.expiresOn) ||
            !Number.isFinite(Date.parse(gift.expiresOn)) ||
            new Date(gift.expiresOn).toISOString().slice(0, 10) !==
              gift.expiresOn))
      )
        return false;
    }
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
