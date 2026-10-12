import { I18nManager, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { t } from '@/i18n';
import { radius, spacing, useTheme } from '@/lib/theme';
import { Icon } from './Icon';
import { Text } from './Text';
import { Lantern } from './ornaments';

/** Geri oku + fener + başlık. (Ok yönü RTL'de otomatik ters döner.) */
export function ScreenHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack?: () => void }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        onPress={onBack ?? (() => router.back())}
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          borderRadius: radius.pill,
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.border,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.8 : 1,
        })}>
        <Icon name={I18nManager.isRTL ? 'arrow-right' : 'arrow-left'} size={22} color={theme.text} />
      </Pressable>
      <Lantern size={34} />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ color: theme.text, fontSize: 20, fontWeight: '700' }}>
          {title}
        </Text>
        {!!subtitle && (
          <Text numberOfLines={1} style={{ color: theme.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 }}>
            {subtitle.toLocaleUpperCase('tr')}
          </Text>
        )}
      </View>
    </View>
  );
}
