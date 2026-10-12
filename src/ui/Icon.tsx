import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { layoutIsRTL } from '@/i18n';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Yönü olan simgeler: sağdan sola düzende aynalanır (ok, ileri, çıkış). Diğerleri (✓, ✕, kupa…) aynalanmaz. */
const DIRECTIONAL = new Set<string>([
  'arrow-left',
  'arrow-right',
  'chevron-left',
  'chevron-right',
  'skip-next-circle',
  'skip-next-circle-outline',
  'play',
  'logout',
]);

/** İnce, yuvarlak hatlı simge seti (tek yerden değiştirilebilsin diye sarmalandı). */
export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color: string }) {
  const flip = DIRECTIONAL.has(name as string) && layoutIsRTL();
  return <MaterialCommunityIcons name={name} size={size} color={color} style={flip ? { transform: [{ scaleX: -1 }] } : undefined} />;
}
