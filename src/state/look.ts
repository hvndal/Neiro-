import { useSyncExternalStore } from 'react';
import type { FinishId, GrainId, IconId } from '../theme/finishes';

// What the user has applied in Customise. (Persistence arrives with storage; alternate app icons need the
// native icon setup before `icon` changes the home-screen icon.)
type Look = { icon: IconId; finish: FinishId; grain: GrainId };

let look: Look = { icon: 'rings', finish: 'ceramic', grain: '16mm' };
const listeners = new Set<() => void>();

export const lookStore = {
  get: () => look,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  set: (patch: Partial<Look>) => {
    look = { ...look, ...patch };
    listeners.forEach((l) => l());
  },
};

export const useLook = () => useSyncExternalStore(lookStore.subscribe, lookStore.get, lookStore.get);
