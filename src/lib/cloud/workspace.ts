import {
  parseBackup,
  questionsForDoor,
  isQuestionComplete,
  type AdventCalendar,
  type AppData,
} from "../model.ts";
import type { QuizProgress } from "../quiz-progress.ts";
export type CloudProgress = Record<
  string,
  { opened: number[]; answers: QuizProgress }
>;
export type CloudSnapshot = {
  data: AppData;
  versions: Record<string, number>;
  progress: CloudProgress;
};
export type CloudCache = { data: AppData; base: CloudSnapshot; dirty: boolean };
export function ownedDocument(calendar: AdventCalendar): AdventCalendar {
  const {
    remote,
    serverAvailableDay,
    serverQuizCounts,
    receivedSourceId,
    ...document
  } = calendar;
  void remote;
  void serverAvailableDay;
  void serverQuizCounts;
  void receivedSourceId;
  return {
    ...document,
    access: "owner",
    demo: false,
    quizCounts: Object.fromEntries(
      calendar.doors.map((door) => [
        String(door.day),
        questionsForDoor(door, calendar).filter(isQuestionComplete).length,
      ]),
    ),
  };
}
function same(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}
export function workspacePatch(base: CloudSnapshot, current: AppData) {
  const old = new Map(base.data.calendars.map((c) => [c.id, c]));
  const currentIds = new Set(current.calendars.map((c) => c.id));
  const changes = current.calendars
    .filter(
      (c) =>
        c.access !== "received" &&
        (!old.has(c.id) ||
          !same(ownedDocument(old.get(c.id)!), ownedDocument(c))),
    )
    .map((c) => ({
      document: ownedDocument(c),
      expectedRevision: base.versions[c.id] ?? null,
    }));
  const deletes = base.data.calendars
    .filter((c) => c.access !== "received" && !currentIds.has(c.id))
    .map((c) => ({ id: c.id, expectedRevision: base.versions[c.id] }));
  const unfollow = base.data.calendars
    .filter((c) => c.access === "received" && !currentIds.has(c.id))
    .map((c) => c.id);
  return {
    p_changes: changes,
    p_deletes: deletes,
    p_unfollow: unfollow,
    p_preferences: current.preferences,
  };
}
export function hasCloudChanges(base: CloudSnapshot, current: AppData) {
  const patch = workspacePatch(base, current);
  return !!(
    patch.p_changes.length ||
    patch.p_deletes.length ||
    patch.p_unfollow.length ||
    !same(base.data.preferences, current.preferences)
  );
}
export function hasVersionConflict(cache: CloudCache, server: CloudSnapshot) {
  const patch = workspacePatch(cache.base, cache.data);
  return [
    ...patch.p_changes.map((c) => ({
      id: c.document.id,
      expectedRevision: c.expectedRevision,
    })),
    ...patch.p_deletes,
  ].some(
    (c) => (server.versions[c.id] ?? null) !== (c.expectedRevision ?? null),
  );
}
export function parseCloudSnapshot(value: unknown): CloudSnapshot {
  if (!value || typeof value !== "object")
    throw new Error("Skyversjonen kunne ikke leses.");
  const snapshot = value as CloudSnapshot;
  return {
    data: parseBackup(JSON.stringify(snapshot.data)),
    versions: snapshot.versions ?? {},
    progress: snapshot.progress ?? {},
  };
}
export function mergedAfterSave(
  sent: AppData,
  current: AppData,
  server: CloudSnapshot,
): AppData {
  // Preserve edits made while a request was in flight. Refresh remote documents
  // only when the recipient hasn't explicitly removed one in the meantime.
  if (same(sent, current)) return server.data;
  return rebaseDraft(
    { data: current, base: { ...server, data: sent }, dirty: true },
    server,
  );
}
export function rebaseDraft(cache: CloudCache, server: CloudSnapshot): AppData {
  const patch = workspacePatch(cache.base, cache.data);
  const changed = new Map(
    patch.p_changes.map((item) => [
      item.document.id,
      cache.data.calendars.find((c) => c.id === item.document.id)!,
    ]),
  );
  const removed = new Set([
    ...patch.p_deletes.map((item) => item.id),
    ...patch.p_unfollow,
  ]);
  return {
    ...server.data,
    preferences: same(cache.data.preferences, cache.base.data.preferences)
      ? server.data.preferences
      : cache.data.preferences,
    calendars: [
      ...changed.values(),
      ...server.data.calendars.filter(
        (c) => !changed.has(c.id) && !removed.has(c.id),
      ),
    ],
  };
}
export function inviteToken(hash: string): string | null {
  const token = new URLSearchParams(hash.replace(/^#/, "")).get("invite");
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}
export function nextOsloMidnight(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZoneName: "longOffset",
  }).formatToParts(now);
  const part = (name: string) =>
    parts.find((p) => p.type === name)?.value ?? "0";
  const offset = Number(part("timeZoneName").match(/GMT\+(\d+)/)?.[1] ?? 1);
  return (
    Date.UTC(
      Number(part("year")),
      Number(part("month")) - 1,
      Number(part("day")) + 1,
    ) -
    offset * 3600000
  );
}
