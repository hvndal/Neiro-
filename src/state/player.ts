import { useSyncExternalStore } from 'react';
import type { NoiseId } from '../theme/tokens';

// Tiny external store (no dependency). Audio wiring arrives in the audio-engine step.
type PlayerState = { noiseId: NoiseId; playing: boolean };

let state: PlayerState = { noiseId: 'pink', playing: false }; // first launch: pink loaded, first tap plays
const listeners = new Set<() => void>();

const set = (patch: Partial<PlayerState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

export const player = {
  get: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  setNoise: (noiseId: NoiseId) => set({ noiseId }),
  toggle: () => set({ playing: !state.playing }),
};

export function usePlayer(): PlayerState {
  return useSyncExternalStore(player.subscribe, player.get, player.get);
}
