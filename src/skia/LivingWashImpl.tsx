import { Canvas, Fill, Shader, Skia } from '@shopify/react-native-skia';
import { Accelerometer } from 'expo-sensors';
import { useEffect } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Easing, useDerivedValue, useFrameCallback, useSharedValue, withTiming } from 'react-native-reanimated';
import { noiseById } from '../theme/tokens';
import { washColours, type RGB } from './colours';
import type { LivingWashProps } from './LivingWash';
import { WASH_SKSL } from './washShader';

const effect = Skia.RuntimeEffect.Make(WASH_SKSL);
if (!effect && __DEV__) console.error('[neiro] wash shader failed to compile');

const FPS_CAP = 30; // the wash is slow; 30 fps halves GPU work vs 60 with no visible difference
const IDLE_SPEED = 0.35;
const PLAY_SPEED = 1;

type Tones = { base: RGB; deep: RGB; light: RGB };

export default function LivingWashImpl({ noise, playing, lens = null, revealFrom = null, dim = 0, active = true }: LivingWashProps) {
  const size = useSharedValue({ width: 0, height: 0 });
  const phase = useSharedValue(0);
  const speed = useSharedValue(IDLE_SPEED);
  const breath = useSharedValue(0);
  const dimSV = useSharedValue(dim);
  const reduce = useSharedValue(false);
  const live = useSharedValue(active);

  const cur = useSharedValue<Tones>(washColours(noise));
  const prev = useSharedValue<Tones>(washColours(noise));
  const reveal = useSharedValue(1);
  const origin = useSharedValue({ x: 0, y: 0 });

  const lensSV = useSharedValue({ x: 0, y: 0, r: 0, on: 0 });
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  // Reduce Motion: no flow, no reveal, no tilt — plain, still colour.
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => alive && reduce.set(v));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => reduce.set(v));
    return () => {
      alive = false;
      sub.remove();
    };
  }, [reduce]);

  // Flow clock, capped at FPS_CAP, paused when off-screen or in the background.
  const acc = useSharedValue(0);
  const clock = useFrameCallback((f) => {
    'worklet';
    acc.value += f.timeSincePreviousFrame ?? 16;
    if (acc.value < 1000 / FPS_CAP) return;
    if (live.value && !reduce.value) phase.value += (acc.value / 1000) * speed.value;
    acc.value = 0;
  });
  useEffect(() => {
    live.set(active);
    clock.setActive(active);
  }, [active, clock, live]);

  useEffect(() => {
    speed.set(withTiming(playing ? PLAY_SPEED : IDLE_SPEED, { duration: 1200 }));
    breath.set(withTiming(playing ? 1 : 0, { duration: 1200 }));
  }, [playing, speed, breath]);

  useEffect(() => {
    dimSV.set(withTiming(dim, { duration: 1500 }));
  }, [dim, dimSV]);

  // Colour change: the new wash expands from the tapped dot (handover §9: wash 700 ms).
  const shown = useSharedValue(noise);
  useEffect(() => {
    if (shown.get() === noise) return;
    shown.set(noise);
    prev.set(cur.get());
    cur.set(washColours(noise));
    if (revealFrom) origin.set(revealFrom);
    reveal.set(0);
    reveal.set(reduce.get() ? 1 : withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [noise, revealFrom, cur, prev, origin, reveal, shown, reduce]);

  useEffect(() => {
    lensSV.set(lens ? { x: lens.x, y: lens.y, r: lens.r, on: 1 } : { x: 0, y: 0, r: 1, on: 0 });
  }, [lens, lensSV]);

  // Tilt moves the lens highlight like a real glass disc under a window.
  useEffect(() => {
    if (Platform.OS === 'web') return; // no accelerometer in browsers (previews)
    let sub: { remove: () => void } | undefined;
    let cancelled = false;
    Accelerometer.isAvailableAsync().then((ok) => {
      if (!ok || cancelled) return;
      Accelerometer.setUpdateInterval(50);
      sub = Accelerometer.addListener(({ x, y }) => {
        if (reduce.get()) return;
        tiltX.set(withTiming(Math.max(-1, Math.min(1, x)), { duration: 160 }));
        tiltY.set(withTiming(Math.max(-1, Math.min(1, -y)), { duration: 160 }));
      });
    });
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [reduce, tiltX, tiltY]);

  const uniforms = useDerivedValue(() => {
    const w = Math.max(size.value.width, 1);
    const h = Math.max(size.value.height, 1);
    const ox = origin.value.x || w / 2;
    const oy = origin.value.y || h / 2;
    const maxD = Math.hypot(Math.max(ox, w - ox), Math.max(oy, h - oy)) + 100;
    return {
      uRes: [w, h],
      uPhase: phase.value,
      uBreath: breath.value,
      uDim: dimSV.value,
      uBase: cur.value.base,
      uDeep: cur.value.deep,
      uLight: cur.value.light,
      uPBase: prev.value.base,
      uPDeep: prev.value.deep,
      uPLight: prev.value.light,
      uOrigin: [ox, oy],
      uReveal: reveal.value,
      uMaxD: maxD,
      uLens: [lensSV.value.x, lensSV.value.y],
      uLensR: lensSV.value.r,
      uLensOn: lensSV.value.on,
      uTilt: [tiltX.value, tiltY.value],
    };
  });

  if (!effect) return <View style={[StyleSheet.absoluteFill, { backgroundColor: noiseById(noise).hex }]} />;
  return (
    <Canvas style={StyleSheet.absoluteFill} onSize={size} pointerEvents="none">
      <Fill>
        <Shader source={effect} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
}
