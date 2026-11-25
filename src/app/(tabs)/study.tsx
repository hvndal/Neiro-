import { useIsFocused } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { GlassPill } from '../../components/GlassPill';
import { Grain } from '../../components/Grain';
import { LivingWash } from '../../skia/LivingWash';
import { fonts, layout, noiseById, palette, textStyle } from '../../theme/tokens';

const MODES = [
  { id: 'pomodoro', name: 'pomodoro 25/5', pro: false },
  { id: '50-10', name: '50/10', pro: true },
  { id: '52-17', name: '52/17', pro: true },
  { id: 'flowtime', name: 'flowtime', pro: true },
  { id: 'custom', name: 'custom', pro: true },
] as const;

// Layout only. Real timers (timestamp-based + notifications) are the Study step.
export default function Study() {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const brown = noiseById('brown');
  const pink = noiseById('pink');
  const [mode, setMode] = useState<string>('pomodoro');
  const paper = palette.paper;

  return (
    <View style={[styles.root, { backgroundColor: brown.hex, paddingTop: insets.top + 12 }]}>
      <LivingWash noise="brown" playing active={focused} />
      <View style={styles.top}>
        <Text accessibilityRole="header" style={[textStyle('title'), { fontSize: 22, lineHeight: 26, letterSpacing: -0.44, color: paper }]}>
          study
        </Text>
        <GlassPill tone="dark" color={paper}>
          <View style={[styles.dot, { backgroundColor: brown.hex, borderColor: paper, borderWidth: 2 }]} />
          <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: paper }}>brown noise</Text>
        </GlassPill>
      </View>

      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={[textStyle('eyebrow'), { color: '#EAD9CF' }]}>FOCUS · 2 OF 4</Text>
        <Text style={[textStyle('countdown'), { color: paper, fontVariant: ['tabular-nums'], marginTop: 6 }]}>18:42</Text>
        <View style={styles.thenRow}>
          <Text style={[textStyle('body'), { fontFamily: fonts.bold, color: paper }]}>then a 5 min break in</Text>
          <View style={[styles.dot, { width: 14, height: 14, backgroundColor: pink.hex }]} />
          <Text style={[textStyle('body'), { fontFamily: fonts.bold, color: paper }]}>pink</Text>
        </View>
        <View accessibilityLabel="session 2 of 4" style={styles.sessions}>
          {[1, 1, 0, 0].map((on, i) => (
            <View key={i} style={{ width: 28, height: 8, borderRadius: 4, backgroundColor: on ? paper : 'rgba(247,245,240,0.3)' }} />
          ))}
        </View>
      </View>

      <View style={styles.modes}>
        {MODES.map((m) => {
          const sel = m.id === mode;
          const label = m.name + (m.pro ? ', pro' : '');
          const choose = () => !m.pro && setMode(m.id);
          return sel ? (
            <Pressable key={m.id} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: true }} onPress={choose} style={[styles.chip, { backgroundColor: paper }]}>
              <Text style={{ fontFamily: fonts.heavy, fontSize: 15, color: palette.ink }}>{m.name}</Text>
            </Pressable>
          ) : (
            <GlassPill key={m.id} tone="dark" color={paper} accessibilityLabel={label} onPress={choose} style={{ paddingHorizontal: 16 }}>
              <Text style={{ fontFamily: fonts.heavy, fontSize: 15, color: paper }}>{m.name}</Text>
              {m.pro && (
                <View style={styles.proTag}>
                  <Text style={{ fontFamily: fonts.heavy, fontSize: 11, color: palette.ink }}>pro</Text>
                </View>
              )}
            </GlassPill>
          );
        })}
      </View>

      <View style={styles.controls}>
        <GlassPill size={56} tone="dark" accessibilityLabel="Restart session">
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={paper} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5" />
            <Path d="M4.5 4.5v4h4" />
          </Svg>
        </GlassPill>
        <Pressable accessibilityRole="button" accessibilityLabel="Pause" style={styles.pause}>
          <Svg width={28} height={28} viewBox="0 0 28 28">
            <Rect x={4} y={0} width={8} height={28} rx={3} fill={brown.hex} />
            <Rect x={16} y={0} width={8} height={28} rx={3} fill={brown.hex} />
          </Svg>
        </Pressable>
        <GlassPill size={56} tone="dark" accessibilityLabel="Skip to break">
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={paper} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M6 6l8 6-8 6z" />
            <Path d="M18 6v12" />
          </Svg>
        </GlassPill>
      </View>
      <Grain opacity={0.3} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24, paddingBottom: layout.contentBottomPad, gap: 20 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dot: { width: 12, height: 12, borderRadius: 7 },
  thenRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  sessions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: layout.minTouch, paddingHorizontal: 16, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  proTag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999, backgroundColor: 'rgba(247,245,240,0.9)' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  pause: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#F7F5F0', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
});
