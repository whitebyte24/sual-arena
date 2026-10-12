import { Platform } from 'react-native';
import * as Tracking from 'expo-tracking-transparency';
import { AD_UNITS } from './ids';
import type { AdsAdapter, RewardResult } from './types';

type Lib = typeof import('react-native-google-mobile-ads');

/** Expo Go'da modül yoktur: import hata verir → null (reklamsız çalışır). */
let cached: Lib | null | undefined;
export function adsLib(): Lib | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('react-native-google-mobile-ads') as Lib;
  } catch {
    cached = null;
  }
  return cached;
}

interface Loadable {
  load(): void;
  show(): Promise<void>;
  addAdEventListener(type: string, cb: (...args: unknown[]) => void): () => void;
}

/** Tek bir reklam biriminin yükle/hazır/göster döngüsü. */
class Slot {
  private ad: Loadable | null = null;
  private loaded = false;
  private waiters: (() => void)[] = [];

  constructor(
    private create: () => Loadable | null,
    private events: { loaded: string; error: string; closed: string; earned?: string },
  ) {}

  preload() {
    if (this.ad) return;
    const ad = this.create();
    if (!ad) return;
    this.ad = ad;
    ad.addAdEventListener(this.events.loaded, () => {
      this.loaded = true;
      this.flush();
    });
    ad.addAdEventListener(this.events.error, () => {
      this.loaded = false;
      this.ad = null;
      this.flush();
      setTimeout(() => this.preload(), 30_000); // hata sonrası yavaş yeniden dene
    });
    ad.addAdEventListener(this.events.closed, () => {
      this.loaded = false;
      this.ad = null;
      this.preload();
    });
    ad.load();
  }

  private flush() {
    this.waiters.splice(0).forEach((w) => w());
  }

  /** Hazır olana kadar (en fazla ms) bekler. */
  async ready(ms: number): Promise<boolean> {
    this.preload();
    if (this.loaded) return true;
    await new Promise<void>((resolve) => {
      const h = setTimeout(resolve, ms);
      this.waiters.push(() => (clearTimeout(h), resolve()));
    });
    return this.loaded;
  }

  /** Reklamı gösterir; kapanınca çözülür. `earned` ödül olayı geldiyse true. */
  async show(): Promise<{ shown: boolean; earned: boolean }> {
    const ad = this.ad;
    if (!ad || !this.loaded) return { shown: false, earned: false };
    let earned = false;
    return new Promise((resolve) => {
      const offs: (() => void)[] = [];
      const done = (shown: boolean) => {
        offs.forEach((o) => o());
        resolve({ shown, earned });
      };
      if (this.events.earned) offs.push(ad.addAdEventListener(this.events.earned, () => (earned = true)));
      offs.push(ad.addAdEventListener(this.events.closed, () => done(true)));
      ad.show().catch(() => done(false));
    });
  }
}

let personalized = false;
let slots: { interstitial: Slot; rewarded: Slot } | null = null;
let initPromise: Promise<{ ready: boolean; personalized: boolean }> | null = null;

async function doInit(): Promise<{ ready: boolean; personalized: boolean }> {
  const L = adsLib();
  if (!L || !AD_UNITS.interstitial) return { ready: false, personalized: false };
  try {
    // 1) UMP onay formu (AB/İngiltere'de zorunlu)
    const consent = await L.AdsConsent.gatherConsent();
    if (!consent.canRequestAds) return { ready: false, personalized: false };

    // 2) iOS ATT; reddedilirse kişiselleştirilmemiş reklam
    if (Platform.OS === 'ios') {
      const cur = await Tracking.getTrackingPermissionsAsync();
      const res = cur.status === Tracking.PermissionStatus.UNDETERMINED ? await Tracking.requestTrackingPermissionsAsync() : cur;
      personalized = res.granted;
    } else {
      personalized = true; // Android'de UMP tercihi SDK tarafından uygulanır
    }

    // 3) İçerik derecesi G; SDK'yı başlat
    const ads = L.default();
    await ads.setRequestConfiguration({ maxAdContentRating: L.MaxAdContentRating.G });
    await ads.initialize();

    const opts = { requestNonPersonalizedAdsOnly: !personalized };
    slots = {
      interstitial: new Slot(
        () => (AD_UNITS.interstitial ? (L.InterstitialAd.createForAdRequest(AD_UNITS.interstitial, opts) as unknown as Loadable) : null),
        { loaded: L.AdEventType.LOADED, error: L.AdEventType.ERROR, closed: L.AdEventType.CLOSED },
      ),
      rewarded: new Slot(
        () => (AD_UNITS.rewarded ? (L.RewardedAd.createForAdRequest(AD_UNITS.rewarded, opts) as unknown as Loadable) : null),
        { loaded: L.RewardedAdEventType.LOADED, error: L.AdEventType.ERROR, closed: L.AdEventType.CLOSED, earned: L.RewardedAdEventType.EARNED_REWARD },
      ),
    };
    slots.interstitial.preload();
    slots.rewarded.preload();
    return { ready: true, personalized };
  } catch {
    return { ready: false, personalized: false };
  }
}

export const adapter: AdsAdapter = {
  init() {
    initPromise ??= doInit();
    return initPromise;
  },
  async showInterstitial() {
    if (!slots || !(await slots.interstitial.ready(0))) return false;
    return (await slots.interstitial.show()).shown;
  },
  async showRewarded(): Promise<RewardResult> {
    if (!slots || !(await slots.rewarded.ready(4000))) return 'unavailable';
    const r = await slots.rewarded.show();
    return !r.shown ? 'unavailable' : r.earned ? 'earned' : 'dismissed';
  },
};
