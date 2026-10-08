import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';
import { radius, spacing, useTheme } from '@/lib/theme';

type Variant = 'primary' | 'danger' | 'neutral' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  /** Dokunma yüksekliği (dp). Varsayılan 56; Söyleme! oyun düğmeleri ≥ 88. */
  height?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fontSize?: number;
}

export function Button({ label, onPress, variant = 'primary', height = 56, disabled, style, fontSize = 18 }: Props) {
  const theme = useTheme();
  const bg =
    variant === 'primary' ? theme.primary : variant === 'danger' ? theme.danger : variant === 'neutral' ? theme.surface : 'transparent';
  const fg = variant === 'neutral' || variant === 'ghost' ? theme.text : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: height,
          backgroundColor: bg,
          borderRadius: radius.md,
          borderWidth: variant === 'neutral' || variant === 'ghost' ? 1 : 0,
          borderColor: theme.border,
          paddingHorizontal: spacing.md,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        },
        style,
      ]}>
      <Text style={{ color: fg, fontSize, fontWeight: '700', textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}
