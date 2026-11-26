// Pure mixing maths for the audio engine. No players, no clocks: given the intent (src/state/player.ts) it says
// how loud each colour should be, and how a loop hands over to its own copy. Tested because nothing here can be
// heard in CI.

import type { NoiseId } from '../theme/tokens';

export type Gains = Partial<Record<NoiseId, number>>;

export type MixIntent = {
  noiseId: NoiseId;
  playing: boolean;
  mix: { id: NoiseId; amount: number } | null;
  audition: { id: NoiseId; endsAt: number } | null;
  sleepEndsAt: number | null;
  sleepFade: boolean;
};

export const SLEEP_FADE_MS = 60_000; // fade over the last minute of the sleep timer
export const FADE_IN_MS = 1200; // handover §9: play fades in over 1.2 s
export const FADE_OUT_MS = 800; //                pause fades out over 0.8 s
export const CROSSFADE_MS = 1200; //               colour change crossfades over 1.2 s, never a hard cut
export const LOOP_XFADE_SEC = 0.8; //             loop handover; must fit inside the 1 s file padding

/** Master gain from the sleep timer: 1 until the last minute, then a straight line to 0. */
export function sleepGain(intent: Pick<MixIntent, 'sleepEndsAt' | 'sleepFade'>, now: number): number {
  if (intent.sleepEndsAt === null) return 1;
  if (!intent.sleepFade) return 1;
  const left = intent.sleepEndsAt - now;
  if (left >= SLEEP_FADE_MS) return 1;
  return Math.max(0, left / SLEEP_FADE_MS);
}

/**
 * Target *power* level (0–1) for each colour. A second colour is balanced for equal total power, so adding a mix
 * never makes the sound louder. An audition (a locked colour from the Pro sheet) takes over completely.
 */
export function targetLevels(intent: MixIntent, now: number): Gains {
  if (intent.audition && now < intent.audition.endsAt) return { [intent.audition.id]: 1 };
  if (!intent.playing) return {};
  const master = sleepGain(intent, now);
  if (master <= 0) return {};
  if (!intent.mix || intent.mix.id === intent.noiseId) return { [intent.noiseId]: master };
  const a = intent.mix.amount;
  const norm = 1 / (1 + a * a);
  return { [intent.noiseId]: master * norm, [intent.mix.id]: master * a * a * norm };
}

/** Move a power level toward its target at a fixed rate (full scale in `upMs` / `downMs`). */
export function stepLevel(level: number, target: number, dtMs: number, upMs = FADE_IN_MS, downMs = FADE_OUT_MS): number {
  if (level === target) return level;
  const step = dtMs / (target > level ? upMs : downMs);
  return target > level ? Math.min(target, level + step) : Math.max(target, level - step);
}

/** Players take amplitude, and crossfading uncorrelated noise needs equal power: volume = √level. */
export const volumeFor = (level: number): number => Math.sqrt(Math.max(0, Math.min(1, level)));

// ---------------------------------------------------------------------------------------------
// Seamless loop: a file is [PAD tail][LOOP][PAD head] (assets/audio/manifest.json). The signal is periodic over
// LOOP, so playing [PAD, PAD+LOOP) and handing over to a second copy of the file at the boundary is seamless.
// Copy B is started `xfade` seconds before A reaches PAD+LOOP, seeked to PAD−xfade (same phase as A there).
// ---------------------------------------------------------------------------------------------

export type LoopTiming = { padSec: number; loopSec: number; xfadeSec: number };

/** Where the next copy starts (seconds into its file). */
export const nextCopyStart = (t: LoopTiming) => t.padSec - t.xfadeSec;

/** When (position of the playing copy) the handover begins. */
export const handoverAt = (t: LoopTiming) => t.padSec + t.loopSec - t.xfadeSec;

/** Handover progress 0–1 for the playing copy's position (0 before the handover begins). */
export function handoverProgress(pos: number, t: LoopTiming): number {
  return Math.max(0, Math.min(1, (pos - handoverAt(t)) / t.xfadeSec));
}

/** Equal-power gains for the outgoing and incoming copies at progress p. */
export function handoverGains(p: number): { out: number; in: number } {
  return { out: Math.cos((p * Math.PI) / 2), in: Math.sin((p * Math.PI) / 2) };
}
