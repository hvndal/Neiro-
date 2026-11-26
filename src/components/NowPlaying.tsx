import { router } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { player, usePlayer } from '../state/player';
import { useNow } from '../state/useNow';
import { fonts, noiseById, palette } from '../theme/tokens';

/**
 * Now Playing mini-player. Rendered inside the iOS 26 tab bar's bottom accessory, so it is the system's own
 * glass capsule docked above the tabs (it collapses inline when the tab bar minimises). Tap = open Play.
 */
export function NowPlaying() {
  const { noiseId, playing, sleepEndsAt } = usePlayer();
  const now = useNow(30_000, sleepEndsAt !== null);
  const status = !playing ? 'paused' : sleepEndsAt ? `sleep · ${Math.max(1, Math.ceil((sleepEndsAt - now) / 60_000))} min` : 'playing';
  const placement = NativeTabs.BottomAccessory.usePlacement();
  const noise = noiseById(noiseId);

  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${noise.id} noise, open player`} onPress={() => router.navigate('/play')} style={styles.info}>
        <View style={[styles.dot, { backgroundColor: noise.hex }]} />
        <Text numberOfLines={1} style={styles.title}>
          {noise.id} noise
        </Text>
        {placement === 'regular' && <Text style={styles.sub}>{status}</Text>}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={playing ? 'Pause' : 'Play'} hitSlop={8} onPress={player.toggle} style={styles.btn}>
        <Svg width={18} height={18} viewBox="0 0 32 32">
          {playing ? (
            <>
              <Rect x={7} y={3} width={7} height={26} rx={2.5} fill={palette.ink} />
              <Rect x={19} y={3} width={7} height={26} rx={2.5} fill={palette.ink} />
            </>
          ) : (
            <Path d="M9 3.5v25l21-12.5z" fill={palette.ink} />
          )}
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  info: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: 'rgba(21,23,29,0.2)' },
  title: { fontFamily: fonts.heavy, fontSize: 15, color: palette.ink },
  sub: { fontFamily: fonts.regular, fontSize: 13, color: palette.muted },
  btn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
