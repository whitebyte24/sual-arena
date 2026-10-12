import { useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, TextInput, View } from 'react-native';
import { Text } from '@/ui/Text';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { restorePurchases, usePremium } from '@/features/premium/entitlement';
import { t } from '@/i18n';
import {
  appleAvailable,
  deleteAccount,
  getAccountInfo,
  signInWithApple,
  signInWithGoogle,
  signOut,
  wipeLocalData,
  type AccountInfo,
  type AuthResult,
} from '@/lib/auth';
import { PRIVACY_URL, TERMS_URL } from '@/lib/config';
import { MAX_NAME, getPlayerName, setPlayerName } from '@/lib/identity';
import { radius, spacing, useTheme } from '@/lib/theme';
import { Button } from '@/ui/Button';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { confirm } from '@/ui/confirm';

export default function Account() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const premium = usePremium();
  const [info, setInfo] = useState<AccountInfo | null>(null);
  const [apple, setApple] = useState(false);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => setInfo(await getAccountInfo()), []);
  useEffect(() => {
    getAccountInfo().then(setInfo);
    appleAvailable().then(setApple);
    getPlayerName().then(setName);
  }, []);

  const run = async (fn: () => Promise<AuthResult>) => {
    setBusy(true);
    setMsg(null);
    const r = await fn();
    if (r === 'error' || r === 'unavailable') setMsg({ text: t('account.authFailed'), ok: false });
    await refresh();
    setBusy(false);
  };

  const saveName = async () => {
    await setPlayerName(name);
    setMsg({ text: t('account.saved'), ok: true });
  };

  const remove = async () => {
    const hasAccount = !!info?.online;
    const ok = await confirm(t('account.deleteTitle'), t('account.deleteBody'), t('account.deleteConfirm'), t('common.cancel'));
    if (!ok) return;
    setBusy(true);
    try {
      if (hasAccount) await deleteAccount();
      else await wipeLocalData();
      router.replace('/');
    } catch {
      setMsg({ text: t('account.deleteFailed'), ok: false });
      setBusy(false);
    }
  };

  const card = { backgroundColor: theme.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: theme.border, padding: spacing.md, gap: spacing.sm } as const;
  const head = { color: theme.textMuted, fontSize: 14, fontWeight: '600' as const };
  const link = (url: string) => Linking.openURL(url).catch(() => {});

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: spacing.md, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}>
      <ScreenHeader title={t('account.title')} />

      <View style={card}>
        <Text style={head}>{t('account.name')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          maxLength={MAX_NAME}
          style={{ minHeight: 52, borderRadius: radius.md, borderWidth: 1, borderColor: theme.border, color: theme.text, fontSize: 18, paddingHorizontal: spacing.md }}
        />
        <Button label={t('account.save')} variant="neutral" height={48} fontSize={16} onPress={saveName} />
      </View>

      <View style={card}>
        {!info ? null : !info.online ? (
          <Text style={{ color: theme.textMuted }}>{t('account.offline')}</Text>
        ) : info.guest ? (
          <>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>{t('account.guestTitle')}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 14 }}>{t('account.guestBody')}</Text>
            {apple && <Button label={t('account.signInApple')} icon="apple" height={52} disabled={busy} onPress={() => run(signInWithApple)} />}
            <Button label={t('account.signInGoogle')} icon="google" variant="neutral" height={52} disabled={busy} onPress={() => run(signInWithGoogle)} />
          </>
        ) : (
          <>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>{t('account.signedIn')}</Text>
            {!!info.email && <Text style={{ color: theme.textMuted }}>{info.email}</Text>}
            <Text style={{ color: theme.textMuted, fontSize: 14 }}>{info.providers.join(', ')}</Text>
            <Button label={t('account.signOut')} variant="neutral" height={48} fontSize={16} disabled={busy} onPress={async () => { await signOut(); await refresh(); }} />
          </>
        )}
      </View>

      <View style={card}>
        <Text style={head}>{t('account.premiumSection')}</Text>
        <Text style={{ color: premium ? theme.primary : theme.textMuted, fontSize: 16, fontWeight: '700' }}>
          {premium ? t('premium.active') : t('premium.headline')}
        </Text>
        <Button label={premium ? t('premium.manage') : t('premium.upgrade')} variant={premium ? 'neutral' : 'gold'} icon="star-circle-outline" height={48} fontSize={16} onPress={() => router.push('/premium')} />
        <Button label={t('premium.restore')} variant="neutral" height={48} fontSize={16} disabled={busy} onPress={() => restorePurchases().catch(() => {})} />
      </View>

      <View style={card}>
        <Text style={head}>{t('account.legal')}</Text>
        <Text accessibilityRole="link" onPress={() => link(PRIVACY_URL)} style={{ color: theme.accent, fontSize: 16, paddingVertical: 6 }}>{t('premium.privacy')}</Text>
        <Text accessibilityRole="link" onPress={() => link(TERMS_URL)} style={{ color: theme.accent, fontSize: 16, paddingVertical: 6 }}>{t('premium.terms')}</Text>
      </View>

      {msg && <Text style={{ color: msg.ok ? theme.primary : theme.danger, textAlign: 'center' }}>{msg.text}</Text>}

      <Button label={info?.online ? t('account.delete') : t('account.deleteLocal')} variant="danger" height={52} disabled={busy} onPress={remove} />
      <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center' }}>
        {t('account.version', { v: Constants.expoConfig?.version ?? '1.0.0' })}
      </Text>
    </ScrollView>
  );
}
