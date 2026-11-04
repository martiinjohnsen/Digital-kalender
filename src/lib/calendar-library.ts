import type { AdventCalendar } from "./model.ts";
export type LibraryFilter = "all" | "owner" | "received";
export function isReceived(calendar: AdventCalendar): boolean {
  return calendar.access === "received";
}
export function libraryCalendars(
  calendars: AdventCalendar[],
  filter: LibraryFilter,
  search = "",
): AdventCalendar[] {
  const query = search.trim().toLocaleLowerCase("nb");
  return calendars.filter(
    (calendar) =>
      (filter === "all" ||
        (filter === "received" && isReceived(calendar)) ||
        (filter === "owner" && !isReceived(calendar))) &&
      `${calendar.title} ${calendar.recipient} ${calendar.sender}`
        .toLocaleLowerCase("nb")
        .includes(query),
  );
}
export function receivedCopy(
  calendar: AdventCalendar,
  existing?: AdventCalendar,
): AdventCalendar {
  const copy = structuredClone(calendar);
  return {
    ...copy,
    id: existing?.id ?? crypto.randomUUID(),
    access: "received",
    receivedSourceId: calendar.receivedSourceId ?? calendar.id,
    demo: false,
  };
}
export function ownerCopy(calendar: AdventCalendar): AdventCalendar {
  const copy = structuredClone(calendar);
  delete copy.receivedSourceId;
  return {
    ...copy,
    id: crypto.randomUUID(),
    access: "owner",
    demo: false,
    title: `${copy.title.slice(0, 87)} (kopi)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
