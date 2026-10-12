import { View } from 'react-native';
import { useTheme } from '@/lib/theme';
import { Icon } from './Icon';
import { Text } from './Text';

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = Array.from(parts[0])[0] ?? '?';
  const second = parts.length > 1 ? (Array.from(parts[parts.length - 1])[0] ?? '') : (Array.from(parts[0])[1] ?? '');
  return (first + second).toLocaleUpperCase('tr');
}

/** Aniconic avatar: harf mührü (monogram) altın çerçevede. Bot için altıgen simgesi. Yüz/figür YOK. */
export function Avatar({ name, size = 44, bot, highlight }: { name: string; size?: number; bot?: boolean; highlight?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.raised,
        borderWidth: 1.5,
        borderColor: highlight ? theme.accent : theme.goldLine,
      }}>
      {bot ? (
        <Icon name="hexagon-multiple-outline" size={size * 0.5} color={theme.textMuted} />
      ) : (
        <Text style={{ color: theme.accent, fontWeight: '800', fontSize: size * 0.38 }}>{initials(name)}</Text>
      )}
    </View>
  );
}
