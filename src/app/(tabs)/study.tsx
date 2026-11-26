import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { GlassPill } from '../../components/GlassPill';
import { Grain } from '../../components/Grain';
import { Lock } from '../../components/Lock';
import { LivingWash } from '../../skia/LivingWash';
import { useIsPro } from '../../state/entitlement';
import { BREAK_NOISE, FOCUS_NOISE, study, useStudy } from '../../state/study';
import { useNow } from '../../state/useNow';
import { STUDY_MODES, breakMs, clockMs, focusMs, formatClock, isPaused, isRunning, modeById } from '../../study/machine';
import { fonts, layout, noiseById, palette, textStyle } from '../../theme/tokens';

const spoken = (ms: number) => {
  const m = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return `${m} minute${m === 1 ? '' : 's'}${s ? ` ${s} seconds` : ''}`;
};
/** Inline colour dot with a rim in the text colour, so brown stays visible on the brown wash. */
function Dot({ hex, rim }: { hex: string; rim: string }) {
  return <View style={[styles.inlineDot, { backgroundColor: hex, borderColor: rim }]} />;
}

// lowercase UI (handover §12): "4:29 am", not "4:29 AM"
const clockTime = (t: number) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();

export default function Study() {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const reduce = useReducedMotion();
  const isPro = useIsPro();
  const s = useStudy();
  const running = isRunning(s);
  const paused = isPaused(s);
  const now = useNow(1000, focused && running);
  const mode = modeById(s.mode);
  const noise = noiseById(s.phase === 'break' ? BREAK_NOISE : FOCUS_NOISE);
  const focusNoise = noiseById(FOCUS_NOISE);
  const breakNoise = noiseById(BREAK_NOISE);
  const on = noise.on;
  const dark = on === palette.paper;
  const tone = dark ? 'dark' : 'light';
  const ms = clockMs(s, now);

  const eyebrow = {
    idle: `READY · ${mode.sessions} × ${mode.focusMin === null ? 'FLOW' : `${mode.focusMin} MIN`}`,
    focus: `${paused ? 'PAUSED · ' : ''}FOCUS · ${s.session} OF ${mode.sessions}`,
    break: `${paused ? 'PAUSED · ' : ''}BREAK · ${s.session} OF ${mode.sessions}`,
    done: `DONE · ${mode.sessions} OF ${mode.sessions}`,
  }[s.phase];

  // How far through the current block we are, for the session bars.
  const full = s.phase === 'focus' ? focusMs(s.mode) : s.phase === 'break' ? breakMs(s) : null;
  const progress = full ? Math.min(1, Math.max(0, 1 - ms / full)) : 0;
  const completed = s.phase === 'done' ? mode.sessions : s.phase === 'break' ? s.session : s.session - 1;

  return (
    <View style={[styles.root, { backgroundColor: noise.hex, paddingTop: insets.top + 12 }]}>
      {focused && <StatusBar style={dark ? 'light' : 'dark'} />}
      {/* phase change: the wash moves to the break colour over 2 s (handover §9) */}
      <LivingWash noise={noise.id} playing={running} active={focused} revealMs={2000} />
      <Grain opacity={0.3} />

      <View style={styles.top}>
        <Text accessibilityRole="header" style={[textStyle('title'), { fontSize: 22, lineHeight: 26, letterSpacing: -0.44, color: on }]}>
          study
        </Text>
        <GlassPill tone={tone} color={on} accessibilityLabel={`${noise.id} noise`}>
          <View style={[styles.chipDot, { backgroundColor: noise.hex, borderColor: on }]} />
          <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: on }}>{noise.id} noise</Text>
        </GlassPill>
      </View>

      <View style={styles.centre}>
        <Animated.View key={eyebrow} entering={FadeIn.duration(250)}>
          <Text style={[textStyle('eyebrow'), { color: on, opacity: 0.85 }]}>{eyebrow}</Text>
        </Animated.View>
        <Text
          accessibilityLabel={s.phase === 'done' ? `${spoken(ms)} focused` : mode.focusMin === null && s.phase === 'focus' ? `${spoken(ms)} so far` : `${spoken(ms)} left`}
          style={[textStyle('countdown'), { color: on, fontVariant: ['tabular-nums'], marginTop: 6, opacity: paused ? 0.55 : 1 }]}
        >
          {formatClock(ms)}
        </Text>
        <View style={styles.subRow}>
          {s.phase === 'idle' && (
            <>
              <Text style={[styles.sub, { color: on }]}>focus in</Text>
              <Dot hex={focusNoise.hex} rim={on} />
              <Text style={[styles.sub, { color: on }]}>{focusNoise.id}, breaks in</Text>
              <Dot hex={breakNoise.hex} rim={on} />
              <Text style={[styles.sub, { color: on }]}>{breakNoise.id}</Text>
            </>
          )}
          {s.phase === 'focus' &&
            (mode.focusMin === null ? (
              <Text style={[styles.sub, { color: on }]}>when you stop, the break is a fifth of it</Text>
            ) : s.session >= mode.sessions ? (
              <Text style={[styles.sub, { color: on }]}>last one. then you are done</Text>
            ) : (
              <>
                <Text style={[styles.sub, { color: on }]}>then a {Math.round(breakMs(s) / 60_000)} min break in</Text>
                <Dot hex={breakNoise.hex} rim={on} />
                <Text style={[styles.sub, { color: on }]}>{breakNoise.id}</Text>
              </>
            ))}
          {s.phase === 'break' && (
            <>
              <Text style={[styles.sub, { color: on }]}>back to</Text>
              <Dot hex={focusNoise.hex} rim={on} />
              <Text style={[styles.sub, { color: on }]}>
                {focusNoise.id}
                {s.endsAt ? ` at ${clockTime(s.endsAt)}` : ''}
              </Text>
            </>
          )}
          {s.phase === 'done' && <Text style={[styles.sub, { color: on }]}>focused, all in. take a longer break</Text>}
        </View>
        <View style={styles.sessions} accessibilityLabel={`${completed} of ${mode.sessions} sessions done`}>
          {Array.from({ length: mode.sessions }, (_, i) => {
            const fill = i < completed ? 1 : i === completed && s.phase === 'focus' ? progress : 0;
            return (
              <View key={i} style={[styles.bar, { backgroundColor: dark ? 'rgba(247,245,240,0.3)' : 'rgba(21,23,29,0.18)' }]}>
                <View style={[styles.barFill, { width: `${fill * 100}%`, backgroundColor: on }]} />
              </View>
            );
          })}
        </View>
      </View>

      {(s.phase === 'idle' || s.phase === 'done') && (
        <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(150)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modes} style={styles.modesScroll}>
            {STUDY_MODES.map((m) => {
              const sel = m.id === s.mode;
              const locked = m.pro && !isPro;
              const label = `${m.label}${locked ? ', pro' : ''}`;
              const choose = () => (locked ? router.push('/pro') : study.selectMode(m.id));
              return sel ? (
                <Pressable key={m.id} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: true }} onPress={choose} style={[styles.chip, { backgroundColor: on }]}>
                  <Text style={{ fontFamily: fonts.heavy, fontSize: 15, color: noise.hex }}>{m.label}</Text>
                </Pressable>
              ) : (
                <GlassPill key={m.id} tone={tone} color={on} accessibilityLabel={label} onPress={choose} style={{ paddingHorizontal: 16 }}>
                  <Text style={{ fontFamily: fonts.heavy, fontSize: 15, color: on }}>{m.label}</Text>
                  {locked && <Lock size={18} />}
                </GlassPill>
              );
            })}
          </ScrollView>
        </Animated.View>
      )}

      <View style={styles.controls}>
        {s.phase === 'idle' || s.phase === 'done' ? (
          <Pressable
            accessibilityRole="button"
            onPress={s.phase === 'done' ? study.reset : study.start}
            style={({ pressed }) => [styles.primary, { backgroundColor: on, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          >
            <Text style={{ fontFamily: fonts.heavy, fontSize: 18, color: noise.hex }}>{s.phase === 'done' ? 'again' : 'start focus'}</Text>
          </Pressable>
        ) : (
          <>
            <GlassPill size={56} tone={tone} accessibilityLabel="Restart this block" onPress={study.restart}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={on} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5" />
                <Path d="M4.5 4.5v4h4" />
              </Svg>
            </GlassPill>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={paused ? 'Resume' : 'Pause'}
              onPress={paused ? study.resume : study.pause}
              style={({ pressed }) => [styles.pause, { backgroundColor: on, transform: [{ scale: pressed ? 0.96 : 1 }] }]}
            >
              <Animated.View key={paused ? 'play' : 'pause'} entering={reduce ? FadeIn.duration(150) : ZoomIn.duration(200)} exiting={FadeOut.duration(100)}>
                <Svg width={28} height={28} viewBox="0 0 28 28">
                  {paused ? (
                    <Path d="M7 3v22l19-11z" fill={noise.hex} />
                  ) : (
                    <>
                      <Rect x={4} y={0} width={8} height={28} rx={3} fill={noise.hex} />
                      <Rect x={16} y={0} width={8} height={28} rx={3} fill={noise.hex} />
                    </>
                  )}
                </Svg>
              </Animated.View>
            </Pressable>
            <GlassPill size={56} tone={tone} accessibilityLabel={s.phase === 'focus' ? 'Skip to break' : 'Skip to focus'} onPress={study.skip}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={on} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M6 6l8 6-8 6z" />
                <Path d="M18 6v12" />
              </Svg>
            </GlassPill>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24, paddingBottom: layout.contentBottomPad, gap: 18 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chipDot: { width: 12, height: 12, borderRadius: 7, borderWidth: 2 },
  centre: { flex: 1, justifyContent: 'center' },
  subRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 14 },
  sub: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 24 },
  inlineDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
  sessions: { flexDirection: 'row', gap: 8, marginTop: 18 },
  bar: { width: 28, height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  modesScroll: { marginHorizontal: -24 },
  modes: { paddingHorizontal: 24, gap: 8 },
  chip: { minHeight: layout.minTouch, paddingHorizontal: 16, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, minHeight: 84 },
  primary: { flex: 1, minHeight: 60, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  pause: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
});
