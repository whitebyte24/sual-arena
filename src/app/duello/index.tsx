import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES } from '@/content/schema';
import { questionLangs, questionPool, type CategoryChoice } from '@/content/questions';
import { loadQuota, remainingDuels, type Quota } from '@/features/duello/quota';
import { isPremium } from '@/features/premium/entitlement';
import { getLang, t } from '@/i18n';
import { MAX_NAME, getPlayerName, setPlayerName } from '@/lib/identity';
import { radius, spacing, useTheme } from '@/lib/theme';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';

const MIN_QUESTIONS = 5;
const CHOICES: CategoryChoice[] = ['all', ...CATEGORIES];

export default function DuelSetup() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const langs = questionLangs();
  const lang = langs.includes(getLang()) ? getLang() : (langs[0] ?? getLang());
  const [category, setCategory] = useState<CategoryChoice>('all');
  const [name, setName] = useState('');
  const [quota, setQuota] = useState<Quota | null>(null);
  const [premium, setPremium] = useState(false);

  useEffect(() => {
    getPlayerName().then(setName);
    loadQuota().then(setQuota);
    isPremium().then(setPremium);
  }, []);

  const count = useMemo(() => questionPool(lang, category).length, [lang, category]);
  const left = quota ? remainingDuels(quota) : null;
  const blocked = !premium && left === 0;
  const enough = count >= MIN_QUESTIONS;

  const start = async () => {
    await setPlayerName(name);
    router.push({ pathname: '/duello/play', params: { category, lang } });
  };

  const label = { color: theme.textMuted, fontSize: 14, fontWeight: '600' as const, marginBottom: spacing.sm };
  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: spacing.md, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl, gap: spacing.lg }}>
      <Button label={t('common.back')} variant="ghost" height={48} onPress={() => router.back()} style={{ alignSelf: 'flex-start' }} />
      <View>
        <Text style={{ color: theme.accent, fontSize: 32, fontWeight: '800' }}>{t('duel.title')}</Text>
        <Text style={{ color: theme.textMuted, fontSize: 16, marginTop: spacing.xs }}>{t('duel.subtitle')}</Text>
      </View>
      <View>
        <Text style={label}>{t('online.yourName')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          maxLength={MAX_NAME}
          style={{ minHeight: 52, borderRadius: radius.md, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, color: theme.text, fontSize: 18, paddingHorizontal: spacing.md }}
        />
      </View>
      <View>
        <Text style={label}>{t('duel.category')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {CHOICES.map((c) => (
            <Chip key={c} label={t(`category.${c}`)} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>
      </View>
      <View style={{ gap: spacing.sm }}>
        {!premium && left !== null && (
          <Text style={{ color: blocked ? theme.danger : theme.textMuted, fontSize: 14 }}>
            {blocked ? t('duel.quotaOver') : t('duel.quotaLeft', { n: left })}
          </Text>
        )}
        {!enough && <Text style={{ color: theme.danger, fontSize: 14 }}>{t('duel.noQuestions')}</Text>}
        <Button label={t('duel.start')} height={64} disabled={blocked || !enough} onPress={start} />
      </View>
    </ScrollView>
  );
}
