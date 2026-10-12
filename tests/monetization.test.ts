import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ADS_CONFIG,
  EMPTY_AD_STATE,
  bannerAllowed,
  interstitialDue,
  promoDue,
  recordInterstitial,
  recordMatch,
  recordPromo,
  sanitizeAdsConfig,
  startSession,
  type AdState,
} from '../src/features/ads/policy';
import { addBonus, normalizeQuota, remainingDuels } from '../src/features/duello/quotaLogic';
import { allowedCategories, allowedLevels, categoryLocked, levelLocked } from '../src/features/premium/tiers';
import { eligibleCards } from '../src/features/soyleme/engine';
import { parseAuthCallback } from '../src/lib/authUrl';
import type { Card } from '../src/content/schema';

const CFG = DEFAULT_ADS_CONFIG;
const MIN = 60_000;

/** n maç oynat; her maçtan sonra karar sor, reklam gösterildiyse kaydet. Gösterilen maç numaralarını döner. */
function simulate(n: number, opts: { sessions?: number; gapMs?: number; cfg?: typeof CFG; premium?: boolean } = {}) {
  let s: AdState = { ...EMPTY_AD_STATE, sessions: opts.sessions ?? 2 };
  let now = 1_000_000;
  const shown: number[] = [];
  for (let i = 1; i <= n; i++) {
    now += opts.gapMs ?? 4 * MIN;
    s = recordMatch(s);
    if (interstitialDue(s, opts.cfg ?? CFG, { premium: !!opts.premium, now })) {
      shown.push(i);
      s = recordInterstitial(s, now);
    }
  }
  return shown;
}

describe('geçiş reklamı politikası', () => {
  it('ilk 3 maçta reklam yok, sonra 3 maçta bir', () => {
    // 1-3. maç reklamsız → ilk reklam 4. maçtan sonra, sonra her 3 maçta bir
    expect(simulate(12)).toEqual([4, 7, 10]);
  });
  it('ilk oturumda hiç reklam yok', () => {
    expect(simulate(20, { sessions: 1 })).toEqual([]);
  });
  it('maçlar arası 3 dakikadan kısaysa bekler', () => {
    // 1 dk arayla: 6. maçta gap yetmez → zaman dolana kadar ertelenir, ardışık iki reklam arası ≥ 3 dk
    const shown = simulate(30, { gapMs: MIN });
    expect(shown.length).toBeGreaterThan(0);
    for (let i = 1; i < shown.length; i++) expect((shown[i] - shown[i - 1]) * MIN).toBeGreaterThanOrEqual(3 * MIN);
  });
  it('premium kullanıcıya hiç reklam yok', () => {
    expect(simulate(30, { premium: true })).toEqual([]);
  });
  it('reduced_mode sıklığı azaltır', () => {
    const reduced = sanitizeAdsConfig({ reduced_mode: true });
    expect(simulate(21, { cfg: reduced })).toEqual([6, 12, 18]);
    expect(simulate(21, { cfg: reduced }).length).toBeLessThan(simulate(21).length);
  });
  it('kapalıysa gösterilmez', () => {
    expect(simulate(20, { cfg: { ...CFG, enabled: false } })).toEqual([]);
  });
});

describe('uzaktan yapılandırma yalnızca azaltabilir', () => {
  it('taban değerlerin altına inmez', () => {
    const c = sanitizeAdsConfig({
      interstitial_every_n_matches: 1,
      interstitial_min_gap_seconds: 10,
      no_ads_first_matches: 0,
    });
    expect(c.interstitial_every_n_matches).toBe(3);
    expect(c.interstitial_min_gap_seconds).toBe(180);
    expect(c.no_ads_first_matches).toBe(3);
  });
  it('bozuk girdi varsayılana döner', () => {
    expect(sanitizeAdsConfig(null)).toEqual(CFG);
    expect(sanitizeAdsConfig({ enabled: 'evet', interstitial_every_n_matches: 'x' })).toEqual(CFG);
  });
  it('reduced_every_n en az normal sıklık kadar', () => {
    expect(sanitizeAdsConfig({ interstitial_every_n_matches: 5, reduced_every_n_matches: 3 }).reduced_every_n_matches).toBe(5);
  });
});

describe('banner ve premium hatırlatması', () => {
  it('yalnızca ana menü ve sonuç', () => {
    expect(bannerAllowed('home', CFG, false)).toBe(true);
    expect(bannerAllowed('result', CFG, false)).toBe(true);
    for (const s of ['question', 'duel', 'soyleme', 'match', 'daily-question', 'iftar']) expect(bannerAllowed(s, CFG, false)).toBe(false);
  });
  it('premium veya kapalıysa banner yok', () => {
    expect(bannerAllowed('home', CFG, true)).toBe(false);
    expect(bannerAllowed('home', { ...CFG, banner_enabled: false }, false)).toBe(false);
  });
  it('yumuşak hatırlatma günde en fazla 1', () => {
    let s = startSession(EMPTY_AD_STATE);
    expect(promoDue(s, '2026-10-08', false)).toBe(true);
    s = recordPromo(s, '2026-10-08');
    expect(promoDue(s, '2026-10-08', false)).toBe(false);
    expect(promoDue(s, '2026-10-09', false)).toBe(true);
    expect(promoDue(s, '2026-10-09', true)).toBe(false);
  });
});

describe('günlük düello kotası', () => {
  it('gün değişince sıfırlanır, bonus eklenir', () => {
    const q = normalizeQuota({ day: '2026-10-08', used: 10, bonus: 0 }, '2026-10-08');
    expect(remainingDuels(q)).toBe(0);
    expect(remainingDuels(addBonus(q, 3))).toBe(3);
    expect(normalizeQuota({ day: '2026-10-08', used: 10, bonus: 3 }, '2026-10-09')).toEqual({ day: '2026-10-09', used: 0, bonus: 0 });
  });
  it('bozuk kaydı düzeltir (eski biçim: bonus yok)', () => {
    expect(normalizeQuota({ day: 'd', used: 4 } as never, 'd')).toEqual({ day: 'd', used: 4, bonus: 0 });
    expect(normalizeQuota({ day: 'd', used: -3, bonus: NaN } as never, 'd')).toEqual({ day: 'd', used: 0, bonus: 0 });
  });
});

describe('ücretsiz/premium kademeleri', () => {
  it('kilitler', () => {
    expect(categoryLocked('quran', false)).toBe(false);
    expect(categoryLocked('tarih', false)).toBe(true);
    expect(categoryLocked('tarih', true)).toBe(false);
    expect(categoryLocked('all', false)).toBe(false);
    expect(levelLocked('adult', false)).toBe(true);
    expect(levelLocked('mixed', false)).toBe(false);
    expect(allowedCategories(true)).toBeUndefined();
    expect(allowedLevels(false)).toEqual(['child', 'teen']);
  });
  it('Söyleme! havuzu ücretsizde yetişkin kartı içermez', () => {
    const mk = (id: number, level: Card['level']): Card => ({ id: `c-tr-${String(id).padStart(6, '0')}`, lang: 'tr', level, target: 't' + id, forbidden: ['a', 'b', 'c', 'd'], review_status: 'approved' });
    const cards = [mk(1, 'child'), mk(2, 'teen'), mk(3, 'adult')];
    expect(eligibleCards(cards, { lang: 'tr', level: 'mixed' }, allowedLevels(false)).map((c) => c.level)).toEqual(['child', 'teen']);
    expect(eligibleCards(cards, { lang: 'tr', level: 'adult' }, allowedLevels(false))).toEqual([]);
    expect(eligibleCards(cards, { lang: 'tr', level: 'mixed' })).toHaveLength(3);
  });
});

describe('parseAuthCallback', () => {
  it('fragment içindeki token çifti', () => {
    expect(parseAuthCallback('sualarena://auth-callback#access_token=AAA&refresh_token=BBB&expires_in=3600')).toEqual({
      type: 'tokens',
      accessToken: 'AAA',
      refreshToken: 'BBB',
    });
  });
  it('PKCE code (query)', () => {
    expect(parseAuthCallback('sualarena://auth-callback?code=abc123')).toEqual({ type: 'code', code: 'abc123' });
  });
  it('hata', () => {
    expect(parseAuthCallback('sualarena://auth-callback?error=access_denied&error_description=User+cancelled')).toEqual({
      type: 'error',
      message: 'User cancelled',
    });
  });
  it('ilgisiz bağlantı null', () => {
    expect(parseAuthCallback('sualarena://auth-callback')).toBeNull();
    expect(parseAuthCallback('sualarena://x#foo=bar')).toBeNull();
  });
});
