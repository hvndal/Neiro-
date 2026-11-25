// Tileable film-grain texture → assets/grain.png (8-bit greyscale, mean 128 so `overlay` blending is neutral).
//   node scripts/generate-grain.ts
// Our own generated noise: no third-party licence to track. Deterministic (seeded).

import { writeFileSync } from 'node:fs';
import { crc32, deflateSync } from 'node:zlib';
import { gaussian, mulberry32 } from './noise-lib.ts';

const SIZE = 512;
const rand = mulberry32(0x6e656972); // "neir"

const raw = Buffer.alloc((SIZE + 1) * SIZE);
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE + 1)] = 0; // filter: none
  for (let x = 0; x < SIZE; x++) {
    const v = 128 + gaussian(rand) * 38;
    raw[y * (SIZE + 1) + 1 + x] = Math.max(0, Math.min(255, Math.round(v)));
  }
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 0; // greyscale

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const out = new URL('../assets/grain.png', import.meta.url).pathname;
writeFileSync(out, png);
console.log(`wrote ${out} (${(png.length / 1024).toFixed(0)} KB)`);
