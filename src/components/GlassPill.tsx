import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { fonts, layout, palette } from '../theme/tokens';
import { Glass } from './Glass';

type Props = {
  label?: string;
  children?: ReactNode;
  onPress?: () => void;
  color?: string;
  tone?: 'light' | 'dark';
  size?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  fontSize?: number;
  fontFamily?: string;
};

/** Glass pill (or round button when `size` is set). Floating layer only — never inside cards. */
export function GlassPill({ label, children, onPress, color = palette.ink, tone = 'light', size, accessibilityLabel, style, fontSize = 15, fontFamily = fonts.bold }: Props) {
  const round = size !== undefined;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
    >
      <Glass
        tone={tone}
        interactive
        style={[
          round ? { width: size, height: size, borderRadius: size / 2 } : { minHeight: layout.minTouch, paddingHorizontal: 16, borderRadius: 999 },
          styles.center,
          style,
        ]}
      >
        {children ?? <Text style={{ fontFamily, fontSize, color }}>{label}</Text>}
      </Glass>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
});
