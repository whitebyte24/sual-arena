import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QUESTION_INDEX, questionLangs, questionPool } from '@/content/questions';
import { makeResolver } from '@/features/duello/match';
import { DailyCard } from '@/features/gunluk/DailyCard';
import {
  DAILY_COUNT,
  completeDay,
  currentStreak,
  dailyNumber,
  dailyQuestionIds,
  dailySeed,
  shareText,
  streakStatus,
} from '@/features/gunluk/daily';
import { fetchDailyOverride } from '@/features/gunluk/remote';
import { type DailyState } from '@/features/gunluk/state';
import { loadDaily, saveDaily } from '@/features/gunluk/store';
import { getLang, t } from '@/i18n';
import { dateKey, msUntilMidnight } from '@/lib/date';
import { INVITE_URL } from '@/lib/config';
import { shareView, shareWhatsapp } from '@/lib/share';
import { radius, spacing, useTheme } from '@/lib/theme';
import { Button } from '@/ui/Button';

type Mode = 'intro' | 'play' | 'result';

export default function Daily() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [today] = useState(() => dateKey());
  const langs = questionLangs();
  const lang = langs.includes(getLang()) ? getLang() : (langs[0] ?? getLang());

  const [data, setData] = useState<DailyState | null>(null);
  const [ids, setIds] = useState<string[] | null>(null);
  const [mode, setMode] = useState<Mode>('intro');
  const [cursor, setCursor] = useState(0);
  const cardRef = useRef<View>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [state, override] = await Promise.all([loadDaily(), fetchDailyOverride(today, lang)]);
      if (!alive) return;
      const usable = override && override.every((id) => QUESTION_INDEX.has(id)) ? override : null;
      setIds(usable ?? dailyQuestionIds(questionPool(lang, 'all'), today, DAILY_COUNT));
      setData(state);
      if (state.results[today]) setMode('result');
    })();
    return () => {
      alive = false;
    };
  }, [today, lang]);

  const resolve = useMemo(() => makeResolver(QUESTION_INDEX, dailySeed(today, lang)), [today, lang]);
  const progress = data?.progress?.day === today ? data.progress : null;
  const answered = progress?.choices ?? data?.results[today]?.choices ?? [];

  const begin = () => {
    setCursor(Math.min(progress?.choices.length ?? 0, DAILY_COUNT - 1));
    setMode('play');
  };

  const choose = useCallback(
    (i: number) => {
      if (!data || !ids) return;
      const q = resolve(ids[cursor]);
      const prev = data.progress?.day === today ? data.progress : { day: today, choices: [], correct: [] as boolean[] };
      if (!q || prev.choices.length > cursor) return; // zaten cevaplandı
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const choices = [...prev.choices, i];
      const correct = [...prev.correct, i === q.answerIndex];
      let next: DailyState;
      if (choices.length >= ids.length) {
        next = { streak: completeDay(data.streak, today), results: { ...data.results, [today]: { choices, correct } }, progress: null };
      } else {
        next = { ...data, progress: { day: today, choices, correct } };
      }
      setData(next);
      saveDaily(next, today);
    },
    [data, ids, cursor, resolve, today],
  );

  const frame = { padding: spacing.md, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md };

  if (!data || !ids) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.textMuted, fontSize: 16 }}>{t('daily.loading')}</Text>
      </View>
    );
  }

  const streak = currentStreak(data.streak, today);
  const status = streakStatus(data.streak, today);
  const result = data.results[today];

  // ── Oyun ──────────────────────────────────────────────────────────────────
  if (mode === 'play') {
    const q = resolve(ids[cursor]);
    const choice = answered[cursor];
    const revealed = choice !== undefined;
    const last = cursor >= ids.length - 1;
    return (
      <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={frame}>
        <Text style={{ color: theme.textMuted, fontSize: 14 }}>{t('daily.question', { n: cursor + 1, total: ids.length })}</Text>
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          {ids.map((_, i) => (
            <View key={i} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: i < answered.length ? (i === cursor ? theme.accent : theme.primary) : theme.surface }} />
          ))}
        </View>
        <View style={{ backgroundColor: theme.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: theme.border, padding: spacing.lg, minHeight: 130, justifyContent: 'center' }}>
          <Text style={{ color: theme.text, fontSize: 21, fontWeight: '700', textAlign: 'center' }}>{q?.text}</Text>
        </View>
        {q?.options.map((opt, i) => {
          const isAnswer = revealed && i === q.answerIndex;
          const isWrong = revealed && choice === i && i !== q.answerIndex;
          return (
            <Button
              key={i}
              label={opt}
              variant="neutral"
              height={64}
              textColor={isAnswer || isWrong ? '#FFFFFF' : undefined}
              style={{ backgroundColor: isAnswer ? theme.primary : isWrong ? theme.danger : theme.surface, opacity: revealed && !isAnswer && !isWrong ? 0.5 : 1 }}
              onPress={() => !revealed && choose(i)}
            />
          );
        })}
        {revealed && q && (
          <View style={{ gap: spacing.xs }}>
            <Text style={{ color: theme.textMuted, fontSize: 14, textAlign: 'center' }}>{q.explanation}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center' }}>
              {t('match.source')}: {q.source}
            </Text>
            <Button
              label={last ? t('daily.finish') : t('daily.next')}
              height={64}
              onPress={() => (last ? setMode('result') : setCursor(cursor + 1))}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        )}
      </ScrollView>
    );
  }

  // ── Sonuç ─────────────────────────────────────────────────────────────────
  if (mode === 'result' && result) {
    const n = dailyNumber(today);
    const score = result.correct.filter(Boolean).length;
    const text = shareText({
      header: t('daily.shareHeader', { n, score, total: result.correct.length }),
      correct: result.correct,
      streak,
      url: INVITE_URL,
    });
    const ms = msUntilMidnight();
    return (
      <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={frame}>
        <Text style={{ color: theme.accent, fontSize: 28, fontWeight: '800', textAlign: 'center' }}>{t('daily.doneTitle')}</Text>
        <DailyCard ref={cardRef} number={n} correct={result.correct} streak={streak} />
        <Text style={{ color: theme.textMuted, textAlign: 'center' }}>{t('daily.streakBest', { n: data.streak.best })}</Text>
        <Text style={{ color: theme.textMuted, textAlign: 'center' }}>
          {t('daily.comeBack', { h: Math.floor(ms / 3_600_000), m: Math.floor((ms % 3_600_000) / 60_000) })}
        </Text>
        <Button label={t('daily.share')} onPress={() => shareView(cardRef, text, t('daily.shareCardTitle', { n }))} />
        <Button label={t('match.shareWhatsapp')} variant="neutral" onPress={() => shareWhatsapp(text)} />
        <Button label={t('match.menu')} variant="ghost" onPress={() => router.replace('/')} />
      </ScrollView>
    );
  }

  // ── Giriş ─────────────────────────────────────────────────────────────────
  const enough = ids.length >= DAILY_COUNT;
  const note =
    status === 'broken' ? t('daily.streakBroken') : status === 'active' || status === 'repairable' ? t('daily.streakAtRisk') : '';
  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={frame}>
      <Button label={t('common.back')} variant="ghost" height={48} onPress={() => router.back()} style={{ alignSelf: 'flex-start' }} />
      <View>
        <Text style={{ color: theme.accent, fontSize: 32, fontWeight: '800' }}>{t('daily.title')}</Text>
        <Text style={{ color: theme.textMuted, fontSize: 16, marginTop: spacing.xs }}>{t('daily.subtitle')}</Text>
      </View>
      <View style={{ backgroundColor: theme.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: theme.border, padding: spacing.lg, alignItems: 'center', gap: spacing.xs }}>
        <Text style={{ fontSize: 44 }}>{streak > 0 ? '🔥' : '🕯️'}</Text>
        <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800' }}>{streak > 0 ? t('daily.streak', { n: streak }) : t('daily.streakNone')}</Text>
        {data.streak.best > 0 && <Text style={{ color: theme.textMuted, fontSize: 14 }}>{t('daily.streakBest', { n: data.streak.best })}</Text>}
        {!!note && <Text style={{ color: theme.accent, fontSize: 14, textAlign: 'center' }}>{note}</Text>}
      </View>
      {!enough && <Text style={{ color: theme.danger }}>{t('daily.noQuestions')}</Text>}
      <Button label={progress?.choices.length ? t('daily.resume') : t('daily.start')} height={64} disabled={!enough} onPress={begin} />
    </ScrollView>
  );
}
