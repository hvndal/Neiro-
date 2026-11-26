// Study timer as a pure state machine (handover §7 Study, §11 modes, §9 phase change).
// Time is passed in, never read, so it is exact across backgrounding and trivially testable.
// Phases chain from the previous phase's scheduled end, not from "now", so a phone left in a pocket
// still lands on the right phase and the right minute when it wakes up.

export type StudyModeId = 'pomodoro' | '50-10' | '52-17' | '112-26' | 'flowtime' | 'custom';

export type StudyMode = {
  id: StudyModeId;
  label: string;
  /** minutes; null = counts up (flowtime) */
  focusMin: number | null;
  /** minutes; null = derived (flowtime: focus ÷ 5) */
  breakMin: number | null;
  sessions: number;
  pro: boolean;
};

export const STUDY_MODES: readonly StudyMode[] = [
  { id: 'pomodoro', label: 'pomodoro 25/5', focusMin: 25, breakMin: 5, sessions: 4, pro: false },
  { id: '50-10', label: '50/10', focusMin: 50, breakMin: 10, sessions: 3, pro: true },
  { id: '52-17', label: '52/17', focusMin: 52, breakMin: 17, sessions: 3, pro: true },
  { id: '112-26', label: '112/26', focusMin: 112, breakMin: 26, sessions: 2, pro: true },
  { id: 'flowtime', label: 'flowtime', focusMin: null, breakMin: null, sessions: 4, pro: true },
  // Custom durations need their own editor (Pro). Until it exists it runs 30/5.
  { id: 'custom', label: 'custom', focusMin: 30, breakMin: 5, sessions: 4, pro: true },
] as const;

export const modeById = (id: StudyModeId): StudyMode => STUDY_MODES.find((m) => m.id === id)!;

export type StudyPhase = 'idle' | 'focus' | 'break' | 'done';

export type StudyState = {
  mode: StudyModeId;
  phase: StudyPhase;
  /** 1-based */
  session: number;
  /** countdown phases: when the running phase ends */
  endsAt: number | null;
  /** flowtime focus: when it started */
  startedAt: number | null;
  /** paused: ms left (countdown) or ms elapsed (flowtime focus) */
  paused: number | null;
  /** flowtime: length of the last focus block, to size the break */
  lastFocusMs: number;
  /** total focused ms this run (for the "done" summary) */
  focusedMs: number;
};

const MIN = 60_000;

export const initialStudy = (mode: StudyModeId = 'pomodoro'): StudyState => ({
  mode,
  phase: 'idle',
  session: 1,
  endsAt: null,
  startedAt: null,
  paused: null,
  lastFocusMs: 0,
  focusedMs: 0,
});

const countsUp = (s: StudyState) => s.phase === 'focus' && modeById(s.mode).focusMin === null;

export const isRunning = (s: StudyState) => (s.phase === 'focus' || s.phase === 'break') && s.paused === null;
export const isPaused = (s: StudyState) => (s.phase === 'focus' || s.phase === 'break') && s.paused !== null;

export function focusMs(mode: StudyModeId): number | null {
  const m = modeById(mode).focusMin;
  return m === null ? null : m * MIN;
}

export function breakMs(s: StudyState): number {
  const m = modeById(s.mode);
  if (m.breakMin !== null) return m.breakMin * MIN;
  return Math.max(MIN, Math.round(s.lastFocusMs / 5)); // flowtime: break = work ÷ 5, at least a minute
}

function beginFocus(s: StudyState, session: number, at: number): StudyState {
  const f = focusMs(s.mode);
  return { ...s, phase: 'focus', session, paused: null, endsAt: f === null ? null : at + f, startedAt: f === null ? at : null };
}

function beginBreak(s: StudyState, at: number, focusLen: number): StudyState {
  const next: StudyState = { ...s, lastFocusMs: focusLen, focusedMs: s.focusedMs + focusLen };
  if (s.session >= modeById(s.mode).sessions) return { ...next, phase: 'done', endsAt: null, startedAt: null, paused: null };
  return { ...next, phase: 'break', paused: null, startedAt: null, endsAt: at + breakMs(next) };
}

/** idle / done → first focus block. */
export function start(s: StudyState, now: number): StudyState {
  return beginFocus({ ...initialStudy(s.mode) }, 1, now);
}

export function selectMode(s: StudyState, mode: StudyModeId): StudyState {
  return s.phase === 'idle' || s.phase === 'done' ? initialStudy(mode) : s;
}

export function pause(s: StudyState, now: number): StudyState {
  if (!isRunning(s)) return s;
  if (countsUp(s)) return { ...s, paused: now - (s.startedAt ?? now), startedAt: null };
  return { ...s, paused: Math.max(0, (s.endsAt ?? now) - now), endsAt: null };
}

export function resume(s: StudyState, now: number): StudyState {
  if (!isPaused(s)) return s;
  if (countsUp(s)) return { ...s, startedAt: now - (s.paused ?? 0), paused: null };
  return { ...s, endsAt: now + (s.paused ?? 0), paused: null };
}

/** Restart the current block from its full length (keeps the session number). */
export function restart(s: StudyState, now: number): StudyState {
  if (s.phase === 'focus') return beginFocus(s, s.session, now);
  if (s.phase === 'break') return { ...s, paused: null, endsAt: now + breakMs(s) };
  return s;
}

/** Elapsed ms of the current focus block (for skipping early). */
function focusElapsed(s: StudyState, now: number): number {
  if (countsUp(s)) return s.paused ?? now - (s.startedAt ?? now);
  const full = focusMs(s.mode) ?? 0;
  const left = s.paused ?? Math.max(0, (s.endsAt ?? now) - now);
  return full - left;
}

/** Skip ahead: focus → break (or done after the last session); break → next focus. */
export function skip(s: StudyState, now: number): StudyState {
  if (s.phase === 'focus') return beginBreak(s, now, focusElapsed(s, now));
  if (s.phase === 'break') return beginFocus(s, s.session + 1, now);
  return s;
}

/** Move past every countdown boundary that `now` has crossed, chaining from scheduled ends. */
export function advance(s: StudyState, now: number): StudyState {
  let cur = s;
  for (let guard = 0; guard < 64 && isRunning(cur) && cur.endsAt !== null && now >= cur.endsAt; guard++) {
    const at = cur.endsAt;
    cur = cur.phase === 'focus' ? beginBreak(cur, at, focusMs(cur.mode) ?? 0) : beginFocus(cur, cur.session + 1, at);
  }
  return cur;
}

/** What the big clock shows: time left (countdown) or time elapsed (flowtime focus); full length when idle. */
export function clockMs(s: StudyState, now: number): number {
  if (s.phase === 'idle') return focusMs(s.mode) ?? 0;
  if (s.phase === 'done') return s.focusedMs;
  if (countsUp(s)) return s.paused ?? now - (s.startedAt ?? now);
  return s.paused ?? Math.max(0, (s.endsAt ?? now) - now);
}

export function formatClock(ms: number): string {
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  return h ? `${h}:${mm}:${String(sec).padStart(2, '0')}` : `${mm}:${String(sec).padStart(2, '0')}`;
}
