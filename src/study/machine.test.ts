import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  advance, clockMs, formatClock, initialStudy, isPaused, isRunning, pause, restart, resume, selectMode, skip, start,
} from './machine.ts';

const MIN = 60_000;
const T = 1_700_000_000_000;

test('pomodoro: 4 × (25 focus + 5 break), no break after the last session', () => {
  let s = start(initialStudy('pomodoro'), T);
  assert.equal(s.phase, 'focus');
  assert.equal(s.endsAt, T + 25 * MIN);
  s = advance(s, T + 25 * MIN);
  assert.deepEqual([s.phase, s.session, s.endsAt], ['break', 1, T + 30 * MIN]);
  s = advance(s, T + 30 * MIN);
  assert.deepEqual([s.phase, s.session], ['focus', 2]);
  s = advance(s, T + 4 * 30 * MIN); // everything has elapsed
  assert.equal(s.phase, 'done');
  assert.equal(s.focusedMs, 4 * 25 * MIN);
});

test('waking up late lands on the right phase and minute (chains from scheduled ends)', () => {
  // focus1 0–25, break1 25–30, focus2 30–55, break2 55–60, focus3 60–85: one call walks every boundary
  const s = advance(start(initialStudy('pomodoro'), T), T + 61 * MIN);
  assert.deepEqual([s.phase, s.session, s.endsAt], ['focus', 3, T + 85 * MIN]);
  assert.equal(clockMs(s, T + 61 * MIN), 24 * MIN);
  assert.equal(s.focusedMs, 50 * MIN);
});

test('pause and resume keep the remaining time exactly', () => {
  let s = start(initialStudy('pomodoro'), T);
  s = pause(s, T + 10 * MIN);
  assert.ok(isPaused(s) && !isRunning(s));
  assert.equal(clockMs(s, T + 99 * MIN), 15 * MIN); // frozen while paused
  assert.equal(advance(s, T + 99 * MIN), s); // paused never advances
  s = resume(s, T + 40 * MIN);
  assert.equal(s.endsAt, T + 55 * MIN);
});

test('skip: focus → break → next focus; last focus → done', () => {
  let s = start(initialStudy('pomodoro'), T);
  s = skip(s, T + 5 * MIN);
  assert.deepEqual([s.phase, s.session], ['break', 1]);
  assert.equal(s.focusedMs, 5 * MIN);
  s = skip(s, T + 6 * MIN);
  assert.deepEqual([s.phase, s.session, s.endsAt], ['focus', 2, T + 31 * MIN]);
  s = { ...s, session: 4 };
  assert.equal(skip(s, T + 40 * MIN).phase, 'done');
});

test('flowtime counts up; the break is work ÷ 5', () => {
  let s = start(initialStudy('flowtime'), T);
  assert.equal(s.endsAt, null);
  assert.equal(clockMs(s, T + 50 * MIN), 50 * MIN);
  s = skip(s, T + 50 * MIN);
  assert.deepEqual([s.phase, s.endsAt], ['break', T + 60 * MIN]);
  s = pause(s, T + 52 * MIN);
  assert.equal(clockMs(s, T + 70 * MIN), 8 * MIN);
});

test('flowtime pause during focus freezes elapsed time', () => {
  let s = start(initialStudy('flowtime'), T);
  s = pause(s, T + 20 * MIN);
  assert.equal(clockMs(s, T + 90 * MIN), 20 * MIN);
  s = resume(s, T + 90 * MIN);
  assert.equal(clockMs(s, T + 95 * MIN), 25 * MIN);
});

test('restart resets the block; mode can only change when not running', () => {
  let s = start(initialStudy('pomodoro'), T);
  s = restart(s, T + 20 * MIN);
  assert.equal(s.endsAt, T + 45 * MIN);
  assert.equal(selectMode(s, '50-10').mode, 'pomodoro');
  assert.equal(selectMode(initialStudy('pomodoro'), '50-10').mode, '50-10');
});

test('idle shows the full focus length; clock formatting', () => {
  assert.equal(clockMs(initialStudy('52-17'), T), 52 * MIN);
  assert.equal(formatClock(25 * MIN), '25:00');
  assert.equal(formatClock(18 * MIN + 42_000), '18:42');
  assert.equal(formatClock(112 * MIN), '1:52:00');
  assert.equal(formatClock(59_400), '0:59');
});
