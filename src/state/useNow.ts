import { useEffect, useState } from 'react';

/** Re-render every `ms` while `on` (for countdown labels); returns the current time. */
export function useNow(ms: number, on = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0); // refresh straight away when switched on, then on the interval
    const id = setInterval(tick, ms);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [ms, on]);
  return now;
}
