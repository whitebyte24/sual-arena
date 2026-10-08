import { Pressable, Text, View } from 'react-native';
import { radius, spacing, useTheme } from '@/lib/theme';

interface Props {
  label: string;
  /** Ekranda gösterilen değer (ör. "60 sn"). */
  valueText: string;
  onDec: () => void;
  onInc: () => void;
  decDisabled?: boolean;
  incDisabled?: boolean;
}

export function Stepper({ label, valueText, onDec, onInc, decDisabled, incDisabled }: Props) {
  const theme = useTheme();
  const btn = (sign: string, onPress: () => void, disabled?: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={sign === '−' ? '−' : '+'}
      disabled={disabled}
      onPress={onPress}
      style={{
        width: 48,
        height: 48,
        borderRadius: radius.md,
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: theme.border,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.35 : 1,
      }}>
      <Text style={{ color: theme.text, fontSize: 24, fontWeight: '700' }}>{sign}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
      <Text style={{ color: theme.text, fontSize: 16, flex: 1 }}>{label}</Text>
      {btn('−', onDec, decDisabled)}
      <Text style={{ color: theme.accent, fontSize: 18, fontWeight: '700', minWidth: 72, textAlign: 'center' }}>{valueText}</Text>
      {btn('+', onInc, incDisabled)}
    </View>
  );
}
