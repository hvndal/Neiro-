import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn, useReducedMotion } from 'react-native-reanimated';
import { LOGO_BANDS, palette } from '../theme/tokens';

export const RING_STEP_MS = 60; // per band (handover §9)
export const RING_BAND_MS = 320;

/**
 * The ring mark drawing itself from the core outward, one band every 60 ms (handover §9). Animates on mount.
 * Reduce Motion: appears with a short fade.
 */
export function RingDraw({ size, delay = 0, gap = palette.paper }: { size: number; delay?: number; gap?: string }) {
  const reduce = useReducedMotion();
  const bands = LOGO_BANDS.length; // painted outer → inner; drawn inner → outer
  const enter = (d: number) => (reduce ? FadeIn.duration(150) : ZoomIn.delay(delay + d).duration(RING_BAND_MS));
  const px = (pct: number) => (pct / 100) * size;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {LOGO_BANDS.map((b, i) => (
        <Animated.View key={b.name} entering={enter((bands - i) * RING_STEP_MS)} style={[styles.disc, { width: px(b.to), height: px(b.to), backgroundColor: b.hex }]}>
          <View style={[styles.disc, { width: px(b.from), height: px(b.from), backgroundColor: gap }]} />
        </Animated.View>
      ))}
      <Animated.View entering={enter(0)} style={[styles.disc, { width: px(26), height: px(26), backgroundColor: '#FFFFFF' }]}>
        <View style={{ position: 'absolute', top: px(2.6), width: px(3.9), height: px(7.6), borderRadius: px(2), backgroundColor: palette.ink }} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  disc: { position: 'absolute', borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
