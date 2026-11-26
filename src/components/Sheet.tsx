import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { fonts, palette, textStyle } from '../theme/tokens';

/**
 * Frame for small native form sheets (timer, mix). On iOS the background stays transparent so the system's own
 * sheet material (Liquid Glass on iOS 26) shows; elsewhere it is paper. Grabber and detents come from the route.
 */
export function Sheet({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 16) + 8 }, Platform.OS !== 'ios' && { backgroundColor: palette.paper }]}>
      <View style={styles.head}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text accessibilityRole="header" style={[textStyle('title'), { fontSize: 28, lineHeight: 32 }]}>
            {title}
          </Text>
          {subtitle && <Text style={[textStyle('body'), { fontSize: 15, lineHeight: 20, color: palette.muted }]}>{subtitle}</Text>}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Done" hitSlop={10} onPress={() => router.back()} style={styles.done}>
          <Text style={{ fontFamily: fonts.heavy, fontSize: 17, color: palette.ink }}>done</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

/** Inset grouped list, iOS style: solid rows (content is never glass), hairline separators. */
export function Group({ children }: { children: ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

export function Row({
  label,
  detail,
  selected,
  onPress,
  last,
  right,
}: {
  label: string;
  detail?: string;
  selected?: boolean;
  onPress?: () => void;
  last?: boolean;
  right?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={selected !== undefined ? { selected } : undefined}
      onPress={
        onPress &&
        (() => {
          Haptics.selectionAsync();
          onPress();
        })
      }
      style={({ pressed }) => [styles.row, !last && styles.sep, pressed && onPress && { backgroundColor: 'rgba(21,23,29,0.05)' }]}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      {detail && <Text style={styles.rowDetail}>{detail}</Text>}
      {right}
      {selected && (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={palette.ink} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M5 12.5l4.5 4.5L19 7.5" />
        </Svg>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 20, paddingTop: 22, gap: 18 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  done: { minHeight: 44, paddingHorizontal: 6, justifyContent: 'center' },
  group: { borderRadius: 18, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  row: { minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sep: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(21,23,29,0.14)' },
  rowLabel: { flex: 1, fontFamily: fonts.bold, fontSize: 17, color: palette.ink },
  rowDetail: { fontFamily: fonts.regular, fontSize: 15, color: palette.muted },
});
