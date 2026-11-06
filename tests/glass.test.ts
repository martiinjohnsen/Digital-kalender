import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_GLASS, glassLevel, glassStyle } from "../src/lib/glass.ts";

test("glass settings clamp out-of-range input and keep a safe default", () => {
  assert.equal(glassLevel(undefined), DEFAULT_GLASS);
  assert.equal(glassLevel(NaN), DEFAULT_GLASS);
  assert.equal(glassLevel(Infinity), DEFAULT_GLASS);
  assert.equal(glassLevel(-20), 0);
  assert.equal(glassLevel(140), 100);
  assert.equal(glassLevel(42.8), 43);
});
test("every material responds continuously while action buttons remain stronger than selections", () => {
  let previous: Record<string,string> | undefined;
  for (let level=0;level<=100;level++) {
    const current = glassStyle(level);
    assert.ok(parseFloat(current['--glass-action-fill']) > parseFloat(current['--glass-choice-fill']));
    for (const value of Object.values(current)) assert.ok(Number.isFinite(parseFloat(value)));
    if (previous) for (const key of Object.keys(current)) {
      assert.ok(parseFloat(current[key]) >= parseFloat(previous[key]), key);
      assert.ok(parseFloat(current[key]) - parseFloat(previous[key]) < 2, key);
    }
    previous=current;
  }
  assert.equal(glassStyle(DEFAULT_GLASS)['--glass-nav-fill'],'32.0%');
  assert.equal(glassStyle(100)['--glass-nav-fill'],'96.0%');
});
