import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { isPremium } from '@/features/premium/entitlement';
import { dateKey } from '@/lib/date';
import { getRemoteConfig } from '@/lib/remoteConfig';
import { adapter } from './adapter';
import {
  EMPTY_AD_STATE,
  interstitialDue,
  promoDue,
  recordInterstitial,
  recordMatch,
  recordPromo,
  startSession,
  type AdState,
} from './policy';

const KEY = 'ads.state.v1';

async function load(): Promise<AdState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...EMPTY_AD_STATE, ...JSON.parse(raw) } : EMPTY_AD_STATE;
  } catch {
    return EMPTY_AD_STATE;
  }
}
const save = (s: AdState) => AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {});

// ─── durum (banner bileşenleri için) ─────────────────────────────────────────
let status = { ready: false, personalized: false };
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => (listeners.add(cb), () => void listeners.delete(cb));
const setStatus = (s: typeof status) => {
  status = s;
  listeners.forEach((l) => l());
};
export const useAdsStatus = () => useSyncExternalStore(subscribe, () => status);

let started = false;

/** Uygulama açılışında bir kez: oturum sayacı + (premium değilse) onay → ATT → SDK. */
export async function initAds(): Promise<void> {
  if (started) return;
  started = true;
  await save(startSession(await load()));
  if (await isPremium()) return;
  setStatus(await adapter.init());
}

/**
 * Düello/oda/Söyleme! bittiğinde çağrılır. Politikaya uyuyorsa geçiş reklamı gösterir.
 * `promo`: reklamdan sonra yumuşak "Premium" hatırlatması gösterilsin mi (günde en fazla 1).
 */
export async function onMatchFinished(): Promise<{ interstitialShown: boolean; promo: boolean }> {
  const premium = await isPremium();
  let s = recordMatch(await load());
  let shown = false;
  if (!premium && status.ready) {
    const cfg = (await getRemoteConfig()).ads;
    if (interstitialDue(s, cfg, { premium, now: Date.now() })) {
      shown = await adapter.showInterstitial();
      if (shown) s = recordInterstitial(s, Date.now());
    }
  }
  let promo = false;
  if (shown && promoDue(s, dateKey(), premium)) {
    promo = true;
    s = recordPromo(s, dateKey());
  }
  await save(s);
  return { interstitialShown: shown, promo };
}

/**
 * Ödüllü reklam izlet. true = ödülü ver. Reklam yüklenemezse/desteklenmiyorsa da true (spec: hata oyunu durdurmaz, ödül yine verilir).
 * Yalnızca kullanıcı reklam izlemeyi kapatırsa (ödül kazanmadan) false.
 */
export async function watchRewarded(): Promise<boolean> {
  const r = await adapter.showRewarded();
  return r !== 'dismissed';
}
