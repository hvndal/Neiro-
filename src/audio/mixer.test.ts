import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  CROSSFADE_MS, FADE_IN_MS, LOOP_XFADE_SEC, FADE_OUT_MS, SLEEP_FADE_MS, handoverAt, handoverGains, handoverProgress, nextCopyStart,
  sleepGain, stepLevel, targetLevels, volumeFor, type MixIntent,
} from './mixer.ts';

const base: MixIntent = { noiseId: 'pink', playing: true, mix: null, audition: null, sleepEndsAt: null, sleepFade: true };
const T = 1_000_000;

test('paused: silence; playing: the chosen colour', () => {
  assert.deepEqual(targetLevels({ ...base, playing: false }, T), {});
  assert.deepEqual(targetLevels(base, T), { pink: 1 });
});

test('a mix keeps total power constant, and "a lot" is louder than "a little"', () => {
  for (const amount of [0.25, 0.5, 0.75]) {
    const g = targetLevels({ ...base, mix: { id: 'white', amount } }, T);
    assert.ok(Math.abs((g.pink ?? 0) + (g.white ?? 0) - 1) < 1e-9, `amount ${amount}`);
  }
  const lo = targetLevels({ ...base, mix: { id: 'white', amount: 0.25 } }, T).white!;
  const hi = targetLevels({ ...base, mix: { id: 'white', amount: 0.75 } }, T).white!;
  assert.ok(hi > lo);
  assert.deepEqual(targetLevels({ ...base, mix: { id: 'pink', amount: 0.5 } }, T), { pink: 1 }); // mixing a colour with itself
});

test('sleep timer: full volume, then a straight fade over the last minute, then silence', () => {
  const end = T + 10 * 60_000;
  const g = (now: number) => targetLevels({ ...base, sleepEndsAt: end }, now).pink ?? 0;
  assert.equal(g(T), 1);
  assert.equal(g(end - SLEEP_FADE_MS), 1);
  assert.ok(Math.abs(g(end - SLEEP_FADE_MS / 2) - 0.5) < 1e-9);
  assert.equal(g(end), 0);
  assert.equal(sleepGain({ sleepEndsAt: end, sleepFade: false }, end - 1000), 1); // fade switched off
});

test('an audition plays alone, even when paused, and ends on time', () => {
  const a = { id: 'violet' as const, endsAt: T + 10_000 };
  assert.deepEqual(targetLevels({ ...base, playing: false, audition: a }, T), { violet: 1 });
  assert.deepEqual(targetLevels({ ...base, audition: a, mix: { id: 'white', amount: 0.5 } }, T + 1), { violet: 1 });
  assert.deepEqual(targetLevels({ ...base, playing: false, audition: a }, T + 10_000), {});
});

test('levels ramp at the specified rates and never overshoot', () => {
  assert.equal(stepLevel(0, 1, FADE_IN_MS / 2), 0.5);
  assert.equal(stepLevel(1, 0, FADE_OUT_MS / 4), 0.75);
  assert.equal(stepLevel(0.9, 1, 5000), 1);
  assert.equal(stepLevel(0.1, 0, 5000), 0);
  assert.equal(stepLevel(0.4, 0.4, 100), 0.4);
});

test('colour change: old and new levels crossfade with constant power', () => {
  // old ramps down, new ramps up over the crossfade, both at the same linear rate
  for (let ms = 0; ms <= CROSSFADE_MS; ms += 100) {
    const out = stepLevel(1, 0, ms, CROSSFADE_MS, CROSSFADE_MS);
    const inn = stepLevel(0, 1, ms, CROSSFADE_MS, CROSSFADE_MS);
    assert.ok(Math.abs(out + inn - 1) < 1e-9);
    assert.ok(Math.abs(volumeFor(out) ** 2 + volumeFor(inn) ** 2 - 1) < 1e-9); // √level → equal power
  }
});

test('the engine\'s loop crossfade fits inside the real files\' padding', () => {
  const m = JSON.parse(readFileSync(new URL('../../assets/audio/manifest.json', import.meta.url), 'utf8'));
  const padSec = m.padSamples / m.sampleRate;
  const loopSec = m.loopSamples / m.sampleRate;
  assert.ok(LOOP_XFADE_SEC < padSec, `crossfade ${LOOP_XFADE_SEC}s must be shorter than the ${padSec}s pad`);
  assert.ok(nextCopyStart({ padSec, loopSec, xfadeSec: LOOP_XFADE_SEC }) > 0.1); // clear of AAC priming at the file start
});

test('handover maths with a pad longer than the crossfade', () => {
  const t = { padSec: 2, loopSec: 60, xfadeSec: 1.5 };
  assert.equal(handoverAt(t), 60.5); // pad + loop − xfade
  assert.equal(nextCopyStart(t), 0.5); // pad − xfade, inside the file
  // phase check: copy A at the handover point and copy B at its start are the same point of the periodic signal
  const phase = (pos: number) => (((pos - t.padSec) % t.loopSec) + t.loopSec) % t.loopSec;
  assert.ok(Math.abs(phase(handoverAt(t)) - phase(nextCopyStart(t))) < 1e-9);
  assert.equal(handoverProgress(50, t), 0);
  assert.equal(handoverProgress(61.25, t), 0.5);
  assert.equal(handoverProgress(70, t), 1);
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const g = handoverGains(p);
    assert.ok(Math.abs(g.out ** 2 + g.in ** 2 - 1) < 1e-9);
  }
});
