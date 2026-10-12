import { useId } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';
import { palette, useTheme } from '@/lib/theme';

/** Sekiz köşeli yıldız (Hâtem-i Süleyman) köşe noktaları. */
export function starPoints(cx: number, cy: number, outer: number, inner: number, n = 8): string {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / n - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

/** Çok silik yıldız filigranı (kart köşeleri için). */
export function StarWatermark({ size = 120, color = palette.gold, opacity = 0.045 }: { size?: number; color?: string; opacity?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity }}>
      <Polygon points={starPoints(50, 50, 48, 22)} fill="none" stroke={color} strokeWidth={2} />
      <Polygon points={starPoints(50, 50, 34, 15)} fill={color} />
    </Svg>
  );
}

/** Küçük altın yıldız (ayırıcı düğümü, ödül rozeti). */
export function Star({ size = 12, color = palette.gold }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Polygon points={starPoints(50, 50, 48, 24)} fill={color} />
    </Svg>
  );
}

/** Altın gradyan çizgi + ortada yıldız. */
export function Divider({ style }: { style?: object }) {
  const GOLD = 'rgba(224, 176, 74, 0.45)';
  const NONE = 'rgba(224, 176, 74, 0)';
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 8 }, style]}>
      <LinearGradient colors={[NONE, GOLD]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, height: 1 }} />
      <Star size={11} />
      <LinearGradient colors={[GOLD, NONE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, height: 1 }} />
    </View>
  );
}

/** Fener (maskot / logo): geometrik, yıldız desenli, sıcak ışık. Canlı varlık betimlemesi yok. */
export function Lantern({ size = 40, glow = true }: { size?: number; glow?: boolean }) {
  const theme = useTheme();
  // Web'de gradyan kimlikleri belge genelinde ortaktır; gizli (display:none) ekranlardaki kopya yüzünden kırılmasın diye benzersiz.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const halo = `halo${uid}`;
  const gold = `gold${uid}`;
  return (
    <Svg width={size * 0.72} height={size} viewBox="0 0 100 140">
      <Defs>
        <RadialGradient id={halo} cx="50%" cy="55%" r="50%">
          <Stop offset="0" stopColor={palette.gold} stopOpacity={0.45} />
          <Stop offset="1" stopColor={palette.gold} stopOpacity={0} />
        </RadialGradient>
        <SvgLinearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F3CF7A" />
          <Stop offset="1" stopColor="#C8932F" />
        </SvgLinearGradient>
      </Defs>
      {glow && <Circle cx={50} cy={78} r={52} fill={`url(#${halo})`} />}
      <Path d="M36 24 C36 2 64 2 64 24" stroke={`url(#${gold})`} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Polygon points="28,40 36,24 64,24 72,40" fill={`url(#${gold})`} />
      <Polygon points="30,40 70,40 84,74 72,114 28,114 16,74" fill={theme.dark ? '#0F2547' : '#1C355F'} stroke={`url(#${gold})`} strokeWidth={4} strokeLinejoin="round" />
      <Polygon points="40,50 60,50 70,74 62,100 38,100 30,74" fill={palette.gold} opacity={0.18} />
      <Polygon points={starPoints(50, 76, 20, 9)} fill={palette.emerald} stroke={`url(#${gold})`} strokeWidth={2.5} strokeLinejoin="round" />
      <Rect x={30} y={114} width={40} height={9} rx={3} fill={`url(#${gold})`} />
      <Circle cx={50} cy={130} r={4} fill={`url(#${gold})`} />
    </Svg>
  );
}
