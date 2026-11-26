import { useIsFocused } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const MAX_STAGGERED = 6; // handover §9: at most 6 staggered items, the rest arrive with the 6th

/**
 * Slow reveal (handover §9): fade + rise 16 pt over 380 ms, 50 ms stagger, ease-out cubic.
 * Replays every time the screen comes into focus. Reduce Motion: a plain 200 ms fade.
 */
export function Reveal({ index = 0, children, style }: { index?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const focused = useIsFocused();
  const reduce = useReducedMotion();
  const p = useSharedValue(0);

  useEffect(() => {
    if (!focused) {
      p.set(0);
      return;
    }
    const delay = Math.min(index, MAX_STAGGERED - 1) * 50;
    p.set(withDelay(reduce ? 0 : delay, withTiming(1, { duration: reduce ? 200 : 380, easing: Easing.out(Easing.cubic) })));
  }, [focused, index, p, reduce]);

  const animated = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: reduce ? 0 : (1 - p.value) * 16 }],
  }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
