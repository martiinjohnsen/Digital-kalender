import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseBackup, type AppData } from "../src/lib/model.ts";
import { workspacePatch } from "../src/lib/cloud/workspace.ts";
import { quizSummary, type QuizProgress } from "../src/lib/quiz-progress.ts";
import { calendarCollection } from "../src/lib/calendar-collection.ts";

const existing = JSON.parse(readFileSync(
  new URL("./fixtures/existing-workspace-v1.json", import.meta.url), "utf8",
)) as { data: AppData; opened: number[]; answers: QuizProgress; available: number };

test("a saved version 1 workspace reloads with calendar IDs, media, gift codes and dates intact", () => {
  const restored = parseBackup(JSON.stringify(existing.data));
  assert.deepEqual(restored, existing.data);
});

test("loading existing data after a release does not send calendar changes or deletions to the server", () => {
  const restored = parseBackup(JSON.stringify(existing.data));
  const patch = workspacePatch({
    data: existing.data,
    versions: { [existing.data.calendars[0].id]: 7 },
    progress: {},
  }, restored);
  assert.deepEqual(patch.p_changes, []);
  assert.deepEqual(patch.p_deletes, []);
  assert.deepEqual(patch.p_unfollow, []);
});

test("previously opened gifts and quiz results still work with the saved question keys", () => {
  const calendar = parseBackup(JSON.stringify(existing.data)).calendars[0];
  const summary = quizSummary(calendar, existing.answers, existing.available);
  assert.equal(summary.answered, 1);
  assert.equal(summary.correct, 1);
  assert.equal(summary.total, 1);
  assert.deepEqual(
    calendarCollection(calendar, existing.opened, existing.available).map((item) => item.id),
    ["2-image", "2-video", "2-link", "2-activity", "1-message", "1-giftcard"],
  );
});
