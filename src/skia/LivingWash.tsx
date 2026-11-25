import { lazy, Suspense } from 'react';
import { StyleSheet, View } from 'react-native';
import { noiseById, type NoiseId } from '../theme/tokens';
import { useSkiaReady } from './ready';

export type LivingWashProps = {
  noise: NoiseId;
  playing: boolean;
  /** dial lens in screen coordinates; omit for a plain wash */
  lens?: { x: number; y: number; r: number } | null;
  /** where a colour change expands from (the tapped dot) */
  revealFrom?: { x: number; y: number } | null;
  /** 0–1 sleep dimming */
  dim?: number;
  /** false when the screen is off-screen: stops the clock so nothing burns battery */
  active?: boolean;
};

// Skia is lazy-loaded so web can finish loading CanvasKit first (see ready.ts).
const Impl = lazy(() => import('./LivingWashImpl'));

/** Full-bleed animated wash. Falls back to the flat noise colour until/unless Skia is ready. */
export function LivingWash(props: LivingWashProps) {
  const ready = useSkiaReady();
  const fallback = <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: noiseById(props.noise).hex }]} />;
  if (!ready) return fallback;
  return (
    <Suspense fallback={fallback}>
      <Impl {...props} />
    </Suspense>
  );
}
