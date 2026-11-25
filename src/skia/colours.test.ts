import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NOISES } from '../theme/tokens.ts';
import { contrast, hexToRgb, minContrast, washColours } from './colours.ts';

// Handover §4: body text ≥ 4.5:1, large text ≥ 3:1; on violet only large bold text.

for (const n of NOISES) {
  test(`${n.id}: text stays legible on every tone the wash can reach`, () => {
    const text = hexToRgb(n.on);
    const w = washColours(n.id);
    const min = minContrast(n.id);
    for (const [name, tone] of Object.entries(w)) {
      const c = contrast(text, tone);
      assert.ok(c >= min - 1e-9, `${n.id} ${name}: ${c.toFixed(2)}:1 < ${min}:1`);
    }
  });
}
