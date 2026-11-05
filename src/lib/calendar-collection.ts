import {
  doorBlockOrder,
  safeLink,
  youtubeId,
  type AdventCalendar,
  type GiftCard,
} from "./model.ts";

type Content =
  | { kind: "message"; body: string }
  | { kind: "image"; src: string; alt: string }
  | { kind: "giftcard"; gift: GiftCard }
  | { kind: "video"; url: string; title: string }
  | { kind: "link"; url: string; label: string }
  | { kind: "activity"; title: string; body: string };

export type CollectedItem = Content & { id: string; day: number };
export type CollectedKind = CollectedItem["kind"];

export function calendarCollection(
  calendar: AdventCalendar,
  opened: readonly number[],
  available: number,
): CollectedItem[] {
  const openedDays = new Set(opened);
  const items: CollectedItem[] = [];
  const doors = calendar.doors
    .filter((door) => openedDays.has(door.day) && door.day <= available)
    .sort((a, b) => b.day - a.day);

  for (const door of doors) {
    function add(content: Content) {
      items.push({ ...content, day: door.day, id: `${door.day}-${content.kind}` });
    }
    if (door.body.trim()) add({ kind: "message", body: door.body });
    for (const block of doorBlockOrder(door)) {
      switch (block) {
        case "image":
          if (door.image)
            add({ kind: "image", src: door.image, alt: door.imageAlt || door.title || "Et bilde i kalenderen" });
          break;
        case "giftcard":
          if (door.giftCard && (door.giftCard.merchant.trim() || door.giftCard.code.trim() || safeLink(door.giftCard.url)))
            add({ kind: "giftcard", gift: door.giftCard });
          break;
        case "video":
          if (door.videoUrl && youtubeId(door.videoUrl))
            add({ kind: "video", url: door.videoUrl, title: door.title || `Video fra ${door.day}. desember` });
          break;
        case "link": {
          const url = door.link && safeLink(door.link.url);
          if (url) add({ kind: "link", url, label: door.link!.label || "Åpne lenken" });
          break;
        }
        case "activity":
          if (door.activity && (door.activity.title.trim() || door.activity.body.trim()))
            add({ kind: "activity", title: door.activity.title, body: door.activity.body });
          break;
      }
    }
  }
  return items;
}
