import test from "node:test";
import assert from "node:assert/strict";
import {
  createCalendar,
  emptyDoor,
  isQuestionComplete,
  isQuizResponseCorrect,
  type AppData,
  type AdventCalendar,
} from "../src/lib/model.ts";
import { initialData } from "../src/lib/templates.ts";
import {
  workspacePatch,
  hasVersionConflict,
  rebaseDraft,
  mergedAfterSave,
  inviteToken,
  nextOsloMidnight,
  ownedDocument,
  type CloudSnapshot,
} from "../src/lib/cloud/workspace.ts";
import { quizSummary, questionKey } from "../src/lib/quiz-progress.ts";
function calendar(id: string): AdventCalendar {
  return {
    ...createCalendar({
      title: id,
      recipient: "",
      sender: "Meg",
      year: 2026,
      theme: "advent",
    }),
    id,
    access: "owner",
  };
}
function snapshot(calendars: AdventCalendar[]): CloudSnapshot {
  return {
    data: { ...initialData(), calendars },
    versions: Object.fromEntries(
      calendars.filter((c) => c.access !== "received").map((c) => [c.id, 1]),
    ),
    progress: {},
  };
}
test("cloud patches include explicit owner changes and removals without uploading received content", () => {
  const a = calendar("a"),
    b = calendar("b"),
    received = { ...calendar("r"), access: "received" as const };
  const base = snapshot([a, b, received]);
  const current = {
    ...base.data,
    calendars: [
      { ...a, title: "Endret" },
      { ...received, title: "Mottatt" },
    ],
  };
  const patch = workspacePatch(base, current);
  assert.equal(patch.p_changes.length, 1);
  assert.equal(patch.p_changes[0].document.id, "a");
  assert.equal(patch.p_changes[0].expectedRevision, 1);
  assert.deepEqual(patch.p_deletes, [{ id: "b", expectedRevision: 1 }]);
  assert.deepEqual(patch.p_unfollow, []);
  assert.deepEqual(
    workspacePatch(base, { ...base.data, calendars: [a, b] }).p_unfollow,
    ["r"],
  );
});
test("offline drafts detect a changed or deleted server revision before upload", () => {
  const base = snapshot([calendar("a")]);
  const cache = {
    base,
    data: {
      ...base.data,
      calendars: [{ ...base.data.calendars[0], title: "Utkast" }],
    },
    dirty: true,
  };
  assert.equal(
    hasVersionConflict(cache, { ...base, versions: { a: 2 } }),
    true,
  );
  assert.equal(hasVersionConflict(cache, snapshot([])), true);
  assert.equal(hasVersionConflict(cache, base), false);
});
test("rebasing a local draft preserves unrelated edits made on another device", () => {
  const base = snapshot([calendar("a"), calendar("b")]);
  const current = {
    ...base.data,
    calendars: base.data.calendars.map((c) =>
      c.id === "a" ? { ...c, title: "Mitt utkast" } : c,
    ),
  };
  const server = snapshot(
    base.data.calendars.map((c) =>
      c.id === "b" ? { ...c, title: "Annen enhet" } : c,
    ),
  );
  const next = rebaseDraft({ base, data: current, dirty: true }, server);
  assert.equal(next.calendars.find((c) => c.id === "a")?.title, "Mitt utkast");
  assert.equal(next.calendars.find((c) => c.id === "b")?.title, "Annen enhet");
  assert.deepEqual(
    workspacePatch(server, next).p_changes.map((c) => c.document.id),
    ["a"],
  );
});
test("an in-flight save cannot erase new edits or resurrect a removed recipient calendar", () => {
  const received = { ...calendar("r"), access: "received" as const };
  const sent = snapshot([calendar("a"), received]);
  const current = {
    ...sent.data,
    calendars: [
      { ...sent.data.calendars[0], title: "Skrevet mens det lagret" },
    ],
  };
  const merged = mergedAfterSave(sent.data, current, sent);
  assert.equal(merged.calendars[0].title, "Skrevet mens det lagret");
  assert.equal(
    merged.calendars.some((c) => c.id === "r"),
    false,
  );
});
test("owner uploads omit the remote-view-only metadata", () => {
  const c = {
    ...calendar("a"),
    remote: true,
    serverAvailableDay: 0,
    serverQuizCounts: { "1": 3 },
    receivedSourceId: "x",
  };
  const clean = ownedDocument(c);
  assert.equal(clean.remote, undefined);
  assert.equal(clean.serverAvailableDay, undefined);
  assert.equal(clean.serverQuizCounts, undefined);
  assert.equal(clean.receivedSourceId, undefined);
});
test("invitation parsing only accepts a full random-token format", () => {
  const token = "a".repeat(64);
  assert.equal(inviteToken(`#invite=${token}`), token);
  assert.equal(inviteToken("#invite=javascript:alert(1)"), null);
  assert.equal(inviteToken("#invite=" + "a".repeat(63)), null);
  assert.equal(inviteToken("#old-calendar-payload"), null);
});
test("next midnight follows Oslo time in winter and summer", () => {
  assert.equal(
    new Date(nextOsloMidnight(new Date("2026-12-04T20:00:00Z"))).toISOString(),
    "2026-12-04T23:00:00.000Z",
  );
  assert.equal(
    new Date(nextOsloMidnight(new Date("2026-06-04T20:00:00Z"))).toISOString(),
    "2026-06-04T22:00:00.000Z",
  );
});
test("remote questions use server results and can count hidden questions without their contents", () => {
  const q = {
    type: "text" as const,
    title: "Dagens ord",
    options: [],
    answerIndex: 0,
    acceptedAnswers: [],
    explanation: "",
    remote: { key: "1-0-abc123", multiple: false },
  };
  assert.equal(isQuestionComplete(q), true);
  assert.equal(questionKey(1, 0, q), q.remote.key);
  assert.equal(isQuizResponseCorrect(q, { text: "jul" }), false);
  assert.equal(
    isQuizResponseCorrect(q, { text: "jul", result: { correct: true } }),
    true,
  );
  const c = {
    ...calendar("a"),
    remote: true,
    access: "received" as const,
    serverQuizCounts: { "1": 1, "5": 2 },
    doors: Array.from({ length: 24 }, (_, i) => emptyDoor(i + 1)),
  };
  c.doors[0].questions = [q];
  const summary = quizSummary(
    c,
    { [q.remote.key]: { text: "jul", result: { correct: true } } },
    4,
  );
  assert.equal(summary.total, 3);
  assert.equal(summary.correct, 1);
  assert.equal(summary.days.find((d) => d.day === 5)?.locked, true);
});
