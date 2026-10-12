/**
 * Reklam politikası — saf TS (prompt §7.1). Uzaktan yapılandırma (`remote_config.ads`) YALNIZCA azaltabilir:
 * değerler spec'in taban değerlerinin altına inemez (en sık 3 maçta bir, ≥3 dk ara, ilk 3 maç reklamsız).
 */

export interface AdsConfig {
  enabled: boolean;
  banner_enabled: boolean;
  interstitial_every_n_matches: number;
  interstitial_min_gap_seconds: number;
  no_ads_first_matches: number;
  /** Ramazan / Kadir Gecesi gibi dönemlerde sıklığı azaltır */
  reduced_mode: boolean;
  reduced_every_n_matches: number;
}

export const FLOORS = { everyN: 3, gapSeconds: 180, firstMatches: 3 } as const;

export const DEFAULT_ADS_CONFIG: AdsConfig = {
  enabled: true,
  banner_enabled: true,
  interstitial_every_n_matches: 3,
  interstitial_min_gap_seconds: 180,
  no_ads_first_matches: 3,
  reduced_mode: false,
  reduced_every_n_matches: 6,
};

const int = (v: unknown, d: number, min: number, max = 1000) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : d;
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);

export function sanitizeAdsConfig(raw: unknown): AdsConfig {
  const r = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const D = DEFAULT_ADS_CONFIG;
  const every = int(r.interstitial_every_n_matches, D.interstitial_every_n_matches, FLOORS.everyN);
  return {
    enabled: bool(r.enabled, D.enabled),
    banner_enabled: bool(r.banner_enabled, D.banner_enabled),
    interstitial_every_n_matches: every,
    interstitial_min_gap_seconds: int(r.interstitial_min_gap_seconds, D.interstitial_min_gap_seconds, FLOORS.gapSeconds, 86_400),
    no_ads_first_matches: int(r.no_ads_first_matches, D.no_ads_first_matches, FLOORS.firstMatches),
    reduced_mode: bool(r.reduced_mode, D.reduced_mode),
    reduced_every_n_matches: Math.max(every, int(r.reduced_every_n_matches, D.reduced_every_n_matches, FLOORS.everyN)),
  };
}

export interface AdState {
  /** Ömür boyu tamamlanan maç/oyun sayısı (düello, oda, Söyleme!) */
  totalMatches: number;
  sinceInterstitial: number;
  lastInterstitialAt: number;
  /** Uygulama açılış sayısı; ilk oturumda geçiş reklamı yok */
  sessions: number;
  /** Premium hatırlatması en son hangi gün gösterildi (YYYY-MM-DD) */
  promoDay: string | null;
}

export const EMPTY_AD_STATE: AdState = { totalMatches: 0, sinceInterstitial: 0, lastInterstitialAt: 0, sessions: 0, promoDay: null };

export const startSession = (s: AdState): AdState => ({ ...s, sessions: s.sessions + 1 });
export const recordMatch = (s: AdState): AdState => ({ ...s, totalMatches: s.totalMatches + 1, sinceInterstitial: s.sinceInterstitial + 1 });
export const recordInterstitial = (s: AdState, now: number): AdState => ({ ...s, sinceInterstitial: 0, lastInterstitialAt: now });

/** `recordMatch` çağrıldıktan SONRA sorulur. */
export function interstitialDue(s: AdState, cfg: AdsConfig, o: { premium: boolean; now: number }): boolean {
  if (o.premium || !cfg.enabled) return false;
  if (s.sessions < 2) return false; // ilk oturum reklamsız
  if (s.totalMatches <= cfg.no_ads_first_matches) return false; // ilk 3 maç reklamsız
  const every = cfg.reduced_mode ? cfg.reduced_every_n_matches : cfg.interstitial_every_n_matches;
  if (s.sinceInterstitial < every) return false;
  return o.now - s.lastInterstitialAt >= cfg.interstitial_min_gap_seconds * 1000;
}

/** Geçiş reklamından sonra günde en fazla 1 yumuşak premium hatırlatması. */
export const promoDue = (s: AdState, today: string, premium: boolean) => !premium && s.promoDay !== today;
export const recordPromo = (s: AdState, today: string): AdState => ({ ...s, promoDay: today });

/** Banner yalnızca ana menü ve sonuç ekranlarında. Soru/düello/Söyleme! tur ekranlarında ASLA. */
export const BANNER_SURFACES = ['home', 'result'] as const;
export type BannerSurface = (typeof BANNER_SURFACES)[number];
export function bannerAllowed(surface: string, cfg: AdsConfig, premium: boolean): boolean {
  return !premium && cfg.enabled && cfg.banner_enabled && (BANNER_SURFACES as readonly string[]).includes(surface);
}

export const REWARD_DUELS = 3;
