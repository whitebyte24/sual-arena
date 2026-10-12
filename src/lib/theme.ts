import { useColorScheme } from 'react-native';

/** Tasarım sistemi: docs/design/stitch/DESIGN.md ("Serene Illumination"). Karanlık mod birincil. */
export const palette = {
  emerald: '#0E9F6E',
  emeraldDark: '#0A7A54',
  navy: '#0B1B33',
  navyRaised: '#12294A',
  navyCard: '#18335A',
  gold: '#E0B04A',
  cream: '#F7F4EC',
  white: '#FFFFFF',
  danger: '#D64545',
} as const;

export type Theme = {
  /** Sayfa zemini (Level 0) */
  bg: string;
  /** Paneller / gruplar (Level 1) */
  raised: string;
  /** Kartlar, cevap kutuları, girişler (Level 2) */
  surface: string;
  text: string;
  textMuted: string;
  primary: string;
  accent: string;
  border: string;
  /** Altın ince çizgi (premium/aktif vurgu) */
  goldLine: string;
  danger: string;
  /** Birincil (zümrüt) düğme üstündeki yazı */
  onPrimary: string;
  /** Doğru / yanlış cevap dolguları */
  correctBg: string;
  wrongBg: string;
  /** Fener parıltısı (gölge rengi) */
  glowGold: string;
  glowEmerald: string;
  dark: boolean;
};

export const darkTheme: Theme = {
  bg: palette.navy,
  raised: palette.navyRaised,
  surface: palette.navyCard,
  text: '#F4F1E8',
  textMuted: '#9DB0C9',
  primary: palette.emerald,
  accent: palette.gold,
  border: '#1E3A63',
  goldLine: 'rgba(224, 176, 74, 0.25)',
  danger: palette.danger,
  onPrimary: '#F4F1E8',
  correctBg: 'rgba(14, 159, 110, 0.30)',
  wrongBg: 'rgba(214, 69, 69, 0.22)',
  glowGold: 'rgba(224, 176, 74, 0.15)',
  glowEmerald: 'rgba(14, 159, 110, 0.20)',
  dark: true,
};

export const lightTheme: Theme = {
  bg: palette.cream,
  raised: '#FBF8F0',
  surface: palette.white,
  text: palette.navy,
  textMuted: '#4B5E7A',
  primary: palette.emeraldDark,
  accent: '#B88A1F',
  border: '#E1DACA',
  goldLine: 'rgba(184, 138, 31, 0.35)',
  danger: palette.danger,
  onPrimary: '#FFFFFF',
  correctBg: 'rgba(10, 122, 84, 0.14)',
  wrongBg: 'rgba(214, 69, 69, 0.12)',
  glowGold: 'rgba(184, 138, 31, 0.18)',
  glowEmerald: 'rgba(10, 122, 84, 0.18)',
  dark: false,
};

export function useTheme(): Theme {
  return useColorScheme() === 'light' ? lightTheme : darkTheme;
}

/** 4 pt tabanlı ızgara; ekran kenar boşluğu 20. */
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, screen: 20 } as const;
export const radius = { sm: 8, md: 16, lg: 22, xl: 24, pill: 9999 } as const;

/** Fener parıltısı: sert gölge yerine yumuşak, renkli yayılım. */
export const glow = (color: string, blur = 24) =>
  ({ shadowColor: color, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: blur, elevation: 0 }) as const;
