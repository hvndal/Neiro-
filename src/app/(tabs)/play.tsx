import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Glass } from '../../components/Glass';
import { RingMark } from '../../components/RingMark';
import { layout, noiseById, palette, textStyle } from '../../theme/tokens';

// Step 1 stub: pink preloaded. The dial, wash transitions and audio land in steps 3–4.
export default function Play() {
  const insets = useSafeAreaInsets();
  const noise = noiseById('pink');
  return (
    <View style={[styles.root, { backgroundColor: noise.hex, paddingTop: insets.top + 12 }]}>
      <View style={styles.top}>
        <View style={styles.brand}>
          <RingMark size={28} gap={palette.paper} />
          <Text style={[textStyle('title'), { fontSize: 22, lineHeight: 26, letterSpacing: -0.44, color: palette.ink }]}>neiro</Text>
        </View>
        <Link href="/pro" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="get pro">
            <Glass style={styles.pill} interactive>
              <Text style={[textStyle('label'), { fontSize: 16, color: palette.ink }]}>get pro</Text>
            </Glass>
          </Pressable>
        </Link>
      </View>

      <View style={styles.hero}>
        <Text accessibilityRole="header" style={[textStyle('hero'), { color: noise.on }]}>
          {noise.id}
        </Text>
        <Text style={[textStyle('title'), { fontSize: 40, lineHeight: 44, color: noise.on }]}>noise</Text>
        <Text style={[textStyle('body'), { color: noise.on, marginTop: 8 }]}>
          <Text style={textStyle('eyebrow')}>BEST FOR </Text>
          {noise.bestFor.replace(' · ', ' · ')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24, paddingBottom: layout.contentBottomPad },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pill: { minHeight: layout.minTouch, paddingHorizontal: 18, borderRadius: 999, justifyContent: 'center' },
  hero: { marginTop: 'auto', marginBottom: 'auto' },
});
