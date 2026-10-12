import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { initAds } from '@/features/ads';
import { initPremium } from '@/features/premium/entitlement';
import { initLang, needsRestart, t, useLang } from '@/i18n';
import { initAppearance } from '@/lib/appearance';
import { spacing, useTheme } from '@/lib/theme';
import { Icon } from '@/ui/Icon';
import { Text } from '@/ui/Text';

export default function RootLayout() {
  const theme = useTheme();
  const lang = useLang();
  const [ready, setReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
  });

  // İlk çizimden ÖNCE: kayıtlı dil/yön ve tema tercihi.
  useEffect(() => {
    Promise.all([initLang(), initAppearance()])
      .catch(() => {})
      .then(() => setReady(true));
  }, []);

  // Premium durumu (premium'a reklam/ATT gösterilmez), sonra onay → ATT → reklam SDK'sı.
  useEffect(() => {
    initPremium()
      .catch(() => {})
      .then(() => initAds())
      .catch(() => {});
  }, []);

  // Yazı tipleri ve dil hazır olana kadar çizim yok (yerel açılış ekranı görünür); font hatasında sistem yazı tipiyle devam.
  if (!ready || (!fontsLoaded && !fontError)) return null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      {/* key: dil değişince tüm ekranlar yeni dille yeniden kurulur */}
      <Stack key={lang} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }} />
      {needsRestart() && (
        <View
          accessibilityRole="alert"
          style={{
            position: 'absolute',
            start: spacing.md,
            end: spacing.md,
            bottom: spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            padding: spacing.md,
            borderRadius: 16,
            backgroundColor: theme.raised,
            borderWidth: 1,
            borderColor: theme.goldLine,
          }}>
          <Icon name="restart" size={22} color={theme.accent} />
          <Text style={{ flex: 1, color: theme.text, fontSize: 14, fontWeight: '600' }}>{t('account.restartNote')}</Text>
        </View>
      )}
    </View>
  );
}
