import { StyleSheet, Text as RNText, type TextProps, type TextStyle } from 'react-native';

/**
 * Tüm uygulama metni bu bileşenle çizilir: `fontWeight` değerini Plus Jakarta Sans ağırlık ailesine çevirir
 * (özel yazı tiplerinde fontWeight tek başına çalışmaz). Arapça için Faz 6'da ayrı aile eklenecek;
 * Plus Jakarta'da olmayan glifler sistem yazı tipine düşer.
 */
export const FONT_FAMILY = {
  '400': 'PlusJakartaSans_400Regular',
  '500': 'PlusJakartaSans_500Medium',
  '600': 'PlusJakartaSans_600SemiBold',
  '700': 'PlusJakartaSans_700Bold',
  '800': 'PlusJakartaSans_800ExtraBold',
} as const;

function weightKey(w: unknown): keyof typeof FONT_FAMILY {
  if (w === 'bold') return '700';
  if (w === 'normal' || w === undefined) return '400';
  const n = Number(w);
  if (n >= 800) return '800';
  if (n >= 700) return '700';
  if (n >= 600) return '600';
  if (n >= 500) return '500';
  return '400';
}

export function Text({ style, ...props }: TextProps) {
  const flat = StyleSheet.flatten(style) ?? {};
  return <RNText {...props} style={[style, { fontFamily: FONT_FAMILY[weightKey(flat.fontWeight)], fontWeight: 'normal' }]} />;
}

/** Sayaç/skor gibi rakamların oynamaması için */
export const TABULAR: TextStyle = { fontVariant: ['tabular-nums'] };
