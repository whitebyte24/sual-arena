import { describe, expect, it } from 'vitest';
import { fontFor, textMetrics, weightKey } from '../src/i18n/fonts';
import { isRTLLang, pickInitialLang, pickThemePref } from '../src/i18n/lang';

describe('pickInitialLang', () => {
  it('kayıtlı tercih önceliklidir', () => {
    expect(pickInitialLang('ar', 'tr')).toBe('ar');
    expect(pickInitialLang('en', 'ar')).toBe('en');
  });
  it('kayıt yoksa cihaz dili (bölge ekiyle de)', () => {
    expect(pickInitialLang(null, 'tr')).toBe('tr');
    expect(pickInitialLang(undefined, 'ar-SA')).toBe('ar');
    expect(pickInitialLang(undefined, 'tr_TR')).toBe('tr');
  });
  it('desteklenmeyen dil → İngilizce; bozuk kayıt yok sayılır', () => {
    expect(pickInitialLang(undefined, 'de')).toBe('en');
    expect(pickInitialLang('zz', 'fr')).toBe('en');
    expect(pickInitialLang(42, undefined)).toBe('en');
    expect(pickInitialLang(null, '')).toBe('en');
  });
  it('yalnızca Arapça sağdan sola', () => {
    expect(isRTLLang('ar')).toBe(true);
    expect(isRTLLang('tr')).toBe(false);
    expect(isRTLLang('en')).toBe(false);
  });
});

describe('pickThemePref', () => {
  it('geçerli değerleri korur, gerisi sistem', () => {
    expect(pickThemePref('dark')).toBe('dark');
    expect(pickThemePref('light')).toBe('light');
    expect(pickThemePref('system')).toBe('system');
    expect(pickThemePref('mavi')).toBe('system');
    expect(pickThemePref(null)).toBe('system');
  });
});

describe('yazı tipi seçimi', () => {
  it('ağırlık eşlemesi', () => {
    expect(weightKey('bold')).toBe('700');
    expect(weightKey('normal')).toBe('400');
    expect(weightKey(undefined)).toBe('400');
    expect(weightKey('600')).toBe('600');
    expect(weightKey(800)).toBe('800');
    expect(weightKey('300')).toBe('400');
  });
  it('Latin/Türkçe Plus Jakarta, Arapça Plex Arabic', () => {
    expect(fontFor('tr', '700')).toBe('PlusJakartaSans_700Bold');
    expect(fontFor('en', '800')).toBe('PlusJakartaSans_800ExtraBold');
    expect(fontFor('ar', '700')).toBe('IBMPlexSansArabic_700Bold');
    expect(fontFor('ar', '800')).toBe('IBMPlexSansArabic_700Bold');
  });
  it('Arapçada boyut büyür, harf aralığı sıfırlanır; küçük yazı ve diğer diller değişmez', () => {
    const ar = textMetrics('ar', { fontWeight: '700', fontSize: 20, lineHeight: 30 });
    expect(ar).toMatchObject({ fontSize: 22, lineHeight: 33, letterSpacing: 0, fontFamily: 'IBMPlexSansArabic_700Bold' });
    expect(textMetrics('ar', { fontSize: 9 }).fontSize).toBeUndefined();
    expect(textMetrics('tr', { fontSize: 20, lineHeight: 30 })).toEqual({ fontFamily: 'PlusJakartaSans_400Regular', fontWeight: 'normal' });
  });
});
