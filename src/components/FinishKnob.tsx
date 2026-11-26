import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { finishById, type FinishId } from '../theme/finishes';
import { palette } from '../theme/tokens';

/** A dial knob in a given finish (Customise swatches and preview). */
export function FinishKnob({ finish, size }: { finish: FinishId; size: number }) {
  const f = finishById(finish);
  const id = `knob-${finish}-${size}`;
  const dark = finish === 'walnut';
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={id} x1="0.2" y1="0" x2="0.8" y2="1">
            <Stop offset="0" stopColor={f.swatch[0]} />
            <Stop offset="1" stopColor={f.swatch[1]} />
          </LinearGradient>
        </Defs>
        <Circle cx={50} cy={53} r={46} fill="#000000" opacity={0.12} />
        <Circle cx={50} cy={50} r={46} fill={`url(#${id})`} />
        <Circle cx={50} cy={50} r={45.2} fill="none" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={1.6} />
      </Svg>
      <View
        style={{
          position: 'absolute',
          left: size / 2 - size * 0.045,
          top: size * 0.12,
          width: size * 0.09,
          height: size * 0.22,
          borderRadius: size,
          backgroundColor: dark ? palette.paper : palette.ink,
        }}
      />
    </View>
  );
}
