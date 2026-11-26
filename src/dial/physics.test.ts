import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DETENT, MAX_ANGLE, MAX_STRETCH, MIN_ANGLE, SENSITIVITY, SUBTICK, angleFor, angleOf, crossings, indexAt, rubberBand,
  settleIndex, shortestDelta,
} from './physics.ts';

test('seven colours span −90° to +90° in 30° detents', () => {
  assert.equal(DETENT * 6, MAX_ANGLE - MIN_ANGLE);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(angleFor), [-90, -60, -30, 0, 30, 60, 90]);
  assert.equal(indexAt(-90), 0);
  assert.equal(indexAt(0), 3);
  assert.equal(indexAt(14), 3);
  assert.equal(indexAt(16), 4);
  assert.equal(indexAt(500), 6); // clamps
});

test('angleOf is clockwise from 12 o’clock', () => {
  assert.equal(Math.round(angleOf(100, 0, 0, 0)), 90); // right of centre
  assert.equal(Math.round(angleOf(0, -100, 0, 0)), 0); // above centre
  assert.equal(Math.round(angleOf(-100, 0, 0, 0)), -90); // left
  assert.equal(Math.abs(Math.round(angleOf(0, 100, 0, 0))), 180); // below
});

test('shortestDelta wraps across ±180°', () => {
  assert.equal(shortestDelta(170, -170), 20);
  assert.equal(shortestDelta(-170, 170), -20);
  assert.equal(shortestDelta(10, 40), 30);
});

test('rubber band: 1:1 inside, bounded stretch outside, monotonic', () => {
  assert.equal(rubberBand(25), 25);
  assert.equal(rubberBand(MAX_ANGLE), MAX_ANGLE);
  let last = MAX_ANGLE;
  for (const over of [5, 20, 60, 200, 5000]) {
    const v = rubberBand(MAX_ANGLE + over);
    assert.ok(v > last - 1e-9 && v <= MAX_ANGLE + MAX_STRETCH, `over ${over}: ${v}`);
    last = v;
  }
  assert.ok(Math.abs(rubberBand(MIN_ANGLE - 5000) - (MIN_ANGLE - MAX_STRETCH)) < 0.5);
});

test('slow feel: one colour needs a deliberate sweep of the finger', () => {
  assert.ok(SENSITIVITY < 1);
  const fingerDegreesPerColour = DETENT / SENSITIVITY;
  assert.ok(fingerDegreesPerColour >= 40 && fingerDegreesPerColour <= 70, `${fingerDegreesPerColour}`);
});

test('release settles to the nearest detent; a flick carries one colour at most', () => {
  assert.equal(settleIndex(-60 + 10), 1); // closer to −60 than −30
  assert.equal(settleIndex(-60 + 16), 2);
  assert.equal(settleIndex(-60 + 10, 400), 2); // flick pushes past the midpoint
  assert.equal(settleIndex(0, 10_000), 3); // a flick alone cannot leave a detent (nudge is capped below the midpoint)
  assert.equal(settleIndex(2, 10_000), 4); // ...but a flick after turning a little carries on
  assert.equal(settleIndex(-2, -10_000), 2);
  assert.equal(settleIndex(2, 10_000) - 3, 1); // never skips two colours
});

test('haptic ticks: 5 light ticks and 1 latch per colour, none outside the dial', () => {
  const c = crossings(-60, -30);
  assert.equal(c.sub + c.detent, DETENT / SUBTICK); // 5 boundaries entered: −54…−30
  assert.equal(c.detent, 1);
  assert.equal(c.sub, 4);
  const whole = crossings(MIN_ANGLE, MAX_ANGLE);
  assert.equal(whole.detent, 6); // every detent after the first
  assert.equal(whole.sub, 6 * 4);
  assert.deepEqual(crossings(10, 10.5), { sub: 0, detent: 0 });
  assert.deepEqual(crossings(95, 120), { sub: 0, detent: 0 }); // stretching past the end is silent
  assert.deepEqual(crossings(-30, -60), crossings(-60, -30)); // direction-independent
});
