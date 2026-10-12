import { useEffect, useId, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { t } from '@/i18n';
import { radius, spacing, useTheme } from '@/lib/theme';
import { Avatar } from '@/ui/Avatar';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { Lantern } from '@/ui/ornaments';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { TABULAR, Text } from '@/ui/Text';

export type SearchView =
  | { kind: 'search' }
  | { kind: 'bot'; reason: 'offline' | 'timeout' }
  | { kind: 'found'; opponent: string };

/** "Fener radarı": dönen kesikli halkalar + nabız gibi parıltı. */
function Radar() {
  const theme = useTheme();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [spin] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const a = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: true }));
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [spin, pulse]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.06] });
  const size = 260;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', transform: [{ scale }] }}>
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id={`g${uid}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0.35" stopColor="#E0B04A" stopOpacity={0.28} />
              <Stop offset="1" stopColor="#E0B04A" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id={`e${uid}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0.4" stopColor="#0E9F6E" stopOpacity={0.22} />
              <Stop offset="1" stopColor="#0E9F6E" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#g${uid})`} />
          <Circle cx={size / 2} cy={size / 2} r={size / 2 - 44} fill={`url(#e${uid})`} />
        </Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', transform: [{ rotate }] }}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={size / 2 - 8} stroke={theme.goldLine} strokeWidth={1.5} strokeDasharray="4 10" fill="none" />
          <Circle cx={size / 2} cy={size / 2} r={size / 2 - 34} stroke={theme.accent} strokeOpacity={0.35} strokeWidth={1} strokeDasharray="14 8" fill="none" />
        </Svg>
      </Animated.View>
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: theme.raised,
          borderWidth: 1,
          borderColor: theme.goldLine,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Lantern size={78} />
      </View>
    </View>
  );
}

export function SearchScreen({ name, view, onCancel }: { name: string; view: SearchView; onCancel: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    if (view.kind !== 'search') return;
    const start = Date.now();
    const id = setInterval(() => setSecs(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [view.kind]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingHorizontal: spacing.screen, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md, gap: spacing.md }}>
      <ScreenHeader title={t('duel.title')} onBack={onCancel} />

      <Card padding={12} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Avatar name={name} size={52} highlight />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>
            {name}
          </Text>
        </View>
        <Badge label={t('duelUi.ready')} tone="emerald" dot />
      </Card>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
        <Radar />
        <Badge label={t('duelUi.radar')} tone="gold" icon="radar" />
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={{ color: theme.text, fontSize: 26, fontWeight: '800' }}>{t('duel.searching')}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 14, textAlign: 'center' }}>{t('duelUi.searchSub')}</Text>
        </View>
      </View>

      {view.kind === 'bot' && (
        <>
          <Card tone="raised" outline="gold" padding={12} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 40, height: 40, borderRadius: radius.pill, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="information-outline" size={22} color="#0B1B33" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>{t('duelUi.botTitle')}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 13 }}>{view.reason === 'offline' ? t('duel.offlineNote') : t('duelUi.botBody')}</Text>
            </View>
          </Card>
          <Card padding={12} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Avatar name="BOT" size={48} bot />
            <View style={{ flex: 1, gap: 4 }}>
              <Badge label={t('matchUi.botTag')} />
              <Text style={{ color: theme.textMuted, fontSize: 13 }}>{t('duelUi.matched')}</Text>
            </View>
            <Icon name="check-circle-outline" size={26} color={theme.primary} />
          </Card>
        </>
      )}
      {view.kind === 'found' && (
        <Card padding={12} glow="emerald" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Avatar name={view.opponent} size={48} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>
              {view.opponent}
            </Text>
            <Text style={{ color: theme.textMuted, fontSize: 13 }}>{t('duelUi.matched')}</Text>
          </View>
          <Icon name="check-circle-outline" size={26} color={theme.primary} />
        </Card>
      )}

      {view.kind === 'search' && (
        <View style={{ gap: spacing.sm }}>
          <Button label={t('duel.cancel')} icon="close" variant="neutral" onPress={onCancel} />
          <Text style={[{ color: theme.textMuted, fontSize: 13, textAlign: 'center' }, TABULAR]}>{t('duelUi.waited', { s: secs })}</Text>
        </View>
      )}
    </View>
  );
}
