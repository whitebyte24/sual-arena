import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { buyPlan, getPlans, restorePurchases, usePremium } from '@/features/premium/entitlement';
import { PLAN_ORDER } from '@/features/premium/tiers';
import type { Plan } from '@/features/premium/types';
import { t, type TKey } from '@/i18n';
import { MANAGE_SUBSCRIPTIONS_URL, PRIVACY_URL, TERMS_URL } from '@/lib/config';
import { spacing, useTheme } from '@/lib/theme';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { Divider, Lantern } from '@/ui/ornaments';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { Text } from '@/ui/Text';

const BENEFITS: { key: TKey; icon: 'cancel' | 'infinity' | 'shape-outline' | 'comment-text-multiple-outline' | 'trophy-outline' }[] = [
  { key: 'premium.benefits.noAds', icon: 'cancel' },
  { key: 'premium.benefits.unlimitedDuels', icon: 'infinity' },
  { key: 'premium.benefits.allCategories', icon: 'shape-outline' },
  { key: 'premium.benefits.allDecks', icon: 'comment-text-multiple-outline' },
];

export default function Paywall() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const premium = usePremium();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [selected, setSelected] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    getPlans().then((list) => {
      const sorted = [...list].sort((a, b) => PLAN_ORDER.indexOf(a.type) - PLAN_ORDER.indexOf(b.type));
      setPlans(sorted);
      setSelected(sorted[0]?.id);
    });
  }, []);

  const plan = plans?.find((p) => p.id === selected);

  const buy = async () => {
    if (!plan || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await buyPlan(plan.id);
      if (r === 'purchased') setMsg({ text: t('premium.success'), ok: true });
    } catch {
      setMsg({ text: t('premium.failed'), ok: false });
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const ok = await restorePurchases();
      setMsg({ text: ok ? t('premium.restored') : t('premium.restoreNone'), ok });
    } catch {
      setMsg({ text: t('premium.failed'), ok: false });
    } finally {
      setBusy(false);
    }
  };

  const link = (url: string) => Linking.openURL(url).catch(() => {});
  const manageUrl = Platform.OS === 'ios' ? MANAGE_SUBSCRIPTIONS_URL.ios : MANAGE_SUBSCRIPTIONS_URL.android;

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}>
      <ScreenHeader title={t('premium.title')} subtitle="Premium" />

      <Card outline="gold" glow="gold" watermark padding={20} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: theme.accent, fontSize: 22, fontWeight: '800', lineHeight: 29 }}>{t('premium.headline')}</Text>
        </View>
        <Lantern size={82} />
      </Card>

      <Card tone="raised" style={{ gap: spacing.md }}>
        {BENEFITS.map((b) => (
          <View key={b.key} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={b.icon} size={20} color={theme.accent} />
            </View>
            <Text style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: '600' }}>{t(b.key)}</Text>
            <Icon name="check-circle" size={20} color={theme.primary} />
          </View>
        ))}
      </Card>

      {premium ? (
        <View style={{ gap: spacing.sm }}>
          <Badge label={t('premium.active')} tone="gold" icon="star-check" />
          <Button label={t('premium.manage')} variant="neutral" onPress={() => link(manageUrl)} />
        </View>
      ) : (
        <>
          {plans === null ? null : plans.length === 0 ? (
            <Text style={{ color: theme.danger, textAlign: 'center' }}>{t('premium.unavailable')}</Text>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {plans.map((p, idx) => {
                const on = p.id === selected;
                return (
                  <Pressable key={p.id} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => setSelected(p.id)}>
                    <Card padding={14} outline={on ? 'gold' : 'default'} glow={on ? 'gold' : undefined} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: on ? 2 : 1 }}>
                      <Icon name={on ? 'radiobox-marked' : 'radiobox-blank'} size={24} color={on ? theme.accent : theme.textMuted} />
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>{t(`premium.plan.${p.type}`)}</Text>
                        {idx === 0 && p.type === 'yearly' && <Badge label={t('premium.best')} tone="gold" icon="star-four-points" />}
                      </View>
                      <Text style={{ color: theme.text, fontSize: 17, fontWeight: '700' }}>
                        {p.priceString} <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '500' }}>{t(`premium.per.${p.type}`)}</Text>
                      </Text>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          )}
          <Button label={busy ? t('premium.processing') : t('premium.subscribe')} variant="gold" icon="star-circle-outline" height={60} disabled={!plan || busy} onPress={buy} />
          <Button label={t('premium.restore')} variant="neutral" disabled={busy} onPress={restore} />
        </>
      )}

      {msg && <Text style={{ color: msg.ok ? theme.primary : theme.danger, textAlign: 'center', fontSize: 15 }}>{msg.text}</Text>}

      <Divider />
      {/* Mağaza zorunlu bilgilendirmesi: fiyat/süre yukarıda, otomatik yenileme ve iptal burada */}
      <Text style={{ color: theme.textMuted, fontSize: 12, lineHeight: 17 }}>
        {Platform.OS === 'ios' ? t('premium.legalIos') : t('premium.legalAndroid')}
        {plan?.type === 'lifetime' ? `\n${t('premium.lifetimeNote')}` : ''}
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.lg, justifyContent: 'center' }}>
        <Text accessibilityRole="link" onPress={() => link(TERMS_URL)} style={{ color: theme.accent, fontSize: 14, fontWeight: '600' }}>
          {t('premium.terms')}
        </Text>
        <Text accessibilityRole="link" onPress={() => link(PRIVACY_URL)} style={{ color: theme.accent, fontSize: 14, fontWeight: '600' }}>
          {t('premium.privacy')}
        </Text>
      </View>
    </ScrollView>
  );
}
