import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Glass } from '../components/Glass';
import { GlassPill } from '../components/GlassPill';
import { RingMark } from '../components/RingMark';
import { Wash } from '../components/Wash';
import { fonts, NOISES, palette, textStyle } from '../theme/tokens';

const PERKS = [
  'four more noise colours',
  'seven colour app icons (the rings are free)',
  'dial finishes: ceramic, brass, walnut, chrome',
  'grain styles: 35mm, vhs',
  'study modes: 50/10, 52/17, flowtime, custom',
  'custom tints, saved mixes, wallpapers',
];

const TIPS = ['$1.99', '$4.99', '$9.99'];

// Layout only. Store prices (with skeleton while they load), purchase and restore wire in with IAP.
export default function Pro() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <Wash />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: 20, paddingBottom: insets.bottom + 32 }]}>
        <GlassPill size={44} accessibilityLabel="Close" onPress={() => router.back()} style={{ alignSelf: 'flex-end' }}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={palette.ink} strokeWidth={2.4} strokeLinecap="round">
            <Path d="M6 6l12 12M18 6L6 18" />
          </Svg>
        </GlassPill>

        <View style={{ alignItems: 'center', gap: 10 }}>
          <RingMark size={84} />
          <Text accessibilityRole="header" style={[textStyle('title'), { color: palette.ink }]}>
            neiro pro
          </Text>
          <Text style={[textStyle('body'), { color: palette.muted }]}>pay once. no subscription. no ads.</Text>
        </View>

        <View style={styles.locked}>
          {NOISES.filter((n) => n.pro).map((n) => (
            <View key={n.id} style={{ alignItems: 'center', gap: 6 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: n.hex }} />
              <Text style={[textStyle('caption'), { color: palette.ink }]}>{n.id}</Text>
            </View>
          ))}
        </View>

        <View style={{ gap: 14 }}>
          {PERKS.map((perk) => (
            <View key={perk} style={styles.perk}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={palette.ink} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 3 }}>
                <Path d="M5 12.5l4.5 4.5L19 7.5" />
              </Svg>
              <Text style={[textStyle('body'), { flex: 1, color: palette.ink }]}>{perk}</Text>
            </View>
          ))}
        </View>

        <View style={{ gap: 12 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="unlock for $4.99">
            <Glass tone="dark" tint={palette.ink} solid={palette.ink} interactive style={styles.cta}>
              <Text style={{ fontFamily: fonts.heavy, fontSize: 17, color: palette.paper }}>unlock for $4.99</Text>
            </Glass>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="restore purchase" style={styles.restore}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: palette.ink }}>restore purchase</Text>
          </Pressable>
        </View>

        <View style={{ gap: 12, alignItems: 'center' }}>
          <Text style={[textStyle('caption'), { color: palette.muted }]}>or just say thanks</Text>
          <View style={styles.tips}>
            {TIPS.map((t) => (
              <GlassPill key={t} label={t} accessibilityLabel={`tip ${t}`} style={{ minWidth: 88 }} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, gap: 28 },
  locked: { flexDirection: 'row', justifyContent: 'space-around' },
  perk: { flexDirection: 'row', gap: 12 },
  cta: { minHeight: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  restore: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  tips: { flexDirection: 'row', gap: 10 },
});
