import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdBanner } from '@/features/ads/AdBanner';
import { currentStreak } from '@/features/gunluk/daily';
import { loadDaily } from '@/features/gunluk/store';
import { isLeagueAvailable } from '@/features/lig/remote';
import { usePremium } from '@/features/premium/entitlement';
import { getLang, t, type TKey } from '@/i18n';
import { MAX_ROOM_PLAYERS } from '@/lib/config';
import { dateKey } from '@/lib/date';
import { glow, radius, spacing, useTheme } from '@/lib/theme';
import { Badge } from '@/ui/Badge';
import { Card } from '@/ui/Card';
import { Icon, type IconName } from '@/ui/Icon';
import { Lantern, Divider } from '@/ui/ornaments';
import { Text } from '@/ui/Text';

type Route = '/soyleme' | '/duello' | '/oda' | '/gunluk' | '/lig';
type Mode = { key: 'duel' | 'room' | 'family' | 'daily' | 'league'; title: TKey; sub: TKey; icon: IconName; route?: Route };

const MODES: Mode[] = [
  { key: 'duel', title: 'home.modes.duel', sub: 'home.sub.duel', icon: 'sword-cross', route: '/duello' },
  { key: 'room', title: 'home.modes.room', sub: 'home.sub.room', icon: 'door-open', route: '/oda' },
  { key: 'family', title: 'home.modes.family', sub: 'home.sub.family', icon: 'comment-text-multiple-outline', route: '/soyleme' },
  { key: 'daily', title: 'home.modes.daily', sub: 'home.sub.daily', icon: 'book-open-page-variant-outline', route: '/gunluk' },
  { key: 'league', title: 'home.modes.league', sub: 'home.sub.league', icon: 'moon-waning-crescent' },
];

export default function Home() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const premium = usePremium();
  const [streak, setStreak] = useState(0);
  const [leagueOpen, setLeagueOpen] = useState(false);

  useEffect(() => {
    loadDaily().then((d) => setStreak(currentStreak(d.streak, dateKey())));
    isLeagueAvailable(getLang()).then(setLeagueOpen); // uzaktan açılır: yeniden yayın gerekmez
  }, []);

  const badge = (m: Mode) => {
    switch (m.key) {
      case 'duel':
        return <Badge label={t('home.badge.live')} tone="emerald" dot />;
      case 'room':
        return <Badge label={t('home.badge.upTo', { n: MAX_ROOM_PLAYERS })} icon="account-group-outline" />;
      case 'family':
        return <Badge label={t('home.badge.family')} tone="gold" icon="heart-outline" />;
      case 'daily':
        return streak > 0 ? <Badge label={t('home.badge.days', { n: streak })} tone="gold" icon="fire" /> : null;
      default:
        return leagueOpen ? <Badge label={t('home.badge.live')} tone="gold" icon="moon-waning-crescent" /> : <Badge label={t('home.badge.soon')} icon="lock-outline" />;
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{
        paddingHorizontal: spacing.screen,
        paddingTop: insets.top + spacing.md,
        paddingBottom: insets.bottom + spacing.lg,
        gap: spacing.md,
      }}>
      {/* Üst çubuk */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Lantern size={40} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: theme.text, fontSize: 21, fontWeight: '800' }}>
            {t('app.name')}
          </Text>
          <Text numberOfLines={1} style={{ color: theme.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 }}>
            {t('home.menuLabel').toLocaleUpperCase('tr')}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('home.premium')}
          onPress={() => router.push('/premium')}
          style={({ pressed }) => [
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              minHeight: 44,
              paddingHorizontal: 14,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: theme.goldLine,
              backgroundColor: theme.raised,
              opacity: pressed ? 0.85 : 1,
            },
            glow(theme.glowGold, 16),
          ]}>
          <Icon name={premium ? 'star-check' : 'star-outline'} size={18} color={theme.accent} />
          <Text style={{ color: theme.accent, fontSize: 14, fontWeight: '700' }}>{premium ? t('premium.active') : t('home.premium')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('home.account')}
          onPress={() => router.push('/hesap')}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: radius.pill,
            backgroundColor: theme.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}>
          <Icon name="account-outline" size={24} color={theme.onPrimary} />
        </Pressable>
      </View>

      {/* Karşılama kartı */}
      <Card glow="gold" watermark outline="gold" padding={20}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1.2 }}>
              {t('home.hero.eyebrow').toLocaleUpperCase('tr')}
            </Text>
            <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800', lineHeight: 29 }}>{t('home.hero.title')}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 14, lineHeight: 20 }}>{t('home.hero.body')}</Text>
          </View>
          <Lantern size={86} />
        </View>
      </Card>

      {/* Modlar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs }}>
        <Icon name="compass-outline" size={22} color={theme.accent} />
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700' }}>{t('home.section')}</Text>
      </View>

      {MODES.map((m0) => {
        // Ramazan Ligi uzaktan açılır (sezon + bayrak); kapalıyken kilitli kart
        const m: Mode = m0.key === 'league' && leagueOpen ? { ...m0, route: '/lig' } : m0;
        const locked = !m.route;
        return (
          <Pressable
            key={m.key}
            accessibilityRole="button"
            accessibilityLabel={t(m.title)}
            disabled={locked}
            onPress={() => m.route && router.push(m.route)}
            style={({ pressed }) => ({ opacity: locked ? 0.6 : pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}>
            <Card padding={14} watermark={!locked} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: radius.md,
                  backgroundColor: theme.raised,
                  borderWidth: 1,
                  borderColor: theme.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon name={m.icon} size={28} color={locked ? theme.textMuted : m.key === 'family' ? theme.accent : theme.primary} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
                  <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>{t(m.title)}</Text>
                  {badge(m)}
                </View>
                <Text numberOfLines={2} style={{ color: theme.textMuted, fontSize: 13, lineHeight: 18 }}>
                  {t(m.sub)}
                </Text>
              </View>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: radius.pill,
                  backgroundColor: theme.raised,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon name={locked ? 'lock-outline' : 'arrow-right'} size={20} color={theme.text} />
              </View>
            </Card>
          </Pressable>
        );
      })}

      <Divider />
      <AdBanner surface="home" />
    </ScrollView>
  );
}
