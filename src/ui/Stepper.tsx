import { Pressable, View } from 'react-native';
import { radius, spacing, useTheme } from '@/lib/theme';
import { Icon } from './Icon';
import { TABULAR, Text } from './Text';

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
  const btn = (name: 'minus' | 'plus', onPress: () => void, disabled?: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name === 'minus' ? '−' : '+'}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 48,
        height: 48,
        borderRadius: radius.md,
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: theme.border,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.35 : pressed ? 0.8 : 1,
      })}>
      <Icon name={name} size={24} color={theme.text} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
      <Text style={{ color: theme.text, fontSize: 16, flex: 1 }}>{label}</Text>
      {btn('minus', onDec, decDisabled)}
      <Text style={[{ color: theme.accent, fontSize: 18, fontWeight: '700', minWidth: 72, textAlign: 'center' }, TABULAR]}>{valueText}</Text>
      {btn('plus', onInc, incDisabled)}
    </View>
  );
}
