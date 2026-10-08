import { useColorScheme } from 'react-native';

export const palette = {
  emerald: '#0E9F6E',
  emeraldDark: '#0A7A54',
  navy: '#0B1B33',
  navySoft: '#12294A',
  gold: '#E0B04A',
  cream: '#F7F4EC',
  white: '#FFFFFF',
  danger: '#D64545',
} as const;

export type Theme = {
  bg: string;
  surface: string;
  text: string;
  textMuted: string;
  primary: string;
  accent: string;
  border: string;
  danger: string;
  dark: boolean;
};

export const darkTheme: Theme = {
  bg: palette.navy,
  surface: palette.navySoft,
  text: '#F4F1E8',
  textMuted: '#9DB0C9',
  primary: palette.emerald,
  accent: palette.gold,
  border: '#1E3A63',
  danger: palette.danger,
  dark: true,
};

export const lightTheme: Theme = {
  bg: palette.cream,
  surface: palette.white,
  text: palette.navy,
  textMuted: '#4B5E7A',
  primary: palette.emeraldDark,
  accent: '#B88A1F',
  border: '#E1DACA',
  danger: palette.danger,
  dark: false,
};

export function useTheme(): Theme {
  return useColorScheme() === 'light' ? lightTheme : darkTheme;
}

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { md: 14, lg: 22 } as const;
