import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES } from '@/content/schema';
import { questionLangs, questionPool, type CategoryChoice } from '@/content/questions';
import { watchRewarded } from '@/features/ads';
import { REWARD_DUELS } from '@/features/ads/policy';
import { grantBonusDuels, loadQuota, remainingDuels, type Quota } from '@/features/duello/quota';
import { usePremium } from '@/features/premium/entitlement';
import { allowedCategories, categoryLocked } from '@/features/premium/tiers';
import { getLang, t, upper } from '@/i18n';
import { MAX_NAME, getPlayerName, setPlayerName } from '@/lib/identity';
import { getRemoteConfig } from '@/lib/remoteConfig';
import { radius, spacing, useTheme } from '@/lib/theme';
import { Avatar } from '@/ui/Avatar';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { Divider } from '@/ui/ornaments';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { Text } from '@/ui/Text';

const MIN_QUESTIONS = 5;
const CHOICES: CategoryChoice[] = ['all', ...CATEGORIES];

export default function DuelSetup() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const premium = usePremium();
  const langs = questionLangs();
  const lang = langs.includes(getLang()) ? getLang() : (langs[0] ?? getLang());
  const [category, setCategory] = useState<CategoryChoice>('all');
  const [name, setName] = useState('');
  const [quota, setQuota] = useState<Quota | null>(null);
  const [limit, setLimit] = useState(10);
  const [note, setNote] = useState('');

  useEffect(() => {
    getPlayerName().then(setName);
    loadQuota().then(setQuota);
    getRemoteConfig().then((r) => setLimit(r.features.free_duels_per_day));
  }, []);

  const count = useMemo(() => questionPool(lang, category, allowedCategories(premium)).length, [lang, category, premium]);
  const left = quota ? remainingDuels(quota, limit) : null;
  const blocked = !premium && left === 0;
  const enough = count >= MIN_QUESTIONS;

  const pick = (c: CategoryChoice) => (categoryLocked(c, premium) ? router.push('/premium') : setCategory(c));

  const start = async () => {
    await setPlayerName(name);
    router.push({ pathname: '/duello/play', params: { category, lang } });
  };

  const watchAd = useCallback(async () => {
    setNote('');
    if (await watchRewarded()) {
      setQuota(await grantBonusDuels(REWARD_DUELS));
      setNote(t('ads.rewardThanks', { n: REWARD_DUELS }));
    }
  }, []);

  const eyebrow = { color: theme.textMuted, fontSize: 12, fontWeight: '700' as const, letterSpacing: 1.2 };
  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl, gap: spacing.lg }}>
      <ScreenHeader title={t('duel.title')} subtitle={t('home.badge.live')} />

      {/* Kurallar */}
      <Card outline="gold" glow="gold" watermark style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={{ width: 52, height: 52, borderRadius: radius.md, backgroundColor: theme.raised, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="trophy-outline" size={28} color={theme.accent} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: theme.accent, fontSize: 16, fontWeight: '700' }}>{t('duelUi.rules')}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 14, lineHeight: 20 }}>{t('duel.subtitle')}</Text>
        </View>
      </Card>

      {/* Yarışmacı */}
      <View style={{ gap: spacing.sm }}>
        <Text style={eyebrow}>{upper(t('duelUi.identity'))}</Text>
        <Card padding={12} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Avatar name={name || '?'} size={52} highlight />
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.textMuted, fontSize: 12 }}>{t('duelUi.yourName')}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              maxLength={MAX_NAME}
              accessibilityLabel={t('online.yourName')}
              placeholderTextColor={theme.textMuted}
              style={{ color: theme.text, fontSize: 20, fontWeight: '700', paddingVertical: 2, fontFamily: 'PlusJakartaSans_700Bold' }}
            />
          </View>
          <View style={{ width: 40, height: 40, borderRadius: radius.pill, backgroundColor: theme.raised, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="pencil-outline" size={18} color={theme.textMuted} />
          </View>
        </Card>
      </View>

      {/* Kategori */}
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700' }}>{t('duelUi.pickCategory')}</Text>
          <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>{upper(t('duelUi.single'))}</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {CHOICES.map((c) => (
            <Chip key={c} label={t(`category.${c}`)} selected={category === c} locked={categoryLocked(c, premium)} onPress={() => pick(c)} />
          ))}
        </View>
      </View>

      {/* Kota */}
      {!premium && left !== null && (
        <Card padding={14} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ width: 44, height: 44, borderRadius: radius.pill, backgroundColor: theme.raised, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="fire" size={22} color={theme.accent} />
          </View>
          <Text style={{ flex: 1, color: theme.text, fontSize: 15, fontWeight: '600' }}>{t('duelUi.quotaTitle')}</Text>
          <Badge label={t('duelUi.quotaLeft', { n: left })} tone={blocked ? 'danger' : 'gold'} dot />
        </Card>
      )}
      {!!note && <Text style={{ color: theme.primary, fontSize: 14, textAlign: 'center' }}>{note}</Text>}
      {!enough && <Text style={{ color: theme.danger, fontSize: 14 }}>{t('duel.noQuestions')}</Text>}

      <Button label={t('duel.start')} icon="sword-cross" trailingIcon="arrow-right" height={58} disabled={blocked || !enough} onPress={start} />

      {blocked && (
        <>
          <Divider />
          <Card tone="raised" style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Icon name="information-outline" size={20} color={theme.accent} />
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', flex: 1 }}>{t('duelUi.outTitle')}</Text>
            </View>
            <Text style={{ color: theme.textMuted, fontSize: 14, lineHeight: 20 }}>{t('duelUi.outBody')}</Text>
            <Button label={t('ads.rewardDuels', { n: REWARD_DUELS })} icon="play-circle-outline" variant="neutral" onPress={watchAd} />
            <Button label={t('premium.upgrade')} icon="star-circle-outline" variant="gold" onPress={() => router.push('/premium')} />
          </Card>
        </>
      )}
    </ScrollView>
  );
}
