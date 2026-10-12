/**
 * İftar (akşam/gün batımı) vakti — saf TS, çevrimdışı, konum izni YOK (kullanıcı şehir seçer).
 * Yöntem: NOAA/Spencer yaklaşımı (denklem-i zaman + güneş sapması + saat açısı), güneş merkezi ufuk altında 0°50′ (90.833°).
 * Doğruluk ~±1–2 dk (yüksek enlemlerde daha az). Resmî imsakiye yerine GEÇMEZ; arayüzde "yaklaşık" denir.
 */

const RAD = Math.PI / 180;
/** Güvenlik payı: set, hesaplanan gün batımından birkaç dakika SONRA açılır (iftar vaktinden önce açılmasın). */
export const IFTAR_SAFETY_MINUTES = 5;

function dayOfYear(y: number, m: number, d: number): number {
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86_400_000) + 1;
}

/** Gün batımı anı (UTC epoch ms). Kutup gecesi/gündüzünde null. `m` 1–12. */
export function sunsetUtcMs(y: number, m: number, d: number, lat: number, lon: number): number | null {
  const n = dayOfYear(y, m, d);
  const gamma = ((2 * Math.PI) / 365) * (n - 1);
  const eqTime =
    229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  const cosHa = Math.cos(90.833 * RAD) / (Math.cos(lat * RAD) * Math.cos(decl)) - Math.tan(lat * RAD) * Math.tan(decl);
  if (cosHa < -1 || cosHa > 1) return null;
  const haDeg = Math.acos(cosHa) / RAD;
  const minutesUtc = 720 - 4 * (lon - haDeg) - eqTime;
  return Date.UTC(y, m - 1, d) + Math.round(minutesUtc * 60_000);
}

/** Verilen takvim günü (YYYY-MM-DD) için şehrin "iftar sonrası açılış" anı (UTC epoch ms) = gün batımı + güvenlik payı. */
export function iftarOpenMs(dateKey: string, lat: number, lon: number, safetyMin = IFTAR_SAFETY_MINUTES): number | null {
  const [y, m, d] = dateKey.split('-').map(Number);
  const s = sunsetUtcMs(y, m, d, lat, lon);
  return s === null ? null : s + safetyMin * 60_000;
}

/** Yerel saat metni ("17:52") — `utcOffsetMinutes` verilmezse cihazın saat dilimi. */
export function formatClock(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
