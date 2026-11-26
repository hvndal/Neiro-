import { lazy, Suspense } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NoiseId } from '../theme/tokens';
import { rgbToHex, softWashColours, washColours } from './colours';
import { useSkiaReady } from './ready';

export type LivingWashProps = {
  noise: NoiseId;
  playing: boolean;
  /** 'full' = the colour itself (Play, Study); 'soft' = paper tinted by it (browsing screens and sheets) */
  variant?: 'full' | 'soft';
  /** dial lens in this view's coordinates; omit for a plain wash */
  lens?: { x: number; y: number; r: number } | null;
  /** dial finish tint for the lens */
  lensTint?: { tint: string; amount: number } | null;
  /** where a colour change expands from (the tapped dot); default the centre */
  revealFrom?: { x: number; y: number } | null;
  /** how long a colour change takes to expand (ms) */
  revealMs?: number;
  /** 0–1 sleep dimming */
  dim?: number;
  /** false when the screen is off-screen: stops the clock so nothing burns battery */
  active?: boolean;
};

// Skia is lazy-loaded so web can finish loading CanvasKit first (see ready.ts).
const Impl = lazy(() => import('./LivingWashImpl'));

/** Full-bleed animated wash. Falls back to the flat base tone until/unless Skia is ready. */
export function LivingWash(props: LivingWashProps) {
  const ready = useSkiaReady();
  const tones = props.variant === 'soft' ? softWashColours(props.noise) : washColours(props.noise);
  const fallback = <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: rgbToHex(tones.base) }]} />;
  if (!ready) return fallback;
  return (
    <Suspense fallback={fallback}>
      <Impl {...props} />
    </Suspense>
  );
}
