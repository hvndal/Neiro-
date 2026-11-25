import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '../theme/tokens';

/**
 * Soft tint of the playing colour over paper, so glass has something to show (handover §8).
 * Used behind Programs / Customise / Pro.
 */
export function Wash({ tint = '#FF7AA2', accent = '#8B4A2B' }: { tint?: string; accent?: string }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: palette.paper }]}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="a" cx="10%" cy="0%" rx="110%" ry="45%" fx="10%" fy="0%" gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={tint} stopOpacity={0.5} />
            <Stop offset="0.7" stopColor={tint} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="b" cx="100%" cy="0%" rx="80%" ry="35%" fx="100%" fy="0%" gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={accent} stopOpacity={0.18} />
            <Stop offset="0.7" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#a)" />
        <Rect width="100%" height="100%" fill="url(#b)" />
      </Svg>
    </View>
  );
}
