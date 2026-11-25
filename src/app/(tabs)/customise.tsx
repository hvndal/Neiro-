import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '../../components/BackButton';
import { Glass } from '../../components/Glass';
import { RingMark } from '../../components/RingMark';
import { Wash } from '../../components/Wash';
import { fonts, layout, NOISES, palette, textStyle } from '../../theme/tokens';

const FINISHES = [
  { name: 'ceramic', colours: ['#FFFFFF', '#F7F5F0'] },
  { name: 'brass', colours: ['#E8C77E', '#B08A3A'] },
  { name: 'walnut', colours: ['#7A5538', '#4A3222'] },
  { name: 'chrome', colours: ['#FAFBFC', '#9DA3AB'] },
] as const;

const GRAINS = ['none', '16mm', '35mm', 'vhs'] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 14 }}>
      <View style={styles.sectionHead}>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.heavy, fontSize: 18, color: palette.ink }}>
          {title}
        </Text>
        <View style={styles.proChip}>
          <Text style={{ fontFamily: fonts.heavy, fontSize: 12, color: palette.paper }}>pro</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

// Everything here is pro. Free users tap through to the Pro sheet; the real pickers wire in with IAP.
export default function Customise() {
  const insets = useSafeAreaInsets();
  const [icon, setIcon] = useState('rings');
  const [finish, setFinish] = useState('ceramic');
  const [grain, setGrain] = useState<string>('16mm');
  const pick = (set: (v: string) => void, v: string) => () => {
    set(v);
  };

  return (
    <View style={styles.root}>
      <Wash />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
        <View style={{ gap: 16 }}>
          <BackButton />
          <Text accessibilityRole="header" style={[textStyle('title'), { color: palette.ink }]}>
            customise
          </Text>
        </View>

        <Section title="app icon">
          <View style={styles.iconGrid}>
            {[{ id: 'rings', hex: palette.paper }, ...NOISES.map((n) => ({ id: n.id as string, hex: n.hex }))].map((ic) => {
              const sel = icon === ic.id;
              return (
                <Pressable key={ic.id} accessibilityRole="button" accessibilityLabel={`${ic.id} icon`} accessibilityState={{ selected: sel }} onPress={pick(setIcon, ic.id)} style={styles.iconCell}>
                  <View style={[styles.icon, { backgroundColor: ic.hex }, sel ? styles.selected : styles.plain]}>
                    {ic.id === 'rings' ? (
                      <RingMark size={44} gap={palette.paper} notch={false} />
                    ) : (
                      <View style={[styles.knob, { backgroundColor: ic.hex }]}>
                        <View style={[styles.knobNotch, { backgroundColor: NOISES.find((n) => n.id === ic.id)!.on }]} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.cellLabel}>{ic.id}</Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="dial finish">
          <View style={styles.finishRow}>
            {FINISHES.map((f) => {
              const sel = finish === f.name;
              return (
                <Pressable key={f.name} accessibilityRole="button" accessibilityLabel={`${f.name} dial`} accessibilityState={{ selected: sel }} onPress={pick(setFinish, f.name)} style={styles.finishCell}>
                  <View style={[styles.finish, sel ? styles.selected : styles.plain, { backgroundColor: f.colours[0], borderColor: f.colours[1] }]}>
                    <View style={[StyleSheet.absoluteFill, { borderRadius: 26, backgroundColor: f.colours[1], opacity: 0.45, transform: [{ scale: 0.55 }] }]} />
                  </View>
                  <Text style={styles.cellLabel}>{f.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="grain">
          <Glass style={styles.segment}>
            {GRAINS.map((g) => {
              const sel = grain === g;
              return (
                <Pressable key={g} accessibilityRole="button" accessibilityState={{ selected: sel }} onPress={pick(setGrain, g)} style={[styles.segBtn, sel && { backgroundColor: palette.ink }]}>
                  <Text style={{ fontFamily: fonts.heavy, fontSize: 15, color: sel ? palette.paper : palette.ink }}>{g}</Text>
                </Pressable>
              );
            })}
          </Glass>
        </Section>

        <Pressable accessibilityRole="button" onPress={() => router.push('/pro')} style={styles.unlock}>
          <Text style={{ fontFamily: fonts.heavy, fontSize: 16, color: palette.paper }}>unlock with pro</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: layout.contentBottomPad + 16, gap: 28 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  proChip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: palette.ink },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16, columnGap: 12 },
  iconCell: { width: '22%', alignItems: 'center', gap: 6 },
  icon: { width: 64, height: 64, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  knob: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 7, shadowOffset: { width: 0, height: 3 } },
  knobNotch: { position: 'absolute', left: 18, top: 4, width: 4, height: 10, borderRadius: 2 },
  cellLabel: { fontFamily: fonts.bold, fontSize: 13, color: '#3A3D45' },
  selected: { borderWidth: 0, shadowColor: palette.ink, shadowOpacity: 0, outlineWidth: 0, boxShadow: '0 0 0 3px #F7F5F0, 0 0 0 5.5px #15171D' },
  plain: { boxShadow: '0 2px 6px rgba(21,23,29,0.12)' },
  finishRow: { flexDirection: 'row', gap: 12 },
  finishCell: { flex: 1, alignItems: 'center', gap: 6 },
  finish: { width: 52, height: 52, borderRadius: 26, borderWidth: 1 },
  segment: { flexDirection: 'row', gap: 8, padding: 4, borderRadius: 999 },
  segBtn: { flex: 1, minHeight: layout.minTouch, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  unlock: { minHeight: 52, borderRadius: 999, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' },
});
