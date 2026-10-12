/**
 * Ücretsiz / Premium kademeleri (prompt §7). Ürün kararı burada tek yerde: değiştirmek için yalnızca bu dosyayı düzenle.
 *  - Ücretsiz: Kur'an, Siyer, Peygamber Kıssaları kategorileri; Söyleme! çocuk + genç desteleri; günde 10 düello; Günlük Soru (hepsi).
 *  - Premium: tüm kategoriler, tüm Söyleme! desteleri, sınırsız düello, reklamsız, lig ödülleri.
 */
import type { CardLevel, Category } from '../../content/schema';

export const FREE_CATEGORIES: readonly Category[] = ['quran', 'siyer', 'kissalar'];
export const FREE_CARD_LEVELS: readonly CardLevel[] = ['child', 'teen'];

/** Ücretsiz kullanıcının "Karışık" seçimi yalnızca ücretsiz kategorilerden çekilir. */
export const allowedCategories = (premium: boolean): readonly Category[] | undefined => (premium ? undefined : FREE_CATEGORIES);
export const allowedLevels = (premium: boolean): readonly CardLevel[] | undefined => (premium ? undefined : FREE_CARD_LEVELS);

export const categoryLocked = (c: Category | 'all', premium: boolean) => !premium && c !== 'all' && !FREE_CATEGORIES.includes(c);
export const levelLocked = (l: CardLevel | 'mixed', premium: boolean) => !premium && l !== 'mixed' && !FREE_CARD_LEVELS.includes(l);

/** RevenueCat tarafında tanımlanacak kimlikler (docs/setup-accounts.md). */
export const ENTITLEMENT_ID = 'premium';
export type PlanType = 'monthly' | 'yearly' | 'lifetime';
export const PLAN_ORDER: readonly PlanType[] = ['yearly', 'monthly', 'lifetime'];
