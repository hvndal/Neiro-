import * as Haptics from 'expo-haptics';
import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { DEAD_ZONE, SENSITIVITY, angleFor, angleOf, crossings, rubberBand, settleIndex, shortestDelta } from '../dial/physics';
import { NOISES, palette, type NoiseId } from '../theme/tokens';
import { Glass } from './Glass';

const BOX = 320;
const C = BOX / 2;
const DOT_RADIUS = 148;
const ARC_R = 130;
export const LENS_R = 100;

/** Screen position of detent dot `index`, given the dial box's top-left corner. */
export const dotCentre = (index: number, boxX: number, boxY: number) => {
  const a = ((-90 + index * 30) * Math.PI) / 180;
  return { x: boxX + C + DOT_RADIUS * Math.sin(a), y: boxY + C - DOT_RADIUS * Math.cos(a) };
};

/** Point on a circle, angle clockwise from 12 o'clock. */
const polar = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return [C + r * Math.sin(a), C - r * Math.cos(a)] as const;
};

function arc(from: number, to: number, r: number): string {
  const [x1, y1] = polar(from, r);
  const [x2, y2] = polar(to, r);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}

// Heavy, slightly damped: the knob lags the finger and settles with a soft landing.
const FOLLOW = { mass: 1.4, damping: 24, stiffness: 150 } as const;
const SETTLE = { mass: 1.2, damping: 20, stiffness: 170 } as const;

// Haptics, rate-limited. Sub-ticks use the system "selection" feedback (the sound-less tick of an iOS picker);
// each detent is a firmer latch. Together: trr-trr-trr-CLICK.
let lastTick = 0;
const tick = (kind: 'sub' | 'detent') => {
  const now = Date.now();
  if (kind === 'sub') {
    if (now - lastTick < 26) return;
    lastTick = now;
    Haptics.selectionAsync();
  } else {
    lastTick = now;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
};

type Props = {
  noiseId: NoiseId;
  playing: boolean;
  /** 0–1 */
  volume?: number;
  /** true when the lens is drawn by the Skia wash shader (real refraction); false = RN glass view */
  shaderLens?: boolean;
  onSelect: (id: NoiseId, locked: boolean) => void;
  onToggle: () => void;
};

/**
 * The main control (handover §7, Play).
 *  - Turn it: a rotary drag with heavy follow, a light tick every 6° and a latch at each colour.
 *  - Past either end it stretches and springs back; releasing on a Pro colour latches, then returns and opens Pro.
 *  - Tap a dot to jump. VoiceOver: the lens is an adjustable (swipe up/down = next/previous colour).
 */
export function Dial({ noiseId, playing, volume = 0.7, shaderLens = false, onSelect, onToggle }: Props) {
  const index = NOISES.findIndex((n) => n.id === noiseId);
  const knob = useSharedValue(angleFor(index));
  const dragging = useSharedValue(false);
  const startKnob = useSharedValue(0);
  const total = useSharedValue(0);
  const lastTouch = useSharedValue(0);
  const hasTouch = useSharedValue(false);
  const lastTime = useSharedValue(0);
  const omega = useSharedValue(0);

  const commit = useCallback(
    (i: number) => {
      const n = NOISES[i];
      if (n.pro) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        onSelect(n.id, true);
        knob.set(withSpring(angleFor(index), SETTLE)); // locked: come back to where we were
      } else if (n.id !== noiseId) {
        onSelect(n.id, false);
      }
    },
    [index, knob, noiseId, onSelect],
  );

  const goTo = useCallback(
    (i: number) => {
      knob.set(
        withSpring(angleFor(i), SETTLE, (finished) => {
          'worklet';
          if (finished) scheduleOnRN(commit, i);
        }),
      );
    },
    [commit, knob],
  );

  // Follow the selected colour when it changes from outside (a program, a tap elsewhere).
  useEffect(() => {
    if (!dragging.get()) knob.set(withSpring(angleFor(index), SETTLE));
  }, [index, knob, dragging]);

  // Haptics come from the knob's real angle, so drags, taps and spring overshoot all feel the same.
  useAnimatedReaction(
    () => knob.value,
    (now, prev) => {
      if (prev === null) return;
      const c = crossings(prev, now);
      if (c.detent > 0) scheduleOnRN(tick, 'detent');
      else if (c.sub > 0) scheduleOnRN(tick, 'sub');
    },
  );

  const pan = usePanGesture({
    minDistance: 4,
    onBegin: (e) => {
      'worklet';
      startKnob.set(knob.get());
      total.set(0);
      omega.set(0);
      hasTouch.set(false);
      lastTime.set(Date.now());
      if (Math.hypot(e.x - C, e.y - C) >= DEAD_ZONE) {
        lastTouch.set(angleOf(e.x, e.y, C, C));
        hasTouch.set(true);
      }
    },
    onActivate: () => {
      'worklet';
      dragging.set(true);
    },
    onUpdate: (e) => {
      'worklet';
      if (Math.hypot(e.x - C, e.y - C) < DEAD_ZONE) return; // angle is meaningless near the centre
      const a = angleOf(e.x, e.y, C, C);
      if (!hasTouch.get()) {
        lastTouch.set(a);
        hasTouch.set(true);
        return;
      }
      const d = shortestDelta(lastTouch.get(), a);
      lastTouch.set(a);
      total.set(total.get() + d);
      const now = Date.now();
      const dt = Math.max(now - lastTime.get(), 1);
      lastTime.set(now);
      omega.set(omega.get() * 0.6 + ((d / dt) * 1000) * 0.4);
      knob.set(withSpring(rubberBand(startKnob.get() + total.get() * SENSITIVITY), FOLLOW));
    },
    onFinalize: () => {
      'worklet';
      if (!dragging.get()) return;
      dragging.set(false);
      const i = settleIndex(knob.get(), omega.get() * SENSITIVITY);
      knob.set(withSpring(angleFor(i), SETTLE, (finished) => {
        if (finished) scheduleOnRN(commit, i);
      }));
    },
  });

  const lensStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${knob.value}deg` }] }));
  const sweep = 240;
  const filledTo = -120 + sweep * volume;

  return (
    <GestureDetector gesture={pan}>
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
              hitSlop={16} // 14 + 2×16 = 46 pt, above the 44 pt minimum
              onPress={() => goTo(i)}
              style={{
                position: 'absolute',
                left: C - size / 2,
                top: C - size / 2,
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

        <Animated.View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="colour dial"
          accessibilityValue={{ text: `${noiseId} noise` }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => {
            const next = index + (e.nativeEvent.actionName === 'increment' ? 1 : -1);
            if (next >= 0 && next < NOISES.length) goTo(next);
          }}
          style={[styles.lensWrap, lensStyle]}
        >
          {shaderLens ? (
            <View style={styles.lens}>
              <View style={styles.notch} />
            </View>
          ) : (
            <Glass tone="light" style={styles.lens}>
              <View style={styles.notch} />
            </Glass>
          )}
        </Animated.View>

        <Pressable accessibilityRole="button" accessibilityLabel={playing ? 'Pause' : 'Play'} onPress={onToggle} style={styles.centre}>
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
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  box: { width: BOX, height: BOX },
  selRing: { position: 'absolute', left: -5, top: -5, right: -5, bottom: -5, borderRadius: 99, borderWidth: 2 },
  lensWrap: { position: 'absolute', left: 60, top: 60, width: 200, height: 200 },
  lens: { width: 200, height: 200, borderRadius: 100 },
  notch: { position: 'absolute', left: 96, top: 14, width: 8, height: 26, borderRadius: 4, backgroundColor: palette.ink },
  centre: { position: 'absolute', left: C - 44, top: C - 44, width: 88, height: 88 },
  centreGlass: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
});
