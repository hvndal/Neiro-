import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FinishKnob } from '../../components/FinishKnob';
import { Glass } from '../../components/Glass';
import { Grain } from '../../components/Grain';
import { Lock } from '../../components/Lock';
import { Reveal } from '../../motion/Reveal';
import { LivingWash } from '../../skia/LivingWash';
import { useIsPro } from '../../state/entitlement';
import { lookStore, useLook } from '../../state/look';
import { usePlayer } from '../../state/player';
import { FINISHES, GRAINS, type FinishId, type GrainId, type IconId } from '../../theme/finishes';
import { fonts, layout, noiseById, palette, textStyle } from '../../theme/tokens';

const THUMBS: Record<IconId, number> = {
  rings: require('../../../assets/icons/thumbs/rings.png'),
  white: require('../../../assets/icons/thumbs/white.png'),
  pink: require('../../../assets/icons/thumbs/pink.png'),
  brown: require('../../../assets/icons/thumbs/brown.png'),
  green: require('../../../assets/icons/thumbs/green.png'),
  blue: require('../../../assets/icons/thumbs/blue.png'),
  violet: require('../../../assets/icons/thumbs/violet.png'),
  grey: require('../../../assets/icons/thumbs/grey.png'),
};
const ICONS: IconId[] = ['rings', 'white', 'pink', 'brown', 'green', 'blue', 'violet', 'grey'];

type Look = { icon: IconId; finish: FinishId; grain: GrainId };

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

/**
 * Customise (all Pro except the defaults). Try before you buy: tapping a locked option previews it in the card
 * at the top; free options apply at once. The dial finish is the one Play's glass lens wears.
 */
export default function Customise() {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const isPro = useIsPro();
  const look = useLook();
  const { noiseId, playing } = usePlayer();
  const [preview, setPreview] = useState<Partial<Look>>({});
  const shown: Look = { ...look, ...preview };
  const previewing = Object.keys(preview).length > 0;

  // Leaving the screen ends any try-on.
  useFocusEffect(useCallback(() => () => setPreview({}), []));

  const choose = <K extends keyof Look>(key: K, value: Look[K], pro: boolean) => {
    if (pro && !isPro) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPreview((p) => ({ ...p, [key]: value }));
      return;
    }
    Haptics.selectionAsync();
    lookStore.set({ [key]: value } as Partial<Look>);
    setPreview((p) => {
      const next = { ...p };
      delete next[key];
      return next;
    });
  };

  const ring = (applied: boolean, previewed: boolean) => (previewed ? styles.previewed : applied ? styles.selected : styles.plain);
  const noise = noiseById(noiseId);

  return (
    <View style={styles.root}>
      {focused && <StatusBar style="dark" />}
      <LivingWash noise={noiseId} variant="soft" playing={playing} active={focused} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}>
        <Reveal index={0}>
          <Text accessibilityRole="header" style={[textStyle('title'), { color: palette.ink }]}>
            customise
          </Text>
        </Reveal>

        {/* live preview of what is applied, or what is being tried */}
        <Reveal index={1}>
          <View style={styles.card}>
            <View style={styles.previewRow}>
              <View style={styles.previewCell}>
                <Image source={THUMBS[shown.icon]} style={styles.previewIcon} accessibilityLabel={`${shown.icon} app icon`} />
                <Text style={styles.cellLabel}>icon</Text>
              </View>
              <View style={styles.previewCell}>
                <FinishKnob finish={shown.finish} size={84} />
                <Text style={styles.cellLabel}>{shown.finish}</Text>
              </View>
              <View style={styles.previewCell}>
                <View style={[styles.grainSwatch, { backgroundColor: noise.hex }]}>
                  <Grain grain={shown.grain} opacity={0.5} />
                </View>
                <Text style={styles.cellLabel}>{shown.grain === 'none' ? 'no grain' : shown.grain}</Text>
              </View>
            </View>
            {previewing ? (
              <Animated.View key="previewing" entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.previewBar}>
                <Text style={[styles.previewText, { flex: 1 }]}>previewing. unlock to keep it</Text>
                <Pressable accessibilityRole="button" onPress={() => router.push('/pro')} style={styles.unlockSmall}>
                  <Text style={{ fontFamily: fonts.heavy, fontSize: 15, color: palette.paper }}>unlock</Text>
                </Pressable>
              </Animated.View>
            ) : (
              <Animated.Text key="applied" entering={FadeIn.duration(200)} style={styles.previewText}>
                this is how your neiro looks
              </Animated.Text>
            )}
          </View>
        </Reveal>

        <Reveal index={2}>
          <Section title="app icon" note="the rings are free · colours are pro">
            <View style={styles.iconGrid}>
              {ICONS.map((id) => {
                const pro = id !== 'rings';
                const locked = pro && !isPro;
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="button"
                    accessibilityLabel={`${id} icon${locked ? ', pro' : ''}`}
                    accessibilityState={{ selected: look.icon === id }}
                    onPress={() => choose('icon', id, pro)}
                    style={styles.iconCell}
                  >
                    <View style={[styles.iconTile, ring(look.icon === id && !preview.icon, preview.icon === id)]}>
                      <Image source={THUMBS[id]} style={styles.iconImage} />
                      {locked && <Lock style={styles.lockCorner} />}
                    </View>
                    <Text style={styles.cellLabel}>{id}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>
        </Reveal>

        <Reveal index={3}>
          <Section title="dial finish" note="ceramic is free · it is the glass on play">
            <View style={styles.finishRow}>
              {FINISHES.map((f) => {
                const locked = f.pro && !isPro;
                return (
                  <Pressable
                    key={f.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${f.id} dial${locked ? ', pro' : ''}`}
                    accessibilityState={{ selected: look.finish === f.id }}
                    onPress={() => choose('finish', f.id, f.pro)}
                    style={styles.finishCell}
                  >
                    <View style={[styles.finishRing, ring(look.finish === f.id && !preview.finish, preview.finish === f.id)]}>
                      <FinishKnob finish={f.id} size={52} />
                      {locked && <Lock style={styles.lockCorner} />}
                    </View>
                    <Text style={styles.cellLabel}>{f.id}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>
        </Reveal>

        <Reveal index={4}>
          <Section title="grain" note="35mm and vhs are pro">
            <Glass style={styles.segment}>
              {GRAINS.map((g) => {
                const locked = g.pro && !isPro;
                const sel = shown.grain === g.id;
                return (
                  <Pressable
                    key={g.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${g.id} grain${locked ? ', pro' : ''}`}
                    accessibilityState={{ selected: sel }}
                    onPress={() => choose('grain', g.id, g.pro)}
                    style={[styles.segBtn, sel && { backgroundColor: preview.grain === g.id ? palette.muted : palette.ink }]}
                  >
                    <Text style={{ fontFamily: fonts.heavy, fontSize: 15, color: sel ? palette.paper : palette.ink }}>{g.id}</Text>
                    {locked && <Lock size={18} style={{ marginLeft: 6 }} />}
                  </Pressable>
                );
              })}
            </Glass>
          </Section>
        </Reveal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: layout.contentBottomPad + 16, gap: 28 },
  card: { borderRadius: 26, backgroundColor: '#FFFFFF', padding: 18, gap: 14 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between' },
  previewCell: { alignItems: 'center', gap: 8 },
  previewIcon: { width: 84, height: 84, borderRadius: 19 },
  grainSwatch: { width: 84, height: 84, borderRadius: 19, overflow: 'hidden' },
  previewBar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewText: { fontFamily: fonts.bold, fontSize: 14, color: palette.muted, textAlign: 'center' },
  unlockSmall: { minHeight: 44, paddingHorizontal: 18, borderRadius: 999, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16, justifyContent: 'space-between' },
  iconCell: { width: '23%', alignItems: 'center', gap: 6 },
  iconTile: { width: 64, height: 64, borderRadius: 15 },
  iconImage: { width: 64, height: 64, borderRadius: 15 },
  lockCorner: { position: 'absolute', right: -6, top: -6 },
  cellLabel: { fontFamily: fonts.bold, fontSize: 13, color: '#3A3D45' },
  selected: { boxShadow: '0 0 0 3px #F7F5F0, 0 0 0 5.5px #15171D' },
  previewed: { boxShadow: '0 0 0 3px #F7F5F0, 0 0 0 5.5px #474A52' },
  plain: { boxShadow: '0 2px 6px rgba(21,23,29,0.12)' },
  finishRow: { flexDirection: 'row', justifyContent: 'space-between' },
  finishCell: { alignItems: 'center', gap: 6, minWidth: 64 },
  finishRing: { width: 52, height: 52, borderRadius: 26 },
  segment: { flexDirection: 'row', gap: 8, padding: 4, borderRadius: 999 },
  segBtn: { flex: 1, minHeight: layout.minTouch, borderRadius: 999, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
});
