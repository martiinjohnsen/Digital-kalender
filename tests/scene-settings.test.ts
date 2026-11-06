import test from "node:test";
import assert from "node:assert/strict";
import { createCalendar, DEFAULT_SCENE, isScene, isCalendar, parseBackup } from "../src/lib/model.ts";
import { initialData } from "../src/lib/templates.ts";
import { encodeCalendar, decodeCalendar } from "../src/lib/share.ts";
import { workspacePatch } from "../src/lib/cloud/workspace.ts";

const make = () => createCalendar({ title: "Jul", recipient: "En venn", sender: "Avsender", year: 2026, theme: "advent" });
test("new objects and animation flags survive account upload, backup and sharing for every sky", () => {
  for (const sky of ["stars", "moon", "fullmoon", "cloudy", "clear"] as const) {
    const calendar = make();
    calendar.scene = { ...DEFAULT_SCENE, sky, santa: true, sleigh: true, skis: true, christmasTree: true, lanterns: true, storm: true, shootingStars: true };
    const data = { ...initialData(), calendars: [calendar] };
    assert.equal(isCalendar(calendar), true);
    assert.deepEqual(parseBackup(JSON.stringify(data)).calendars[0].scene, calendar.scene);
    assert.deepEqual(decodeCalendar(encodeCalendar(calendar)).scene, calendar.scene);
    const patch = workspacePatch({ data: initialData(), versions: {}, progress: {} }, data);
    assert.deepEqual(patch.p_changes[0].document.scene, calendar.scene);
  }
});
test("old moon scenes keep their original key and absent new choices remain absent", () => {
  const scene = { ...DEFAULT_SCENE, sky: "moon" as const };
  const calendar = { ...make(), scene };
  const restored = parseBackup(JSON.stringify({ ...initialData(), calendars: [calendar] }));
  assert.deepEqual(restored.calendars[0].scene, scene);
  assert.equal(restored.calendars[0].scene!.santa, undefined);
  assert.equal(restored.calendars[0].scene!.storm, undefined);
});
test("new optional flags reject non-boolean stored values without changing valid old scenes", () => {
  for (const key of ["santa", "sleigh", "skis", "christmasTree", "lanterns", "storm", "shootingStars"]) {
    assert.equal(isScene({ ...DEFAULT_SCENE, [key]: "true" }), false);
    assert.equal(isScene({ ...DEFAULT_SCENE, [key]: false }), true);
  }
  assert.equal(isScene({ ...DEFAULT_SCENE, sky: "unknown" }), false);
});
