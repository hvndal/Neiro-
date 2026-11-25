# neiro — sound sources

Goal: more than seven hiss colours, without licence risk and without paying for anything. neiro's seven colours are **generated** by `npm run gen:audio` (ours, no third-party licence). Everything below is for *textures* (rain, fan, stream…) that layer under or over a colour, and for tooling.

Checked on 2026-11-25 by reading the repos themselves, not from memory. **Not legal advice**: confirm each file's licence page before shipping.

## What is safe to bundle

| Licence | Obligation | Use |
| --- | --- | --- |
| CC0 / public domain | None | Bundle freely. |
| CC-BY 3.0 / 4.0 | Credit author, link, licence in the app | Needs an in-app credits screen (planned: Settings). |
| Pixabay Content License | **Check carefully.** As we read it, it does not allow redistributing content on a stand-alone basis, which a sound library arguably is | Avoid for bundled sounds unless confirmed. |
| GPL (code) | Copyleft | Do not copy code from GPL repos into a closed app. |

## Repos

### Blankie (`codybrom/Blankie`), best source
- Code: **MIT**. Name, logo and icons are © the author and not reusable.
- Sounds: **per-sound licence data** in `Blankie/Resources/sounds.json` (author, freesound URL, licence, LUFS, the exact loop-cut command, mood tags). 24 sounds: **16 CC0, 3 public domain, 3 CC-BY 4.0, 2 CC-BY 3.0**.
- Also documents a loudness workflow (EBU R 128, target −27 LUFS) and ships CarPlay, widgets, Siri, Spotlight: a feature checklist for us (`CARPLAY.md`, `Sound_normalization.md`).

**Bundle-safe without attribution (19):** acoustic-guitar, airplane, ambient-music, birds, boat, brown-noise, coffee-shop, fan, fireplace, forest, green-noise, laundry-room, lofi-beats, pink-noise, stream, summer-night, warm-piano, white-noise, wind.
**Useful for sleep and focus first:** fan, stream, wind, forest, airplane, laundry-room, fireplace, coffee-shop, summer-night.
**Needs attribution (5):** city, rain, storm, train, waves (rain and waves are the two users expect most, so budget for the credits screen).

### Moodist (`remvze/moodist`)
- Code: MIT. 84 sounds across nature, rain, urban, places, transport, noise, binaural.
- Sounds are **mixed licences** (Pixabay Content License and CC0) and the README gives **no per-file list**, so each file would need its own audit. Treat as a lead for *what to look for*, not as a download.

### Others
- `itsPronay/blankee`: GPL-3.0, so do not reuse code.
- `joaopmatos/tinyAmbient` (MIT): CLI noise generator; we already have a better-matched generator.
- Many small clones have no licence (`NO-LICENSE`), which legally means **all rights reserved**. Skip.

## Plan
1. Add a `sounds.json`-style manifest to neiro: file, author, source URL, licence, LUFS, loop points. Generate the credits screen from it.
2. Import the CC0 / public-domain textures first (fan, stream, wind, forest, airplane, laundry-room, fireplace).
3. Re-encode with our pipeline (loudness-match to the colours, seamless loop with 1 s padding, level drift gate), never ship the source files as-is.
4. Mixable as a *layer* on any colour (the "+ mix" pill), free layers vs Pro layers decided separately.
5. Add rain and waves with attribution once the credits screen exists.

## Open questions
- Textures change the product from "seven colours" to "colours plus soundscapes". That is a positioning decision; it is likely needed for the revenue target, since competitors lead with nature sounds.
- Freesound has more CC0 material than Blankie's 24; a later pass can mine it directly (each file's page states its licence).
