import { useEffect, useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALL_CARDS, cardLangs } from '@/content/cards';
import {
  LIMITS,
  clamp,
  eligibleCards,
  sanitizeSettings,
  type LevelChoice,
  type Settings,
} from '@/features/soyleme/engine';
import { usePremium } from '@/features/premium/entitlement';
import { allowedLevels, levelLocked } from '@/features/premium/tiers';
import { loadSettings, saveSettings } from '@/features/soyleme/storage';
import { getLang, t, upper } from '@/i18n';
import { spacing, useTheme } from '@/lib/theme';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { Stepper } from '@/ui/Stepper';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { Text } from '@/ui/Text';

const LEVELS: LevelChoice[] = ['child', 'teen', 'adult', 'mixed'];

function defaults(): Settings {
  const langs = cardLangs();
  const app = getLang();
  return {
    teamNames: [t('soyleme.setup.team', { n: 1 }), t('soyleme.setup.team', { n: 2 })],
    roundSeconds: 60,
    turnsPerTeam: 3,
    passLimit: 3,
    level: 'mixed',
    lang: langs.includes(app) ? app : (langs[0] ?? app),
  };
}

export default function SoylemeSetup() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const premium = usePremium();
  const [settings, setSettings] = useState<Settings>(defaults);
  const langs = cardLangs();

  useEffect(() => {
    loadSettings().then((saved) => {
      if (saved) setSettings(sanitizeSettings(saved, defaults()));
    });
  }, []);

  const patch = (p: Partial<Settings>) => setSettings((s) => ({ ...s, ...p }));
  const count = useMemo(() => eligibleCards(ALL_CARDS, settings, allowedLevels(premium)).length, [settings, premium]);
  const enough = count >= LIMITS.minCards;
  const R = LIMITS.roundSeconds;

  const setName = (i: 0 | 1, v: string) => {
    const names: [string, string] = [...settings.teamNames];
    names[i] = v;
    patch({ teamNames: names });
  };

  const start = () => {
    const clean = sanitizeSettings(settings, defaults());
    if (levelLocked(clean.level, premium)) clean.level = 'mixed'; // kilitli seviye (ör. eski kayıt) → ücretsiz karışık
    saveSettings(clean);
    router.push({ pathname: '/soyleme/play', params: { s: JSON.stringify(clean) } });
  };

  const eyebrow = { color: theme.textMuted, fontSize: 12, fontWeight: '700' as const, letterSpacing: 1.2 };

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl, gap: spacing.lg }}>
      <ScreenHeader title={t('soyleme.setup.title')} subtitle={t('home.badge.family')} />
      <Text style={{ color: theme.textMuted, fontSize: 15, lineHeight: 22 }}>{t('soyleme.setup.subtitle')}</Text>

      <View style={{ gap: spacing.sm }}>
        <Text style={eyebrow}>{upper(t('soyleme.setup.teams'))}</Text>
        {([0, 1] as const).map((i) => (
          <Card key={i} padding={10} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Avatar name={settings.teamNames[i] || String(i + 1)} size={44} highlight={i === 0} />
            <TextInput
              value={settings.teamNames[i]}
              onChangeText={(v) => setName(i, v)}
              maxLength={LIMITS.teamName}
              accessibilityLabel={t('soyleme.setup.team', { n: i + 1 })}
              style={{ flex: 1, color: theme.text, fontSize: 18, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold', minHeight: 44 }}
            />
          </Card>
        ))}
      </View>

      <Card tone="raised" style={{ gap: spacing.md }}>
        <Stepper
          label={t('soyleme.setup.roundSeconds')}
          valueText={t('soyleme.setup.seconds', { n: settings.roundSeconds })}
          decDisabled={settings.roundSeconds <= R.min}
          incDisabled={settings.roundSeconds >= R.max}
          onDec={() => patch({ roundSeconds: clamp(settings.roundSeconds - R.step, R.min, R.max) })}
          onInc={() => patch({ roundSeconds: clamp(settings.roundSeconds + R.step, R.min, R.max) })}
        />
        <Stepper
          label={t('soyleme.setup.turnsPerTeam')}
          valueText={String(settings.turnsPerTeam)}
          decDisabled={settings.turnsPerTeam <= LIMITS.turnsPerTeam.min}
          incDisabled={settings.turnsPerTeam >= LIMITS.turnsPerTeam.max}
          onDec={() => patch({ turnsPerTeam: settings.turnsPerTeam - 1 })}
          onInc={() => patch({ turnsPerTeam: settings.turnsPerTeam + 1 })}
        />
        <Stepper
          label={t('soyleme.setup.passLimit')}
          valueText={settings.passLimit === 0 ? t('soyleme.setup.unlimited') : String(settings.passLimit)}
          decDisabled={settings.passLimit <= LIMITS.passLimit.min}
          incDisabled={settings.passLimit >= LIMITS.passLimit.max}
          onDec={() => patch({ passLimit: settings.passLimit - 1 })}
          onInc={() => patch({ passLimit: settings.passLimit + 1 })}
        />
      </Card>

      <View style={{ gap: spacing.sm }}>
        <Text style={eyebrow}>{upper(t('soyleme.setup.level'))}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {LEVELS.map((l) => (
            <Chip
              key={l}
              label={t(`soyleme.level.${l}`)}
              selected={settings.level === l}
              locked={levelLocked(l, premium)}
              onPress={() => (levelLocked(l, premium) ? router.push('/premium') : patch({ level: l }))}
            />
          ))}
        </View>
      </View>

      {langs.length > 1 && (
        <View style={{ gap: spacing.sm }}>
          <Text style={eyebrow}>{upper(t('soyleme.setup.deckLang'))}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {langs.map((l) => (
              <Chip key={l} label={l.toUpperCase()} selected={settings.lang === l} onPress={() => patch({ lang: l })} />
            ))}
          </View>
        </View>
      )}

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: enough ? theme.textMuted : theme.danger, fontSize: 14 }}>
          {enough ? t('soyleme.setup.cards', { n: count }) : t('soyleme.setup.notEnough')}
        </Text>
        <Button label={t('soyleme.setup.start')} icon="play" height={60} disabled={!enough} onPress={start} />
      </View>
    </ScrollView>
  );
}
