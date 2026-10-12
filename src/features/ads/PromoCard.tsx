import { View } from 'react-native';
import { Text } from '@/ui/Text';
import { router } from 'expo-router';
import { t } from '@/i18n';
import { radius, spacing, useTheme } from '@/lib/theme';
import { Button } from '@/ui/Button';

/** Geçiş reklamından sonra (günde en fazla 1) gösterilen yumuşak Premium hatırlatması. Modal değil, satır içi kart. */
export function PromoCard({ onDismiss }: { onDismiss: () => void }) {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: theme.accent, padding: spacing.md, gap: spacing.sm }}>
      <Text style={{ color: theme.accent, fontSize: 18, fontWeight: '800' }}>{t('ads.promoTitle')}</Text>
      <Text style={{ color: theme.textMuted, fontSize: 14 }}>{t('ads.promoBody')}</Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button label={t('ads.promoCta')} height={48} fontSize={16} style={{ flex: 1 }} onPress={() => router.push('/premium')} />
        <Button label={t('ads.dismiss')} variant="neutral" height={48} fontSize={16} onPress={onDismiss} />
      </View>
    </View>
  );
}
