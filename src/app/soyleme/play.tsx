import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALL_CARDS } from '@/content/cards';
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
import { radius, spacing, useTheme, type Theme } from '@/lib/theme';
import { Button } from '@/ui/Button';

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
    const seen = await loadSeen();
    setGame(createGame(ALL_CARDS, settings, seen, newSeed()));
  }, [settings]);

  useEffect(() => {
    let alive = true;
    loadSeen().then((seen) => {
      if (alive) setGame(createGame(ALL_CARDS, settings, seen, newSeed()));
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

  const confirmQuit = useCallback(() => {
    Alert.alert(t('soyleme.play.quit'), t('soyleme.play.quitMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.ok'), style: 'destructive', onPress: () => router.back() },
    ]);
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
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Stack.Screen options={{ gestureEnabled: false }} />
        <Text style={{ color: theme.textMuted, fontSize: 16 }}>{t('soyleme.play.loading')}</Text>
      </View>
    );
  }

  const [a, b] = scores(game);
  const team = game.settings.teamNames;
  const frame = { flex: 1, backgroundColor: theme.bg, paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md, paddingHorizontal: spacing.md };

  const board = (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      {[0, 1].map((i) => (
        <View
          key={i}
          style={{
            flex: 1,
            backgroundColor: theme.surface,
            borderRadius: radius.md,
            borderWidth: 2,
            borderColor: game.phase !== 'finished' && game.turns[game.turnIndex]?.team === i ? theme.accent : theme.border,
            padding: spacing.sm,
            alignItems: 'center',
          }}>
          <Text numberOfLines={1} style={{ color: theme.textMuted, fontSize: 14 }}>{team[i]}</Text>
          <Text style={{ color: theme.text, fontSize: 28, fontWeight: '800' }}>{i === 0 ? a : b}</Text>
        </View>
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
          <Text style={{ color: theme.textMuted, fontSize: 16 }}>
            {t('soyleme.play.round', { n: game.turnIndex + 1, total: totalTurns(game) })}
          </Text>
          <Text style={{ color: theme.accent, fontSize: 34, fontWeight: '800', textAlign: 'center' }}>
            {t('soyleme.play.turnOf', { team: who })}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 17, textAlign: 'center', paddingHorizontal: spacing.md }}>
            {t('soyleme.play.hint')}
          </Text>
        </View>
        <Button label={t('soyleme.play.go')} height={88} fontSize={26} onPress={() => { setNow(Date.now()); setGame(startTurn(game, Date.now())); }} />
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
          <View style={{ flex: 1 }}>
            <View style={{ height: 14, borderRadius: 7, backgroundColor: theme.surface, overflow: 'hidden' }}>
              <View style={{ height: 14, width: `${Math.max(0, Math.min(1, ratio)) * 100}%`, backgroundColor: urgent ? theme.danger : theme.primary }} />
            </View>
          </View>
          <Text style={{ color: urgent ? theme.danger : theme.text, fontSize: 28, fontWeight: '800', minWidth: 56, textAlign: 'right' }}>
            {Math.ceil(left / 1000)}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            marginVertical: spacing.md,
            backgroundColor: theme.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: theme.border,
            padding: spacing.lg,
            justifyContent: 'center',
            gap: spacing.lg,
          }}>
          <Text adjustsFontSizeToFit numberOfLines={2} style={{ color: theme.accent, fontSize: 44, fontWeight: '800', textAlign: 'center' }}>
            {card?.target}
          </Text>
          <View style={{ height: 1, backgroundColor: theme.border }} />
          <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center' }}>{t('soyleme.play.forbidden')}</Text>
          <View style={{ gap: spacing.sm }}>
            {card?.forbidden.map((w) => (
              <Text key={w} adjustsFontSizeToFit numberOfLines={1} style={{ color: theme.danger, fontSize: 26, fontWeight: '700', textAlign: 'center' }}>
                {w}
              </Text>
            ))}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button label={t('soyleme.play.taboo')} variant="danger" height={96} fontSize={17} style={{ flex: 1 }} onPress={() => press('taboo')} />
          <Button
            label={passLeft === Infinity ? t('soyleme.play.pass') : t('soyleme.play.passLeft', { n: passLeft })}
            variant="neutral"
            height={96}
            fontSize={17}
            disabled={!canPass(game)}
            style={{ flex: 1 }}
            onPress={() => press('pass')}
          />
          <Button label={t('soyleme.play.correct')} height={96} fontSize={20} style={{ flex: 1 }} onPress={() => press('correct')} />
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
      <ScrollView contentContainerStyle={{ paddingVertical: spacing.md, gap: spacing.sm }}>
        {finished ? (
          <Text style={{ color: theme.accent, fontSize: 32, fontWeight: '800', textAlign: 'center', marginVertical: spacing.md }}>
            {w === 'draw' ? t('soyleme.play.draw') : t('soyleme.play.winner', { team: team[w] })}
          </Text>
        ) : (
          <>
            <Text style={{ color: theme.accent, fontSize: 28, fontWeight: '800', textAlign: 'center' }}>{t('soyleme.play.timeUp')}</Text>
            <Text style={{ color: theme.text, fontSize: 18, textAlign: 'center' }}>
              {t('soyleme.play.turnScore', { n: turn ? turnScore(turn) : 0 })}
            </Text>
            <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center' }}>{t('soyleme.play.tapToFix')}</Text>
            {turn?.entries.map((e, i) => (
              <Pressable
                key={`${e.card.id}-${i}`}
                accessibilityRole="button"
                onPress={() => setGame(setResult(game, game.turnIndex, i, CYCLE[(CYCLE.indexOf(e.result) + 1) % CYCLE.length]))}
                style={{
                  minHeight: 52,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: theme.surface,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: theme.border,
                  paddingHorizontal: spacing.md,
                  gap: spacing.md,
                }}>
                <Text style={{ color: theme.text, fontSize: 17, flex: 1 }} numberOfLines={1}>{e.card.target}</Text>
                <Text style={{ color: resultColor(e.result, theme), fontSize: 15, fontWeight: '800' }}>
                  {resultMark(e.result)} {t(`soyleme.result.${e.result}`)}
                </Text>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
      {finished ? (
        <View style={{ gap: spacing.sm }}>
          <Button label={t('soyleme.play.again')} height={64} onPress={begin} />
          <Button label={t('soyleme.play.menu')} variant="neutral" onPress={() => router.replace('/')} />
        </View>
      ) : (
        <Button
          label={game.turnIndex + 1 >= totalTurns(game) ? t('soyleme.play.showResult') : t('soyleme.play.next')}
          height={72}
          onPress={() => setGame(nextTurn(game))}
        />
      )}
    </View>
  );
}

const resultColor = (r: Result, th: Theme) => (r === 'correct' ? th.primary : r === 'taboo' ? th.danger : th.textMuted);
const resultMark = (r: Result) => (r === 'correct' ? '✓' : r === 'taboo' ? '✕' : '↷');

function CloseButton({ onPress, theme }: { onPress: () => void; theme: Theme }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.cancel')}
      onPress={onPress}
      style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' }}>
      <Text style={{ color: theme.textMuted, fontSize: 26 }}>✕</Text>
    </Pressable>
  );
}
