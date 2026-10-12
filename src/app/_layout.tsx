import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
import { useTheme } from '@/lib/theme';

export default function RootLayout() {
  const theme = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Önce premium durumu (premium'a reklam/ATT gösterilmez), sonra onay → ATT → reklam SDK'sı.
  useEffect(() => {
    initPremium()
      .catch(() => {})
      .then(() => initAds())
      .catch(() => {});
  }, []);

  // Yazı tipleri yüklenene kadar (yerel açılış ekranı görünür) çizim yok; hata olursa sistem yazı tipiyle devam.
  if (!fontsLoaded && !fontError) return null;

  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }} />
    </>
  );
}
