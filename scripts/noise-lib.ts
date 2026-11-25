// Offline noise synthesis for neiro (handover §10).
//
// Each colour is built in the frequency domain (random complex Gaussian bins shaped by a
// target magnitude curve) and inverse-FFT'd, so the time signal is *exactly periodic* over
// the loop length. That makes the PCM loop seamless by construction — no filter warm-up or
// seam crossfade needed. The AAC edge behaviour is handled separately (see generate-noise.ts).

export type NoiseId = 'white' | 'pink' | 'brown' | 'green' | 'blue' | 'violet' | 'grey';

export const SAMPLE_RATE = 48_000;
/** 60 s loop = 2,880,000 samples = 2^9 · 3^2 · 5^4, so the mixed-radix FFT below handles it. */
export const LOOP_SAMPLES = 60 * SAMPLE_RATE;

// ---------------------------------------------------------------------------------------------
// PRNG + Gaussian
// ---------------------------------------------------------------------------------------------

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-12);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

// ---------------------------------------------------------------------------------------------
// Mixed-radix (2, 3, 5) complex FFT
// ---------------------------------------------------------------------------------------------

function factorise(n: number): number[] {
  const factors: number[] = [];
  let rest = n;
  for (const p of [2, 3, 5]) {
    while (rest % p === 0) {
      factors.push(p);
      rest /= p;
    }
  }
  if (rest !== 1) throw new Error(`FFT length ${n} has a prime factor above 5`);
  return factors;
}

const tmpRe = new Float64Array(5);
const tmpIm = new Float64Array(5);

function rec(
  inRe: Float64Array, inIm: Float64Array, inOff: number, stride: number, n: number,
  outRe: Float64Array, outIm: Float64Array, outOff: number,
  factors: number[], level: number, N: number, cosT: Float64Array, sinT: Float64Array,
): void {
  if (n === 1) {
    outRe[outOff] = inRe[inOff];
    outIm[outOff] = inIm[inOff];
    return;
  }
  const p = factors[level];
  const m = n / p;
  for (let r = 0; r < p; r++) {
    rec(inRe, inIm, inOff + r * stride, stride * p, m, outRe, outIm, outOff + r * m, factors, level + 1, N, cosT, sinT);
  }
  const step = N / n;
  for (let k = 0; k < m; k++) {
    for (let r = 0; r < p; r++) {
      const idx = (r * k * step) % N;
      const c = cosT[idx];
      const s = sinT[idx];
      const xr = outRe[outOff + r * m + k];
      const xi = outIm[outOff + r * m + k];
      tmpRe[r] = xr * c - xi * s;
      tmpIm[r] = xr * s + xi * c;
    }
    for (let q = 0; q < p; q++) {
      let sr = 0;
      let si = 0;
      for (let r = 0; r < p; r++) {
        const idx = (r * q * m * step) % N;
        const c = cosT[idx];
        const s = sinT[idx];
        sr += tmpRe[r] * c - tmpIm[r] * s;
        si += tmpRe[r] * s + tmpIm[r] * c;
      }
      outRe[outOff + q * m + k] = sr;
      outIm[outOff + q * m + k] = si;
    }
  }
}

/** In-place complex FFT. The inverse is unnormalised (divide by N yourself). */
export function fft(re: Float64Array, im: Float64Array, inverse = false): void {
  const N = re.length;
  const factors = factorise(N);
  const sign = inverse ? 1 : -1;
  const cosT = new Float64Array(N);
  const sinT = new Float64Array(N);
  for (let k = 0; k < N; k++) {
    const a = (2 * Math.PI * k) / N;
    cosT[k] = Math.cos(a);
    sinT[k] = sign * Math.sin(a);
  }
  const outRe = new Float64Array(N);
  const outIm = new Float64Array(N);
  rec(re, im, 0, 1, N, outRe, outIm, 0, factors, 0, N, cosT, sinT);
  re.set(outRe);
  im.set(outIm);
}

// ---------------------------------------------------------------------------------------------
// Spectral shapes (magnitude vs frequency, arbitrary overall gain — loudness is matched later)
// ---------------------------------------------------------------------------------------------

/** IEC 61672 A-weighting magnitude (linear). ~1.0 at 1 kHz. */
export function aWeighting(f: number): number {
  const f2 = f * f;
  const num = 12194 ** 2 * f2 * f2;
  const den = (f2 + 20.6 ** 2) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2);
  return (num / den) * 1.2589; // +2.0 dB normalisation so A(1 kHz) = 0 dB
}

export const shapes: Record<NoiseId, (f: number) => number> = {
  white: () => 1,
  pink: (f) => 1 / Math.sqrt(f), // −3 dB / octave
  brown: (f) => 1 / f, // −6 dB / octave
  blue: (f) => Math.sqrt(f), // +3 dB / octave
  violet: (f) => f, // +6 dB / octave
  // Inverse equal-loudness (A-weighting as a stand-in for the ~40 phon contour), boost capped at 24 dB.
  grey: (f) => 1 / Math.max(aWeighting(f), 0.0631),
  // No standard definition: white, gently emphasising the mid-range around 500 Hz (±1.5 octaves),
  // with a −20 dB floor so it stays soft rather than a hard band-pass.
  green: (f) => Math.max(Math.exp(-0.5 * (Math.log2(f / 500) / 1.5) ** 2), 0.1),
};

/**
 * Keeps sub-audio rumble out and fixes the top end: high-pass 20→40 Hz, low-pass 15→16.5 kHz.
 * The low-pass sits below AAC's own cutoff, so the encoder never has to decide what to drop up there
 * (a floating encoder cutoff made blue/violet change brightness along the loop).
 */
export function band(f: number): number {
  if (f < 20 || f > 16_500) return 0;
  if (f < 40) return 0.5 - 0.5 * Math.cos((Math.PI * (f - 20)) / 20);
  if (f > 15_000) return 0.5 + 0.5 * Math.cos((Math.PI * (f - 15_000)) / 1_500);
  return 1;
}

/** One channel of exactly-periodic noise, length N, unit-less amplitude. */
export function synthLoop(id: NoiseId, N: number, sampleRate: number, seed: number): Float64Array {
  const rand = mulberry32(seed);
  const re = new Float64Array(N);
  const im = new Float64Array(N);
  const shape = shapes[id];
  const half = N / 2;
  for (let k = 1; k < half; k++) {
    const f = (k * sampleRate) / N;
    const mag = shape(f) * band(f);
    const a = gaussian(rand) * mag;
    const b = gaussian(rand) * mag;
    re[k] = a;
    im[k] = b;
    re[N - k] = a;
    im[N - k] = -b;
  }
  fft(re, im, true);
  // real part of a conjugate-symmetric spectrum; im is ~0
  return re;
}

// ---------------------------------------------------------------------------------------------
// Analysis helpers
// ---------------------------------------------------------------------------------------------

/** Welch PSD (dB) on blocks of `size` samples; returns [freqHz, dB] pairs for bins 1..size/2-1. */
export function welchDb(x: ArrayLike<number>, sampleRate: number, size = 8192, maxBlocks = 200): [number, number][] {
  const win = new Float64Array(size);
  for (let i = 0; i < size; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / size);
  const acc = new Float64Array(size / 2);
  const hop = Math.max(size, Math.floor((x.length - size) / maxBlocks));
  let blocks = 0;
  for (let start = 0; start + size <= x.length && blocks < maxBlocks; start += hop) {
    const re = new Float64Array(size);
    const im = new Float64Array(size);
    for (let i = 0; i < size; i++) re[i] = x[start + i] * win[i];
    fft(re, im);
    for (let k = 1; k < size / 2; k++) acc[k] += re[k] * re[k] + im[k] * im[k];
    blocks++;
  }
  const out: [number, number][] = [];
  for (let k = 1; k < size / 2; k++) out.push([(k * sampleRate) / size, 10 * Math.log10(acc[k] / blocks + 1e-30)]);
  return out;
}

/** Least-squares slope (dB per octave) of a PSD between two frequencies. */
export function slopeDbPerOctave(psd: [number, number][], lo: number, hi: number): number {
  const pts = psd.filter(([f]) => f >= lo && f <= hi).map(([f, db]) => [Math.log2(f), db] as const);
  const n = pts.length;
  const mx = pts.reduce((s, [x]) => s + x, 0) / n;
  const my = pts.reduce((s, [, y]) => s + y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const [x, y] of pts) {
    sxy += (x - mx) * (y - my);
    sxx += (x - mx) ** 2;
  }
  return sxy / sxx;
}

// ---------------------------------------------------------------------------------------------
// WAV (32-bit float, interleaved) writer
// ---------------------------------------------------------------------------------------------

export function wavFloat32(channels: Float32Array[], sampleRate: number): Buffer {
  const nCh = channels.length;
  const frames = channels[0].length;
  const dataBytes = frames * nCh * 4;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(3, 20); // IEEE float
  buf.writeUInt16LE(nCh, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * nCh * 4, 28);
  buf.writeUInt16LE(nCh * 4, 32);
  buf.writeUInt16LE(32, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataBytes, 40);
  let o = 44;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < nCh; c++) {
      buf.writeFloatLE(channels[c][i], o);
      o += 4;
    }
  }
  return buf;
}
