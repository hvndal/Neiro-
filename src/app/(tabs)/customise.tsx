import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Glass } from '../../components/Glass';
import { RingMark } from '../../components/RingMark';
import { Wash } from '../../components/Wash';
import { useIsPro } from '../../state/entitlement';
import { fonts, layout, NOISES, palette, textStyle } from '../../theme/tokens';

const FINISHES = [
  { name: 'ceramic', colours: ['#FFFFFF', '#F7F5F0'] },
  { name: 'brass', colours: ['#E8C77E', '#B08A3A'] },
  { name: 'walnut', colours: ['#7A5538', '#4A3222'] },
  { name: 'chrome', colours: ['#FAFBFC', '#9DA3AB'] },
] as const;

const GRAINS = ['none', '16mm', '35mm', 'vhs'] as const;

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 14 }}>
      <View style={styles.sectionHead}>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.heavy, fontSize: 18, color: palette.ink }}>
          {title}
        </Text>
        {note && <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: palette.muted }}>{note}</Text>}
      </View>
      {children}
    </View>
  );
}

/** Small padlock for anything behind Pro. */
function Lock({ style }: { style?: object }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.lock, style]}>
      <Svg width={12} height={12} viewBox="0 0 24 24">
        <Rect x={5} y={10.5} width={14} height={10} rx={2.5} fill={palette.paper} />
        <Path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" stroke={palette.paper} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}

// Everything here is pro. Free users tap through to the Pro sheet; the real pickers wire in with IAP.
export default function Customise() {
  const insets = useSafeAreaInsets();
  const isPro = useIsPro();
  const [icon, setIcon] = useState('rings');
  const [finish, setFinish] = useState('ceramic');
  const [grain, setGrain] = useState<string>('16mm');
  // Free: the rings icon, ceramic dial, none/16mm grain. Everything else opens the Pro sheet.
  const pick = (set: (v: string) => void, v: string, locked: boolean) => () => {
    if (locked && !isPro) return router.push('/pro');
    set(v);
  };
  const FREE_GRAINS = ['none', '16mm'];

  return (
    <View style={styles.root}>
      <Wash />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
        <Text accessibilityRole="header" style={[textStyle('title'), { color: palette.ink }]}>
          customise
        </Text>

        <Section title="app icon" note="the rings are free · colours are pro">
          <View style={styles.iconGrid}>
            {[{ id: 'rings', hex: palette.paper }, ...NOISES.map((n) => ({ id: n.id as string, hex: n.hex }))].map((ic) => {
              const sel = icon === ic.id;
              const locked = ic.id !== 'rings' && !isPro;
              return (
                <Pressable key={ic.id} accessibilityRole="button" accessibilityLabel={`${ic.id} icon${locked ? ', pro' : ''}`} accessibilityState={{ selected: sel }} onPress={pick(setIcon, ic.id, ic.id !== 'rings')} style={styles.iconCell}>
                  <View style={[styles.icon, { backgroundColor: ic.hex }, sel ? styles.selected : styles.plain]}>
                    {locked && <Lock style={styles.lockCorner} />}
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

        <Section title="dial finish" note="ceramic is free">
          <View style={styles.finishRow}>
            {FINISHES.map((f) => {
              const sel = finish === f.name;
              const locked = f.name !== 'ceramic' && !isPro;
              return (
                <Pressable key={f.name} accessibilityRole="button" accessibilityLabel={`${f.name} dial${locked ? ', pro' : ''}`} accessibilityState={{ selected: sel }} onPress={pick(setFinish, f.name, f.name !== 'ceramic')} style={styles.finishCell}>
                  <View style={[styles.finish, sel ? styles.selected : styles.plain, { backgroundColor: f.colours[0], borderColor: f.colours[1] }]}>
                    <View style={[StyleSheet.absoluteFill, { borderRadius: 26, backgroundColor: f.colours[1], opacity: 0.45, transform: [{ scale: 0.55 }] }]} />
                    {locked && <Lock style={styles.lockCorner} />}
                  </View>
                  <Text style={styles.cellLabel}>{f.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="grain" note="35mm and vhs are pro">
          <Glass style={styles.segment}>
            {GRAINS.map((g) => {
              const sel = grain === g;
              const locked = !FREE_GRAINS.includes(g) && !isPro;
              return (
                <Pressable key={g} accessibilityRole="button" accessibilityLabel={`${g} grain${locked ? ', pro' : ''}`} accessibilityState={{ selected: sel }} onPress={pick(setGrain, g, !FREE_GRAINS.includes(g))} style={[styles.segBtn, sel && { backgroundColor: palette.ink }]}>
                  <Text style={{ fontFamily: fonts.heavy, fontSize: 15, color: sel ? palette.paper : palette.ink }}>{g}</Text>
                  {locked && <Lock style={{ marginLeft: 6, position: 'relative' }} />}
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
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  lock: { width: 20, height: 20, borderRadius: 10, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' },
  lockCorner: { position: 'absolute', right: -6, top: -6 },
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
  segBtn: { flex: 1, minHeight: layout.minTouch, borderRadius: 999, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  unlock: { minHeight: 52, borderRadius: 999, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' },
});
