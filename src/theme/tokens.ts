// Source of truth: "neiro — design handover for Claude Code" (Notion), sections 4–6.

export const palette = {
  ink: '#15171D',
  paper: '#F7F5F0',
  muted: '#474A52',
  logoRed: '#E5484D',
} as const;

export type NoiseId = 'white' | 'pink' | 'brown' | 'green' | 'blue' | 'violet' | 'grey';

export type Noise = {
  id: NoiseId;
  hex: string;
  /** text colour used on top of this noise's wash */
  on: string;
  soundsLike: string;
  bestFor: string;
  pro: boolean;
};

// Order matters: this is the dial detent order (left → right along the top arc).
export const NOISES: readonly Noise[] = [
  { id: 'white', hex: '#F4F2EE', on: palette.ink, soundsLike: 'tv static, a fan on high', bestFor: 'study · blocking chatter', pro: false },
  { id: 'pink', hex: '#FF7AA2', on: palette.ink, soundsLike: 'steady rain on a roof', bestFor: 'sleep · reading', pro: false },
  { id: 'brown', hex: '#8B4A2B', on: palette.paper, soundsLike: 'a waterfall, a low rumble', bestFor: 'deep work · winding down', pro: false },
  { id: 'green', hex: '#2FBF71', on: palette.ink, soundsLike: 'a stream in the woods', bestFor: 'relaxing · meditation', pro: true },
  { id: 'blue', hex: '#2F7CF6', on: palette.ink, soundsLike: 'a soft, bright hiss', bestFor: 'masking sharp sounds', pro: true },
  { id: 'violet', hex: '#8A5CF6', on: palette.paper, soundsLike: 'a fine spray of water', bestFor: 'masking high-pitched sounds', pro: true },
  { id: 'grey', hex: '#8E949C', on: palette.ink, soundsLike: 'even across the ear', bestFor: 'all-night background', pro: true },
] as const;

export const noiseById = (id: NoiseId): Noise => NOISES.find((n) => n.id === id)!;

// Logo bands, outer → inner (handover §5). Radial stops are % of radius.
export const LOGO_BANDS = [
  { name: 'red', hex: palette.logoRed, from: 90.6, to: 100 },
  { name: 'white', hex: '#FFFFFF', from: 80, to: 89.6 },
  { name: 'green', hex: '#2FBF71', from: 69.4, to: 79 },
  { name: 'blue', hex: '#2F7CF6', from: 58.8, to: 68.4 },
  { name: 'violet', hex: '#8A5CF6', from: 48.2, to: 57.8 },
  { name: 'pink', hex: '#FF7AA2', from: 37.6, to: 47.2 },
  { name: 'grey', hex: '#8E949C', from: 27, to: 36.6 },
] as const;

export const fonts = {
  regular: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  heavy: 'Nunito_800ExtraBold',
  accent: 'MPLUSRounded1c_500Medium',
} as const;

// Type scale (handover §6). letterSpacing is in em → converted to px at use site.
export const type = {
  hero: { size: 116, lineHeight: 100, tracking: -0.05, font: fonts.heavy },
  countdown: { size: 104, lineHeight: 94, tracking: -0.04, font: fonts.heavy },
  display: { size: 52, lineHeight: 56, tracking: -0.03, font: fonts.heavy },
  title: { size: 40, lineHeight: 44, tracking: -0.03, font: fonts.heavy },
  body: { size: 17, lineHeight: 24, tracking: 0, font: fonts.regular },
  label: { size: 15, lineHeight: 20, tracking: 0, font: fonts.bold },
  caption: { size: 13, lineHeight: 18, tracking: 0, font: fonts.bold },
  eyebrow: { size: 13, lineHeight: 16, tracking: 0.08, font: fonts.heavy },
} as const;

export type TypeRole = keyof typeof type;

export const textStyle = (role: TypeRole) => {
  const t = type[role];
  return {
    fontFamily: t.font,
    fontSize: t.size,
    lineHeight: t.lineHeight,
    letterSpacing: t.tracking * t.size,
  };
};

export const layout = {
  tabBarHeight: 64,
  tabBarBottom: 28,
  tabBarInset: 40,
  /** space content needs at the bottom so it can scroll clear of the floating tab bar */
  contentBottomPad: 108,
  minTouch: 44,
} as const;
