import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { useLook } from '../state/look';
import type { GrainId } from '../theme/finishes';

const TILE = 512; // assets/grain.png is 512×512 and tiles seamlessly
const DRIFT = { x: 48, y: 32 }; // px travelled per half-cycle

/**
 * Film grain over a wash (it is literally noise). The texture is mean-grey, so `overlay` keeps the colour
 * balance. Styles (Customise): 16mm (default), 35mm (finer, quieter), vhs (heavier, with scanlines), none.
 * It drifts very slowly — one cycle ≈ 8 s (handover §9) — and holds still under Reduce Motion.
 * Tiles are laid out by hand because `resizeMode="repeat"` is not reliable across iOS, Android and web.
 */
export function Grain({ opacity = 0.3, grain }: { opacity?: number; grain?: GrainId }) {
  const look = useLook();
  const id = grain ?? look.grain;
  const reduce = useReducedMotion();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const drift = useSharedValue(0);

  useEffect(() => {
    if (reduce || id === 'none') return;
    drift.set(withRepeat(withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(drift);
  }, [drift, id, reduce]);

  const moving = useAnimatedStyle(() => ({ transform: [{ translateX: -drift.value * DRIFT.x }, { translateY: -drift.value * DRIFT.y }] }));

  if (id === 'none') return null;
  const tile = id === '35mm' ? TILE / 2 : TILE;
  const strength = id === '35mm' ? opacity * 0.7 : id === 'vhs' ? Math.min(1, opacity * 1.25) : opacity;
  const cols = Math.ceil((size.w + DRIFT.x) / tile);
  const rows = Math.ceil((size.h + DRIFT.y) / tile);
  const tiles = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tiles.push(
        <Image
          key={`${r}-${c}`}
          accessible={false}
          source={require('../../assets/grain.png')}
          style={{ position: 'absolute', left: c * tile, top: r * tile, width: tile, height: tile }}
        />,
      );
    }
  }
  return (
    <View
      pointerEvents="none"
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={[StyleSheet.absoluteFill, { overflow: 'hidden', opacity: strength, mixBlendMode: 'overlay' }]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, moving]}>{tiles}</Animated.View>
      {id === 'vhs' && (
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <Pattern id="neiro-scanlines" width={4} height={3} patternUnits="userSpaceOnUse">
              <Rect width={4} height={1} fill="#000000" opacity={0.55} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#neiro-scanlines)" />
        </Svg>
      )}
    </View>
  );
}
