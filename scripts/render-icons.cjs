/* global __dirname */
// Renders neiro's app icons → assets/icons/*.png (+ the Expo icon slots in assets/).
//   node scripts/render-icons.cjs        (needs Playwright + Chromium; not a project dependency)
//
// One free icon (rings) and seven Pro colour icons (a tone-on-tone knob with a notch on each noise colour),
// per handover §5. iOS icons are opaque 1024², Android gets adaptive layers.

const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const OUT = path.join(__dirname, '..', 'assets', 'icons');
const ASSETS = path.join(__dirname, '..', 'assets');
fs.mkdirSync(OUT, { recursive: true });

const PAPER = '#F7F5F0';
const INK = '#15171D';
// outer → inner, with 1% paper gaps (handover §5)
const RINGS = `radial-gradient(circle closest-side,
  #FFFFFF 0 26%, ${PAPER} 26% 27%, #8E949C 27% 36.6%, ${PAPER} 36.6% 37.6%, #FF7AA2 37.6% 47.2%, ${PAPER} 47.2% 48.2%,
  #8A5CF6 48.2% 57.8%, ${PAPER} 57.8% 58.8%, #2F7CF6 58.8% 68.4%, ${PAPER} 68.4% 69.4%, #2FBF71 69.4% 79%, ${PAPER} 79% 80%,
  #FFFFFF 80% 89.6%, ${PAPER} 89.6% 90.6%, #E5484D 90.6% 100%)`;

const COLOURS = {
  white: ['#F4F2EE', INK],
  pink: ['#FF7AA2', INK],
  brown: ['#8B4A2B', PAPER],
  green: ['#2FBF71', INK],
  blue: ['#2F7CF6', INK],
  violet: ['#8A5CF6', PAPER],
  grey: ['#8E949C', INK],
};

const grain = (o) => `<svg width="100%" height="100%" style="position:absolute;inset:0;mix-blend-mode:overlay;opacity:${o}"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#g)"/></svg>`;

const ringMark = (size, notch = true) => `
  <div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;background:${RINGS};box-shadow:0 ${size * 0.02}px ${size * 0.06}px rgba(14,18,32,0.18)">
    ${notch ? `<div style="position:absolute;left:50%;top:${size * 0.386}px;width:${size * 0.039}px;height:${size * 0.076}px;margin-left:${-size * 0.0195}px;border-radius:99px;background:${INK}"></div>` : ''}
  </div>`;

const knob = (size, base, notch) => `
  <div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;
    background:linear-gradient(160deg,rgba(255,255,255,0.38) 0%,rgba(255,255,255,0) 55%,rgba(0,0,0,0.12) 100%),${base};
    box-shadow:0 ${size * 0.05}px ${size * 0.12}px rgba(0,0,0,0.22), inset 0 0 0 ${size * 0.012}px rgba(255,255,255,0.28)">
    <div style="position:absolute;left:50%;top:${size * 0.1}px;width:${size * 0.1}px;height:${size * 0.25}px;margin-left:${-size * 0.05}px;border-radius:99px;background:${notch}"></div>
  </div>`;

const page = (bg, inner, extra = '') =>
  `<html><body style="margin:0;width:1024px;height:1024px;background:${bg};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden">${inner}${extra}</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const shot = async (html, file, transparent = false) => {
    await p.setContent(html);
    await p.screenshot({ path: file, omitBackground: transparent });
    console.log('wrote', path.relative(path.join(__dirname, '..'), file));
  };

  // free icon
  await shot(page(PAPER, ringMark(680), grain(0.18)), path.join(OUT, 'rings.png'));
  // pro colour icons
  for (const [name, [bg, notch]] of Object.entries(COLOURS)) {
    await shot(page(bg, knob(640, bg, notch), grain(0.22)), path.join(OUT, `${name}.png`));
  }
  // Expo slots: iOS/default icon, Android adaptive layers (content inside the central 66% safe zone)
  fs.copyFileSync(path.join(OUT, 'rings.png'), path.join(ASSETS, 'icon.png'));
  await shot(page('transparent', ringMark(540)), path.join(ASSETS, 'android-icon-foreground.png'), true);
  await shot(page(PAPER, ''), path.join(ASSETS, 'android-icon-background.png'));
  await shot(
    page('transparent', `<div style="width:540px;height:540px;border-radius:50%;border:56px solid #000;box-sizing:border-box;position:relative"><div style="position:absolute;inset:92px;border-radius:50%;background:#000"></div></div>`),
    path.join(ASSETS, 'android-icon-monochrome.png'),
    true,
  );
  await shot(page('transparent', ringMark(560)), path.join(ASSETS, 'splash-icon.png'), true);
  await browser.close();
})();
