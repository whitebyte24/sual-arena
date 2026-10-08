import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing, useTheme } from '@/lib/theme';
import { t, type TKey } from '@/i18n';

const MODES: { key: TKey; route?: '/soyleme' }[] = [
  { key: 'home.modes.family', route: '/soyleme' },
  { key: 'home.modes.duel' },
  { key: 'home.modes.room' },
  { key: 'home.modes.daily' },
  { key: 'home.modes.league' },
];

export default function Home() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: spacing.md, paddingTop: insets.top + spacing.lg, gap: spacing.md }}>
      <Text style={{ color: theme.accent, fontSize: 28, fontWeight: '800' }}>{t('app.name')}</Text>
      <Text style={{ color: theme.textMuted, fontSize: 16 }}>{t('app.tagline')}</Text>
      {MODES.map(({ key, route }) => (
        <Pressable
          key={key}
          accessibilityRole="button"
          disabled={!route}
          onPress={() => route && router.push(route)}
          style={({ pressed }) => ({
            backgroundColor: theme.surface,
            borderColor: route ? theme.primary : theme.border,
            borderWidth: 1,
            borderRadius: radius.lg,
            padding: spacing.lg,
            opacity: pressed ? 0.8 : 1,
          })}>
          <View>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700' }}>{t(key)}</Text>
            {!route && <Text style={{ color: theme.textMuted, marginTop: spacing.xs }}>{t('home.soon')}</Text>}
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}
