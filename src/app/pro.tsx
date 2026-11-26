import * as Haptics from 'expo-haptics';
import { router, useIsFocused } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { Glass } from '../components/Glass';
import { GlassPill } from '../components/GlassPill';
import { Reveal } from '../motion/Reveal';
import { RingDraw } from '../motion/RingDraw';
import { Skeleton } from '../motion/Skeleton';
import { LivingWash } from '../skia/LivingWash';
import { player, usePlayer } from '../state/player';
import { useProducts } from '../state/products';
import { fonts, NOISES, palette, textStyle, type Noise } from '../theme/tokens';

const PERKS = [
  'four more noise colours',
  'seven colour app icons (the rings are free)',
  'dial finishes: brass, walnut, chrome',
  'grain styles: 35mm, vhs',
  'study modes: 50/10, 52/17, 112/26, flowtime, custom',
  'custom tints, saved mixes, wallpapers',
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const DOT = 52;
const R = 31; // progress ring radius around the dot
const C = 2 * Math.PI * R;

/** A locked colour you can hear for 10 seconds before buying: a ring fills around it while it plays. */
function AuditionDot({ noise, active, endsAt }: { noise: Noise; active: boolean; endsAt: number | null }) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (!active || endsAt === null) {
      p.set(withTiming(0, { duration: 200 }));
      return;
    }
    p.set(0);
    p.set(withTiming(1, { duration: Math.max(0, endsAt - Date.now()), easing: Easing.linear }));
  }, [active, endsAt, p]);
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: C * (1 - p.value) }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`hear ${noise.id} noise for 10 seconds`}
      accessibilityState={{ busy: active }}
      onPress={() => {
        Haptics.selectionAsync();
        player.audition(noise.id);
      }}
      style={styles.audition}
    >
      <View style={styles.auditionDotWrap}>
        <Svg width={70} height={70} style={StyleSheet.absoluteFill}>
          <Circle cx={35} cy={35} r={R} stroke="rgba(21,23,29,0.12)" strokeWidth={3} fill="none" />
          <AnimatedCircle
            cx={35}
            cy={35}
            r={R}
            stroke={palette.ink}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${C} ${C}`}
            animatedProps={ringProps}
            transform="rotate(-90 35 35)"
          />
        </Svg>
        <View style={[styles.auditionDot, { backgroundColor: noise.hex }]} />
      </View>
      <Text style={styles.cellLabel}>{noise.id}</Text>
    </Pressable>
  );
}

export default function Pro() {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { width } = useWindowDimensions();
  const { noiseId, playing, audition } = usePlayer();
  const products = useProducts();
  const locked = NOISES.filter((n) => n.pro);
  const ctaWidth = Math.min(width, 640) - 48;
  const ready = products.status === 'ready';

  return (
    <View style={{ flex: 1 }}>
      <LivingWash noise={audition?.id ?? noiseId} variant="soft" playing={playing || !!audition} active={focused} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 150 + insets.bottom }]}>
        <GlassPill size={44} accessibilityLabel="Close" onPress={() => router.back()} style={{ alignSelf: 'flex-end' }}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={palette.ink} strokeWidth={2.4} strokeLinecap="round">
            <Path d="M6 6l12 12M18 6L6 18" />
          </Svg>
        </GlassPill>

        <Reveal index={0} style={{ alignItems: 'center', gap: 10 }}>
          <RingDraw size={92} delay={150} />
          <Text accessibilityRole="header" style={[textStyle('title'), { color: palette.ink }]}>
            neiro pro
          </Text>
          <Text style={[textStyle('body'), { color: palette.muted }]}>pay once. no subscription. no ads.</Text>
        </Reveal>

        <Reveal index={1} style={{ gap: 12 }}>
          <Text style={styles.section}>HEAR THEM FIRST</Text>
          <View style={styles.auditionRow}>
            {locked.map((n) => (
              <AuditionDot key={n.id} noise={n} active={audition?.id === n.id} endsAt={audition?.id === n.id ? audition.endsAt : null} />
            ))}
          </View>
          <Text style={[styles.hint]}>{audition ? `${audition.id} noise · 10 second preview` : 'tap a colour to hear it'}</Text>
        </Reveal>

        <View style={{ gap: 14 }}>
          {PERKS.map((perk, i) => (
            <Reveal key={perk} index={i + 2} style={styles.perk}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={palette.ink} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 3 }}>
                <Path d="M5 12.5l4.5 4.5L19 7.5" />
              </Svg>
              <Text style={[textStyle('body'), { flex: 1, color: palette.ink }]}>{perk}</Text>
            </Reveal>
          ))}
        </View>

        <View style={{ gap: 12, alignItems: 'center' }}>
          <Text style={[textStyle('caption'), { color: palette.muted }]}>or just say thanks</Text>
          <View style={styles.tips}>
            {ready
              ? products.tips.map((t) => (
                  <Animated.View key={t} entering={FadeIn.duration(200)}>
                    <GlassPill label={t} accessibilityLabel={`tip ${t}`} style={{ minWidth: 88 }} />
                  </Animated.View>
                ))
              : [0, 1, 2].map((i) => <Skeleton key={i} width={88} height={44} radius={22} />)}
          </View>
        </View>
      </ScrollView>

      {/* sticky purchase bar: the button is above the fold on every phone */}
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
        <Glass style={styles.barGlass}>
          {ready ? (
            <Animated.View entering={FadeIn.duration(200)}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`unlock neiro pro for ${products.pro}`}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                style={({ pressed }) => [styles.cta, { width: ctaWidth - 16, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
              >
                <Text style={{ fontFamily: fonts.heavy, fontSize: 17, color: palette.paper }}>unlock for {products.pro}</Text>
              </Pressable>
            </Animated.View>
          ) : (
            <Skeleton width={ctaWidth - 16} height={56} radius={28} />
          )}
          <Pressable accessibilityRole="button" accessibilityLabel="restore purchase" style={styles.restore}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: palette.ink }}>restore purchase</Text>
          </Pressable>
        </Glass>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 20, gap: 28 },
  section: { fontFamily: fonts.heavy, fontSize: 13, letterSpacing: 1, color: palette.muted, textAlign: 'center' },
  auditionRow: { flexDirection: 'row', justifyContent: 'space-around' },
  audition: { alignItems: 'center', gap: 4 },
  auditionDotWrap: { width: 70, height: 70, alignItems: 'center', justifyContent: 'center' },
  auditionDot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
  cellLabel: { fontFamily: fonts.bold, fontSize: 13, color: palette.ink },
  hint: { fontFamily: fonts.bold, fontSize: 14, color: palette.muted, textAlign: 'center' },
  perk: { flexDirection: 'row', gap: 12 },
  tips: { flexDirection: 'row', gap: 10 },
  bar: { position: 'absolute', left: 16, right: 16, bottom: 0, alignItems: 'center' },
  barGlass: { borderRadius: 32, padding: 8, gap: 2, alignItems: 'center', alignSelf: 'stretch' },
  cta: { minHeight: 56, borderRadius: 28, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' },
  restore: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
