import { Pressable, Text } from 'react-native';
import { radius, spacing, useTheme } from '@/lib/theme';

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minHeight: 48,
        paddingHorizontal: spacing.md,
        justifyContent: 'center',
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: selected ? theme.primary : theme.border,
        backgroundColor: selected ? theme.primary : theme.surface,
      }}>
      <Text style={{ color: selected ? '#FFFFFF' : theme.text, fontSize: 16, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}
