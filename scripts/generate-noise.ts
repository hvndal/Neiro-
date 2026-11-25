// Generates the seven neiro noise loops → assets/audio/<colour>.m4a (+ manifest.json, src/audio/sources.ts).
//
//   npm run gen:audio
//
// Requires ffmpeg on PATH. Deterministic: same seeds → same PCM. Takes a couple of minutes.
//
// Loop layout (what the audio engine in step 4 relies on, recorded in manifest.json):
//   file = [ PAD samples of the loop's tail ] [ LOOP samples ] [ PAD samples of the loop's head ]
// The signal is exactly periodic (LOOP samples), so the engine plays [PAD, PAD+LOOP) and overlaps a
// second player across the boundary; the pads exist so AAC priming/padding never lands inside the loop.

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LOOP_SAMPLES, SAMPLE_RATE, fft, hashSeed, synthLoop, wavFloat32, type NoiseId } from './noise-lib.ts';

const ALL_IDS: NoiseId[] = ['white', 'pink', 'brown', 'green', 'blue', 'violet', 'grey'];
// Experiment hooks: NEIRO_ONLY=blue,violet  NEIRO_AAC="-q:a 1 -cutoff 16000"  (output still goes to assets/audio)
const IDS = (process.env.NEIRO_ONLY?.split(',') as NoiseId[] | undefined) ?? ALL_IDS;
const TARGET_LUFS = -23;
const MAX_TRUE_PEAK_DB = -1.5;
const PAD = SAMPLE_RATE; // 1 s each side
// VBR q1: ~1.2 MB per 62 s loop. CBR 128k let the high bands wander by ~1 dB over the file (audible as a
// slow timbre change at each loop pass); VBR q1 holds them within ~0.3 dB.
const AAC_QUALITY = '1';
const AAC_ARGS = process.env.NEIRO_AAC?.split(' ') ?? ['-q:a', AAC_QUALITY];
const MAX_LEVEL_DRIFT_DB = 0.75;

const OUT_DIR = new URL('../assets/audio/', import.meta.url).pathname;
const SOURCES_TS = new URL('../src/audio/sources.ts', import.meta.url).pathname;

function ffmpeg(args: string[]): string {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostdin', ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`ffmpeg ${args.join(' ')}\n${r.stderr}`);
  return r.stderr;
}

function measure(file: string): { lufs: number; truePeak: number } {
  const err = ffmpeg(['-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const summary = err.slice(err.lastIndexOf('Summary:'));
  const lufs = Number(/I:\s+(-?[\d.]+) LUFS/.exec(summary)?.[1]);
  const truePeak = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(summary.slice(summary.indexOf('True peak')))?.[1]);
  if (Number.isNaN(lufs) || Number.isNaN(truePeak)) throw new Error(`could not parse loudness for ${file}:\n${summary}`);
  return { lufs, truePeak };
}

function decodeLeft(file: string): Float32Array {
  const buf = execFileSync('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-i', file, '-f', 'f32le', '-ac', '2', '-ar', String(SAMPLE_RATE), 'pipe:1'], {
    maxBuffer: 1 << 30,
  });
  const all = new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 4));
  const left = new Float32Array(all.length / 2);
  for (let i = 0; i < left.length; i++) left[i] = all[i * 2];
  return left;
}

function bestLag(ref: Float32Array, dec: Float32Array, maxLag = 4000): number {
  const start = 200_000;
  const win = 8192;
  let best = 0;
  let bestScore = -Infinity;
  for (let lag = -maxLag; lag <= maxLag; lag++) {
    let s = 0;
    for (let i = 0; i < win; i++) s += ref[start + i] * dec[start + i + lag];
    if (s > bestScore) {
      bestScore = s;
      best = lag;
    }
  }
  return best;
}

function bandLevels(x: Float32Array, start: number, size: number, bands: [number, number][]): number[] {
  const acc = bands.map(() => 0);
  const blocks = 12;
  for (let b = 0; b < blocks; b++) {
    const re = new Float64Array(size);
    const im = new Float64Array(size);
    for (let i = 0; i < size; i++) re[i] = x[start + b * size + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / size));
    fft(re, im);
    bands.forEach(([lo, hi], j) => {
      let t = 0;
      let c = 0;
      for (let k = 1; k < size / 2; k++) {
        const f = (k * SAMPLE_RATE) / size;
        if (f >= lo && f < hi) {
          t += re[k] * re[k] + im[k] * im[k];
          c++;
        }
      }
      acc[j] += (10 * Math.log10(t / c + 1e-30)) / blocks;
    });
  }
  return acc;
}

/**
 * Audible loop-timbre check: at six points along the engine region [PAD, PAD+LOOP), how far does the
 * codec move each band's level away from the source's? Returns the spread (max − min, dB) of that
 * decoded-minus-source error per band, worst band wins. Comparing to the source cancels the signal's own
 * natural variation (large for brown's few low bins), leaving only what AAC adds.
 */
function levelDriftDb(dec: Float32Array, ref: Float32Array): number {
  const size = 8192;
  const bands: [number, number][] = [[100, 1000], [1000, 4000], [4000, 8000], [8000, 12000]];
  const positions = [0.02, 0.2, 0.4, 0.6, 0.8, 0.97].map((p) => PAD + Math.floor(p * (LOOP_SAMPLES - 12 * size)));
  const err = positions.map((start) => {
    const d = bandLevels(dec, start, size, bands);
    const r = bandLevels(ref, start, size, bands);
    return d.map((v, j) => v - r[j]);
  });
  return Math.max(...bands.map((_, j) => Math.max(...err.map((e) => e[j])) - Math.min(...err.map((e) => e[j]))));
}

const work = mkdtempSync(join(tmpdir(), 'neiro-audio-'));
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(new URL('../src/audio/', import.meta.url).pathname, { recursive: true });

type Entry = {
  file: string; lufs: number; truePeakDb: number; gainDb: number;
  bytes: number; aacLagSamples: number; extraDecodedFrames: number; levelDriftDb: number;
};
const manifestFiles: Record<string, Entry> = {};

try {
  for (const id of IDS) {
    const t0 = Date.now();
    const channels = [0, 1].map((c) => synthLoop(id, LOOP_SAMPLES, SAMPLE_RATE, hashSeed(`neiro:${id}:${c}`)));

    // Normalise to a sane working level, then build the padded buffers (exact periodic extension).
    const rms = Math.sqrt(channels[0].reduce((s, v) => s + v * v, 0) / LOOP_SAMPLES);
    const work32 = channels.map((ch) => {
      const out = new Float32Array(PAD + LOOP_SAMPLES + PAD);
      for (let i = 0; i < out.length; i++) out[i] = (ch[(i - PAD + LOOP_SAMPLES) % LOOP_SAMPLES] / rms) * 0.1;
      return out;
    });

    const probe = join(work, `${id}-probe.wav`);
    writeFileSync(probe, wavFloat32(work32, SAMPLE_RATE));
    const before = measure(probe);

    let gainDb = TARGET_LUFS - before.lufs;
    const peakAfter = before.truePeak + gainDb;
    if (peakAfter > MAX_TRUE_PEAK_DB) gainDb -= peakAfter - MAX_TRUE_PEAK_DB;
    const g = 10 ** (gainDb / 20);
    const final32 = work32.map((ch) => ch.map((v) => v * g));

    const finalWav = join(work, `${id}.wav`);
    writeFileSync(finalWav, wavFloat32(final32, SAMPLE_RATE));
    const outFile = join(OUT_DIR, `${id}.m4a`);
    ffmpeg(['-y', '-i', finalWav, '-c:a', 'aac', ...AAC_ARGS, '-ar', String(SAMPLE_RATE), '-ac', '2', '-movflags', '+faststart', outFile]);

    // What did AAC do to the loop edges? Decode back and compare against the PCM we encoded.
    const decoded = decodeLeft(outFile);
    const lag = bestLag(final32[0], decoded);
    const extra = decoded.length - final32[0].length;
    const drift = levelDriftDb(decoded, final32[0]);
    if (drift > MAX_LEVEL_DRIFT_DB && !process.env.NEIRO_ONLY) throw new Error(`${id}: band level drifts ${drift.toFixed(2)} dB along the loop (max ${MAX_LEVEL_DRIFT_DB})`);
    if (lag !== 0) throw new Error(`${id}: AAC decode is offset by ${lag} samples — the engine's pad layout assumes 0`);

    const after = measure(outFile);
    manifestFiles[id] = {
      file: `${id}.m4a`,
      lufs: Math.round(after.lufs * 10) / 10,
      truePeakDb: Math.round(after.truePeak * 10) / 10,
      gainDb: Math.round(gainDb * 10) / 10,
      bytes: statSync(outFile).size,
      aacLagSamples: lag,
      extraDecodedFrames: extra,
      levelDriftDb: Math.round(drift * 100) / 100,
    };
    console.log(
      `${id.padEnd(7)} ${((Date.now() - t0) / 1000).toFixed(1)}s  ${after.lufs.toFixed(1)} LUFS  tp ${after.truePeak.toFixed(1)} dB  ` +
        `lag ${lag}  +${extra} frames  drift ${drift.toFixed(2)} dB  ${(manifestFiles[id].bytes / 1e6).toFixed(2)} MB`,
    );
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

writeFileSync(
  join(OUT_DIR, 'manifest.json'),
  JSON.stringify(
    {
      sampleRate: SAMPLE_RATE,
      loopSamples: LOOP_SAMPLES,
      padSamples: PAD,
      channels: 2,
      codec: `aac vbr q${AAC_QUALITY}`,
      targetLufs: TARGET_LUFS,
      note: 'File = [PAD tail copy][LOOP][PAD head copy]. Signal is exactly periodic over LOOP samples. Play [PAD, PAD+LOOP) and crossfade (linear; the overlapped copies are identical) across the boundary.',
      files: manifestFiles,
    },
    null,
    2,
  ) + '\n',
);

const lines = IDS.map((id) => `  ${id}: require('../../assets/audio/${id}.m4a'),`).join('\n');
writeFileSync(
  SOURCES_TS,
  `// GENERATED by scripts/generate-noise.ts — do not edit.\nimport type { NoiseId } from '../theme/tokens';\n\n` +
    `export const NOISE_SOURCES: Record<NoiseId, number> = {\n${lines}\n};\n\n` +
    `export const LOOP = { sampleRate: ${SAMPLE_RATE}, loopSamples: ${LOOP_SAMPLES}, padSamples: ${PAD} } as const;\n`,
);
console.log('wrote manifest.json and src/audio/sources.ts');
