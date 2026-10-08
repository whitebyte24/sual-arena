import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
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
import { loadSettings, saveSettings } from '@/features/soyleme/storage';
import { getLang, t } from '@/i18n';
import { radius, spacing, useTheme } from '@/lib/theme';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Stepper } from '@/ui/Stepper';

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
  const [settings, setSettings] = useState<Settings>(defaults);
  const langs = cardLangs();

  useEffect(() => {
    loadSettings().then((saved) => {
      if (saved) setSettings(sanitizeSettings(saved, defaults()));
    });
  }, []);

  const patch = (p: Partial<Settings>) => setSettings((s) => ({ ...s, ...p }));
  const count = useMemo(() => eligibleCards(ALL_CARDS, settings).length, [settings]);
  const enough = count >= LIMITS.minCards;
  const R = LIMITS.roundSeconds;

  const setName = (i: 0 | 1, v: string) => {
    const names: [string, string] = [...settings.teamNames];
    names[i] = v;
    patch({ teamNames: names });
  };

  const start = () => {
    const clean = sanitizeSettings(settings, defaults());
    saveSettings(clean);
    router.push({ pathname: '/soyleme/play', params: { s: JSON.stringify(clean) } });
  };

  const label = { color: theme.textMuted, fontSize: 14, fontWeight: '600' as const, marginBottom: spacing.sm };

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: spacing.md, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl, gap: spacing.lg }}>
      <Button label={t('common.back')} variant="ghost" height={48} onPress={() => router.back()} style={{ alignSelf: 'flex-start' }} />
      <View>
        <Text style={{ color: theme.accent, fontSize: 32, fontWeight: '800' }}>{t('soyleme.setup.title')}</Text>
        <Text style={{ color: theme.textMuted, fontSize: 16, marginTop: spacing.xs }}>{t('soyleme.setup.subtitle')}</Text>
      </View>

      <View>
        <Text style={label}>{t('soyleme.setup.teams')}</Text>
        <View style={{ gap: spacing.sm }}>
          {([0, 1] as const).map((i) => (
            <TextInput
              key={i}
              value={settings.teamNames[i]}
              onChangeText={(v) => setName(i, v)}
              maxLength={LIMITS.teamName}
              style={{
                minHeight: 52,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.surface,
                color: theme.text,
                fontSize: 18,
                paddingHorizontal: spacing.md,
              }}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
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
      </View>

      <View>
        <Text style={label}>{t('soyleme.setup.level')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {LEVELS.map((l) => (
            <Chip key={l} label={t(`soyleme.level.${l}`)} selected={settings.level === l} onPress={() => patch({ level: l })} />
          ))}
        </View>
      </View>

      {langs.length > 1 && (
        <View>
          <Text style={label}>{t('soyleme.setup.deckLang')}</Text>
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
        <Button label={t('soyleme.setup.start')} height={64} disabled={!enough} onPress={start} />
      </View>
    </ScrollView>
  );
}
