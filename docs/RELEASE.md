# neiro — release checklist

State at `HEAD`: code-complete for v1 except in-app purchase and the items marked **you**. Verified: types, lint,
51 unit tests, noise files, the audio engine and every UI flow in a browser, and iOS + Android production bundles
(`npm run verify`, `npm run bundle:check`). **Not verified: anything on a real phone or speaker.**

## 1. Things only you can supply (placeholders are in the repo)

| Item | Where | Note |
| --- | --- | --- |
| EAS project id | `app.json` → `extra.eas.projectId` | `npx eas-cli@latest init` after `eas login` |
| Bundle id / package | `app.json` → `ios.bundleIdentifier`, `android.package` | currently `com.neiro.app`: change if it is taken |
| App Store Connect app id | `eas.json` → `submit.production.ios.ascAppId` | create the app first |
| Apple team + signing | EAS prompts on first build | free to let EAS manage credentials |
| In-app products | App Store Connect / Play Console | `neiro_pro` (non-consumable $4.99), `tip_small` $1.99, `tip_medium` $4.99, `tip_large` $9.99 (consumables) |
| Privacy policy + support URLs | store listings | must match what the app collects (see §4) |

## 2. First device build (about 20 minutes, mostly waiting)

```bash
npx eas-cli@latest login
npx eas-cli@latest init                      # writes the project id
npx eas-cli@latest build --profile development --platform ios     # dev client: native tabs, glass, haptics, audio
```

Install it, then `npx expo start --dev-client` and open it. **Check on the phone, in this order:**

1. Sound: tap play; turn pink → brown (no click, 1.2 s crossfade); lock the phone (keeps playing); take a call and return.
2. Dial: the slow ratchet (light tick per 6°, firmer latch per colour), the bounce at both ends, a Pro colour latching and opening the sheet.
3. System tab bar and the Now Playing capsule above it (iOS 26), the native sheets (Pro, sleep timer, mix).
4. Loop seam: leave brown running past 60 s and listen at the 60 s mark, then white.
5. Reduce Motion and Reduce Transparency on: nothing should break, glass becomes solid.
6. Battery: one hour with the screen on Play; the wash is capped at 30 fps and pauses off-screen.

## 3. Still to build before submitting

1. **In-app purchase** (`src/state/products.ts` and `entitlement.ts` mark the seams): `expo-iap`, purchase, restore, tips, set `entitlement` from the store.
2. **Settings + credits**: the five CC-BY sounds (rain, waves, storm, city, train) need attribution; the colour loops are our own and need none.
3. **Phase-end notifications** for a backgrounded Study timer (`expo-notifications` is installed and configured).
4. **Programs engine** (the colour moves over the program's length), persistence of look and settings, alternate app icons (native icon set).
5. **Lock-screen controls / Now Playing info** (`AudioPlayer.setActiveForLockScreen`): needs one stable player to attach to.

## 4. Store copy and review risks

- Name `Neiro: Brown & Pink Noise`, subtitle `White, sleep & focus sounds`.
- **No medical claims** in the listing, screenshots or app. Keywords: do not use `adhd` or `tinnitus` (decided).
- **Analytics:** the handover said none; the decision taken is full product analytics. If any SDK ships, the privacy policy,
  App Store privacy labels and the Pro sheet's trust line must say so. Until then the app collects nothing.
- Encryption export: `ITSAppUsesNonExemptEncryption` is false (no custom crypto).
- Screenshots: the Adobe Express icon set exists; store screenshots should come from the dev build on a real phone (the web
  build draws a stand-in tab bar).

## 4. Commands

```bash
npm run verify          # types + lint + all tests + shipped-audio checks
npm run bundle:check    # iOS and Android production bundles compile
npm run gen:audio       # regenerate the seven loops (needs ffmpeg)
node scripts/render-icons.cjs   # regenerate icons (needs Playwright)
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --profile production --platform ios
```
