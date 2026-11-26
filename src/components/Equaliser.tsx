import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming,
} from 'react-native-reanimated';
import { palette } from '../theme/tokens';

function Bar({ delay, period, color }: { delay: number; period: number; color: string }) {
  const reduce = useReducedMotion();
  const h = useSharedValue(0.5);
  useEffect(() => {
    if (reduce) return;
    h.set(withDelay(delay, withRepeat(withTiming(1, { duration: period, easing: Easing.inOut(Easing.sin) }), -1, true)));
    return () => cancelAnimation(h);
  }, [delay, h, period, reduce]);
  const style = useAnimatedStyle(() => ({ height: 5 + h.value * 13 }));
  return <Animated.View style={[{ width: 4, borderRadius: 2, backgroundColor: color }, style]} />;
}

/** "Now playing" bars. Still under Reduce Motion. */
export function Equaliser({ color = palette.ink }: { color?: string }) {
  return (
    <View accessibilityLabel="playing" style={{ width: 20, height: 18, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <Bar delay={0} period={520} color={color} />
      <Bar delay={140} period={430} color={color} />
      <Bar delay={60} period={610} color={color} />
    </View>
  );
}
