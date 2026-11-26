import { useSyncExternalStore } from 'react';

/** Skia is ready immediately on iOS and Android (the web loader lives in ready.web.ts). */
let ready = true;
const listeners = new Set<() => void>();

export const skiaReady = {
  get: () => ready,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  set: (v: boolean) => {
    ready = v;
    listeners.forEach((l) => l());
  },
};

export const useSkiaReady = () => useSyncExternalStore(skiaReady.subscribe, skiaReady.get, skiaReady.get);

/** No-op on native. */
export async function initSkia(): Promise<void> {}
