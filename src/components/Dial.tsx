import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { NOISES, palette, type NoiseId } from '../theme/tokens';
import { Glass } from './Glass';

const BOX = 320;
const DOT_RADIUS = 148;
const ARC_R = 130;

/** Point on a circle, angle clockwise from 12 o'clock. */
const polar = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return [BOX / 2 + r * Math.sin(a), BOX / 2 - r * Math.cos(a)] as const;
};

function arc(from: number, to: number, r: number): string {
  const [x1, y1] = polar(from, r);
  const [x2, y2] = polar(to, r);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}

type Props = {
  noiseId: NoiseId;
  playing: boolean;
  /** 0–1 */
  volume?: number;
  wash: string;
  onSelect: (id: NoiseId, locked: boolean) => void;
  onToggle: () => void;
};

/**
 * The main control (handover §7, Play). 7 detent dots on the top arc (−90° → +90°, 30° apart, noise order),
 * a 240° volume arc, a clear-glass lens whose notch points at the active dot, and a dark-glass play/pause centre.
 */
export function Dial({ noiseId, playing, volume = 0.7, wash, onSelect, onToggle }: Props) {
  const index = NOISES.findIndex((n) => n.id === noiseId);
  const knobDeg = -90 + index * 30;
  const sweep = 240;
  const filledTo = -120 + sweep * volume;

  return (
    <View style={styles.box}>
      <Svg width={BOX} height={BOX} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Path d={arc(-120, 120, ARC_R)} stroke={palette.ink} strokeOpacity={0.14} strokeWidth={8} strokeLinecap="round" fill="none" />
        <Path d={arc(-120, filledTo, ARC_R)} stroke={palette.ink} strokeWidth={8} strokeLinecap="round" fill="none" />
      </Svg>

      {NOISES.map((n, i) => {
        const selected = i === index;
        const size = selected ? 18 : 14;
        return (
          <Pressable
            key={n.id}
            accessibilityRole="button"
            accessibilityLabel={`${n.id} noise${n.pro ? ', pro' : ''}`}
            accessibilityState={{ selected }}
            hitSlop={14}
            onPress={() => {
              if (n.pro) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
              onSelect(n.id, n.pro);
            }}
            style={{
              position: 'absolute',
              left: BOX / 2 - size / 2,
              top: BOX / 2 - size / 2,
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: n.hex,
              opacity: n.pro ? 0.6 : 1,
              transform: [{ rotate: `${-90 + i * 30}deg` }, { translateY: -DOT_RADIUS }],
              borderWidth: selected ? 0 : 1.5,
              borderColor: 'rgba(21,23,29,0.18)',
            }}
          >
            {selected && <View pointerEvents="none" style={[styles.selRing, { borderColor: palette.ink }]} />}
          </Pressable>
        );
      })}

      <View pointerEvents="none" style={[styles.lensWrap, { transform: [{ rotate: `${knobDeg}deg` }] }]}>
        <Glass tone="light" style={styles.lens}>
          <View style={styles.notch} />
        </Glass>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Pause' : 'Play'}
        onPress={() => {
          Haptics.selectionAsync();
          onToggle();
        }}
        style={styles.centre}
      >
        <Glass tone="dark" tint={palette.ink} solid="rgba(21,23,29,0.9)" interactive style={styles.centreGlass}>
          <Svg width={32} height={32} viewBox="0 0 32 32">
            {playing ? (
              <>
                <Rect x={7} y={2} width={8} height={28} rx={3} fill={palette.paper} />
                <Rect x={19} y={2} width={8} height={28} rx={3} fill={palette.paper} />
              </>
            ) : (
              <Path d="M9 3.5v25l21-12.5z" fill={palette.paper} />
            )}
          </Svg>
        </Glass>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: BOX, height: BOX },
  // 2px ink ring, separated from the dot by a 2px wash-coloured gap (set via `gap` below)
  selRing: { position: 'absolute', left: -5, top: -5, right: -5, bottom: -5, borderRadius: 99, borderWidth: 2 },
  lensWrap: { position: 'absolute', left: 60, top: 60, width: 200, height: 200 },
  lens: { width: 200, height: 200, borderRadius: 100, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)' },
  notch: { position: 'absolute', left: 96, top: 14, width: 8, height: 26, borderRadius: 4, backgroundColor: palette.ink },
  centre: { position: 'absolute', left: BOX / 2 - 44, top: BOX / 2 - 44, width: 88, height: 88 },
  centreGlass: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
});
