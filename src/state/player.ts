import { useSyncExternalStore } from 'react';
import type { NoiseId } from '../theme/tokens';

// Tiny external store (no dependency). The audio engine subscribes to this in its own step; everything here is
// the *intent* (what should be playing, how, until when), so the UI is complete before the engine exists.

export type MixAmount = 0.25 | 0.5 | 0.75;
export type Mix = { id: NoiseId; amount: MixAmount } | null;

type PlayerState = {
  noiseId: NoiseId;
  playing: boolean;
  /** true once anything has played: shows the Now Playing accessory */
  started: boolean;
  /** chosen sleep timer length (minutes) or null = off */
  sleepMinutes: number | null;
  /** when the running sleep timer stops playback */
  sleepEndsAt: number | null;
  /** fade out at the end of the sleep timer instead of stopping dead */
  sleepFade: boolean;
  /** a second colour layered under the first */
  mix: Mix;
  /** program currently running, if any */
  programId: string | null;
  /** 10-second audition of a locked colour from the Pro sheet */
  audition: { id: NoiseId; endsAt: number } | null;
};

let state: PlayerState = {
  noiseId: 'pink', // first launch: pink loaded, first tap plays
  playing: false,
  started: false,
  sleepMinutes: null,
  sleepEndsAt: null,
  sleepFade: true,
  mix: null,
  programId: null,
  audition: null,
};
const listeners = new Set<() => void>();

const set = (patch: Partial<PlayerState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

const MIN = 60_000;

export const player = {
  get: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  setNoise: (noiseId: NoiseId) => set({ noiseId, mix: state.mix?.id === noiseId ? null : state.mix }),
  play: (now = Date.now()) =>
    set({ playing: true, started: true, sleepEndsAt: state.sleepMinutes ? now + state.sleepMinutes * MIN : null }),
  pause: () => set({ playing: false, sleepEndsAt: null }),
  toggle: () => (state.playing ? player.pause() : player.play()),
  setSleep: (minutes: number | null, now = Date.now()) =>
    set({ sleepMinutes: minutes, sleepEndsAt: minutes && state.playing ? now + minutes * MIN : null }),
  setSleepFade: (sleepFade: boolean) => set({ sleepFade }),
  setMix: (mix: Mix) => set({ mix }),
  startProgram: (programId: string, first: NoiseId) => {
    set({ programId, noiseId: first, mix: null });
    player.play();
  },
  stopProgram: () => set({ programId: null }),
  audition: (id: NoiseId, now = Date.now()) => set({ audition: { id, endsAt: now + 10_000 } }),
  /** Called once a second by <Watchers />: ends the sleep timer and auditions. */
  tick: (now = Date.now()) => {
    if (state.playing && state.sleepEndsAt !== null && now >= state.sleepEndsAt) set({ playing: false, sleepEndsAt: null });
    if (state.audition && now >= state.audition.endsAt) set({ audition: null });
  },
};

export function usePlayer(): PlayerState {
  return useSyncExternalStore(player.subscribe, player.get, player.get);
}
