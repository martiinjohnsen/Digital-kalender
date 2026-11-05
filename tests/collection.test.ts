import test from "node:test";
import assert from "node:assert/strict";
import { createCalendar } from "../src/lib/model.ts";
import { calendarCollection } from "../src/lib/calendar-collection.ts";

function calendar() {
  return createCalendar({
    title: "Til en venn", recipient: "En venn", sender: "Meg", year: 2026, theme: "advent",
  });
}

test("the collection gathers every supported gift and keeps quiz answers in the quiz overview", () => {
  const value = calendar();
  Object.assign(value.doors[0], {
    body: "En varm hilsen",
    contentOrder: ["giftcard", "video", "image", "link", "activity", "quiz", "effect"],
    giftCard: { merchant: "Kaféen", amount: 100, currency: "NOK", code: "GAVE123", url: "", expiresOn: "" },
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    image: "data:image/png;base64,YWJj",
    imageAlt: "Et minne",
    link: { label: "Se overraskelsen", url: "https://example.com/gave" },
    activity: { title: "Kakaotur", body: "Vi går en tur." },
    effect: "snow",
    questions: [{ title: "Hva er to pluss to?", options: ["3", "4"], answerIndex: 1, explanation: "" }],
  });
  const items = calendarCollection(value, [1], 1);
  assert.deepEqual(items.map((item) => item.kind), ["message", "giftcard", "video", "image", "link", "activity"]);
  assert.equal(items.length, new Set(items.map((item) => item.id)).size);
  assert.deepEqual(items.find((item) => item.kind === "giftcard")?.gift, value.doors[0].giftCard);
  assert.equal(items.find((item) => item.kind === "image")?.alt, "Et minne");
});

test("unopened and date-locked gifts cannot appear even if the calendar payload contains them", () => {
  const value = calendar();
  value.doors[0].body = "Åpnet";
  value.doors[1].body = "Ikke åpnet";
  value.doors[2].body = "Fortsatt datolåst";
  assert.deepEqual(calendarCollection(value, [1, 3], 2).map((item) => item.day), [1]);
  assert.deepEqual(calendarCollection(value, [1, 2, 3], 0), []);
  assert.deepEqual(calendarCollection(value, [], 24), []);
});

test("the latest days appear first and each gift appears once despite duplicate opened-day records", () => {
  const value = calendar();
  value.doors[0].body = "Første dag";
  value.doors[4].body = "Femte dag";
  assert.deepEqual(calendarCollection(value, [1, 5, 1], 5).map((item) => item.day), [5, 1]);
});

test("empty drafts, unsafe links and invalid videos do not become collected gifts", () => {
  const value = calendar();
  Object.assign(value.doors[0], {
    body: " ", contentOrder: ["image", "video", "link", "giftcard", "activity"],
    image: "", videoUrl: "https://example.com/not-a-video",
    link: { label: "Ugyldig", url: "javascript:alert(1)" },
    giftCard: { merchant: "", amount: 100, currency: "NOK", code: "", url: "", expiresOn: "" },
    activity: { title: "", body: "" },
  });
  assert.deepEqual(calendarCollection(value, [1], 24), []);
});
