import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Glass } from '../components/Glass';
import { Lock } from '../components/Lock';
import { Group, Row, Sheet } from '../components/Sheet';
import { useIsPro } from '../state/entitlement';
import { player, usePlayer, type MixAmount } from '../state/player';
import { fonts, layout, NOISES, noiseById, palette } from '../theme/tokens';

const AMOUNTS: { label: string; value: MixAmount }[] = [
  { label: 'a little', value: 0.25 },
  { label: 'half', value: 0.5 },
  { label: 'a lot', value: 0.75 },
];

/**
 * Mix sheet: layer a second colour under the playing one. Colours stay circles (never stripes); Pro colours
 * show a lock and open Pro. The balance is a three-step control rather than a fiddly slider.
 */
export default function Mix() {
  const { noiseId, mix } = usePlayer();
  const isPro = useIsPro();
  const base = noiseById(noiseId);
  const others = NOISES.filter((n) => n.id !== noiseId);

  return (
    <Sheet title="mix" subtitle={`add a second colour under ${base.id}`}>
      <View style={styles.grid}>
        {others.map((n) => {
          const locked = n.pro && !isPro;
          const sel = mix?.id === n.id;
          return (
            <Pressable
              key={n.id}
              accessibilityRole="button"
              accessibilityLabel={`${n.id}${locked ? ', pro' : ''}`}
              accessibilityState={{ selected: sel }}
              onPress={() => {
                if (locked) return router.push('/pro');
                Haptics.selectionAsync();
                player.setMix(sel ? null : { id: n.id, amount: mix?.amount ?? 0.5 });
              }}
              style={styles.cell}
            >
              <View style={[styles.dot, { backgroundColor: n.hex, opacity: locked ? 0.6 : 1 }, sel && styles.dotSel]}>
                {locked && <Lock style={styles.lock} />}
              </View>
              <Text style={styles.cellLabel}>{n.id}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: 10, opacity: mix ? 1 : 0.4 }} pointerEvents={mix ? 'auto' : 'none'}>
        <Text style={styles.section}>balance</Text>
        <Glass style={styles.segment}>
          {AMOUNTS.map((a) => {
            const sel = mix?.amount === a.value;
            return (
              <Pressable
                key={a.label}
                accessibilityRole="button"
                accessibilityState={{ selected: sel }}
                onPress={() => {
                  if (!mix) return;
                  Haptics.selectionAsync();
                  player.setMix({ ...mix, amount: a.value });
                }}
                style={[styles.segBtn, sel && { backgroundColor: palette.ink }]}
              >
                <Text style={{ fontFamily: fonts.heavy, fontSize: 15, color: sel ? palette.paper : palette.ink }}>{a.label}</Text>
              </Pressable>
            );
          })}
        </Glass>
      </View>

      {mix && (
        <Group>
          <Row label="remove mix" last onPress={() => player.setMix(null)} />
        </Group>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  cell: { width: '30%', alignItems: 'center', gap: 6, minHeight: layout.minTouch },
  dot: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: 'rgba(21,23,29,0.15)' },
  dotSel: { borderWidth: 0, boxShadow: '0 0 0 3px #F7F5F0, 0 0 0 5.5px #15171D' },
  lock: { position: 'absolute', right: -4, top: -4 },
  cellLabel: { fontFamily: fonts.bold, fontSize: 14, color: palette.ink },
  section: { fontFamily: fonts.heavy, fontSize: 13, letterSpacing: 1, color: palette.muted, textTransform: 'uppercase' },
  segment: { flexDirection: 'row', gap: 6, padding: 4, borderRadius: 999 },
  segBtn: { flex: 1, minHeight: layout.minTouch, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
