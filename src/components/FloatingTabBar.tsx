import type { BottomTabBarProps } from 'expo-router/js-tabs';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { fonts, layout, palette } from '../theme/tokens';
import { Glass } from './Glass';

type TabName = 'play' | 'study' | 'programs' | 'customise';

function Icon({ name, color }: { name: TabName; color: string }) {
  const p = { fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const };
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      {name === 'play' && (
        <>
          <Circle cx={12} cy={12} r={8} {...p} />
          <Path d="M12 4.5v4" {...p} />
        </>
      )}
      {name === 'study' && (
        <>
          <Circle cx={12} cy={13} r={7.5} {...p} />
          <Path d="M12 13V9.5M9.5 3h5" {...p} />
        </>
      )}
      {name === 'programs' && <Path d="M5 7h14M5 12h14M5 17h9" {...p} />}
      {name === 'customise' && (
        <>
          <Path d="M4 8h9M17 8h3M4 16h3M11 16h9" {...p} />
          <Circle cx={15} cy={8} r={2} {...p} />
          <Circle cx={9} cy={16} r={2} {...p} />
        </>
      )}
    </Svg>
  );
}

type Props = BottomTabBarProps & {
  /** text colour on the current wash; defaults to ink */
  color?: string;
  tone?: 'light' | 'dark';
};

/** Floating glass tab bar (handover §3, §8). Content scrolls under it. */
export function FloatingTabBar({ state, emitter, navigateToTab, color: colorProp, tone: toneProp }: Props) {
  const insets = useSafeAreaInsets();
  // Study sits on the brown wash (paper text, dark glass); everything else is light for now.
  // Step 4 replaces this with the current noise's `on` colour.
  const onBrown = state.routes[state.index]?.name === 'study';
  const color = colorProp ?? (onBrown ? palette.paper : palette.ink);
  const tone = toneProp ?? (onBrown ? 'dark' : 'light');
  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: Math.max(insets.bottom, 0) + layout.tabBarBottom - 8 }]}
    >
      <Glass style={styles.bar} tone={tone} interactive>
        <View accessibilityRole="tabbar" style={styles.row}>
          {state.routes.map((route, i) => {
            const focused = state.index === i;
            const name = route.name as TabName;
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityLabel={name}
                accessibilityState={{ selected: focused }}
                onPress={() => {
                  Haptics.selectionAsync();
                  const e = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!focused && !e.defaultPrevented) navigateToTab(route.key);
                }}
                style={[styles.tab, focused && styles.tabFocused]}
              >
                <Icon name={name} color={color} />
                <Text style={[styles.label, { color }]}>{name}</Text>
              </Pressable>
            );
          })}
        </View>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: layout.tabBarInset, right: layout.tabBarInset },
  bar: { height: layout.tabBarHeight, borderRadius: 999 },
  row: { flex: 1, flexDirection: 'row', padding: 6, gap: 4 },
  tab: { flex: 1, minHeight: layout.minTouch, borderRadius: 999, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabFocused: { backgroundColor: 'rgba(255,255,255,0.22)' },
  label: { fontFamily: fonts.bold, fontSize: 11 },
});
