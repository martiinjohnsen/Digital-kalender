import test from "node:test";
import assert from "node:assert/strict";
import { fieldScrollOffset } from "../src/lib/dialog-layout.ts";

test("a quiz field hidden beneath the keyboard is moved into the visible dialog area", () => {
  assert.equal(fieldScrollOffset({ top: 140, bottom: 410 }, { top: 510, bottom: 558 }), 164);
});
test("a field already visible stays in place while typing", () => {
  assert.equal(fieldScrollOffset({ top: 140, bottom: 410 }, { top: 200, bottom: 248 }), 0);
});
test("fields above the scroll area are brought back below its fixed header", () => {
  assert.equal(fieldScrollOffset({ top: 140, bottom: 410 }, { top: 100, bottom: 148 }), -56);
});
test("a tall textarea is aligned by its top instead of repeatedly scrolling between its ends", () => {
  assert.equal(fieldScrollOffset({ top: 140, bottom: 260 }, { top: 180, bottom: 450 }), 24);
  assert.equal(fieldScrollOffset({ top: 140, bottom: 260 }, { top: 156, bottom: 426 }), 0);
});
