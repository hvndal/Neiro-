import { router, useIsFocused } from 'expo-router';
import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dial, LENS_R, dotCentre } from '../../components/Dial';
import { GlassPill } from '../../components/GlassPill';
import { Grain } from '../../components/Grain';
import { RingMark } from '../../components/RingMark';
import { LivingWash } from '../../skia/LivingWash';
import { player, usePlayer } from '../../state/player';
import { layout, noiseById, NOISES, palette, textStyle, type NoiseId } from '../../theme/tokens';

export default function Play() {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { noiseId, playing } = usePlayer();
  const noise = noiseById(noiseId);
  const dark = noise.on === palette.paper;
  const proCount = NOISES.filter((n) => n.pro).length;

  // Dial box position in screen coordinates: the shader draws the glass lens and the reveal from there.
  const dialRef = useRef<ComponentRef<typeof View>>(null);
  const [box, setBox] = useState<{ x: number; y: number } | null>(null);
  const [revealFrom, setRevealFrom] = useState<{ x: number; y: number } | null>(null);
  const measure = useCallback(() => {
    dialRef.current?.measureInWindow((x, y) => setBox((b) => (b && b.x === x && b.y === y ? b : { x, y })));
  }, []);

  const select = (id: NoiseId, locked: boolean) => {
    if (locked) return router.push('/pro');
    if (box) setRevealFrom(dotCentre(NOISES.findIndex((n) => n.id === id), box.x, box.y));
    player.setNoise(id);
  };

  return (
    <View style={[styles.root, { backgroundColor: noise.hex, paddingTop: insets.top + 12 }]}>
      <LivingWash
        noise={noiseId}
        playing={playing}
        active={focused}
        revealFrom={revealFrom}
        lens={box ? { x: box.x + 160, y: box.y + 160, r: LENS_R } : null}
      />

      <View style={styles.top}>
        <View style={styles.brand}>
          <RingMark size={28} gap={palette.paper} />
          <Text style={[textStyle('title'), { fontSize: 22, lineHeight: 26, letterSpacing: -0.44, color: noise.on }]}>neiro</Text>
        </View>
        <GlassPill label="get pro" tone={dark ? 'dark' : 'light'} color={noise.on} fontSize={16} onPress={() => router.push('/pro')} style={{ paddingHorizontal: 18 }} />
      </View>

      <View style={styles.hero}>
        <Text accessibilityRole="header" style={[textStyle('hero'), { color: noise.on }]}>
          {noise.id}
        </Text>
        <Text style={[textStyle('title'), { lineHeight: 44, color: noise.on, marginTop: -4 }]}>noise</Text>
        <Text style={[textStyle('body'), { fontFamily: 'Nunito_800ExtraBold', fontSize: 19, color: noise.on, marginTop: 12 }]}>
          <Text style={[textStyle('eyebrow'), { color: noise.on, opacity: 0.8 }]}>BEST FOR  </Text>
          {noise.bestFor}
        </Text>
        <View style={styles.pills}>
          <GlassPill label="sleep timer · 45 min" tone={dark ? 'dark' : 'light'} color={noise.on} />
          <GlassPill label="+ mix" tone={dark ? 'dark' : 'light'} color={noise.on} />
        </View>
      </View>

      <View style={styles.dialWrap}>
        <View ref={dialRef} onLayout={measure} collapsable={false}>
          <Dial noiseId={noiseId} playing={playing} shaderLens={box !== null} onSelect={select} onToggle={player.toggle} />
        </View>
        <Text style={[textStyle('caption'), { color: noise.on, opacity: 0.8 }]}>turn to change colour · {proCount} more with pro</Text>
      </View>
      <Grain opacity={dark ? 0.3 : 0.35} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24, paddingBottom: layout.contentBottomPad },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hero: { flex: 1, justifyContent: 'center' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  dialWrap: { alignItems: 'center', gap: 14 },
});
