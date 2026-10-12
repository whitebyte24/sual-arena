import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { BackHandler, Pressable, ScrollView, View } from 'react-native';
import { TABULAR, Text } from '@/ui/Text';
import { Avatar } from '@/ui/Avatar';
import { Badge } from '@/ui/Badge';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { ReportButton } from '@/features/report/ReportButton';
import { addSeenQuestions } from './seen';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QUESTION_INDEX } from '@/content/questions';
import { onMatchFinished } from '@/features/ads';
import { AdBanner } from '@/features/ads/AdBanner';
import { PromoCard } from '@/features/ads/PromoCard';
import { t } from '@/i18n';
import { INVITE_URL } from '@/lib/config';
import { shareView, shareWhatsapp } from '@/lib/share';
import { glow, radius, spacing, useTheme, type Theme } from '@/lib/theme';
import { Button } from '@/ui/Button';
import { confirm } from '@/ui/confirm';
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

  const confirmLeave = useCallback(async () => {
    if (await confirm(t('match.leave'), t('match.leaveMsg'), t('common.ok'), t('common.cancel'))) onLeave();
  }, [onLeave]);
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

  const choose = (i: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    session.answer(i);
  };

  const mineChoice = mine?.choice ?? -2;
  const doneCount = state.players.filter((p) => !state.left.includes(p.id) && state.answers[p.id]?.[state.index]).length;
  const activeCount = state.players.filter((p) => !state.left.includes(p.id)).length;
  const compact = state.players.length <= 2;

  const playerCard = (p: (typeof state.players)[number]) => {
    const sc = playerScore(state, p.id, resolve).score;
    const emoji = view.emojis[p.id];
    const left = state.left.includes(p.id);
    const me = p.id === selfId;
    return (
      <Card
        key={p.id}
        padding={10}
        outline={me ? 'gold' : 'default'}
        tone={me ? 'surface' : 'raised'}
        style={[
          { flexDirection: 'row', alignItems: 'center', gap: 10, opacity: left ? 0.45 : 1 },
          compact ? { flex: 1 } : { minWidth: 170 },
        ]}>
        <Avatar name={p.name} size={44} bot={p.isBot} highlight={me} />
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text numberOfLines={1} style={{ color: theme.text, fontSize: 14, fontWeight: '700', flexShrink: 1 }}>
              {p.isBot ? t('match.bot') : p.name}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[{ color: me ? theme.accent : theme.text, fontSize: 22, fontWeight: '800' }, TABULAR]}>
              {sc}
            </Text>
            {me && <Badge label={t('matchUi.youTag')} tone="gold" />}
          </View>
        </View>
        {left && <Badge label={t('match.left')} />}
        {emoji && now - emoji.at < 2500 ? (
          <View style={{ position: 'absolute', top: 2, end: 6 }}>
            <Text style={{ fontSize: 22 }}>{emoji.e}</Text>
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.sm }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.md, gap: spacing.md }}>
        {/* Oyuncular */}
        {compact ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>{state.players.map(playerCard)}</View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {state.players.map(playerCard)}
          </ScrollView>
        )}

        {/* Soru sayacı + süre */}
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.raised, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: theme.border }}>
              <Icon name="book-open-page-variant-outline" size={16} color={theme.primary} />
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700', letterSpacing: 0.6 }}>
                {t('match.question', { n: state.index + 1, total: state.qids.length })}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                borderRadius: radius.pill,
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: urgent ? theme.danger : theme.raised,
                borderWidth: 1,
                borderColor: urgent ? theme.danger : theme.border,
              }}>
              <Icon name="timer-outline" size={16} color={urgent ? '#FFFFFF' : theme.accent} />
              <Text style={[{ color: urgent ? '#FFFFFF' : theme.text, fontSize: 16, fontWeight: '800', minWidth: 36, textAlign: 'center' }, TABULAR]}>
                {String(Math.ceil(remaining / 1000)).padStart(2, '0')}
              </Text>
            </View>
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.raised, overflow: 'hidden' }}>
            <View style={{ height: 6, width: `${Math.max(0, Math.min(1, ratio)) * 100}%`, borderRadius: 3, backgroundColor: urgent ? theme.danger : theme.primary }} />
          </View>
        </View>

        {/* Soru */}
        <Card watermark padding={20} style={{ gap: spacing.sm, minHeight: 130, justifyContent: 'center' }}>
          {!!q && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="book-open-variant" size={14} color={theme.accent} />
              <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.1 }}>
                {t(`category.${q.category}`).toLocaleUpperCase('tr')}
              </Text>
            </View>
          )}
          <Text style={{ color: theme.text, fontSize: 22, fontWeight: '700', lineHeight: 31 }}>{q?.text}</Text>
        </Card>

        {/* Cevaplar */}
        <View style={{ gap: 10 }}>
          {q?.options.map((opt, i) => {
            const isAnswer = revealed && i === q.answerIndex;
            const isWrongPick = revealed && mineChoice === i && i !== q.answerIndex;
            const dim = revealed && !isAnswer && !isWrongPick;
            const fg = isAnswer || isWrongPick ? '#FFFFFF' : theme.text;
            return (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={`${'ABCD'[i]}. ${opt}`}
                onPress={() => !revealed && choose(i)}
                style={({ pressed }) => [
                  {
                    minHeight: 64,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: radius.xl,
                    borderWidth: isAnswer ? 2 : 1.5,
                    borderColor: isAnswer ? theme.primary : isWrongPick ? theme.danger : theme.border,
                    backgroundColor: isAnswer ? theme.primary : isWrongPick ? theme.danger : theme.surface,
                    opacity: dim ? 0.45 : 1,
                    transform: [{ scale: pressed && !revealed ? 0.985 : 1 }],
                  },
                  isAnswer ? glow(theme.glowEmerald, 24) : null,
                ]}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isAnswer || isWrongPick ? 'rgba(11,27,51,0.35)' : theme.raised,
                  }}>
                  <Text style={{ color: isAnswer || isWrongPick ? '#FFFFFF' : theme.accent, fontSize: 15, fontWeight: '800' }}>{'ABCD'[i]}</Text>
                </View>
                <Text style={{ flex: 1, color: fg, fontSize: 18, fontWeight: '600' }}>{opt}</Text>
                {isAnswer && mine && mine.choice === q.answerIndex && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(11,27,51,0.4)', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Icon name="flash" size={14} color={theme.accent} />
                    <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '800' }}>{t('matchUi.pts', { n: points(true, mine.ms) })}</Text>
                  </View>
                )}
                {isAnswer && <Icon name="check-circle" size={26} color="#FFFFFF" />}
                {isWrongPick && <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>{t('matchUi.wrongPick')}</Text>}
                {isWrongPick && <Icon name="close-circle" size={26} color="#FFFFFF" />}
              </Pressable>
            );
          })}
        </View>

        {/* Açıklama + kaynak */}
        {revealed && q && (
          <Card tone="raised" padding={14} style={{ gap: spacing.sm }}>
            {mineChoice === -1 && <Badge label={t('match.timeUp')} tone="danger" icon="timer-sand" />}
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Icon name="check-decagram-outline" size={22} color={theme.primary} />
              <Text style={{ flex: 1, color: theme.text, fontSize: 15, lineHeight: 22 }}>{q.explanation}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="book-open-variant" size={16} color={theme.accent} />
              <Text style={{ flex: 1, color: theme.accent, fontSize: 12, fontWeight: '600' }}>
                {t('match.source')}: {q.source}
              </Text>
            </View>
            <ReportButton questionId={q.id} />
          </Card>
        )}
        {revealed && !everyone && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: theme.accent }} />
            <Text style={{ color: theme.textMuted, fontSize: 14, fontWeight: '600' }}>
              {t('match.waiting')} ({t('matchUi.done', { a: doneCount, b: activeCount })})
            </Text>
          </View>
        )}

        {/* Tepkiler */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginTop: spacing.xs }}>
          {EMOJIS.map((e) => (
            <Pressable
              key={e}
              accessibilityRole="button"
              accessibilityLabel={e}
              onPress={() => session.sendEmoji(e)}
              style={({ pressed }) => ({
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: theme.raised,
                borderWidth: 1,
                borderColor: theme.border,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale: pressed ? 0.92 : 1 }],
              })}>
              <Text style={{ fontSize: 26 }}>{e}</Text>
            </Pressable>
          ))}
        </View>
        <Button label={t('match.leaveBtn')} icon="logout" variant="ghost" height={48} fontSize={15} onPress={confirmLeave} />
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

  // Maç sonu: politika uygunsa geçiş reklamı (ilk 3 maç/ilk oturum/premium değilse hariç), ardından günde en fazla 1 yumuşak Premium kartı
  const [promo, setPromo] = useState(false);
  const counted = useRef(false);
  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    addSeenQuestions(state.qids); // tekrar önleme: sonraki maçta görülmemiş sorular öne alınır
    onMatchFinished()
      .then((r) => setPromo(r.promo))
      .catch(() => {});
  }, [state.qids]);

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: spacing.md, paddingTop: top + spacing.lg, paddingBottom: bottom + spacing.lg, gap: spacing.md }}>
      <ShareCard ref={cardRef} headline={headline} standings={st} selfId={selfId} total={state.qids.length} />
      {state.forfeit && <Text style={{ color: theme.textMuted, textAlign: 'center' }}>{t('match.forfeit')}</Text>}
      {promo && <PromoCard onDismiss={() => setPromo(false)} />}
      <Button label={t('match.share')} onPress={() => shareView(cardRef, text, t('match.shareTitle'))} />
      <Button label={t('match.shareWhatsapp')} variant="neutral" onPress={() => shareWhatsapp(text)} />
      {onAgain && <Button label={t('match.playAgain')} variant="neutral" onPress={onAgain} />}
      <Button label={t('match.menu')} variant="ghost" onPress={onMenu} />
      <AdBanner surface="result" />
    </ScrollView>
  );
}
