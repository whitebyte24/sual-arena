import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { adapter } from './adapter';
import type { BuyResult, Plan } from './types';

/**
 * Premium durumu cephesi. Son bilinen değer cihazda önbelleklenir (açılışta anında doğru UI);
 * her açılışta ve değişimde mağaza/RevenueCat'ten tazelenir.
 */
const CACHE_KEY = 'premium.cache.v1';
let premium = false;
const listeners = new Set<() => void>();
const set = (v: boolean) => {
  if (v === premium) return;
  premium = v;
  AsyncStorage.setItem(CACHE_KEY, v ? '1' : '0').catch(() => {});
  listeners.forEach((l) => l());
};

let initPromise: Promise<void> | null = null;

export function initPremium(appUserId?: string): Promise<void> {
  initPromise ??= (async () => {
    try {
      premium = (await AsyncStorage.getItem(CACHE_KEY)) === '1';
      listeners.forEach((l) => l());
    } catch {
      // yoksay
    }
    if (await adapter.configure(appUserId)) {
      adapter.onPremiumChange(set);
      set(await adapter.isPremium());
    } else {
      set(false); // yapılandırılamadıysa (ör. üretimde anahtar yok) premium verilmez
    }
  })();
  return initPromise;
}

/** Başlatma bitene kadar bekler, sonra güncel değeri verir. */
export async function isPremium(): Promise<boolean> {
  await (initPromise ?? initPremium());
  return premium;
}

export const usePremium = () => useSyncExternalStore((cb) => (listeners.add(cb), () => void listeners.delete(cb)), () => premium);

export const getPlans = (): Promise<Plan[]> => adapter.getPlans();

export async function buyPlan(planId: string): Promise<BuyResult> {
  const r = await adapter.buy(planId);
  if (r === 'purchased') set(await adapter.isPremium());
  return r;
}

export async function restorePurchases(): Promise<boolean> {
  const p = await adapter.restore();
  set(p);
  return p;
}
