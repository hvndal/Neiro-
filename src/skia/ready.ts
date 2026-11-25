import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

/**
 * Skia is ready immediately on iOS/Android. On web (previews, screenshots) CanvasKit must load first, and
 * nothing may import @shopify/react-native-skia before that — so Skia code is lazy-loaded behind this flag.
 */
let ready = Platform.OS !== 'web';
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

/** Call once at app start. No-op on native. */
export async function initSkia(): Promise<void> {
  if (Platform.OS !== 'web' || ready) return;
  const { LoadSkiaWeb } = await import('@shopify/react-native-skia/lib/module/web');
  await LoadSkiaWeb({ locateFile: (file: string) => `/${file}` });
  skiaReady.set(true);
}
