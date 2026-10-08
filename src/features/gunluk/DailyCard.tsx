import { forwardRef } from 'react';
import { Text, View } from 'react-native';
import { t } from '@/i18n';
import { INVITE_URL } from '@/lib/config';
import { palette, radius, spacing } from '@/lib/theme';
import { emojiGrid } from './daily';

interface Props {
  number: number;
  correct: boolean[];
  streak: number;
}

/** Görüntü olarak paylaşılan Wordle tarzı sonuç kartı (görüntü sabit kalsın diye her zaman koyu tema). */
export const DailyCard = forwardRef<View, Props>(function DailyCard({ number, correct, streak }, ref) {
  const score = correct.filter(Boolean).length;
  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ backgroundColor: palette.navy, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth: 2, borderColor: palette.gold, alignItems: 'center' }}>
      <Text style={{ color: palette.gold, fontSize: 20, fontWeight: '800' }}>{t('app.name')}</Text>
      <Text style={{ color: '#F4F1E8', fontSize: 18, fontWeight: '700' }}>{t('daily.shareCardTitle', { n: number })}</Text>
      {/* Izgara her dilde soldan sağa okunur */}
      <Text style={{ fontSize: 36, letterSpacing: 4, writingDirection: 'ltr', textAlign: 'center' }}>{emojiGrid(correct)}</Text>
      <Text style={{ color: '#F4F1E8', fontSize: 22, fontWeight: '800' }}>{t('daily.score', { n: score, total: correct.length })}</Text>
      {streak > 0 && <Text style={{ color: palette.gold, fontSize: 18, fontWeight: '700' }}>🔥 {t('daily.streak', { n: streak })}</Text>}
      <Text style={{ color: '#9DB0C9', fontSize: 13 }}>{INVITE_URL}</Text>
    </View>
  );
});
