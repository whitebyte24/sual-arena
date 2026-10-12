import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, TextInput, View } from 'react-native';
import { QUESTION_INDEX } from '@/content/questions';
import { t } from '@/i18n';
import { radius, spacing, useTheme } from '@/lib/theme';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { Text } from '@/ui/Text';
import { NOTE_MAX, REASONS, buildReport, type Reason } from './logic';
import { loadReported, submitReport, type SubmitResult } from './service';

/** Her soruda "Hatalı soru bildir": neden seç + isteğe bağlı not → `question_reports` (çevrimdışıysa kuyruğa). */
export function ReportButton({ questionId }: { questionId: string }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    let alive = true;
    loadReported().then((ids) => alive && ids.includes(questionId) && setResult('duplicate'));
    return () => {
      alive = false;
    };
  }, [questionId]);

  const lang = QUESTION_INDEX.get(questionId)?.lang;
  const done = result !== null;

  const send = async () => {
    if (!lang || !reason || busy) return;
    const report = buildReport({ questionId, lang, reason, note });
    if (!report) return;
    setBusy(true);
    setResult(await submitReport(report));
    setBusy(false);
  };

  const message = result === 'sent' ? t('report.sent') : result === 'queued' ? t('report.queued') : result === 'duplicate' ? t('report.already') : '';

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('report.button')}
        disabled={result === 'duplicate'}
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 6, opacity: result === 'duplicate' ? 0.6 : pressed ? 0.7 : 1 })}>
        <Icon name={done ? 'flag-checkered' : 'flag-outline'} size={16} color={theme.textMuted} />
        <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '600' }}>{done ? t('report.reported') : t('report.button')}</Text>
      </Pressable>

      <Modal transparent animationType="slide" visible={open} onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' }}>
          <View
            style={{
              backgroundColor: theme.raised,
              borderTopStartRadius: radius.xl,
              borderTopEndRadius: radius.xl,
              borderWidth: 1,
              borderColor: theme.border,
              padding: spacing.screen,
              gap: spacing.md,
            }}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700' }}>{t('report.title')}</Text>

            {message ? (
              <>
                <Text style={{ color: theme.primary, fontSize: 16, fontWeight: '600' }}>{message}</Text>
                <Button label={t('common.ok')} onPress={() => setOpen(false)} />
              </>
            ) : (
              <>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {REASONS.map((r) => (
                    <Chip key={r} label={t(`report.reasons.${r}`)} selected={reason === r} onPress={() => setReason(r)} />
                  ))}
                </View>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  maxLength={NOTE_MAX}
                  multiline
                  placeholder={t('report.notePlaceholder')}
                  placeholderTextColor={theme.textMuted}
                  accessibilityLabel={t('report.notePlaceholder')}
                  style={{
                    minHeight: 72,
                    textAlignVertical: 'top',
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                    color: theme.text,
                    fontSize: 15,
                    padding: spacing.md,
                  }}
                />
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Button label={t('common.cancel')} variant="neutral" style={{ flex: 1 }} onPress={() => setOpen(false)} />
                  <Button label={t('report.send')} style={{ flex: 1 }} disabled={!reason || busy} onPress={send} />
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
