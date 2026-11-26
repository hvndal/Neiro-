import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Wash } from '../../components/Wash';
import { fonts, layout, noiseById, palette, textStyle, type NoiseId } from '../../theme/tokens';

type Program = { name: string; meta: string; colours: NoiseId[]; pro: boolean };

// Seed list (handover §7). Free = programs that only use free colours.
const PROGRAMS: Program[] = [
  { name: 'long night', meta: '8 h · pink to brown, fades out', colours: ['pink', 'brown'], pro: false },
  { name: 'focus 50', meta: '50 min brown, then 10 min white', colours: ['brown', 'white'], pro: false },
  { name: 'nap 20', meta: '20 min · pink, gentle fade', colours: ['pink'], pro: false },
  { name: 'deep work', meta: '90 min · brown to green', colours: ['brown', 'green'], pro: true },
  { name: 'blue hour', meta: '30 min · blue to violet', colours: ['blue', 'violet'], pro: true },
  { name: 'still air', meta: '2 h · grey to white', colours: ['grey', 'white'], pro: true },
];

export default function Programs() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <Wash />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
        <View style={{ gap: 8 }}>
          <Text accessibilityRole="header" style={[textStyle('title'), { color: palette.ink }]}>
            programs
          </Text>
          <Text style={[textStyle('body'), { fontSize: 16, lineHeight: 22, color: palette.muted }]}>timed sessions that move through colours</Text>
        </View>

        <View style={{ gap: 12 }}>
          {PROGRAMS.map((p) => (
            // Solid white cards: content is never glass (handover §8)
            <Pressable
              key={p.name}
              accessibilityRole="button"
              accessibilityLabel={`${p.name}, ${p.meta}${p.pro ? ', pro' : ''}`}
              onPress={() => (p.pro ? router.push('/pro') : router.navigate('/play'))}
              style={styles.card}
            >
              <View style={styles.dots}>
                {p.colours.map((c, i) => (
                  <View key={c} style={[styles.chipDot, { backgroundColor: noiseById(c).hex, marginLeft: i === 0 ? 0 : -8 }]} />
                ))}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontFamily: fonts.heavy, fontSize: 18, color: palette.ink }}>{p.name}</Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: palette.muted }}>{p.meta}</Text>
              </View>
              {p.pro ? (
                <View style={styles.proChip}>
                  <Text style={{ fontFamily: fonts.heavy, fontSize: 13, color: palette.paper }}>pro</Text>
                </View>
              ) : (
                <View style={styles.playIcon}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill={palette.ink}>
                    <Path d="M7 4.5v15l13-7.5z" />
                  </Svg>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: layout.contentBottomPad + 16, gap: 28 },
  card: { minHeight: 76, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 22, backgroundColor: '#FFFFFF' },
  dots: { width: 56, flexDirection: 'row', alignItems: 'center' },
  chipDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 2.5, borderColor: '#FFFFFF' },
  proChip: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, backgroundColor: palette.ink },
  playIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(21,23,29,0.06)' },
});
