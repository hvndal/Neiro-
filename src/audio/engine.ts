import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { player } from '../state/player';
import { NOISES, type NoiseId } from '../theme/tokens';
import { LOOP, NOISE_SOURCES } from './sources';
import { LOOP_XFADE_SEC, handoverAt, handoverGains, handoverProgress, nextCopyStart, stepLevel, targetLevels, volumeFor } from './mixer';

// Audio engine: turns the player store's intent into sound. Each colour is a Voice with two copies of its looping
// file so the loop point is a crossfade between identical, in-phase signals (see mixer.ts). Colours fade by
// ramping each voice's power level (equal-power crossfades), so a change is never a hard cut. Everything that can
// be decided without a speaker lives in mixer.ts and is tested.

const TICK_MS = 50;
const TIMING = { padSec: LOOP.padSamples / LOOP.sampleRate, loopSec: LOOP.loopSamples / LOOP.sampleRate, xfadeSec: LOOP_XFADE_SEC };

class Voice {
  private copies: [AudioPlayer, AudioPlayer] | null = null;
  private active = 0; // index of the copy that is the "main" one
  private handing = false;
  level = 0;

  constructor(private readonly id: NoiseId) {}

  private ensure(): [AudioPlayer, AudioPlayer] {
    if (!this.copies) {
      const make = () => {
        const p = createAudioPlayer(NOISE_SOURCES[this.id], { updateInterval: TICK_MS });
        p.loop = false;
        p.volume = 0;
        return p;
      };
      this.copies = [make(), make()];
    }
    return this.copies;
  }

  get audible() {
    return this.level > 0;
  }

  /** Called every tick with this voice's level and the master clock step. */
  update(master: number) {
    const gain = volumeFor(this.level) * master;
    if (!this.audible && !this.copies) return;
    const [a, b] = this.ensure();
    const main = this.active === 0 ? a : b;
    const other = this.active === 0 ? b : a;

    if (this.audible && !main.playing && !this.handing) {
      main.volume = 0;
      main.seekTo(TIMING.padSec).then(() => main.play());
    }
    if (!this.audible && main.playing) {
      main.pause();
      other.pause();
      this.handing = false;
      return;
    }

    if (this.handing) {
      // main is the outgoing copy, other the incoming one
      const p = handoverProgress(main.currentTime, TIMING);
      const g = handoverGains(p);
      main.volume = gain * g.out;
      other.volume = gain * g.in;
      if (p >= 1 || !main.playing) {
        main.pause();
        this.active = this.active === 0 ? 1 : 0;
        this.handing = false;
      }
    } else if (main.playing) {
      main.volume = gain;
      if (main.currentTime >= handoverAt(TIMING)) {
        // start the next copy in phase, inside the file's padding, then crossfade into it
        this.handing = true;
        other.volume = 0;
        other.seekTo(nextCopyStart(TIMING)).then(() => other.play());
      }
    }
  }

  release() {
    this.copies?.forEach((c) => {
      try {
        c.remove();
      } catch {
        /* already released */
      }
    });
    this.copies = null;
  }
}

let timer: ReturnType<typeof setInterval> | null = null;
let unsubscribe: (() => void) | null = null;
const voices = Object.fromEntries(NOISES.map((n) => [n.id, new Voice(n.id)])) as Record<NoiseId, Voice>;
let last = Date.now();

function tick() {
  const now = Date.now();
  const dt = Math.min(250, now - last);
  last = now;
  const s = player.get();
  const target = targetLevels(
    { noiseId: s.noiseId, playing: s.playing, mix: s.mix, audition: s.audition, sleepEndsAt: s.sleepEndsAt, sleepFade: s.sleepFade },
    now,
  );
  let anyAudible = false;
  for (const n of NOISES) {
    const v = voices[n.id];
    v.level = stepLevel(v.level, target[n.id] ?? 0, dt);
    v.update(1);
    anyAudible ||= v.audible;
  }
  // nothing audible and nothing wanted: stop the timer so an idle app costs nothing
  if (!anyAudible && Object.keys(target).length === 0) stop();
}

function run() {
  if (timer) return;
  last = Date.now();
  timer = setInterval(tick, TICK_MS);
}
function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

/** Start the engine: configures the audio session and follows the player store. Call once at app start. */
export async function startAudio(): Promise<void> {
  if (unsubscribe) return;
  await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' });
  const wake = () => {
    const s = player.get();
    if (s.playing || s.audition) run();
  };
  unsubscribe = player.subscribe(wake);
  wake();
}

export function stopAudio() {
  stop();
  unsubscribe?.();
  unsubscribe = null;
  for (const n of NOISES) voices[n.id].release();
}
