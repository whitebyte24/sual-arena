import { useEffect, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { Text } from '@/ui/Text';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isRoomCode } from '@/features/duello/pairing';
import { t } from '@/i18n';
import { MAX_NAME, getPlayerName, setPlayerName } from '@/lib/identity';
import { radius, spacing, useTheme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { Button } from '@/ui/Button';
import { ScreenHeader } from '@/ui/ScreenHeader';

export default function RoomEntry() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { code: linkCode } = useLocalSearchParams<{ code?: string }>();
  const [name, setName] = useState('');
  const [code, setCode] = useState(linkCode ?? '');
  const [error, setError] = useState('');

  useEffect(() => {
    getPlayerName().then(setName);
  }, []);

  const online = !!supabase;
  const input = { minHeight: 52, borderRadius: radius.md, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, color: theme.text, fontSize: 18, paddingHorizontal: spacing.md } as const;
  const label = { color: theme.textMuted, fontSize: 14, fontWeight: '600' as const, marginBottom: spacing.sm };

  const create = async () => {
    await setPlayerName(name);
    router.push({ pathname: '/oda/lobby', params: { mode: 'host' } });
  };
  const join = async () => {
    if (!isRoomCode(code)) return setError(t('room.invalidCode'));
    setError('');
    await setPlayerName(name);
    router.push({ pathname: '/oda/lobby', params: { mode: 'join', code } });
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: spacing.md, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl, gap: spacing.lg }}>
      <ScreenHeader title={t('room.title')} />
      <Text style={{ color: theme.textMuted, fontSize: 15, lineHeight: 22 }}>{t('room.subtitle')}</Text>
      {!online && <Text style={{ color: theme.danger, fontSize: 15 }}>{t('room.needOnline')}</Text>}
      <View>
        <Text style={label}>{t('online.yourName')}</Text>
        <TextInput value={name} onChangeText={setName} maxLength={MAX_NAME} style={input} />
      </View>
      <Button label={t('room.create')} height={64} disabled={!online} onPress={create} />
      <View style={{ gap: spacing.sm }}>
        <Text style={label}>{t('room.codeLabel')}</Text>
        <TextInput
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
          placeholder={t('room.codePlaceholder')}
          placeholderTextColor={theme.textMuted}
          keyboardType="number-pad"
          maxLength={6}
          style={{ ...input, fontSize: 28, letterSpacing: 6, textAlign: 'center' }}
        />
        {!!error && <Text style={{ color: theme.danger, fontSize: 14 }}>{error}</Text>}
        <Button label={t('room.joinBtn')} variant="neutral" height={56} disabled={!online} onPress={join} />
      </View>
    </ScrollView>
  );
}
