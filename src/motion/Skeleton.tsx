import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * Skeleton block (handover §9): ink 6 % in the exact size of what will replace it, with a soft highlight
 * sweeping across every 1.4 s. Use only where there is real waiting (store prices). Reduce Motion: no sweep.
 */
export function Skeleton({ width, height, radius = 12, style }: { width: number; height: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  const reduce = useReducedMotion();
  const x = useSharedValue(0);

  useEffect(() => {
    if (reduce) return;
    x.set(withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }), -1, false));
    return () => cancelAnimation(x);
  }, [reduce, x]);

  const band = useAnimatedStyle(() => ({ transform: [{ translateX: -width + x.value * width * 2 }] }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="loading"
      style={[{ width, height, borderRadius: radius, backgroundColor: 'rgba(21,23,29,0.06)', overflow: 'hidden' }, style]}
    >
      {!reduce && (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, band]}>
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="neiro-skeleton-sweep" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
                <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.6} />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect width={width} height={height} fill="url(#neiro-skeleton-sweep)" />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}
