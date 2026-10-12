import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CITIES, cityById, guessCityId } from '@/features/lig/cities';
import { doneDays, pendingScores, withDay, dayRecord, type LigState, EMPTY_LIG } from '@/features/lig/ligState';
import { cancelReminders, ensureReminderPermission, scheduleReminders } from '@/features/lig/notifications';
import { formatClock, iftarOpenMs } from '@/features/lig/prayer';
import { fetchLeaderboard, loadLeague, submitScore, type LeagueData, type Row } from '@/features/lig/remote';
import { leagueStatus, reminderPlan, seasonLength } from '@/features/lig/schedule';
import { loadLig, saveLig } from '@/features/lig/store';
import { getLang, t } from '@/i18n';
import { addDays, dateKey } from '@/lib/date';
import { getPlayerName } from '@/lib/identity';
import { radius, spacing, useTheme } from '@/lib/theme';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { Divider, Lantern } from '@/ui/ornaments';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { TABULAR, Text } from '@/ui/Text';

export default function LeagueHub() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const lang = getLang();
  const [data, setData] = useState<LeagueData | null | undefined>(undefined);
  const [offline, setOffline] = useState(false);
  const [lig, setLig] = useState<LigState>(EMPTY_LIG);
  const [now, setNow] = useState(() => Date.now());
  const [pickCity, setPickCity] = useState(false);
  const [tab, setTab] = useState<'today' | 'season'>('today');
  const [rows, setRows] = useState<Row[] | null | undefined>(undefined);
  const [denied, setDenied] = useState(false);

  // Açılışta: sezon + yerel kayıt; bekleyen skorları yeniden göndermeyi dene
  useEffect(() => {
    let alive = true;
    (async () => {
      const [res, saved] = await Promise.all([loadLeague(lang), loadLig()]);
      if (!alive) return;
      setData(res.data);
      setOffline(res.offline);
      setLig(saved);
      let next = saved;
      const name = await getPlayerName();
      for (const p of pendingScores(saved)) {
        if (await submitScore(p.seasonId, p.dayNo, p.score, name)) {
          const rec = dayRecord(next, p.seasonId, p.dayNo)!;
          next = withDay(next, p.seasonId, p.dayNo, { ...rec, submitted: true });
        }
      }
      if (next !== saved && alive) {
        setLig(next);
        saveLig(next);
      }
    })();
    return () => {
      alive = false;
    };
  }, [lang]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const today = dateKey(new Date(now));
  const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;
  const city = cityById(lig.cityId) ?? cityById(guessCityId(tz, lang))!;
  const iftarAt = iftarOpenMs(today, city.lat, city.lon);
  const season = data?.season;
  const done = useMemo(() => (season ? doneDays(lig, season.id) : []), [lig, season]);
  const status = useMemo(
    () => (data ? leagueStatus({ season: data.season, days: data.days, today, now, iftarAt, doneDays: done }) : null),
    [data, today, now, iftarAt, done],
  );
  const dayNo = status && 'dayNo' in status ? status.dayNo : null;

  // Sıralama
  useEffect(() => {
    if (!season) return;
    let alive = true;
    const wantDay = tab === 'today' ? dayNo : null;
    if (tab === 'today' && wantDay === null) {
      Promise.resolve().then(() => alive && setRows([]));
      return () => {
        alive = false;
      };
    }
    fetchLeaderboard(season.id, wantDay).then((r) => alive && setRows(r));
    return () => {
      alive = false;
    };
  }, [season, tab, dayNo]);

  const persist = useCallback((next: LigState) => {
    setLig(next);
    saveLig(next);
  }, []);

  const rescheduleFor = useCallback(
    (cityId: string, on: boolean) => {
      if (!season) return;
      if (!on) return void cancelReminders();
      const c = cityById(cityId) ?? city;
      const plan = reminderPlan({ season, today, now, openMsFor: (k) => iftarOpenMs(k, c.lat, c.lon), addDays });
      scheduleReminders(plan, { title: t('lig.notifTitle'), body: (n) => t('lig.notifBody', { n }), channelName: t('lig.notifChannel') });
    },
    [season, today, now, city],
  );

  // Hatırlatma açıksa takvimi her açılışta ileri taşı
  useEffect(() => {
    if (lig.reminders && season) rescheduleFor(lig.cityId ?? city.id, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season, lig.reminders, lig.cityId]);

  const chooseCity = (id: string) => {
    setPickCity(false);
    persist({ ...lig, cityId: id });
  };

  const toggleReminders = async () => {
    setDenied(false);
    if (lig.reminders) {
      persist({ ...lig, reminders: false });
      rescheduleFor(city.id, false);
      return;
    }
    if (await ensureReminderPermission()) {
      persist({ ...lig, reminders: true, cityId: lig.cityId ?? city.id });
      rescheduleFor(city.id, true);
    } else setDenied(true);
  };

  const eyebrow = { color: theme.textMuted, fontSize: 12, fontWeight: '700' as const, letterSpacing: 1.2 };
  const frame = { paddingHorizontal: spacing.screen, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl, gap: spacing.lg };

  // ── Kapalı / yükleniyor ───────────────────────────────────────────────────
  if (data === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Lantern size={64} />
      </View>
    );
  }
  if (!data || !season || !status) {
    return (
      <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={frame}>
        <ScreenHeader title={t('lig.title')} />
        <Card outline="gold" padding={24} style={{ alignItems: 'center', gap: spacing.md }}>
          <Icon name="moon-waning-crescent" size={56} color={theme.accent} />
          <Text style={{ color: theme.textMuted, fontSize: 16, textAlign: 'center', lineHeight: 23 }}>{t('lig.unavailable')}</Text>
        </Card>
      </ScrollView>
    );
  }

  const total = seasonLength(season);
  const inSeason = dayNo !== null && Math.min(dayNo, total) === Math.max(dayNo, 1);
  const day = data.days.find((d) => d.day_no === dayNo);
  const rec = dayNo ? dayRecord(lig, season.id, dayNo) : undefined;

  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={frame}>
      <ScreenHeader title={t('lig.title')} subtitle={season.name} />

      {/* Bugünün durumu */}
      <Card outline="gold" glow="gold" watermark padding={20} style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ gap: 6, flex: 1 }}>
            {inSeason && <Badge label={t('lig.day', { n: dayNo, total })} tone="gold" icon="calendar-star" />}
            {'isFinal' in status && status.isFinal && <Badge label={t('lig.finale')} tone="emerald" icon="star-four-points" />}
          </View>
          <Lantern size={64} />
        </View>

        {status.kind === 'not-started' && <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>{t('lig.notStarted', { date: status.startsOn })}</Text>}
        {status.kind === 'ended' && <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>{t('lig.ended')}</Text>}
        {status.kind === 'no-set' && <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>{t('lig.noSet')}</Text>}
        {status.kind === 'locked' && (
          <>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>{t('lig.lockedTitle')}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 15 }}>{t('lig.lockedBody', { time: formatClock(status.opensAt) })}</Text>
          </>
        )}
        {status.kind === 'open' && (
          <>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>{t('lig.openTitle')}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 15 }}>{t('lig.openBody', { n: day?.question_ids.length ?? 5 })}</Text>
            <Button label={t('lig.play')} icon="play" height={58} onPress={() => router.push('/lig/play')} />
          </>
        )}
        {status.kind === 'done' && (
          <>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>{t('lig.doneTitle')}</Text>
            <Text style={[{ color: theme.accent, fontSize: 18, fontWeight: '700' }, TABULAR]}>{t('lig.doneScore', { n: rec?.score ?? 0 })}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 14 }}>{t('lig.doneNext')}</Text>
            {rec && !rec.submitted && <Badge label={t('lig.pending')} tone="gold" icon="cloud-upload-outline" />}
          </>
        )}
      </Card>
      {offline && <Text style={{ color: theme.textMuted, fontSize: 13 }}>{t('lig.offline')}</Text>}

      {/* Şehir ve iftar */}
      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ width: 44, height: 44, borderRadius: radius.pill, backgroundColor: theme.raised, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="weather-sunset-down" size={24} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.textMuted, fontSize: 12 }}>{t('lig.city')}</Text>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>{city.name[lang]}</Text>
            {iftarAt !== null && <Text style={[{ color: theme.accent, fontSize: 14, fontWeight: '600' }, TABULAR]}>{t('lig.iftarAt', { time: formatClock(iftarAt - 5 * 60_000) })}</Text>}
          </View>
          <Button label={t('lig.chooseCity')} variant="neutral" height={44} fontSize={14} onPress={() => setPickCity((v) => !v)} />
        </View>
        {pickCity && (
          <ScrollView nestedScrollEnabled style={{ maxHeight: 260 }} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingVertical: spacing.sm }}>
            {CITIES.map((c) => (
              <Chip key={c.id} label={c.name[lang]} selected={c.id === city.id} onPress={() => chooseCity(c.id)} />
            ))}
          </ScrollView>
        )}
      </Card>

      {/* Hatırlatma (yalnızca yerel uygulamada) */}
      {Platform.OS !== 'web' && (
        <Card padding={14} style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Icon name={lig.reminders ? 'bell-ring-outline' : 'bell-outline'} size={24} color={theme.accent} />
            <Text style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: '600' }}>{t('lig.reminders')}</Text>
            <Chip label={lig.reminders ? t('lig.remindersOn') : t('lig.remindersOff')} selected={lig.reminders} onPress={toggleReminders} />
          </View>
          {denied && <Text style={{ color: theme.danger, fontSize: 13 }}>{t('lig.remindersDenied')}</Text>}
        </Card>
      )}

      {/* Sıralama */}
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700' }}>{t('lig.board')}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Chip label={t('lig.tabToday')} selected={tab === 'today'} onPress={() => setTab('today')} />
            <Chip label={t('lig.tabSeason')} selected={tab === 'season'} onPress={() => setTab('season')} />
          </View>
        </View>
        <Card padding={12} style={{ gap: 2 }}>
          {rows === undefined ? (
            <Text style={{ color: theme.textMuted }}>…</Text>
          ) : rows === null ? (
            <Text style={{ color: theme.textMuted }}>{t('lig.boardError')}</Text>
          ) : rows.length === 0 ? (
            <Text style={{ color: theme.textMuted }}>{t('lig.emptyBoard')}</Text>
          ) : (
            rows.map((r, i) => (
              <View key={`${r.rank_no}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: theme.border }}>
                <Text style={[{ width: 32, color: r.rank_no <= 3 ? theme.accent : theme.textMuted, fontSize: 16, fontWeight: '800' }, TABULAR]}>{r.rank_no}</Text>
                <Text numberOfLines={1} style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: '600' }}>
                  {r.display_name}
                </Text>
                <Text style={[{ color: theme.text, fontSize: 16, fontWeight: '800' }, TABULAR]}>{r.total_score}</Text>
              </View>
            ))
          )}
        </Card>
      </View>

      {/* Gün rozetleri */}
      <View style={{ gap: spacing.sm }}>
        <Text style={eyebrow}>{t('lig.daysDone', { n: done.length }).toLocaleUpperCase('tr')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
            const ok = done.includes(n);
            const now_ = n === dayNo;
            return (
              <Pressable key={n} accessibilityLabel={`${n}`} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: ok ? theme.primary : theme.raised, borderWidth: now_ ? 2 : 1, borderColor: now_ ? theme.accent : theme.border }}>
                {ok ? <Icon name="check" size={18} color={theme.onPrimary} /> : <Text style={[{ color: theme.textMuted, fontSize: 12, fontWeight: '700' }, TABULAR]}>{n}</Text>}
              </Pressable>
            );
          })}
        </View>
      </View>

      <Divider />
      <Text style={{ color: theme.textMuted, fontSize: 12, lineHeight: 17 }}>{t('lig.disclaimer')}</Text>
    </ScrollView>
  );
}
