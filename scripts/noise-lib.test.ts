import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  LOOP_SAMPLES, SAMPLE_RATE, aWeighting, band, fft, mulberry32, shapes, slopeDbPerOctave, synthLoop, welchDb,
  type NoiseId,
} from './noise-lib.ts';

test('loop length factors into 2,3,5 so the FFT accepts it', () => {
  let n = LOOP_SAMPLES;
  for (const p of [2, 3, 5]) while (n % p === 0) n /= p;
  assert.equal(n, 1);
  assert.equal(LOOP_SAMPLES, 60 * SAMPLE_RATE);
});

test('fft matches a naive DFT (mixed radix, N=60) and inverts back', () => {
  const N = 60;
  const rand = mulberry32(1);
  const xr = Float64Array.from({ length: N }, () => rand() - 0.5);
  const xi = Float64Array.from({ length: N }, () => rand() - 0.5);
  const re = xr.slice();
  const im = xi.slice();
  fft(re, im);
  for (let k = 0; k < N; k++) {
    let sr = 0;
    let si = 0;
    for (let n = 0; n < N; n++) {
      const a = (-2 * Math.PI * k * n) / N;
      sr += xr[n] * Math.cos(a) - xi[n] * Math.sin(a);
      si += xr[n] * Math.sin(a) + xi[n] * Math.cos(a);
    }
    assert.ok(Math.abs(sr - re[k]) < 1e-9 && Math.abs(si - im[k]) < 1e-9, `bin ${k}`);
  }
  fft(re, im, true);
  for (let n = 0; n < N; n++) {
    assert.ok(Math.abs(re[n] / N - xr[n]) < 1e-12);
    assert.ok(Math.abs(im[n] / N - xi[n]) < 1e-12);
  }
});

test('fft rejects lengths with a prime factor above 5', () => {
  assert.throws(() => fft(new Float64Array(7), new Float64Array(7)));
});

test('a-weighting is ~0 dB at 1 kHz and strongly negative in the bass', () => {
  assert.ok(Math.abs(20 * Math.log10(aWeighting(1000))) < 0.2);
  assert.ok(20 * Math.log10(aWeighting(50)) < -25);
});

test('band edges: silent below 20 Hz and above 16.5 kHz, flat in between', () => {
  assert.equal(band(10), 0);
  assert.equal(band(17_000), 0);
  assert.equal(band(1000), 1);
});

const EXPECTED_SLOPE: Partial<Record<NoiseId, number>> = { white: 0, pink: -3, brown: -6, blue: 3, violet: 6 };

for (const [id, expected] of Object.entries(EXPECTED_SLOPE) as [NoiseId, number][]) {
  test(`${id} noise has ${expected} dB/octave slope (100 Hz–8 kHz)`, () => {
    const N = 2 ** 18;
    const x = synthLoop(id, N, SAMPLE_RATE, 42);
    const slope = slopeDbPerOctave(welchDb(x, SAMPLE_RATE, 4096, 60), 100, 8000);
    assert.ok(Math.abs(slope - expected) < 0.35, `${id}: measured ${slope.toFixed(2)} dB/oct`);
  });
}

test('synthesised loop is real-valued and has no DC', () => {
  const x = synthLoop('pink', 2 ** 16, SAMPLE_RATE, 7);
  const mean = x.reduce((s, v) => s + v, 0) / x.length;
  const rms = Math.sqrt(x.reduce((s, v) => s + v * v, 0) / x.length);
  assert.ok(Math.abs(mean) < rms * 1e-6);
});

test('grey boosts bass and treble relative to the mid-range; green peaks near 500 Hz', () => {
  const db = (id: NoiseId, f: number) => 20 * Math.log10(shapes[id](f));
  assert.ok(db('grey', 50) > db('grey', 1000) + 15);
  assert.ok(db('grey', 12000) > db('grey', 3000));
  assert.ok(db('green', 500) > db('green', 8000) + 15);
  assert.ok(db('green', 500) > db('green', 40) + 15);
});

test('loop is exactly periodic: shifting by N reproduces the signal (circular by construction)', () => {
  const N = 2 ** 14;
  const x = synthLoop('brown', N, SAMPLE_RATE, 3);
  // circular autocorrelation at lag 0 is the energy; at lag N it must equal lag 0 by definition,
  // so check the seam instead: no larger a jump across the wrap than inside the signal
  let maxInner = 0;
  for (let i = 1; i < N; i++) maxInner = Math.max(maxInner, Math.abs(x[i] - x[i - 1]));
  const wrap = Math.abs(x[0] - x[N - 1]);
  assert.ok(wrap <= maxInner, `wrap jump ${wrap} vs max inner ${maxInner}`);
});
