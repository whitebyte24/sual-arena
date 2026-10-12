import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { glow, radius, spacing, useTheme } from '@/lib/theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Variant = 'primary' | 'gold' | 'danger' | 'neutral' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  /** Dokunma yüksekliği (dp). Varsayılan 54; Söyleme! oyun düğmeleri ≥ 88. */
  height?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fontSize?: number;
  /** Metin rengini geçersiz kıl (ör. doğru/yanlış şık). */
  textColor?: string;
  /** Soldaki simge */
  icon?: IconName;
  /** Sağdaki simge (ör. ok) */
  trailingIcon?: IconName;
}

export function Button({ label, onPress, variant = 'primary', height = 54, disabled, style, fontSize = 17, textColor, icon, trailingIcon }: Props) {
  const theme = useTheme();
  const bg =
    variant === 'primary' ? theme.primary : variant === 'gold' ? theme.accent : variant === 'danger' ? theme.danger : variant === 'neutral' ? theme.surface : 'transparent';
  const fg = textColor ?? (variant === 'neutral' || variant === 'ghost' ? theme.text : variant === 'gold' ? '#0B1B33' : theme.onPrimary);
  const outlined = variant === 'neutral' || variant === 'ghost';
  const shadow = variant === 'primary' && !disabled ? glow(theme.glowEmerald, 22) : variant === 'gold' && !disabled ? glow(theme.glowGold, 20) : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: height,
          backgroundColor: bg,
          borderRadius: radius.md,
          borderWidth: outlined ? 1 : 0,
          borderColor: variant === 'ghost' ? 'transparent' : theme.border,
          paddingHorizontal: spacing.md,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        shadow,
        style,
      ]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}>
        {icon && <Icon name={icon} size={fontSize + 5} color={fg} />}
        <Text style={{ color: fg, fontSize, fontWeight: '700', textAlign: 'center', flexShrink: 1 }}>{label}</Text>
        {trailingIcon && <Icon name={trailingIcon} size={fontSize + 3} color={fg} />}
      </View>
    </Pressable>
  );
}
