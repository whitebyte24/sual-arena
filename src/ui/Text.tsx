import { StyleSheet, Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { getLang } from '@/i18n';
import { textMetrics } from '@/i18n/fonts';

/**
 * Tüm uygulama metni bu bileşenle çizilir: `fontWeight` değerini yazı tipi ailesine çevirir
 * (özel yazı tiplerinde fontWeight tek başına çalışmaz). Latin/Türkçe: Plus Jakarta Sans,
 * Arapça arayüz: IBM Plex Sans Arabic. Ayrıntı ve kurallar: `i18n/fonts.ts`.
 * Dil değişince kök yerleşim yeniden kurulduğu için burada abonelik gerekmez.
 */
export function Text({ style, ...props }: TextProps) {
  const flat = StyleSheet.flatten(style) ?? {};
  return <RNText {...props} style={[style, textMetrics(getLang(), flat)]} />;
}

/** Sayaç/skor gibi rakamların oynamaması için */
export const TABULAR: TextStyle = { fontVariant: ['tabular-nums'] };
