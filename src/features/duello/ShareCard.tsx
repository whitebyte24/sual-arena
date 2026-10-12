import { forwardRef } from 'react';
import { View } from 'react-native';
import { Text } from '@/ui/Text';
import { INVITE_URL } from '@/lib/config';
import { palette, radius, spacing } from '@/lib/theme';
import { t } from '@/i18n';
import type { Standing } from './match';

interface Props {
  headline: string;
  standings: Standing[];
  selfId: string;
  total: number;
}

/** WhatsApp vb. için görüntü olarak paylaşılan sonuç kartı (her zaman koyu tema: görüntü sabit kalsın). */
export const ShareCard = forwardRef<View, Props>(function ShareCard({ headline, standings, selfId, total }, ref) {
  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ backgroundColor: palette.navy, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth: 2, borderColor: palette.gold }}>
      <Text style={{ color: palette.gold, fontSize: 22, fontWeight: '800' }}>{t('app.name')}</Text>
      <Text style={{ color: '#F4F1E8', fontSize: 28, fontWeight: '800' }}>{headline}</Text>
      {standings.slice(0, 4).map((r) => (
        <View key={r.player.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text style={{ color: palette.gold, fontSize: 18, fontWeight: '800', width: 28 }}>{r.rank}.</Text>
          <Text numberOfLines={1} style={{ color: '#F4F1E8', fontSize: 18, flex: 1, fontWeight: r.player.id === selfId ? '800' : '500' }}>
            {r.player.isBot ? t('match.bot') : r.player.name}
          </Text>
          <Text style={{ color: '#9DB0C9', fontSize: 14 }}>{t('match.correctCount', { n: r.correct, total })}</Text>
          <Text style={{ color: '#F4F1E8', fontSize: 18, fontWeight: '800' }}>{r.score}</Text>
        </View>
      ))}
      <Text style={{ color: '#9DB0C9', fontSize: 13, marginTop: spacing.sm }}>{INVITE_URL}</Text>
    </View>
  );
});
