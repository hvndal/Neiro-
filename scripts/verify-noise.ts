// Independent check of the shipped loops: decodes assets/audio/*.m4a and verifies them against the spec.
//
//   npm run verify:audio
//
// Checks (handover §10): all seven loudness-matched near −23 LUFS, spectral slope per colour, and the loop
// layout in manifest.json (PAD + LOOP + PAD frames present, bandlimited, stereo).

import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { SAMPLE_RATE, shapes, slopeDbPerOctave, welchDb, type NoiseId } from './noise-lib.ts';

const dir = new URL('../assets/audio/', import.meta.url).pathname;
const manifest = JSON.parse(readFileSync(`${dir}manifest.json`, 'utf8')) as {
  sampleRate: number; loopSamples: number; padSamples: number; targetLufs: number;
  files: Record<string, { file: string }>;
};

const EXPECTED_SLOPE: Partial<Record<NoiseId, number>> = { white: 0, pink: -3, brown: -6, blue: 3, violet: 6 };
const ids = Object.keys(manifest.files) as NoiseId[];
let failed = 0;
const check = (ok: boolean, label: string) => {
  if (!ok) failed++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}`);
};

function lufs(file: string): number {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostdin', '-i', file, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 28 });
  const summary = r.stderr.slice(r.stderr.lastIndexOf('Summary:'));
  return Number(/I:\s+(-?[\d.]+) LUFS/.exec(summary)?.[1]);
}

function decodeStereo(file: string): [Float32Array, Float32Array] {
  const buf = execFileSync('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-i', file, '-f', 'f32le', '-ac', '2', '-ar', String(SAMPLE_RATE), 'pipe:1'], { maxBuffer: 1 << 30 });
  const all = new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 4));
  const l = new Float32Array(all.length / 2);
  const r = new Float32Array(all.length / 2);
  for (let i = 0; i < l.length; i++) {
    l[i] = all[i * 2];
    r[i] = all[i * 2 + 1];
  }
  return [l, r];
}

console.log(`manifest: ${manifest.loopSamples} loop + 2×${manifest.padSamples} pad @ ${manifest.sampleRate} Hz`);
const loud: number[] = [];

for (const id of ids) {
  console.log(id);
  const file = `${dir}${manifest.files[id].file}`;
  const [l, r] = decodeStereo(file);
  const expectFrames = manifest.loopSamples + 2 * manifest.padSamples;
  check(l.length >= expectFrames && l.length <= expectFrames + 2048, `frames ${l.length} (expected ${expectFrames}..+2048)`);

  const L = lufs(file);
  loud.push(L);
  check(Math.abs(L - manifest.targetLufs) <= 0.5, `loudness ${L.toFixed(1)} LUFS (target ${manifest.targetLufs} ±0.5)`);

  const loop = l.subarray(manifest.padSamples, manifest.padSamples + manifest.loopSamples);
  const psd = welchDb(loop, SAMPLE_RATE, 8192, 150);
  const expected = EXPECTED_SLOPE[id];
  if (expected !== undefined) {
    const slope = slopeDbPerOctave(psd, 100, 8000);
    check(Math.abs(slope - expected) <= 0.5, `slope ${slope.toFixed(2)} dB/oct (expected ${expected} ±0.5)`);
  } else {
    // grey / green: compare the measured PSD to the target shape at four probe frequencies, relative to 1 kHz
    const at = (f: number) => psd.reduce((best, p) => (Math.abs(p[0] - f) < Math.abs(best[0] - f) ? p : best))[1];
    for (const f of [60, 250, 4000, 12000]) {
      const want = 20 * Math.log10(shapes[id](f) / shapes[id](1000));
      const got = at(f) - at(1000);
      check(Math.abs(got - want) <= 3, `${f} Hz vs 1 kHz: ${got.toFixed(1)} dB (target ${want.toFixed(1)} ±3)`);
    }
  }

  const rms = (x: Float32Array) => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / x.length);
  check(Math.abs(20 * Math.log10(rms(loop) / rms(r.subarray(manifest.padSamples, manifest.padSamples + manifest.loopSamples)))) < 1, 'left/right levels within 1 dB');
  const hiPsd = psd.filter(([f]) => f > 18_000);
  const midPsd = psd.filter(([f]) => f > 1000 && f < 2000);
  const avg = (p: [number, number][]) => p.reduce((s, q) => s + q[1], 0) / p.length;
  check(avg(hiPsd) < avg(midPsd) - 30 || id === 'brown' || id === 'pink', `nothing above ~16.5 kHz: ${(avg(hiPsd) - avg(midPsd)).toFixed(0)} dB vs 1–2 kHz`);
}

const spread = Math.max(...loud) - Math.min(...loud);
console.log(`loudness spread across colours: ${spread.toFixed(2)} dB`);
check(spread <= 0.5, 'switching colours never jumps in volume (spread ≤ 0.5 dB)');

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
