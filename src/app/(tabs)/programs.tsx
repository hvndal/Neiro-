import * as Haptics from 'expo-haptics';
import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Equaliser } from '../../components/Equaliser';
import { Lock } from '../../components/Lock';
import { Reveal } from '../../motion/Reveal';
import { LivingWash } from '../../skia/LivingWash';
import { useIsPro } from '../../state/entitlement';
import { player, usePlayer } from '../../state/player';
import { fonts, layout, noiseById, palette, textStyle, type NoiseId } from '../../theme/tokens';

type Program = { id: string; name: string; meta: string; colours: NoiseId[]; pro: boolean };

// Seed list (handover §7). Free = programs that only use free colours.
const PROGRAMS: Program[] = [
  { id: 'long-night', name: 'long night', meta: '8 h · pink to brown, fades out', colours: ['pink', 'brown'], pro: false },
  { id: 'focus-50', name: 'focus 50', meta: '50 min brown, then 10 min white', colours: ['brown', 'white'], pro: false },
  { id: 'nap-20', name: 'nap 20', meta: '20 min · pink, gentle fade', colours: ['pink'], pro: false },
  { id: 'deep-work', name: 'deep work', meta: '90 min · brown to green', colours: ['brown', 'green'], pro: true },
  { id: 'blue-hour', name: 'blue hour', meta: '30 min · blue to violet', colours: ['blue', 'violet'], pro: true },
  { id: 'still-air', name: 'still air', meta: '2 h · grey to white', colours: ['grey', 'white'], pro: true },
];

export default function Programs() {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const isPro = useIsPro();
  const { noiseId, playing, programId } = usePlayer();

  return (
    <View style={styles.root}>
      {focused && <StatusBar style="dark" />}
      {/* the playing colour, softly: one identity across every screen (handover §8) */}
      <LivingWash noise={noiseId} variant="soft" playing={playing} active={focused} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}>
        <Reveal index={0} style={{ gap: 8 }}>
          <Text accessibilityRole="header" style={[textStyle('title'), { color: palette.ink }]}>
            programs
          </Text>
          <Text style={[textStyle('body'), { fontSize: 16, lineHeight: 22, color: palette.muted }]}>timed sessions that move through colours</Text>
        </Reveal>

        <View style={{ gap: 12 }}>
          {PROGRAMS.map((p, i) => {
            const locked = p.pro && !isPro;
            const active = programId === p.id && playing;
            return (
              <Reveal key={p.id} index={i + 1}>
                {/* solid cards: content is never glass (handover §8) */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${p.name}, ${p.meta}${locked ? ', pro' : ''}${active ? ', playing' : ''}`}
                  accessibilityHint={locked ? 'opens neiro pro' : active ? 'pauses' : 'starts this program'}
                  onPress={() => {
                    if (locked) return router.push('/pro');
                    Haptics.selectionAsync();
                    if (active) player.pause();
                    else player.startProgram(p.id, p.colours[0]);
                  }}
                  style={({ pressed }) => [styles.card, active && styles.cardActive, { transform: [{ scale: pressed ? 0.985 : 1 }] }]}
                >
                  <View style={styles.dots}>
                    {p.colours.map((c, k) => (
                      <View key={c} style={[styles.chipDot, { backgroundColor: noiseById(c).hex, marginLeft: k === 0 ? 0 : -8, opacity: locked ? 0.7 : 1 }]} />
                    ))}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontFamily: fonts.heavy, fontSize: 18, color: palette.ink }}>{p.name}</Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: palette.muted }}>{active ? 'playing now' : p.meta}</Text>
                  </View>
                  {locked ? (
                    <View style={styles.proChip}>
                      <Lock size={16} style={{ backgroundColor: 'transparent' }} />
                      <Text style={{ fontFamily: fonts.heavy, fontSize: 13, color: palette.paper }}>pro</Text>
                    </View>
                  ) : (
                    <View style={[styles.playIcon, active && { backgroundColor: palette.ink }]}>
                      {active ? (
                        <Equaliser color={palette.paper} />
                      ) : (
                        <Svg width={14} height={14} viewBox="0 0 24 24" fill={palette.ink}>
                          <Path d="M7 4.5v15l13-7.5z" />
                        </Svg>
                      )}
                    </View>
                  )}
                </Pressable>
              </Reveal>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: layout.contentBottomPad + 16, gap: 28 },
  card: { minHeight: 76, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 22, backgroundColor: '#FFFFFF' },
  cardActive: { boxShadow: '0 0 0 2px #15171D' },
  dots: { width: 56, flexDirection: 'row', alignItems: 'center' },
  chipDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 2.5, borderColor: '#FFFFFF' },
  proChip: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingLeft: 6, paddingRight: 11, paddingVertical: 5, borderRadius: 999, backgroundColor: palette.ink },
  playIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(21,23,29,0.06)' },
});
