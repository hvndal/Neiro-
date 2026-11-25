import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

// Layout props that must move onto the inner content wrapper so children stay above the glass layers.
const LAYOUT_KEYS = [
  'flexDirection', 'alignItems', 'justifyContent', 'gap', 'rowGap', 'columnGap', 'flexWrap',
  'padding', 'paddingHorizontal', 'paddingVertical', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
] as const;

function splitLayout(style: StyleProp<ViewStyle>): [ViewStyle, ViewStyle] {
  const flat = (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>;
  const outer: Record<string, unknown> = {};
  const inner: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(flat)) {
    if ((LAYOUT_KEYS as readonly string[]).includes(k)) inner[k] = v;
    else outer[k] = v;
  }
  return [outer as ViewStyle, inner as ViewStyle];
}

/** True when the user has Reduce Transparency on (iOS). Falls back to solid fills. */
export function useReduceTransparency(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceTransparencyEnabled?.().then((v) => alive && setReduce(v));
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

type GlassProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** tint the glass, e.g. with the current noise colour */
  tint?: string;
  /** use on pressables */
  interactive?: boolean;
  /** solid colour used when glass is unavailable or Reduce Transparency is on */
  solid?: string;
  /** 'light' fills for light washes, 'dark' for dark ones (brown) */
  tone?: 'light' | 'dark';
};

/**
 * Liquid Glass for the floating layer only (tab bar, pills, round buttons, dial lens).
 * Never use on cards, lists or text blocks (handover §8).
 *  - iOS 26+: native GlassView
 *  - otherwise: blur ~16 + 24% fill + 1px light top-left rim + soft shadow
 *  - Reduce Transparency: solid tinted fill
 */
export function Glass({ children, style, tint, interactive, solid, tone = 'light' }: GlassProps) {
  const reduce = useReduceTransparency();
  const native = Platform.OS === 'ios' && isLiquidGlassAvailable();

  if (reduce) {
    return (
      <View style={[styles.base, { backgroundColor: solid ?? (tone === 'dark' ? 'rgba(21,23,29,0.88)' : 'rgba(255,255,255,0.85)') }, style]}>
        {children}
      </View>
    );
  }

  if (native) {
    return (
      <GlassView glassEffectStyle="regular" tintColor={tint} isInteractive={interactive} style={[styles.base, style]}>
        {children}
      </GlassView>
    );
  }

  const fill = tone === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.24)';
  const [outer, inner] = splitLayout(style);
  return (
    <View style={[styles.base, styles.fallbackShadow, outer]}>
      <BlurView intensity={16} tint={tone === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: tint ? tint + (tone === 'dark' ? 'E6' : '33') : fill }]} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.rim]} />
      {/* positioned wrapper: on web, un-positioned children (e.g. <svg>) would paint beneath the layers above */}
      <View style={[styles.content, inner]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  content: { flexGrow: 1, flexShrink: 1, position: 'relative' },
  fallbackShadow: {
    shadowColor: '#15171D',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  rim: {
    borderRadius: 999,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderLeftWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
});
