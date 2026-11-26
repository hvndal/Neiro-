import { useSyncExternalStore } from 'react';

/**
 * Skia is ready immediately on iOS/Android. On web (previews, screenshots) CanvasKit must load first, and
 * nothing may import @shopify/react-native-skia before that — so Skia code is lazy-loaded behind this flag.
 */
let ready = false;
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

/** Call once at app start: loads CanvasKit (previews and tests only). */
export async function initSkia(): Promise<void> {
  if (ready) return;
  const { LoadSkiaWeb } = await import('@shopify/react-native-skia/lib/module/web');
  await LoadSkiaWeb({ locateFile: (file: string) => `/${file}` });
  skiaReady.set(true);
}
