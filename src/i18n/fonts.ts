/** Yazı tipi seçimi — saf TS (test edilebilir). `ui/Text.tsx` kullanır. */

export const FONT_FAMILY = {
  '400': 'PlusJakartaSans_400Regular',
  '500': 'PlusJakartaSans_500Medium',
  '600': 'PlusJakartaSans_600SemiBold',
  '700': 'PlusJakartaSans_700Bold',
  '800': 'PlusJakartaSans_800ExtraBold',
} as const;

export const ARABIC_FONT_FAMILY = {
  '400': 'IBMPlexSansArabic_400Regular',
  '500': 'IBMPlexSansArabic_500Medium',
  '600': 'IBMPlexSansArabic_600SemiBold',
  '700': 'IBMPlexSansArabic_700Bold',
  '800': 'IBMPlexSansArabic_700Bold', // Plex Arabic'in 800'ü yok → 700
} as const;

/** Arapça gövde Latin'den ~%10 büyük (x-yüksekliği ve harekeler dengelensin). */
export const ARABIC_SCALE = 1.1;

export type WeightKey = keyof typeof FONT_FAMILY;

export function weightKey(w: unknown): WeightKey {
  if (w === 'bold') return '700';
  if (w === 'normal' || w === undefined) return '400';
  const n = Number(w);
  if (n >= 800) return '800';
  if (n >= 700) return '700';
  if (n >= 600) return '600';
  if (n >= 500) return '500';
  return '400';
}

export const fontFor = (lang: string, weight: unknown): string => (lang === 'ar' ? ARABIC_FONT_FAMILY : FONT_FAMILY)[weightKey(weight)];

export interface TextMetrics {
  fontFamily: string;
  fontWeight: 'normal';
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
}

/** Dile göre yazı tipi/boyut/harf aralığı. Arapçada harf aralığı SIFIR (harflerin bitişmesi bozulmasın). */
export function textMetrics(lang: string, flat: { fontWeight?: unknown; fontSize?: unknown; lineHeight?: unknown }): TextMetrics {
  const out: TextMetrics = { fontFamily: fontFor(lang, flat.fontWeight), fontWeight: 'normal' };
  if (lang !== 'ar') return out;
  out.letterSpacing = 0;
  if (typeof flat.fontSize === 'number' && flat.fontSize >= 10) {
    out.fontSize = Math.round(flat.fontSize * ARABIC_SCALE);
    if (typeof flat.lineHeight === 'number') out.lineHeight = Math.round(flat.lineHeight * ARABIC_SCALE);
  }
  return out;
}
