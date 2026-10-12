import { View } from 'react-native';
import { spacing, useTheme } from '@/lib/theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Tone = 'gold' | 'emerald' | 'neutral' | 'danger';

/** Küçük hap rozet: durum / sayaç / etiket (ör. Canlı, BOT, Kalan: 7). */
export function Badge({ label, tone = 'neutral', icon, dot }: { label: string; tone?: Tone; icon?: IconName; dot?: boolean }) {
  const theme = useTheme();
  const color = tone === 'gold' ? theme.accent : tone === 'emerald' ? theme.primary : tone === 'danger' ? theme.danger : theme.textMuted;
  const bg = tone === 'neutral' ? theme.raised : tone === 'danger' ? theme.wrongBg : tone === 'emerald' ? theme.correctBg : theme.raised;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: spacing.xs + 2,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 9999,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: tone === 'gold' ? theme.goldLine : 'transparent',
      }}>
      {dot && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />}
      {icon && <Icon name={icon} size={13} color={color} />}
      <Text style={{ color, fontSize: 11, fontWeight: '700', letterSpacing: 0.4 }}>{label}</Text>
    </View>
  );
}
