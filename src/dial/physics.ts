// Pure maths for the colour dial. Kept free of React / Reanimated so it can be unit-tested and run in worklets.
//
// Feel: heavy and slow, like a ratcheting rotary control (iPod wheel / Digital Crown):
//   - the knob turns at SENSITIVITY × the finger's angular travel, so changing colour takes a deliberate sweep
//   - a light tick ("trr") every SUBTICK degrees, a firmer latch at every detent (one per colour)
//   - past either end it stretches with growing resistance, then springs back (like a scroll view's bounce)
//   - on release it settles into the nearest detent

export const DETENT = 30; // degrees between colours (handover §7: 30° apart)
export const MIN_ANGLE = -90;
export const MAX_ANGLE = 90;
export const SUBTICK = 6; // 5 light ticks per colour
export const SENSITIVITY = 0.6; // knob degrees per finger degree: >1 would feel light, <1 feels heavy
export const MAX_STRETCH = 16; // degrees the knob may overshoot an end
export const DEAD_ZONE = 36; // px from centre where the touch angle is too noisy to use

const RAD = 180 / Math.PI;

/** Angle of a point around (cx, cy), degrees clockwise from 12 o'clock, in (−180, 180]. */
export function angleOf(x: number, y: number, cx: number, cy: number): number {
  'worklet';
  return Math.atan2(x - cx, cy - y) * RAD;
}

/** Smallest signed difference b − a in degrees, handling the ±180° wrap. */
export function shortestDelta(a: number, b: number): number {
  'worklet';
  let d = b - a;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

/** Index (0-based, in noise order) of the detent at `angle`. */
export function indexAt(angle: number): number {
  'worklet';
  return Math.round((Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, angle)) - MIN_ANGLE) / DETENT);
}

export function angleFor(index: number): number {
  'worklet';
  return MIN_ANGLE + index * DETENT;
}

/** Inside the range the knob follows 1:1; beyond it, stretches with exponentially growing resistance. */
export function rubberBand(angle: number): number {
  'worklet';
  if (angle > MAX_ANGLE) return MAX_ANGLE + MAX_STRETCH * (1 - Math.exp(-(angle - MAX_ANGLE) / 40));
  if (angle < MIN_ANGLE) return MIN_ANGLE - MAX_STRETCH * (1 - Math.exp(-(MIN_ANGLE - angle) / 40));
  return angle;
}

/**
 * Nearest detent to `angle`, nudged by angular `velocity` (deg/s) so a flick carries into the next colour.
 * Never lands more than one detent away from where the knob is.
 */
export function settleIndex(angle: number, velocity = 0): number {
  'worklet';
  const nudged = angle + Math.max(-DETENT * 0.45, Math.min(DETENT * 0.45, velocity * 0.05));
  return indexAt(nudged);
}

export type Crossings = { sub: number; detent: number };

/** How many sub-ticks and detents lie between two knob angles (for haptics, order-independent). */
export function crossings(prev: number, next: number): Crossings {
  'worklet';
  const lo = Math.min(prev, next);
  const hi = Math.max(prev, next);
  const first = Math.floor(lo / SUBTICK) + 1;
  const last = Math.floor(hi / SUBTICK);
  let sub = 0;
  let detent = 0;
  for (let k = first; k <= last; k++) {
    const a = k * SUBTICK;
    if (a < MIN_ANGLE - 1e-6 || a > MAX_ANGLE + 1e-6) continue; // ticks only exist inside the dial's range
    if (Math.abs(((a - MIN_ANGLE) % DETENT + DETENT) % DETENT) < 1e-6) detent++;
    else sub++;
  }
  return { sub, detent };
}
