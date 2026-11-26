// Dial finishes (Customise, Pro). Each tints the shader-drawn glass lens on Play, so a finish is felt where
// the hand is, not just shown as a swatch. Ceramic is the free default (clear glass).

export type FinishId = 'ceramic' | 'brass' | 'walnut' | 'chrome';

export type Finish = {
  id: FinishId;
  /** swatch gradient: light → dark */
  swatch: [string, string];
  /** lens tint and how much of it (0 = clear) */
  lens: { tint: string; amount: number };
  pro: boolean;
};

export const FINISHES: readonly Finish[] = [
  { id: 'ceramic', swatch: ['#FFFFFF', '#E9E5DC'], lens: { tint: '#F7F5F0', amount: 0 }, pro: false },
  { id: 'brass', swatch: ['#E8C77E', '#B08A3A'], lens: { tint: '#D9B45F', amount: 0.42 }, pro: true },
  { id: 'walnut', swatch: ['#8A6446', '#4A3222'], lens: { tint: '#6B4A33', amount: 0.5 }, pro: true },
  { id: 'chrome', swatch: ['#FAFBFC', '#9DA3AB'], lens: { tint: '#E3E7EC', amount: 0.34 }, pro: true },
] as const;

export const finishById = (id: FinishId): Finish => FINISHES.find((f) => f.id === id)!;

export type GrainId = 'none' | '16mm' | '35mm' | 'vhs';
export const GRAINS: readonly { id: GrainId; pro: boolean }[] = [
  { id: 'none', pro: false },
  { id: '16mm', pro: false },
  { id: '35mm', pro: true },
  { id: 'vhs', pro: true },
] as const;

export type IconId = 'rings' | 'white' | 'pink' | 'brown' | 'green' | 'blue' | 'violet' | 'grey';
