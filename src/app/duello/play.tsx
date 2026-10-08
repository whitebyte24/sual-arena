import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { QUESTION_INDEX, questionPool, type CategoryChoice } from '@/content/questions';
import type { ContentLang } from '@/content/schema';
import { BOT_PLAYER } from '@/features/duello/bot';
import { makeResolver, pickQuestions } from '@/features/duello/match';
import { MatchPlay } from '@/features/duello/MatchPlay';
import { searchOpponent } from '@/features/duello/matchmaking';
import { consumeDuel } from '@/features/duello/quota';
import { MatchSession, nullTransport } from '@/features/duello/session';
import { t } from '@/i18n';
import { getIdentity } from '@/lib/identity';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { Button } from '@/ui/Button';

const QUESTIONS_PER_DUEL = 5;
const randomSeed = () => (Math.random() * 0x7fffffff) | 0;
const randomId = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e8).toString(36)}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Phase = { kind: 'search' } | { kind: 'notice'; text: string } | { kind: 'match' };

export default function DuelPlay() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ category?: string; lang?: string }>();
  const category = (params.category ?? 'all') as CategoryChoice;
  const lang = (params.lang ?? 'tr') as ContentLang;

  const [phase, setPhase] = useState<Phase>({ kind: 'search' });
  const [session, setSession] = useState<MatchSession | null>(null);
  const [selfId, setSelfId] = useState('');
  const [attempt, setAttempt] = useState(0);
  const sessionRef = useRef<MatchSession | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      const me = await getIdentity();
      const res = await searchOpponent({ client: me.online ? supabase : null, self: me, lang, category, signal: ac.signal });
      if (!res) return;
      if (ac.signal.aborted) {
        if (res.kind === 'human') res.transport.close();
        return;
      }

      if (res.kind === 'bot') {
        setPhase({ kind: 'notice', text: res.reason === 'offline' ? t('duel.offlineNote') : t('duel.botNote') });
        await sleep(1600);
        if (ac.signal.aborted) return;
      } else {
        setPhase({ kind: 'notice', text: t('duel.found', { name: res.opponent.name }) });
        await sleep(900);
        if (ac.signal.aborted) return res.transport.close();
      }

      await consumeDuel();
      const resolverFor = (seed: number) => makeResolver(QUESTION_INDEX, seed);
      const s =
        res.kind === 'bot'
          ? new MatchSession({ transport: nullTransport, selfId: me.id, withBot: true, resolverFor })
          : new MatchSession({ transport: res.transport, selfId: me.id, resolverFor });
      sessionRef.current = s;

      if (res.kind === 'bot' || res.host) {
        const seed = randomSeed();
        const qids = pickQuestions(questionPool(lang, category), QUESTIONS_PER_DUEL, seed);
        const opponent = res.kind === 'bot' ? BOT_PLAYER : res.opponent;
        s.start({ matchId: randomId(), players: [{ id: me.id, name: me.name }, opponent], qids, seed });
      } else {
        s.hello();
      }
      setSelfId(me.id);
      setSession(s);
      setPhase({ kind: 'match' });
    })();
    return () => {
      ac.abort();
      sessionRef.current?.destroy();
      sessionRef.current = null;
    };
  }, [attempt, category, lang]);

  const again = useCallback(() => {
    sessionRef.current?.destroy();
    sessionRef.current = null;
    setSession(null);
    setPhase({ kind: 'search' });
    setAttempt((a) => a + 1);
  }, []);

  const leave = () => router.back();

  if (phase.kind === 'match' && session) {
    return (
      <>
        <Stack.Screen options={{ gestureEnabled: false }} />
        <MatchPlay session={session} selfId={selfId} onAgain={again} onMenu={() => router.replace('/')} onLeave={leave} />
      </>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 24 }}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <Text style={{ color: theme.text, fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
        {phase.kind === 'notice' ? phase.text : t('duel.searching')}
      </Text>
      {phase.kind === 'search' && <Button label={t('duel.cancel')} variant="neutral" onPress={leave} style={{ alignSelf: 'stretch' }} />}
    </View>
  );
}
