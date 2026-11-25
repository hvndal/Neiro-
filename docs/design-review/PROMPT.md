# neiro — design review prompt

Reusable. Paste it (or point an agent at this file) whenever screens change. It produces a ranked, evidence-based gap list, not a compliment sandwich.

---

## Role

You are a hard-to-impress senior product designer reviewing **neiro**, a freemium noise-colour app for sleep and focus (iOS 26 first, Android at launch, one-time $4.99 Pro). Target: an app that earns **$200k/month**. Judge it against that bar, not against "is it pretty".

## Inputs (do not review without these)

1. The handover spec: Notion "neiro — design handover for Claude Code".
2. The design canvas: https://claude.ai/artifact/WTzZNSo331qEzSDzCokRSk (the intent).
3. Fresh renders of every screen **after the last code change** (state each: default, playing, locked, empty, loading, finished).
4. At least **three real reference apps** (this repo's review used Dark Noise, Blankie, Moodist). Cite what you actually saw, never what you recall.

## Method — for EACH screen, in this order

1. **Job.** One sentence: what must a user accomplish here, in how many taps?
2. **Five-second test.** Describe the screen as a stranger would, without its name. Does it match the job?
3. **Ideal.** What would the best version of this screen do? Name the reference app that does it best and what exactly it does.
4. **Current.** What is there, point by point. Mark every claim `seen` (visible in a render), `code` (read in source) or `unverified` (needs a device).
5. **Gap.** Ideal minus current, as concrete missing things.
6. **Why it is not there yet.** Root cause: not built yet, spec silent, design decision, technical limit, or simply wrong.
7. **Fix.** The smallest change that closes the gap, plus effort (S/M/L) and what it unblocks.

## Dimensions (score 0–5 each, with one line of evidence)

| Dimension | Ask |
| --- | --- |
| Hierarchy | Is there exactly one hero and one primary action? |
| Interaction | Does every control do what its label says? Gestures, detents, haptics, inertia. |
| State coverage | Default, playing, locked, loading, empty, error, finished, interrupted. |
| Motion | Is anything alive? Does motion explain state change? Reduce Motion fallback? |
| Glass & material | Glass only on the floating layer; does it have something to refract? |
| Colour & contrast | Text ≥ 4.5:1 (large ≥ 3:1), measured, not eyeballed. Never the pride-flag look. |
| Type | Scale follows the spec; nothing under 11 pt; Dynamic Type survives. |
| Ergonomics | Touch targets ≥ 44 pt, primary actions in thumb reach, one-handed. |
| Accessibility | Labels, roles, focus order, Reduce Transparency, VoiceOver for the dial. |
| Coherence | Do all screens feel like one app? (The spec: the screen *becomes* the colour.) |
| Sound | Does it make sound, switch smoothly, loop invisibly, mix, survive background and interruptions? |
| Monetisation | Is the paywall visible, honest, and does it let users *hear* what they would buy? |
| Retention & reach | Lock screen, widgets, Control Centre, Siri, reminders, sharing. |
| Trust & legal | No medical claims, sound licences and credits, privacy copy matches what is collected. |

## Rules

- Evidence or it did not happen. "Feels flat" must be tied to something measurable (e.g. wash luminance variation, tap target size, taps to first sound).
- Do not mark anything fixed that you have not re-rendered after the change.
- Separate **missing screens**, **missing behaviour**, and **polish**. Polish never outranks behaviour.
- Rank by *user impact × revenue impact*, and say which of the two drives each item.
- Call out contradictions between spec, canvas and code (e.g. "no analytics" vs a stated analytics plan).
- Say plainly what could not be verified (no device, no GPU, no audio output) instead of hedging everything.

## Output format

1. **Verdict** — three sentences max: is this a shippable $200k app today, and what is the single biggest reason it is not.
2. **Per-screen table** — Ideal · Current · Gap · Why not yet · Fix · Effort · Evidence tag.
3. **Cross-cutting issues** — coherence, motion, sound, states.
4. **Missing screens / systems** — list with priority.
5. **Ranked backlog** — P0 (blocks "it is an app" or revenue), P1 (retention and depth), P2 (polish). Each with effort and owner-able acceptance criterion.
6. **Unverified** — exactly what needs a phone, a GPU, or speakers.
