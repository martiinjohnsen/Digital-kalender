import test from "node:test";
import assert from "node:assert/strict";
import {
  availableDay,
  completedCount,
  createCalendar,
  hasDoorContent,
  isCalendar,
  isCalendarQuiz,
  isDoorComplete,
  parseBackup,
  safeLink,
  youtubeId,
} from "../src/lib/model.ts";
import { initialData, questions, templateDoors } from "../src/lib/templates.ts";
import { decodeCalendar, encodeCalendar } from "../src/lib/share.ts";
const make = () =>
  createCalendar({
    title: "Jul med æ, ø og å 🎄",
    recipient: "Familien",
    sender: "En venn",
    year: 2026,
    theme: "advent",
  });

test("new calendars contain exactly one door for every December day", () => {
  const calendar = make();
  assert.equal(isCalendar(calendar), true);
  assert.deepEqual(
    calendar.doors.map((door) => door.day),
    Array.from({ length: 24 }, (_, i) => i + 1),
  );
  assert.equal(completedCount(calendar), 0);
});
test("the date lock changes at Norwegian midnight, not the device's time zone", () => {
  assert.equal(availableDay(2026, new Date("2026-11-30T22:59:59Z")), 0);
  assert.equal(availableDay(2026, new Date("2026-11-30T23:00:00Z")), 1);
  assert.equal(availableDay(2026, new Date("2026-12-10T22:59:59Z")), 10);
  assert.equal(availableDay(2026, new Date("2026-12-10T23:00:00Z")), 11);
  assert.equal(availableDay(2026, new Date("2026-12-31T15:00:00Z")), 24);
  assert.equal(availableDay(2026, new Date("2027-01-01T00:00:00Z")), 24);
  assert.equal(availableDay(2027, new Date("2026-12-20T00:00:00Z")), 0);
});
test("partial custom content is preserved when filling empty doors", () => {
  const calendar = make();
  calendar.doors[0].body = "Min uferdige hilsen";
  const suggestions = templateDoors("family");
  const result = calendar.doors.map((door) =>
    hasDoorContent(door) ? door : suggestions[door.day - 1],
  );
  assert.equal(result[0].body, "Min uferdige hilsen");
  assert.equal(result[0].title, "");
  assert.equal(result.filter(isDoorComplete).length, 23);
});
test("each template contains 24 usable, valid doors", () => {
  for (const id of ["family", "team", "love", "calm"] as const) {
    const calendar = { ...make(), doors: templateDoors(id) };
    assert.equal(isCalendar(calendar), true);
    assert.equal(completedCount(calendar), 24);
    assert.equal(calendar.doors[23].day, 24);
  }
});
test("backup parsing rejects invalid days, duplicate calendar IDs and unsupported data", () => {
  const data = initialData();
  assert.deepEqual(parseBackup(JSON.stringify(data)), data);
  const corrupt = structuredClone(data);
  corrupt.calendars[0].doors[0].day = 2;
  assert.throws(() => parseBackup(JSON.stringify(corrupt)), /ugyldig/);
  assert.throws(
    () =>
      parseBackup(
        JSON.stringify({
          ...data,
          calendars: [data.calendars[0], data.calendars[0]],
        }),
      ),
    /ugyldig/,
  );
  assert.throws(() => parseBackup("<html>not a backup</html>"), /gyldig/);
  assert.throws(
    () => parseBackup(JSON.stringify({ ...data, version: 99 })),
    /ugyldig/,
  );
});
test("share links round-trip Norwegian text, emojis, media references and the calendar quiz", () => {
  const calendar = {
    ...make(),
    doors: templateDoors("family"),
    quiz: {
      title: "Julequiz",
      description: "Litt juleglede!",
      questions: structuredClone(questions),
    },
  };
  calendar.doors[0].effect = "sparkles";
  calendar.doors[0].link = { label: "Se mer", url: "https://example.com/jul" };
  assert.deepEqual(decodeCalendar(encodeCalendar(calendar)), calendar);
});
test("share link validation rejects malformed and oversized payloads", () => {
  assert.throws(() => decodeCalendar(""), /ugyldig/);
  assert.throws(() => decodeCalendar("%%%"), /ugyldig/);
  assert.throws(() => decodeCalendar("e30"), /kunne ikke åpne/);
  assert.throws(() => decodeCalendar("A".repeat(20001)), /stor/);
  const calendar = make();
  calendar.doors[0].body = "a".repeat(15000);
  assert.throws(() => encodeCalendar(calendar), /for stor/);
});
test("external links reject scripts, insecure protocols and embedded credentials", () => {
  assert.equal(
    safeLink("https://example.com/path?q=ok"),
    "https://example.com/path?q=ok",
  );
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,hello",
    "file:///etc/passwd",
    "http://example.com",
    "https://user:password@example.com",
  ])
    assert.equal(safeLink(url), null);
  const calendar = make();
  calendar.doors[0].link = { label: "Click", url: "javascript:alert(1)" };
  assert.equal(isCalendar(calendar), false);
});
test("video embedding accepts exact YouTube hosts only", () => {
  assert.equal(
    youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    "dQw4w9WgXcQ",
  );
  assert.equal(youtubeId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(
    youtubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
    "dQw4w9WgXcQ",
  );
  assert.equal(
    youtubeId("https://youtube.com.attacker.test/watch?v=dQw4w9WgXcQ"),
    null,
  );
  assert.equal(youtubeId("http://youtu.be/dQw4w9WgXcQ"), null);
  assert.equal(youtubeId("https://youtu.be/not-valid"), null);
});
test("calendar quizzes require complete options and a valid correct answer", () => {
  const quiz = {
    title: "Jul",
    description: "En quiz",
    questions: structuredClone(questions),
  };
  assert.equal(isCalendarQuiz(quiz), true);
  quiz.questions[0].answerIndex = 99;
  assert.equal(isCalendarQuiz(quiz), false);
  quiz.questions[0].answerIndex = 0;
  quiz.questions[0].options[1] = " ";
  assert.equal(isCalendarQuiz(quiz), false);
});
test("initial examples are clearly marked and safe to reload", () => {
  const data = initialData();
  assert.equal(
    data.calendars.every((c) => c.demo && isCalendar(c)),
    true,
  );
  assert.deepEqual(data.calendars.map(completedCount), [8, 4]);
});
test("image and video doors are complete only when their media is present", () => {
  const door = {
    day: 1,
    kind: "image" as const,
    title: "Et minne",
    body: "En tekst",
  };
  assert.equal(isDoorComplete(door), false);
  assert.equal(
    isDoorComplete({ ...door, image: "data:image/jpeg;base64,AAAA" }),
    true,
  );
  assert.equal(
    isDoorComplete({
      ...door,
      kind: "video",
      videoUrl: "https://example.com/video",
    }),
    false,
  );
});

test("effects and calendar quiz attachments are not treated as untouched doors", () => {
  const calendar = make();
  assert.equal(
    hasDoorContent({ ...calendar.doors[0], effect: "sparkles" }),
    true,
  );
  assert.equal(
    hasDoorContent({ ...calendar.doors[0], showCalendarQuiz: true }),
    true,
  );
  assert.equal(hasDoorContent({ ...calendar.doors[0], effect: "none" }), false);
});
test("an attached calendar quiz must exist, and completes a titled door", () => {
  const calendar = make();
  calendar.doors[0] = {
    ...calendar.doors[0],
    title: "Dagens julequiz",
    showCalendarQuiz: true,
  };
  assert.equal(isCalendar(calendar), false);
  calendar.quiz = {
    title: "Jul",
    description: "En quiz",
    questions: structuredClone(questions),
  };
  assert.equal(isCalendar(calendar), true);
  assert.equal(isDoorComplete(calendar.doors[0]), true);
});
