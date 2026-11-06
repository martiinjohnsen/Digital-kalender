import test from "node:test";
import assert from "node:assert/strict";
import { legacyPreviewProgress } from "../src/lib/preview-progress.ts";

test("import reads the original account keys and keeps both preview modes without deleting storage", () => {
  const values = new Map([
    ["luke:preview-saving:user:calendar:2026", "true"],
    ["luke:progress:user:calendar:2026:test:doors", "[1,3]"],
    ["luke:progress:user:calendar:2026:test:quiz", '{"1-0-abc":{"answer":1}}'],
    ["luke:progress:user:calendar:2026:owner-date:doors", "[2]"],
    ["luke:progress:user:calendar:2026:owner-date:quiz", '{"2-0-abc":{"text":"God jul"}}'],
  ]);
  const before = [...values];
  const imported = legacyPreviewProgress({ getItem: key => values.get(key) ?? null }, "user", "calendar", 2026);
  assert.equal(imported.wasEnabled, true);
  assert.equal(imported.alreadyImported, false);
  assert.deepEqual(imported.test, { opened: [1,3], answers: { "1-0-abc": { answer: 1 } } });
  assert.deepEqual(imported.date, { opened: [2], answers: { "2-0-abc": { text: "God jul" } } });
  assert.deepEqual([...values], before);
  const other = legacyPreviewProgress({ getItem: key => values.get(key) ?? null }, "another-user", "calendar", 2026);
  assert.equal(other.wasEnabled, false);
  assert.deepEqual(other.test, { opened: [], answers: {} });
});
test("an import marker prevents a stale device preference from re-enabling account saving", () => {
  const imported = legacyPreviewProgress({ getItem: key => key.endsWith(":cloud-imported-v1") ? "true" : null }, "user", "calendar", 2026);
  assert.equal(imported.alreadyImported, true);
  assert.equal(imported.wasEnabled, false);
});
