import { useEffect, useSyncExternalStore } from 'react';

// Store products (handover §11): neiro_pro $4.99 non-consumable; tips $1.99 / $4.99 / $9.99.
// TODO(IAP): fetch localized prices with expo-iap. Until then prices are local; in development the store's
// latency is simulated so the loading state (skeleton, spec §9) is designed, visible and testable.

type Products = { status: 'idle' | 'loading' | 'ready'; pro: string | null; tips: string[] };

let products: Products = { status: 'idle', pro: null, tips: [] };
const listeners = new Set<() => void>();
const set = (p: Products) => {
  products = p;
  listeners.forEach((l) => l());
};

const SIMULATED_LATENCY_MS = __DEV__ ? 1100 : 0;

async function load() {
  if (products.status !== 'idle') return;
  set({ ...products, status: 'loading' });
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  set({ status: 'ready', pro: '$4.99', tips: ['$1.99', '$4.99', '$9.99'] });
}

export function useProducts(): Products {
  useEffect(() => {
    load();
  }, []);
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => products,
    () => products,
  );
}
