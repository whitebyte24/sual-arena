import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Alert, BackHandler, ScrollView, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QUESTION_INDEX } from '@/content/questions';
import { t } from '@/i18n';
import { INVITE_URL } from '@/lib/config';
import { shareView, shareWhatsapp } from '@/lib/share';
import { radius, spacing, useTheme, type Theme } from '@/lib/theme';
import { Button } from '@/ui/Button';
import { ShareCard } from './ShareCard';
import {
  QUESTION_SECONDS,
  isFinished,
  makeResolver,
  playerScore,
  points,
  standings,
  type MatchState,
} from './match';
import { EMOJIS, type MatchSession } from './session';

interface Props {
  session: MatchSession;
  selfId: string;
  /** "Tekrar oyna" (yalnızca düello); verilmezse düğme gösterilmez */
  onAgain?: () => void;
  onMenu: () => void;
  /** Maç sürerken kullanıcı çıkmayı onayladı */
  onLeave: () => void;
}

export function MatchPlay({ session, selfId, onAgain, onMenu, onLeave }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const view = useSyncExternalStore(session.subscribe, session.getView);
  const state = view.state;
  const seed = state?.seed;
  const resolve = useMemo(() => (seed === undefined ? null : makeResolver(QUESTION_INDEX, seed)), [seed]);
  const running = !!state && !isFinished(state);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [running]);

  const confirmLeave = useCallback(
    () =>
      Alert.alert(t('match.leave'), t('match.leaveMsg'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.ok'), style: 'destructive', onPress: onLeave },
      ]),
    [onLeave],
  );
  useEffect(() => {
    if (!running) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmLeave();
      return true;
    });
    return () => sub.remove();
  }, [running, confirmLeave]);

  if (!state || !resolve) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.textMuted, fontSize: 16 }}>{t('room.connecting')}</Text>
      </View>
    );
  }

  if (isFinished(state)) {
    return <Result state={state} selfId={selfId} resolve={resolve} onAgain={onAgain} onMenu={onMenu} theme={theme} bottom={insets.bottom} top={insets.top} />;
  }

  const q = resolve(state.qids[state.index]);
  const mine = state.answers[selfId]?.[state.index] ?? null;
  const revealed = mine !== null;
  const remaining = Math.min(QUESTION_SECONDS * 1000, Math.max(0, QUESTION_SECONDS * 1000 - (now - view.startedAt)));
  const ratio = remaining / (QUESTION_SECONDS * 1000);
  const urgent = remaining <= 3000;
  const everyone = state.players.filter((p) => !state.left.includes(p.id)).every((p) => state.answers[p.id]?.[state.index]);
  const ok = !!q && mine?.choice === q.answerIndex;

  const choose = (i: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    session.answer(i);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.sm }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}>
        {state.players.map((p) => {
          const sc = playerScore(state, p.id, resolve).score;
          const emoji = view.emojis[p.id];
          const left = state.left.includes(p.id);
          return (
            <View
              key={p.id}
              style={{
                minWidth: 96,
                backgroundColor: theme.surface,
                borderRadius: radius.md,
                borderWidth: 2,
                borderColor: p.id === selfId ? theme.accent : theme.border,
                padding: spacing.sm,
                alignItems: 'center',
                opacity: left ? 0.45 : 1,
              }}>
              <Text numberOfLines={1} style={{ color: theme.textMuted, fontSize: 13, maxWidth: 110 }}>
                {p.isBot ? t('match.bot') : p.name}
                {left ? ` · ${t('match.left')}` : ''}
              </Text>
              <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800' }}>{sc}</Text>
              <Text style={{ fontSize: 18, height: 24 }}>{emoji && now - emoji.at < 2500 ? emoji.e : ''}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Text style={{ color: theme.textMuted, fontSize: 14 }}>{t('match.question', { n: state.index + 1, total: state.qids.length })}</Text>
        <View style={{ flex: 1, height: 12, borderRadius: 6, backgroundColor: theme.surface, overflow: 'hidden' }}>
          <View style={{ height: 12, width: `${Math.max(0, Math.min(1, ratio)) * 100}%`, backgroundColor: urgent ? theme.danger : theme.primary }} />
        </View>
        <Text style={{ color: urgent ? theme.danger : theme.text, fontSize: 22, fontWeight: '800', minWidth: 30, textAlign: 'right' }}>{Math.ceil(remaining / 1000)}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}>
        <View style={{ backgroundColor: theme.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: theme.border, padding: spacing.lg, minHeight: 120, justifyContent: 'center' }}>
          <Text style={{ color: theme.text, fontSize: 21, fontWeight: '700', textAlign: 'center' }}>{q?.text}</Text>
        </View>
        {q?.options.map((opt, i) => {
          const isAnswer = revealed && i === q.answerIndex;
          const isWrongPick = revealed && mine?.choice === i && i !== q.answerIndex;
          const bg = isAnswer ? theme.primary : isWrongPick ? theme.danger : theme.surface;
          const fg = isAnswer || isWrongPick ? '#FFFFFF' : theme.text;
          return (
            <Button
              key={i}
              label={opt}
              height={64}
              fontSize={18}
              variant="neutral"
              style={{ backgroundColor: bg, borderColor: isAnswer ? theme.primary : theme.border, opacity: revealed && !isAnswer && !isWrongPick ? 0.5 : 1 }}
              onPress={() => !revealed && choose(i)}
              textColor={fg}
            />
          );
        })}
        {revealed && q && (
          <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
            <Text style={{ color: ok ? theme.primary : mine?.choice === -1 ? theme.textMuted : theme.danger, fontSize: 18, fontWeight: '800', textAlign: 'center' }}>
              {ok ? `${t('match.correct')} +${points(true, mine!.ms)}` : mine?.choice === -1 ? t('match.timeUp') : t('match.wrong')}
            </Text>
            <Text style={{ color: theme.textMuted, fontSize: 14, textAlign: 'center' }}>{q.explanation}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center' }}>
              {t('match.source')}: {q.source}
            </Text>
            {!everyone && <Text style={{ color: theme.accent, fontSize: 14, textAlign: 'center' }}>{t('match.waiting')}</Text>}
          </View>
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.sm }}>
          {EMOJIS.map((e) => (
            <Button key={e} label={e} variant="neutral" height={48} fontSize={22} style={{ width: 60 }} onPress={() => session.sendEmoji(e)} />
          ))}
        </View>
        <Button label={t('match.leaveBtn')} variant="ghost" height={44} fontSize={14} onPress={confirmLeave} />
      </ScrollView>
    </View>
  );
}

// ─── Sonuç ───────────────────────────────────────────────────────────────────
function Result({
  state,
  selfId,
  resolve,
  onAgain,
  onMenu,
  theme,
  top,
  bottom,
}: {
  state: MatchState;
  selfId: string;
  resolve: NonNullable<ReturnType<typeof makeResolver>>;
  onAgain?: () => void;
  onMenu: () => void;
  theme: Theme;
  top: number;
  bottom: number;
}) {
  const cardRef = useRef<View>(null);
  const st = useMemo(() => standings(state, resolve), [state, resolve]);
  const me = st.find((r) => r.player.id === selfId);
  const winners = st.filter((r) => r.rank === 1).length;
  const stillHere = !state.left.includes(selfId);
  const forfeitWin = state.forfeit && stillHere;
  const headline = forfeitWin || (me?.rank === 1 && winners === 1) ? t('match.youWin') : me?.rank === 1 ? t('match.draw') : t('match.youLose');
  const text = t('match.shareText', { score: me?.score ?? 0, rank: me?.rank ?? '-', url: INVITE_URL });

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: spacing.md, paddingTop: top + spacing.lg, paddingBottom: bottom + spacing.lg, gap: spacing.md }}>
      <ShareCard ref={cardRef} headline={headline} standings={st} selfId={selfId} total={state.qids.length} />
      {state.forfeit && <Text style={{ color: theme.textMuted, textAlign: 'center' }}>{t('match.forfeit')}</Text>}
      <Button label={t('match.share')} onPress={() => shareView(cardRef, text, t('match.shareTitle'))} />
      <Button label={t('match.shareWhatsapp')} variant="neutral" onPress={() => shareWhatsapp(text)} />
      {onAgain && <Button label={t('match.playAgain')} variant="neutral" onPress={onAgain} />}
      <Button label={t('match.menu')} variant="ghost" onPress={onMenu} />
    </ScrollView>
  );
}
