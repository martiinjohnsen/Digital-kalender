import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_GLASS, glassLevel, glassStyle } from "../src/lib/glass.ts";
import { glassMotion } from "../src/lib/glass-motion.ts";

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
      const pigmentOrHelp = key.includes("tint") || ["--glass-help-mix","--glass-reflection","--glass-edge-light"].includes(key);
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
    '--glass-nav-blur': '26.0px',
    '--glass-nav-shine': '35.0%',
    '--glass-reflection': '0.0%',
    '--glass-edge-light': '32.2%',
    '--glass-choice-tint': '32.0%',
    '--glass-choice-hover-tint': '40.0%',
    '--glass-choice-pressed-tint': '46.0%',
    '--glass-help-mix': '35.0%',
  });
});
test("glass press feedback becomes softer towards the transparent end and adds no extra movement at the opaque end",()=>{
  const clear=glassMotion(0),solid=glassMotion(100);
  assert.equal(solid.strength,0);assert.equal(solid.pressX,1);assert.equal(solid.popY,1);
  assert.ok(clear.pressY>=.85 && clear.pressY<.90);
  assert.ok(clear.popY>=1.09 && clear.popY<=1.12);
  for(let value=1;value<=100;value++) {
    const before=glassMotion(value-1),current=glassMotion(value);
    assert.ok(current.pressY>=before.pressY && current.popY<=before.popY);
    assert.ok(current.duration<=before.duration);
  }
});
test("touch feedback is stronger at every transparent setting and converges to the same solid behavior",()=>{
  for(let level=0;level<100;level++) {
    const mouse=glassMotion(level),touch=glassMotion(level,true);
    assert.ok(touch.pressY<mouse.pressY);
    assert.ok(touch.popY>mouse.popY);
    assert.ok(touch.duration>mouse.duration);
    assert.ok(touch.pressY>=.8 && touch.popY<=1.16);
  }
  assert.deepEqual(glassMotion(100,true),glassMotion(100));
});
