import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ScrollView, Share, View } from 'react-native';
import { Text } from '@/ui/Text';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QUESTION_INDEX, questionLangs, questionPool, type CategoryChoice } from '@/content/questions';
import { CATEGORIES } from '@/content/schema';
import { makeResolver, pickQuestions, type PlayerInfo } from '@/features/duello/match';
import { MatchPlay } from '@/features/duello/MatchPlay';
import { isRoomCode } from '@/features/duello/pairing';
import { RoomFailure, createRoom, joinRoom, lobbyPlayers, type RoomError } from '@/features/duello/room';
import { MatchSession } from '@/features/duello/session';
import { usePremium } from '@/features/premium/entitlement';
import { allowedCategories, categoryLocked } from '@/features/premium/tiers';
import { getLang, t } from '@/i18n';
import { INVITE_URL, MAX_ROOM_PLAYERS } from '@/lib/config';
import { getIdentity } from '@/lib/identity';
import type { ChannelTransport, PresenceMeta } from '@/lib/realtime';
import { supabase } from '@/lib/supabase';
import { radius, spacing, useTheme } from '@/lib/theme';
import { Button } from '@/ui/Button';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { Chip } from '@/ui/Chip';
import { Stepper } from '@/ui/Stepper';

const CHOICES: CategoryChoice[] = ['all', ...CATEGORIES];
const randomSeed = () => (Math.random() * 0x7fffffff) | 0;
const randomId = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e8).toString(36)}`;
const errorKey = (r: RoomError) =>
  r === 'notFound' ? 'room.notFound' : r === 'full' ? 'room.full' : r === 'started' ? 'room.started' : 'online.connectError';

export default function RoomLobby() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string; code?: string }>();
  const isHost = params.mode === 'host';
  const premium = usePremium();

  const [code, setCode] = useState(params.code ?? '');
  const [selfId, setSelfId] = useState('');
  const [players, setPlayers] = useState<PresenceMeta[]>([]);
  const [session, setSession] = useState<MatchSession | null>(null);
  const [error, setError] = useState('');
  const [category, setCategory] = useState<CategoryChoice>('all');
  const [count, setCount] = useState(5);
  const transportRef = useRef<ChannelTransport | null>(null);
  const sessionRef = useRef<MatchSession | null>(null);

  const langs = questionLangs();
  const lang = langs.includes(getLang()) ? getLang() : (langs[0] ?? getLang());
  const pool = questionPool(lang, category, allowedCategories(premium)).length;
  const maxCount = Math.max(5, Math.min(15, pool));

  useEffect(() => {
    let alive = true;
    let offPresence: (() => void) | undefined;
    (async () => {
      try {
        const me = await getIdentity();
        if (!me.online || !supabase) return alive && setError(t('room.needOnline'));
        let transport: ChannelTransport;
        if (isHost) {
          const r = await createRoom(supabase, me);
          transport = r.transport;
          if (alive) setCode(r.code);
        } else {
          if (!isRoomCode(params.code ?? '')) return alive && setError(t('room.invalidCode'));
          transport = await joinRoom(supabase, params.code!, me);
        }
        if (!alive) return transport.close();
        transportRef.current = transport;
        const s = new MatchSession({ transport, selfId: me.id, resolverFor: (seed) => makeResolver(QUESTION_INDEX, seed) });
        sessionRef.current = s;
        setSelfId(me.id);
        setSession(s);
        const refresh = () => {
          const list = lobbyPlayers(transport);
          setPlayers(list);
          if (!isHost && !s.state && !list.some((p) => p.host)) setError(t('room.hostLeft'));
        };
        offPresence = transport.onPresence(refresh);
        refresh();
        if (!isHost) s.hello();
      } catch (e) {
        if (alive) setError(t(e instanceof RoomFailure ? errorKey(e.reason) : 'online.connectError'));
      }
    })();
    return () => {
      alive = false;
      offPresence?.();
      sessionRef.current?.destroy();
      sessionRef.current = null;
      transportRef.current = null;
    };
  }, [isHost, params.code]);

  const view = useSyncExternalStore(
    session ? session.subscribe : NOOP_SUBSCRIBE,
    session ? session.getView : () => EMPTY_VIEW,
  );

  const start = useCallback(async () => {
    const s = sessionRef.current;
    const tr = transportRef.current;
    if (!s || !tr || players.length < 2) return;
    const seed = randomSeed();
    const qids = pickQuestions(questionPool(lang, category, allowedCategories(premium)), count, seed);
    const info: PlayerInfo[] = players.slice(0, MAX_ROOM_PLAYERS).map((p) => ({ id: p.id, name: p.name }));
    await tr.updateMeta({ started: true }).catch(() => {});
    s.start({ matchId: randomId(), players: info, qids, seed });
  }, [players, lang, category, count, premium]);

  const invite = () =>
    Share.share({ message: t('room.inviteText', { code, url: INVITE_URL }) }).catch(() => {});

  // ── Maç ───────────────────────────────────────────────────────────────────
  if (session && view.state) {
    return (
      <>
        <Stack.Screen options={{ gestureEnabled: false }} />
        <MatchPlay session={session} selfId={selfId} onMenu={() => router.replace('/')} onLeave={() => router.back()} />
      </>
    );
  }

  // ── Lobi ──────────────────────────────────────────────────────────────────
  const label = { color: theme.textMuted, fontSize: 14, fontWeight: '600' as const, marginBottom: spacing.sm };
  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: spacing.md, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl, gap: spacing.lg }}>
      <Stack.Screen options={{ gestureEnabled: true }} />
      <ScreenHeader title={t('room.title')} />
      {error ? (
        <Text style={{ color: theme.danger, fontSize: 18, textAlign: 'center' }}>{error}</Text>
      ) : !session ? (
        <Text style={{ color: theme.textMuted, fontSize: 18, textAlign: 'center' }}>{t('room.connecting')}</Text>
      ) : (
        <>
          <View style={{ alignItems: 'center', gap: spacing.xs }}>
            <Text style={{ color: theme.textMuted, fontSize: 14 }}>{t('room.codeLabel')}</Text>
            <Text selectable style={{ color: theme.accent, fontSize: 48, fontWeight: '800', letterSpacing: 8 }}>{code}</Text>
            {isHost && <Button label={t('room.invite')} variant="neutral" height={48} fontSize={16} onPress={invite} />}
          </View>

          <View>
            <Text style={label}>{t('room.players', { n: players.length, max: MAX_ROOM_PLAYERS })}</Text>
            <View style={{ gap: spacing.sm }}>
              {players.map((p) => (
                <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.surface, borderRadius: radius.md, borderWidth: 1, borderColor: p.id === selfId ? theme.accent : theme.border, padding: spacing.md }}>
                  <Text style={{ color: theme.text, fontSize: 18 }}>{p.name}</Text>
                  {p.host && <Text style={{ color: theme.accent, fontSize: 14, fontWeight: '700' }}>{t('room.host')}</Text>}
                </View>
              ))}
            </View>
          </View>

          {isHost ? (
            <>
              <View>
                <Text style={label}>{t('duel.category')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {CHOICES.map((c) => (
                    <Chip
                      key={c}
                      label={t(`category.${c}`)}
                      locked={categoryLocked(c, premium)}
                      selected={category === c}
                      onPress={() => (categoryLocked(c, premium) ? router.push('/premium') : setCategory(c))}
                    />
                  ))}
                </View>
              </View>
              <Stepper
                label={t('room.questionCount')}
                valueText={String(Math.min(count, maxCount))}
                decDisabled={count <= 5}
                incDisabled={count >= maxCount}
                onDec={() => setCount((c) => Math.max(5, c - 1))}
                onInc={() => setCount((c) => Math.min(maxCount, c + 1))}
              />
              {players.length < 2 && <Text style={{ color: theme.textMuted, fontSize: 14 }}>{t('room.needTwo')}</Text>}
              <Button label={t('room.startBtn')} height={64} disabled={players.length < 2 || pool < 5} onPress={start} />
            </>
          ) : (
            <Text style={{ color: theme.accent, fontSize: 16, textAlign: 'center' }}>{t('room.waitingHost')}</Text>
          )}
        </>
      )}
    </ScrollView>
  );
}

const NOOP_SUBSCRIBE = () => () => {};
const EMPTY_VIEW = { state: null, startedAt: 0, emojis: {}, version: 0 } as const;
