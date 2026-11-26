import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { palette } from '../theme/tokens';

/** Small padlock badge for anything behind Pro. Decorative: the control's label says "pro". */
export function Lock({ style, size = 20 }: { style?: StyleProp<ViewStyle>; size?: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24">
        <Rect x={5} y={10.5} width={14} height={10} rx={2.5} fill={palette.paper} />
        <Path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" stroke={palette.paper} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}
