import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { glow as glowStyle, radius, useTheme } from '@/lib/theme';
import { StarWatermark } from './ornaments';

interface Props {
  children: ReactNode;
  /** 'gold' | 'emerald': fener parıltısı */
  glow?: 'gold' | 'emerald';
  /** Köşede silik yıldız filigranı */
  watermark?: boolean;
  /** Kenarlık rengi: varsayılan ince mavi, 'gold' premium/aktif vurgu */
  outline?: 'default' | 'gold';
  tone?: 'surface' | 'raised';
  padding?: number;
  style?: StyleProp<ViewStyle>;
}

/** Level 2 kart: 1 px kenarlık + isteğe bağlı fener parıltısı ve yıldız filigranı. */
export function Card({ children, glow, watermark, outline = 'default', tone = 'surface', padding = 16, style }: Props) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: tone === 'raised' ? theme.raised : theme.surface,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: outline === 'gold' ? theme.goldLine : theme.border,
          padding,
          overflow: 'hidden',
        },
        glow ? glowStyle(glow === 'gold' ? theme.glowGold : theme.glowEmerald, 28) : null,
        style,
      ]}>
      {watermark && (
        <View pointerEvents="none" style={{ position: 'absolute', top: -18, end: -18 }}>
          <StarWatermark size={120} />
        </View>
      )}
      {children}
    </View>
  );
}
