import { useEffect } from 'react';
import { player } from './player';
import { study } from './study';

/**
 * One 1 Hz heartbeat for time-based state: the sleep timer, auditions and study phases advance even when their
 * screen is not showing. Everything is computed from timestamps, so a late tick never drifts.
 * (Phase-end notifications for a backgrounded app are scheduled with expo-notifications in the timer step.)
 */
export function Watchers() {
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      player.tick(now);
      study.tick(now);
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return null;
}
