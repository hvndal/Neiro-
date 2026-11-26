import { noiseById, type NoiseId } from '../theme/tokens.ts';

export type RGB = [number, number, number]; // 0–1

export const hexToRgb = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export const rgbToHex = ([r, g, b]: RGB) =>
  '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export type WashColours = { base: RGB; deep: RGB; light: RGB };

const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export const luminance = ([r, g, b]: RGB) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
export const contrast = (a: RGB, b: RGB) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Mix `from` toward `to` by up to `maxT`, stopping early if text contrast would fall under `min`. */
function limitedMix(from: RGB, to: RGB, maxT: number, text: RGB, min: number): RGB {
  let t = maxT;
  while (t > 0 && contrast(text, mix(from, to, t)) < min) t -= 0.005;
  return mix(from, to, Math.max(t, 0));
}

/** Large bold text only on violet (handover §4); everything else is held to body-text contrast. */
export const minContrast = (id: NoiseId) => (id === 'violet' ? 3 : 4.5);

/**
 * The three tones the living wash moves between. Kept tight on purpose: the shader may only wander within
 * this range, so text contrast on the wash holds at *every* frame (checked in colours.test.ts), not just at rest.
 * Each tone is pushed as far as legibility allows, no further. Dark washes (brown) stay dark.
 */
export function washColours(id: NoiseId): WashColours {
  const n = noiseById(id);
  const base = hexToRgb(n.hex);
  const text = hexToRgb(n.on);
  const min = minContrast(id) + 0.05;
  const dark = n.on !== '#15171D';
  return dark
    ? { base, deep: limitedMix(base, [0, 0, 0], 0.14, text, min), light: limitedMix(base, [1, 1, 1], 0.1, text, min) }
    : { base, deep: limitedMix(base, [0, 0, 0], 0.07, text, min), light: limitedMix(base, [1, 1, 1], 0.2, text, min) };
}

const PAPER: RGB = hexToRgb('#F7F5F0');

/**
 * Soft wash for browsing screens (Programs, Customise, Pro, sheets): paper tinted by the playing colour,
 * so glass has something to show and the app keeps one identity (handover §8). Ink and muted text must
 * stay legible on every tone (colours.test.ts).
 */
export function softWashColours(id: NoiseId): WashColours {
  const n = hexToRgb(noiseById(id).hex);
  return { base: mix(PAPER, n, 0.12), deep: mix(PAPER, n, 0.26), light: mix(PAPER, [1, 1, 1], 0.7) };
}
