import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout, palette, textStyle } from '../theme/tokens';

/** Placeholder used by tabs until their step in the build order lands. */
export function ScreenStub({ title, note, bg, fg = palette.ink }: { title: string; note: string; bg: string; fg?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: bg, paddingTop: insets.top + 24 }]}>
      <Text accessibilityRole="header" style={[textStyle('title'), { color: fg }]}>
        {title}
      </Text>
      <Text style={[textStyle('body'), { color: fg, opacity: 0.8, marginTop: 8 }]}>{note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24, paddingBottom: layout.contentBottomPad },
});
