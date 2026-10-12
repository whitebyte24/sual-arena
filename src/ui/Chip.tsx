import { Pressable, View } from 'react-native';
import { radius, spacing, useTheme } from '@/lib/theme';
import { Icon } from './Icon';
import { Text } from './Text';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Premium'a özel: kilit simgesi, soluk görünüm (yine de dokunulabilir → paywall) */
  locked?: boolean;
}

/** Hap biçimli seçenek: seçili = zümrüt + onay, kilitli = soluk + kilit. */
export function Chip({ label, selected, onPress, locked }: Props) {
  const theme = useTheme();
  const fg = selected ? theme.onPrimary : locked ? theme.textMuted : theme.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={locked ? `${label} 🔒` : label}
      accessibilityState={{ selected, disabled: false }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: spacing.md,
        justifyContent: 'center',
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: selected ? theme.primary : theme.border,
        backgroundColor: selected ? theme.primary : theme.surface,
        opacity: locked ? 0.7 : pressed ? 0.85 : 1,
      })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {selected && <Icon name="check-circle-outline" size={18} color={fg} />}
        {locked && <Icon name="lock-outline" size={16} color={fg} />}
        <Text style={{ color: fg, fontSize: 15, fontWeight: '600' }}>{label}</Text>
      </View>
    </Pressable>
  );
}
