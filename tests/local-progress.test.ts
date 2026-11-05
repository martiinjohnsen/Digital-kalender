import test from "node:test";
import assert from "node:assert/strict";
import { readLocalProgress, writeLocalProgress } from "../src/lib/local-progress.ts";

function storage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
  };
}
const progress = { opened: [1, 2], answers: { "1-0-abc": { answer: 1 } } };

test("a fresh preview ignores saved opened doors and quiz answers without deleting them", () => {
  const saved = storage();
  writeLocalProgress(saved, "preview", progress, true);
  assert.deepEqual(readLocalProgress(saved, "preview", false), { opened: [], answers: {} });
  writeLocalProgress(saved, "preview", { opened: [3], answers: {} }, false);
  assert.deepEqual(readLocalProgress(saved, "preview", true), progress);
});

test("saving trial progress stays separate from the recipient's real progress", () => {
  const saved = storage();
  writeLocalProgress(saved, "recipient", progress, true);
  writeLocalProgress(saved, "test", { opened: [6], answers: {} }, true);
  assert.deepEqual(readLocalProgress(saved, "recipient", true), progress);
  assert.deepEqual(readLocalProgress(saved, "test", true), { opened: [6], answers: {} });
});

test("a preview that does not save never reads or writes storage", () => {
  const inaccessible = {
    getItem: () => { throw new Error("Storage must not be read"); },
    setItem: () => { throw new Error("Storage must not be written"); },
  };
  assert.deepEqual(readLocalProgress(inaccessible, "test", false), { opened: [], answers: {} });
  assert.doesNotThrow(() => writeLocalProgress(inaccessible, "test", progress, false));
});

test("invalid saved days and quiz attempts are excluded on restore", () => {
  const saved = storage();
  saved.setItem("test:doors", JSON.stringify([0, 1, 25, "2", 2.5, 24]));
  saved.setItem("test:quiz", JSON.stringify({ invalid: { answer: 1 } }));
  assert.deepEqual(readLocalProgress(saved, "test", true), { opened: [1, 24], answers: {} });
});
