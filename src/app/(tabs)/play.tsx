import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, Keyframe, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dial, LENS_R, dotCentre } from '../../components/Dial';
import { GlassPill } from '../../components/GlassPill';
import { Grain } from '../../components/Grain';
import { RingMark } from '../../components/RingMark';
import { LivingWash } from '../../skia/LivingWash';
import { useIsPro } from '../../state/entitlement';
import { useLook } from '../../state/look';
import { player, usePlayer } from '../../state/player';
import { useNow } from '../../state/useNow';
import { finishById } from '../../theme/finishes';
import { fonts, layout, noiseById, NOISES, palette, textStyle, type NoiseId } from '../../theme/tokens';

// Colour change choreography (handover §9): the old name fades and lifts 8 pt (220 ms); the new name rises
// 24 pt and fades in (420 ms); "noise" follows at +80 ms, best-for at +160 ms.
const rise = (delay: number) =>
  new Keyframe({
    0: { opacity: 0, transform: [{ translateY: 24 }] },
    100: { opacity: 1, transform: [{ translateY: 0 }], easing: Easing.out(Easing.cubic) },
  })
    .duration(420)
    .delay(delay);
const RISE = [rise(0), rise(80), rise(160)];
const LIFT = new Keyframe({
  0: { opacity: 1, transform: [{ translateY: 0 }] },
  100: { opacity: 0, transform: [{ translateY: -8 }] },
}).duration(220);
const HERO_HEIGHT = 186;

function minutesLabel(min: number) {
  return min >= 60 ? `${min / 60 === Math.floor(min / 60) ? min / 60 : (min / 60).toFixed(1)} h` : `${min} min`;
}

export default function Play() {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const reduce = useReducedMotion();
  const isPro = useIsPro();
  const { noiseId, playing, sleepMinutes, sleepEndsAt, mix } = usePlayer();
  const { finish } = useLook();
  const noise = noiseById(noiseId);
  const dark = noise.on === palette.paper;
  const tone = dark ? 'dark' : 'light';
  const proCount = NOISES.filter((n) => n.pro).length;
  const now = useNow(15_000, focused && sleepEndsAt !== null);

  // Dial box position in the screen root's coordinate space (the shader canvas fills the root), so the glass lens
  // and the reveal origin line up. Measured relative to the root, not the window: window coordinates are wrong while
  // a sheet or tab transition is running. Re-measured whenever the screen regains focus.
  const rootRef = useRef<ComponentRef<typeof View>>(null);
  const dialRef = useRef<ComponentRef<typeof View>>(null);
  const [box, setBox] = useState<{ x: number; y: number } | null>(null);
  const [revealFrom, setRevealFrom] = useState<{ x: number; y: number } | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const measure = useCallback(() => {
    const root = rootRef.current;
    const dial = dialRef.current;
    if (!root || !dial) return;
    dial.measureLayout(root, (x, y) => setBox((b) => (b && b.x === x && b.y === y ? b : { x, y })));
  }, []);
  useEffect(() => {
    if (focused) measure();
  }, [focused, measure]);

  const select = (id: NoiseId, locked: boolean) => {
    if (locked) return router.push('/pro');
    if (box) setRevealFrom(dotCentre(NOISES.findIndex((n) => n.id === id), box.x, box.y));
    player.setNoise(id);
  };

  const sleepLabel =
    sleepEndsAt !== null && playing
      ? `sleep · ${Math.max(1, Math.ceil((sleepEndsAt - now) / 60_000))} min left`
      : sleepMinutes
        ? `sleep timer · ${minutesLabel(sleepMinutes)}`
        : 'sleep timer';
  const mixLabel = mix ? `mix · ${mix.id} ${Math.round(mix.amount * 100)}%` : '+ mix';
  const hovered = hover === null ? null : NOISES[hover];
  const lensTint = finishById(finish).lens;

  return (
    <View ref={rootRef} onLayout={measure} collapsable={false} style={[styles.root, { backgroundColor: noise.hex, paddingTop: insets.top + 12 }]}>
      {focused && <StatusBar style={dark ? 'light' : 'dark'} />}
      <LivingWash
        noise={noiseId}
        playing={playing}
        active={focused}
        revealFrom={revealFrom}
        lens={box ? { x: box.x + 160, y: box.y + 160, r: LENS_R } : null}
        lensTint={lensTint}
      />
      <Grain opacity={dark ? 0.3 : 0.35} />

      <View style={styles.top}>
        <View style={styles.brand}>
          <RingMark size={28} gap={palette.paper} />
          <Text style={[textStyle('title'), { fontSize: 22, lineHeight: 26, letterSpacing: -0.44, color: noise.on }]}>neiro</Text>
        </View>
        {!isPro && (
          <GlassPill label="get pro" tone={tone} color={noise.on} fontSize={16} onPress={() => router.push('/pro')} style={{ paddingHorizontal: 18 }} />
        )}
      </View>

      <View style={styles.hero}>
        <View style={{ height: HERO_HEIGHT }} accessible accessibilityRole="header" accessibilityLabel={`${noise.id} noise, best for ${noise.bestFor}`}>
          <Animated.View key={noise.id} exiting={reduce ? FadeOut.duration(200) : LIFT} style={StyleSheet.absoluteFill}>
            <Animated.Text entering={reduce ? FadeIn.duration(200) : RISE[0]} style={[textStyle('hero'), { color: noise.on }]}>
              {noise.id}
            </Animated.Text>
            <Animated.Text entering={reduce ? FadeIn.duration(200) : RISE[1]} style={[textStyle('title'), { lineHeight: 44, color: noise.on, marginTop: -4 }]}>
              noise
            </Animated.Text>
            <Animated.Text
              entering={reduce ? FadeIn.duration(200) : RISE[2]}
              style={[textStyle('body'), { fontFamily: fonts.heavy, fontSize: 19, lineHeight: 26, color: noise.on, marginTop: 12 }]}
            >
              <Text style={[textStyle('eyebrow'), { color: noise.on, opacity: 0.8 }]}>BEST FOR  </Text>
              {noise.bestFor}
            </Animated.Text>
          </Animated.View>
        </View>
        <View style={styles.pills}>
          <GlassPill label={sleepLabel} tone={tone} color={noise.on} onPress={() => router.push('/timer')} />
          <GlassPill label={mixLabel} tone={tone} color={noise.on} onPress={() => router.push('/mix')} />
        </View>
      </View>

      <View style={styles.dialWrap}>
        <View ref={dialRef} collapsable={false}>
          <Dial
            noiseId={noiseId}
            playing={playing}
            shaderLens={box !== null}
            onSelect={select}
            onToggle={player.toggle}
            onHover={setHover}
          />
        </View>
        {/* live readout while turning; otherwise the hint */}
        <View style={styles.readout} accessibilityLiveRegion="polite">
          {hovered ? (
            <Animated.View key={hovered.id} entering={FadeIn.duration(120)} style={styles.readoutRow}>
              <View style={[styles.readoutDot, { backgroundColor: hovered.hex }]} />
              <Text style={[textStyle('label'), { color: noise.on }]}>
                {hovered.id}
                {hovered.pro && !isPro ? '  ·  pro' : ''}
              </Text>
            </Animated.View>
          ) : (
            <Animated.View key="hint" entering={FadeIn.duration(200)}>
              <Text style={[textStyle('caption'), { color: noise.on, opacity: 0.8 }]}>
                turn to change colour{isPro ? '' : ` · ${proCount} more with pro`}
              </Text>
            </Animated.View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24, paddingBottom: layout.contentBottomPad },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hero: { flex: 1, justifyContent: 'center' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  dialWrap: { alignItems: 'center', gap: 10 },
  readout: { height: 24, alignItems: 'center', justifyContent: 'center' },
  readoutRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  readoutDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: 'rgba(21,23,29,0.25)' },
});
