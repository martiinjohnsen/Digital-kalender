import test from "node:test";
import assert from "node:assert/strict";
import { navigationScroll, type NavigationScroll } from "../src/lib/mobile-navigation.ts";

const expanded: NavigationScroll = { y: 0, anchor: 0, direction: 0, compact: false };

test("the navigation shrinks while scrolling down and expands after scrolling back up", () => {
  let state = navigationScroll(expanded, 100, 1000);
  assert.equal(state.compact, true);
  state = navigationScroll(state, 140, 1000);
  state = navigationScroll(state, 135, 1000);
  assert.equal(state.compact, true);
  state = navigationScroll(state, 128, 1000);
  assert.equal(state.compact, false);
  state = navigationScroll(state, 150, 1000);
  assert.equal(state.compact, true);
});

test("small scroll fluctuations do not make the navigation flicker", () => {
  let state = navigationScroll(expanded, 100, 1000);
  for (const y of [99, 101, 98, 102, 100]) {
    state = navigationScroll(state, y, 1000);
    assert.equal(state.compact, true);
  }
});

test("the navigation is always expanded near the top or on a page without scrolling", () => {
  const compact = navigationScroll(expanded, 200, 1000);
  assert.equal(navigationScroll(compact, 30, 1000).compact, false);
  assert.equal(navigationScroll(compact, 200, 0).compact, false);
});

test("slow fractional scrolling still accumulates enough movement to shrink the navigation", () => {
  let state: NavigationScroll = { y: 100, anchor: 100, direction: 0, compact: false };
  for (let step = 1; step <= 60; step++)
    state = navigationScroll(state, 100 + step * 0.4, 1000);
  assert.equal(state.compact, true);
});

test("iOS elastic scrolling past the page bottom cannot accidentally expand the navigation", () => {
  let state = navigationScroll(expanded, 500, 500);
  state = navigationScroll(state, 570, 500);
  state = navigationScroll(state, 530, 500);
  state = navigationScroll(state, 500, 500);
  assert.equal(state.compact, true);
  assert.equal(navigationScroll(state, 485, 500).compact, false);
});
