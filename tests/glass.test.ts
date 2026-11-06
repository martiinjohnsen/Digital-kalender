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
      const change = parseFloat(current[key]) - parseFloat(previous[key]);
      const pigmentOrHelp = key.includes("tint") || key === "--glass-help-mix";
      assert.ok(pigmentOrHelp ? change <= 0 : change >= 0, key);
      assert.ok(Math.abs(change) < 2, key);
    }
    previous=current;
  }
  assert.equal(glassStyle(DEFAULT_GLASS)['--glass-nav-fill'],'32.0%');
  assert.equal(glassStyle(100)['--glass-nav-fill'],'96.0%');
});

test("the transparent end retains purple pigment while the opaque appearance stays unchanged", () => {
  const clear = glassStyle(0);
  assert.ok(parseFloat(clear['--glass-action-fill']) >= 40);
  assert.ok(parseFloat(clear['--glass-choice-fill']) >= 10);
  assert.ok(parseFloat(clear['--glass-choice-tint']) >= 70);
  assert.ok(parseFloat(clear['--glass-nav-fill']) < 5);
  assert.ok(parseFloat(clear['--glass-neutral-fill']) < 5);
  const opaque = glassStyle(100);
  assert.deepEqual(opaque, {
    '--glass-action-fill': '98.0%',
    '--glass-choice-fill': '92.0%',
    '--glass-neutral-fill': '96.0%',
    '--glass-nav-fill': '96.0%',
    '--glass-shine': '35.0%',
    '--glass-blur': '26.0px',
    '--glass-choice-tint': '32.0%',
    '--glass-choice-hover-tint': '40.0%',
    '--glass-choice-pressed-tint': '46.0%',
    '--glass-help-mix': '35.0%',
  });
});
