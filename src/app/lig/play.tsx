import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, View } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QUESTION_INDEX } from '@/content/questions';
import { QUESTION_SECONDS, makeResolver, points } from '@/features/duello/match';
import { cityById, guessCityId } from '@/features/lig/cities';
import { dayRecord, doneDays, withDay, EMPTY_LIG, type LigState } from '@/features/lig/ligState';
import { iftarOpenMs } from '@/features/lig/prayer';
import { loadLeague, submitScore, type LeagueData } from '@/features/lig/remote';
import { isRunComplete, scoreRun, type RunAnswer } from '@/features/lig/run';
import { dayNoFor, leagueStatus } from '@/features/lig/schedule';
import { loadLig, saveLig } from '@/features/lig/store';
import { ReportButton } from '@/features/report/ReportButton';
import { getLang, t, upper } from '@/i18n';
import { dateKey } from '@/lib/date';
import { getPlayerName } from '@/lib/identity';
import { hashString } from '@/lib/rng';
import { glow, radius, spacing, useTheme } from '@/lib/theme';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { confirm } from '@/ui/confirm';
import { Icon } from '@/ui/Icon';
import { Lantern } from '@/ui/ornaments';
import { TABULAR, Text } from '@/ui/Text';

/**
 * Lig seti: tek kişilik, her soru 10 sn, puan düellodaki gibi. REKLAMSIZ ekran (spec: iftar bildirimiyle açılan ekranlar).
 * Her cevap hemen kaydedilir (yarıda bırakıp geri dönünce aynı soruya tekrar bakılamaz). Skor sunucuya gider; çevrimdışıysa kuyrukta bekler.
 */
export default function LeaguePlay() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const lang = getLang();
  const [data, setData] = useState<LeagueData | null | undefined>(undefined);
  const [lig, setLig] = useState<LigState>(EMPTY_LIG);
  const [answers, setAnswers] = useState<RunAnswer[]>([]);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [reveal, setReveal] = useState(false);
  const [final, setFinal] = useState<{ score: number; correct: number; sent: boolean } | null>(null);
  const [blocked, setBlocked] = useState<'update' | 'closed' | null>(null);
  const [needFinish, setNeedFinish] = useState(false);
  const answered = useRef(false);
  const finishing = useRef(false);

  const today = dateKey();
  const dayNo = useMemo(() => (data ? dayNoFor(data.season.starts_on, today) : 0), [data, today]);
  const day = useMemo(() => data?.days.find((d) => d.day_no === dayNo), [data, dayNo]);
  const qids = useMemo(() => day?.question_ids ?? [], [day]);
  const resolve = useMemo(() => (data ? makeResolver(QUESTION_INDEX, hashString(`lig|${data.season.id}|${dayNo}`)) : null), [data, dayNo]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [res, saved] = await Promise.all([loadLeague(lang), loadLig()]);
      if (!alive) return;
      setLig(saved);
      setData(res.data);
      if (!res.data) return setBlocked('closed');
      const season = res.data.season;
      const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;
      const city = cityById(saved.cityId) ?? cityById(guessCityId(tz, lang))!;
      const status = leagueStatus({
        season,
        days: res.data.days,
        today: dateKey(),
        now: Date.now(),
        iftarAt: iftarOpenMs(dateKey(), city.lat, city.lon),
        doneDays: doneDays(saved, season.id),
      });
      if (status.kind !== 'open') return setBlocked('closed');
      const d = res.data.days.find((x) => x.day_no === status.dayNo)!;
      if (d.question_ids.some((id) => !QUESTION_INDEX.has(id))) return setBlocked('update'); // uygulama eski: sorular pakette yok
      const rec = dayRecord(saved, season.id, status.dayNo);
      setAnswers(rec?.answers ?? []);
      setStartedAt(Date.now());
      // Önceki oturumda tüm sorular cevaplanmış ama skor yazılmadan kapanmış: doğrudan bitir
      if (rec && isRunComplete(rec.answers, d.question_ids)) setNeedFinish(true);
    })();
    return () => {
      alive = false;
    };
  }, [lang]);

  const index = answers.length;
  // Gösterilen soru: cevaplama sırasında sıradaki, cevap gösterilirken az önce cevaplanan (son soruda index = soru sayısı olur)
  const showIndex = reveal ? index - 1 : index;
  const shown = resolve && qids[showIndex] ? resolve(qids[showIndex]) : undefined;
  const running = !!data && !blocked && !final && !!shown;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [running]);

  const persist = useCallback(
    async (next: RunAnswer[], score?: number) => {
      if (!data) return;
      const updated = withDay(lig, data.season.id, dayNo, { answers: next, ...(score !== undefined ? { score } : {}), submitted: false });
      setLig(updated);
      await saveLig(updated);
      return updated;
    },
    [data, lig, dayNo],
  );

  const record = useCallback(
    (choice: number) => {
      if (answered.current || !running) return;
      answered.current = true;
      const ms = Math.min(Date.now() - startedAt, QUESTION_SECONDS * 1000);
      const next = [...answers, { choice, ms: choice === -1 ? QUESTION_SECONDS * 1000 : ms }];
      setAnswers(next);
      setReveal(true);
      persist(next);
    },
    [answers, persist, running, startedAt],
  );

  // süre dolunca boş cevap
  const remaining = Math.min(QUESTION_SECONDS * 1000, Math.max(0, QUESTION_SECONDS * 1000 - (now - startedAt)));
  useEffect(() => {
    if (running && !reveal && remaining <= 0) record(-1);
  }, [running, reveal, remaining, record]);

  const finish = useCallback(async () => {
    if (!data || !resolve) return;
    const { score, correct } = scoreRun(answers, qids, resolve);
    const saved = await persist(answers, score);
    const sent = await submitScore(data.season.id, dayNo, score, await getPlayerName());
    if (sent && saved) {
      const done = withDay(saved, data.season.id, dayNo, { answers, score, submitted: true });
      setLig(done);
      await saveLig(done);
    }
    setFinal({ score, correct, sent });
  }, [answers, data, dayNo, persist, qids, resolve]);

  useEffect(() => {
    if (needFinish && resolve && data && !final && !finishing.current) {
      finishing.current = true;
      finish();
    }
  }, [needFinish, resolve, data, final, finish]);

  const next = () => {
    if (isRunComplete(answers, qids)) return void finish();
    answered.current = false;
    setReveal(false);
    setStartedAt(Date.now());
  };

  const quit = useCallback(async () => {
    if (await confirm(t('match.leave'), t('soyleme.play.quitMsg'), t('common.ok'), t('common.cancel'), false)) router.back();
  }, []);
  useEffect(() => {
    if (!running) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      quit();
      return true;
    });
    return () => sub.remove();
  }, [running, quit]);

  const frame = { paddingHorizontal: spacing.screen, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.lg, gap: spacing.md };

  // ── Yükleniyor / engelli ───────────────────────────────────────────────────
  if (data === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Lantern size={64} />
      </View>
    );
  }
  if (blocked) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.screen, gap: spacing.lg }}>
        <Stack.Screen options={{ gestureEnabled: true }} />
        <Icon name="moon-waning-crescent" size={56} color={theme.accent} />
        <Text style={{ color: theme.text, fontSize: 18, textAlign: 'center' }}>{blocked === 'update' ? t('lig.updateNeeded') : t('lig.notAvailableToday')}</Text>
        <Button label={t('lig.backToLeague')} onPress={() => router.replace('/lig')} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  // ── Sonuç ──────────────────────────────────────────────────────────────────
  if (final) {
    return (
      <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={{ ...frame, alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
        <Stack.Screen options={{ gestureEnabled: false }} />
        <Lantern size={110} />
        {day?.is_final && <Badge label={t('lig.finale')} tone="emerald" icon="star-four-points" />}
        <Text style={{ color: theme.accent, fontSize: 40, fontWeight: '800' }}>{t('lig.result', { n: final.score })}</Text>
        <Text style={{ color: theme.textMuted, fontSize: 16 }}>{t('match.correctCount', { n: final.correct, total: qids.length })}</Text>
        <Badge label={final.sent ? t('lig.sent') : t('lig.pending')} tone={final.sent ? 'emerald' : 'gold'} icon={final.sent ? 'check-circle-outline' : 'cloud-upload-outline'} />
        <Button label={t('lig.backToLeague')} height={60} onPress={() => router.replace('/lig')} style={{ alignSelf: 'stretch', marginTop: spacing.lg }} />
      </ScrollView>
    );
  }

  if (!shown) return null;
  const mine = answers[showIndex];
  const urgent = remaining <= 3000;
  const last = isRunComplete(answers, qids);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <ScrollView contentContainerStyle={frame}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.cancel')} onPress={quit} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }}>
            <Icon name="close" size={22} color={theme.textMuted} />
          </Pressable>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>{t('match.question', { n: Math.min(qids.length, reveal ? index : index + 1), total: qids.length })}</Text>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.raised, overflow: 'hidden' }}>
              <View style={{ height: 6, width: `${reveal ? 100 : (remaining / (QUESTION_SECONDS * 1000)) * 100}%`, backgroundColor: urgent && !reveal ? theme.danger : theme.primary }} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: urgent && !reveal ? theme.danger : theme.raised, borderWidth: 1, borderColor: urgent && !reveal ? theme.danger : theme.border }}>
            <Icon name="timer-outline" size={16} color={urgent && !reveal ? '#FFFFFF' : theme.accent} />
            <Text style={[{ color: urgent && !reveal ? '#FFFFFF' : theme.text, fontSize: 16, fontWeight: '800', minWidth: 30, textAlign: 'center' }, TABULAR]}>{String(Math.ceil(remaining / 1000)).padStart(2, '0')}</Text>
          </View>
        </View>

        <Card watermark padding={20} style={{ minHeight: 120, justifyContent: 'center', gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="book-open-variant" size={14} color={theme.accent} />
            <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.1 }}>{upper(t(`category.${shown.category}`))}</Text>
          </View>
          <Text style={{ color: theme.text, fontSize: 22, fontWeight: '700', lineHeight: 31 }}>{shown.text}</Text>
        </Card>

        <View style={{ gap: 10 }}>
          {shown.options.map((opt, i) => {
            const isAnswer = reveal && i === shown.answerIndex;
            const isWrong = reveal && mine?.choice === i && i !== shown.answerIndex;
            const dim = reveal && !isAnswer && !isWrong;
            const fg = isAnswer || isWrong ? '#FFFFFF' : theme.text;
            return (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={`${'ABCD'[i]}. ${opt}`}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  record(i);
                }}
                style={[
                  { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.xl, borderWidth: isAnswer ? 2 : 1.5, borderColor: isAnswer ? theme.primary : isWrong ? theme.danger : theme.border, backgroundColor: isAnswer ? theme.primary : isWrong ? theme.danger : theme.surface, opacity: dim ? 0.45 : 1 },
                  isAnswer ? glow(theme.glowEmerald, 24) : null,
                ]}>
                <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: isAnswer || isWrong ? 'rgba(11,27,51,0.35)' : theme.raised }}>
                  <Text style={{ color: isAnswer || isWrong ? '#FFFFFF' : theme.accent, fontSize: 15, fontWeight: '800' }}>{'ABCD'[i]}</Text>
                </View>
                <Text style={{ flex: 1, color: fg, fontSize: 18, fontWeight: '600' }}>{opt}</Text>
                {isAnswer && mine && mine.choice === shown.answerIndex && <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '800' }}>{t('matchUi.pts', { n: points(true, mine.ms) })}</Text>}
                {isAnswer && <Icon name="check-circle" size={26} color="#FFFFFF" />}
                {isWrong && <Icon name="close-circle" size={26} color="#FFFFFF" />}
              </Pressable>
            );
          })}
        </View>

        {reveal && (
          <>
            <Card tone="raised" padding={14} style={{ gap: spacing.sm }}>
              {mine?.choice === -1 && <Badge label={t('match.timeUp')} tone="danger" icon="timer-sand" />}
              <Text style={{ color: theme.text, fontSize: 15, lineHeight: 22 }}>{shown.explanation}</Text>
              <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '600' }}>
                {t('match.source')}: {shown.source}
              </Text>
              <ReportButton questionId={shown.id} />
            </Card>
            <Button label={last ? t('daily.finish') : t('daily.next')} trailingIcon="arrow-right" height={60} onPress={next} />
          </>
        )}
      </ScrollView>
    </View>
  );
}
