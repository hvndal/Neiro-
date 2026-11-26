import { useSyncExternalStore } from 'react';

// Pro entitlement. Wired to in-app purchase later; until then nobody is Pro.
let pro = false;
const listeners = new Set<() => void>();

export const entitlement = {
  get: () => pro,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  set: (v: boolean) => {
    pro = v;
    listeners.forEach((l) => l());
  },
};

export const useIsPro = () => useSyncExternalStore(entitlement.subscribe, entitlement.get, entitlement.get);
