import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { LOGO_BANDS, palette } from '../theme/tokens';
import { RING_BAND_MS, RING_STEP_MS, RingDraw } from './RingDraw';

/**
 * Launch (handover §9): the ring mark draws from the core outward (~900 ms), then the paper curtain fades
 * (500 ms) onto Play, whose hero rises as it mounts. Reduce Motion: the mark, then a 200 ms fade.
 */
export function Launch({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  const fade = useSharedValue(1);

  useEffect(() => {
    const drawn = reduce ? 150 : (LOGO_BANDS.length + 1) * RING_STEP_MS + RING_BAND_MS;
    fade.set(
      withDelay(
        drawn,
        withTiming(0, { duration: reduce ? 200 : 500 }, (finished) => {
          if (finished) scheduleOnRN(onDone);
        }),
      ),
    );
  }, [fade, onDone, reduce]);

  const curtain = useAnimatedStyle(() => ({ opacity: fade.value }));
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.curtain, curtain]}>
      <RingDraw size={168} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  curtain: { backgroundColor: palette.paper, alignItems: 'center', justifyContent: 'center', zIndex: 100 },
});
