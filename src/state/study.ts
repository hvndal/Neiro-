import { useSyncExternalStore } from 'react';
import {
  advance, initialStudy, pause, restart, resume, selectMode, skip, start, type StudyModeId, type StudyState,
} from '../study/machine';
import type { NoiseId } from '../theme/tokens';
import { player } from './player';

// Focus plays brown, breaks play pink (handover §7). Colour per phase becomes a Pro setting later.
export const FOCUS_NOISE: NoiseId = 'brown';
export const BREAK_NOISE: NoiseId = 'pink';

let state: StudyState = initialStudy();
const listeners = new Set<() => void>();

/** Apply a transition and keep the sound in step with the phase. */
const commit = (next: StudyState) => {
  const prev = state;
  state = next;
  if (next.phase !== prev.phase) {
    if (next.phase === 'focus') {
      player.setNoise(FOCUS_NOISE);
      player.play();
    } else if (next.phase === 'break') {
      player.setNoise(BREAK_NOISE);
      player.play();
    } else if (next.phase === 'done') {
      player.pause();
    }
  }
  if (next.paused !== null && prev.paused === null) player.pause();
  if (next.paused === null && prev.paused !== null) player.play();
  listeners.forEach((l) => l());
};

export const study = {
  get: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  start: () => commit(start(state, Date.now())),
  pause: () => commit(pause(state, Date.now())),
  resume: () => commit(resume(state, Date.now())),
  restart: () => commit(restart(state, Date.now())),
  skip: () => commit(skip(state, Date.now())),
  reset: () => commit(initialStudy(state.mode)),
  selectMode: (mode: StudyModeId) => commit(selectMode(state, mode)),
  /** Called once a second by <Watchers /> so phases change even when Study is not on screen. */
  tick: (now = Date.now()) => {
    const next = advance(state, now);
    if (next !== state) commit(next);
  },
};

export const useStudy = () => useSyncExternalStore(study.subscribe, study.get, study.get);
