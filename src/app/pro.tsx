import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RingMark } from '../components/RingMark';
import { NOISES, palette, textStyle } from '../theme/tokens';

const PERKS = [
  'four more noise colours',
  'eight app icons',
  'dial finishes: ceramic, brass, walnut, chrome',
  'grain styles: 16mm, 35mm, vhs',
  'study modes: 50/10, 52/17, flowtime, custom',
  'custom tints, saved mixes, wallpapers',
];

// Step 1 stub of the Pro sheet. Price (store-loaded, with skeleton), purchase and restore land in step 8.
export default function Pro() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ backgroundColor: palette.paper }}
      contentContainerStyle={[styles.content, { paddingTop: 24, paddingBottom: insets.bottom + 32 }]}
    >
      <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={styles.close}>
        <Text style={[textStyle('label'), { fontSize: 22 }]}>×</Text>
      </Pressable>

      <View style={{ alignItems: 'center', gap: 8 }}>
        <RingMark size={72} />
        <Text accessibilityRole="header" style={[textStyle('title'), { color: palette.ink }]}>
          neiro pro
        </Text>
        <Text style={[textStyle('body'), { color: palette.muted }]}>pay once. no subscription. no ads.</Text>
      </View>

      <View style={styles.locked}>
        {NOISES.filter((n) => n.pro).map((n) => (
          <View key={n.id} style={{ alignItems: 'center', gap: 6 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: n.hex }} />
            <Text style={[textStyle('caption'), { color: palette.ink }]}>{n.id}</Text>
          </View>
        ))}
      </View>

      <View style={{ gap: 12 }}>
        {PERKS.map((perk) => (
          <Text key={perk} style={[textStyle('body'), { color: palette.ink }]}>
            ✓  {perk}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, gap: 28 },
  close: { alignSelf: 'flex-end', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  locked: { flexDirection: 'row', justifyContent: 'space-around' },
});
