import { View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { LOGO_BANDS, palette } from '../theme/tokens';

type Props = {
  size?: number;
  /** colour of the 1% gaps between bands (handover §5) */
  gap?: string;
  /** draw a dark notch at 12 o'clock in the white core */
  notch?: boolean;
  /** rotate the whole mark (deg) */
  rotation?: number;
};

/**
 * Concentric solid rings, outer → inner: red, white, green, blue, violet, pink, grey,
 * then a white core with a small dark notch. Stops are % of radius (handover §5).
 */
export function RingMark({ size = 28, gap = palette.paper, notch = true, rotation = 0 }: Props) {
  const R = 50; // viewBox radius
  const r = (pct: number) => (pct / 100) * R;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size }}>
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* paint outer → inner: each band, then a gap-coloured disc inside it that the next band paints over */}
      {LOGO_BANDS.flatMap((b) => [
        <Circle key={b.name} cx={50} cy={50} r={r(b.to)} fill={b.hex} />,
        <Circle key={`${b.name}-gap`} cx={50} cy={50} r={r(b.from)} fill={gap} />,
      ])}
      <Circle cx={50} cy={50} r={r(26)} fill="#FFFFFF" />
      {notch && (
        <Rect
          x={50 - 1.95}
          y={38.6}
          width={3.9}
          height={7.6}
          rx={1.95}
          fill={palette.ink}
          transform={rotation ? `rotate(${rotation} 50 50)` : undefined}
        />
      )}
    </Svg>
    </View>
  );
}
