import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, View } from 'react-native';
import { TABULAR, Text } from '@/ui/Text';
import { Avatar } from '@/ui/Avatar';
import { Badge } from '@/ui/Badge';
import { Card } from '@/ui/Card';
import { Icon, type IconName } from '@/ui/Icon';
import { Divider, Lantern } from '@/ui/ornaments';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALL_CARDS } from '@/content/cards';
import { onMatchFinished } from '@/features/ads';
import { AdBanner } from '@/features/ads/AdBanner';
import { PromoCard } from '@/features/ads/PromoCard';
import { isPremium } from '@/features/premium/entitlement';
import { allowedLevels } from '@/features/premium/tiers';
import {
  answer,
  canPass,
  createGame,
  currentCard,
  currentTurn,
  nextTurn,
  passesUsed,
  remainingMs,
  sanitizeSettings,
  scores,
  seenIdsOf,
  setResult,
  startTurn,
  tick,
  totalTurns,
  turnScore,
  winner,
  type GameState,
  type Result,
  type Settings,
} from '@/features/soyleme/engine';
import { addSeen, loadSeen } from '@/features/soyleme/storage';
import { t } from '@/i18n';
import { glow, radius, spacing, useTheme, type Theme } from '@/lib/theme';
import { Button } from '@/ui/Button';
import { confirm } from '@/ui/confirm';

const FALLBACK: Settings = {
  teamNames: ['1', '2'],
  roundSeconds: 60,
  turnsPerTeam: 3,
  passLimit: 3,
  level: 'mixed',
  lang: 'tr',
};
const CYCLE: Result[] = ['correct', 'taboo', 'pass'];
const newSeed = () => (Math.random() * 0x7fffffff) | 0;

export default function SoylemePlay() {
  useKeepAwake();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { s } = useLocalSearchParams<{ s?: string }>();
  const settings = useMemo(() => {
    try {
      return sanitizeSettings(s ? JSON.parse(s) : undefined, FALLBACK);
    } catch {
      return FALLBACK;
    }
  }, [s]);

  const [game, setGame] = useState<GameState | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const begin = useCallback(async () => {
    const [seen, premium] = await Promise.all([loadSeen(), isPremium()]);
    setGame(createGame(ALL_CARDS, settings, seen, newSeed(), allowedLevels(premium)));
  }, [settings]);

  useEffect(() => {
    let alive = true;
    Promise.all([loadSeen(), isPremium()]).then(([seen, premium]) => {
      if (alive) setGame(createGame(ALL_CARDS, settings, seen, newSeed(), allowedLevels(premium)));
    });
    return () => {
      alive = false;
    };
  }, [settings]);

  const phase = game?.phase;
  const turnIndex = game?.turnIndex;

  // Sayaç: süreyi duvar saatinden hesaplar (kayma yok); bitince motor turu kapatır.
  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => {
      const n = Date.now();
      setNow(n);
      setGame((g) => (g ? tick(g, n) : g));
    }, 200);
    return () => clearInterval(id);
  }, [phase]);

  // Tur bitince: titreşim + görülen kartları kaydet.
  useEffect(() => {
    if (phase === 'summary') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    if ((phase === 'summary' || phase === 'finished') && game) addSeen(seenIdsOf(game));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, turnIndex]);

  // Oyun bitti: tek geçiş reklamı (tur aralarında reklam yok) + günde en fazla 1 yumuşak Premium kartı
  const [promo, setPromo] = useState(false);
  const counted = useRef(false);
  useEffect(() => {
    if (phase !== 'finished' || counted.current) return;
    counted.current = true;
    onMatchFinished()
      .then((r) => setPromo(r.promo))
      .catch(() => {});
  }, [phase]);

  const confirmQuit = useCallback(async () => {
    if (await confirm(t('soyleme.play.quit'), t('soyleme.play.quitMsg'), t('common.ok'), t('common.cancel'))) router.back();
  }, []);

  useEffect(() => {
    if (phase === 'finished') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmQuit();
      return true;
    });
    return () => sub.remove();
  }, [phase, confirmQuit]);

  const press = (r: Result) => {
    Haptics.impactAsync(r === 'taboo' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setGame((g) => (g ? answer(g, r, Date.now()) : g));
  };

  if (!game) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
        <Stack.Screen options={{ gestureEnabled: false }} />
        <Lantern size={72} />
        <Text style={{ color: theme.textMuted, fontSize: 16 }}>{t('soyleme.play.loading')}</Text>
      </View>
    );
  }

  const [a, b] = scores(game);
  const team = game.settings.teamNames;
  const activeTeam = game.phase === 'finished' ? -1 : game.turnIndex % 2;
  const frame = { flex: 1, backgroundColor: theme.bg, paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md, paddingHorizontal: spacing.screen, gap: spacing.md } as const;

  const board = (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      {[0, 1].map((i) => (
        <Card
          key={i}
          padding={10}
          outline={activeTeam === i ? 'gold' : 'default'}
          glow={activeTeam === i ? 'gold' : undefined}
          tone={activeTeam === i ? 'surface' : 'raised'}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar name={team[i]} size={40} highlight={activeTeam === i} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: theme.textMuted, fontSize: 13, fontWeight: '600' }}>
              {team[i]}
            </Text>
            <Text style={[{ color: activeTeam === i ? theme.accent : theme.text, fontSize: 26, fontWeight: '800' }, TABULAR]}>{i === 0 ? a : b}</Text>
          </View>
        </Card>
      ))}
    </View>
  );

  // ── Hazır ──────────────────────────────────────────────────────────────────
  if (game.phase === 'ready') {
    const who = team[game.turnIndex % 2];
    return (
      <View style={frame}>
        <Stack.Screen options={{ gestureEnabled: false }} />
        <CloseButton onPress={confirmQuit} theme={theme} />
        {board}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
          <Lantern size={110} />
          <Badge label={t('soyleme.play.round', { n: game.turnIndex + 1, total: totalTurns(game) })} tone="gold" />
          <Text style={{ color: theme.accent, fontSize: 32, fontWeight: '800', textAlign: 'center' }}>{t('soyleme.play.turnOf', { team: who })}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 16, lineHeight: 23, textAlign: 'center', paddingHorizontal: spacing.md }}>{t('soyleme.play.hint')}</Text>
        </View>
        <Button
          label={t('soyleme.play.go')}
          icon="play"
          height={88}
          fontSize={26}
          onPress={() => {
            setNow(Date.now());
            setGame(startTurn(game, Date.now()));
          }}
        />
      </View>
    );
  }

  // ── Oynanıyor ──────────────────────────────────────────────────────────────
  if (game.phase === 'playing') {
    const card = currentCard(game);
    const left = remainingMs(game, now);
    const ratio = left / (game.settings.roundSeconds * 1000);
    const urgent = left <= 10_000;
    const passLeft = game.settings.passLimit === 0 ? Infinity : game.settings.passLimit - passesUsed(game);
    return (
      <View style={frame}>
        <Stack.Screen options={{ gestureEnabled: false }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <CloseButton onPress={confirmQuit} theme={theme} />
          <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: theme.raised, overflow: 'hidden' }}>
            <View style={{ height: 10, width: `${Math.max(0, Math.min(1, ratio)) * 100}%`, borderRadius: 5, backgroundColor: urgent ? theme.danger : theme.primary }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: urgent ? theme.danger : theme.raised, borderWidth: 1, borderColor: urgent ? theme.danger : theme.border }}>
            <Icon name="timer-outline" size={18} color={urgent ? '#FFFFFF' : theme.accent} />
            <Text style={[{ color: urgent ? '#FFFFFF' : theme.text, fontSize: 24, fontWeight: '800', minWidth: 40, textAlign: 'center' }, TABULAR]}>{Math.ceil(left / 1000)}</Text>
          </View>
        </View>

        <Card outline="gold" glow="gold" watermark padding={20} style={{ flex: 1, justifyContent: 'center', gap: spacing.sm }}>
          <Text adjustsFontSizeToFit numberOfLines={2} style={{ color: theme.accent, fontSize: 46, fontWeight: '800', textAlign: 'center', lineHeight: 54 }}>
            {card?.target}
          </Text>
          <Divider />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name="cancel" size={14} color={theme.textMuted} />
            <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1.2 }}>{t('soyleme.play.forbidden').toLocaleUpperCase('tr')}</Text>
          </View>
          <View style={{ gap: spacing.sm, marginTop: 4 }}>
            {card?.forbidden.map((w) => (
              <View key={w} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: theme.wrongBg, borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: 14 }}>
                <Icon name="close-circle-outline" size={20} color={theme.danger} />
                <Text adjustsFontSizeToFit numberOfLines={1} style={{ color: theme.text, fontSize: 24, fontWeight: '700', flexShrink: 1 }}>
                  {w}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <BigAction label={t('soyleme.play.taboo')} icon="close-octagon-outline" tone="danger" onPress={() => press('taboo')} />
          <BigAction
            label={passLeft === Infinity ? t('soyleme.play.pass') : t('soyleme.play.passLeft', { n: passLeft })}
            icon="skip-next-circle-outline"
            tone="neutral"
            disabled={!canPass(game)}
            onPress={() => press('pass')}
          />
          <BigAction label={t('soyleme.play.correct')} icon="check-bold" tone="primary" onPress={() => press('correct')} />
        </View>
      </View>
    );
  }

  // ── Özet ve Bitiş ──────────────────────────────────────────────────────────
  const finished = game.phase === 'finished';
  const turn = currentTurn(game);
  const w = winner(game);
  return (
    <View style={frame}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      {board}
      <ScrollView contentContainerStyle={{ paddingVertical: spacing.sm, gap: spacing.sm }}>
        {finished && promo && <PromoCard onDismiss={() => setPromo(false)} />}
        {finished ? (
          <View style={{ alignItems: 'center', gap: spacing.md, marginVertical: spacing.lg }}>
            <Icon name="trophy-award" size={72} color={theme.accent} />
            <Text style={{ color: theme.accent, fontSize: 32, fontWeight: '800', textAlign: 'center' }}>
              {w === 'draw' ? t('soyleme.play.draw') : t('soyleme.play.winner', { team: team[w] })}
            </Text>
          </View>
        ) : (
          <>
            <View style={{ alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm }}>
              <Text style={{ color: theme.accent, fontSize: 28, fontWeight: '800' }}>{t('soyleme.play.timeUp')}</Text>
              <Badge label={t('soyleme.play.turnScore', { n: turn ? turnScore(turn) : 0 })} tone="gold" icon="star-four-points" />
              <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center' }}>{t('soyleme.play.tapToFix')}</Text>
            </View>
            {turn?.entries.map((e, i) => (
              <Pressable
                key={`${e.card.id}-${i}`}
                accessibilityRole="button"
                accessibilityLabel={`${e.card.target}: ${t(`soyleme.result.${e.result}`)}`}
                onPress={() => setGame(setResult(game, game.turnIndex, i, CYCLE[(CYCLE.indexOf(e.result) + 1) % CYCLE.length]))}>
                <Card padding={12} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <Icon name={resultIcon(e.result)} size={26} color={resultColor(e.result, theme)} />
                  <Text style={{ color: theme.text, fontSize: 17, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                    {e.card.target}
                  </Text>
                  <Text style={{ color: resultColor(e.result, theme), fontSize: 13, fontWeight: '800' }}>{t(`soyleme.result.${e.result}`)}</Text>
                </Card>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
      {finished ? (
        <View style={{ gap: spacing.sm }}>
          <Button
            label={t('soyleme.play.again')}
            icon="replay"
            height={60}
            onPress={() => {
              counted.current = false;
              setPromo(false);
              begin();
            }}
          />
          <Button label={t('soyleme.play.menu')} variant="neutral" onPress={() => router.replace('/')} />
          <AdBanner surface="result" />
        </View>
      ) : (
        <Button
          label={game.turnIndex + 1 >= totalTurns(game) ? t('soyleme.play.showResult') : t('soyleme.play.next')}
          trailingIcon="arrow-right"
          height={68}
          onPress={() => setGame(nextTurn(game))}
        />
      )}
    </View>
  );
}

const resultColor = (r: Result, th: Theme) => (r === 'correct' ? th.primary : r === 'taboo' ? th.danger : th.textMuted);
const resultIcon = (r: Result): IconName => (r === 'correct' ? 'check-circle' : r === 'taboo' ? 'close-circle' : 'skip-next-circle');

function CloseButton({ onPress, theme }: { onPress: () => void; theme: Theme }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.cancel')}
      onPress={onPress}
      style={({ pressed }) => ({ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, opacity: pressed ? 0.8 : 1 })}>
      <Icon name="close" size={24} color={theme.textMuted} />
    </Pressable>
  );
}

/** Elden ele oyun için ≥ 96 dp yüksekliğinde büyük eylem düğmesi (simge üstte, etiket altta). */
function BigAction({ label, icon, tone, disabled, onPress }: { label: string; icon: IconName; tone: 'danger' | 'neutral' | 'primary'; disabled?: boolean; onPress: () => void }) {
  const theme = useTheme();
  const bg = tone === 'danger' ? theme.danger : tone === 'primary' ? theme.primary : theme.surface;
  const fg = tone === 'neutral' ? theme.text : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flex: 1,
          minHeight: 100,
          borderRadius: radius.xl,
          backgroundColor: bg,
          borderWidth: tone === 'neutral' ? 1 : 0,
          borderColor: theme.border,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingHorizontal: 6,
          opacity: disabled ? 0.4 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        tone === 'primary' ? glow(theme.glowEmerald, 22) : null,
      ]}>
      <Icon name={icon} size={30} color={fg} />
      <Text numberOfLines={2} style={{ color: fg, fontSize: 15, fontWeight: '700', textAlign: 'center' }}>
        {label}
      </Text>
    </Pressable>
  );
}
