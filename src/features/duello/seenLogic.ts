/** Görülen soru kimliklerini tutma — saf TS. En yeni en sonda; tekrarlar tek kayıt; sınır aşılırsa en eskiler atılır. */
export const SEEN_CAP = 3000;

export function mergeSeen(prev: readonly string[], ids: readonly string[], cap = SEEN_CAP): string[] {
  const fresh = new Set(ids);
  const merged = [...prev.filter((id) => !fresh.has(id)), ...fresh];
  return merged.length > cap ? merged.slice(merged.length - cap) : merged;
}
