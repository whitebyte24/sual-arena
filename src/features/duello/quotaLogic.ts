/** Günlük düello kotası — saf TS. */

/** Ücretsiz plan: günde 10 düello (uzaktan `features.free_duels_per_day` ile değiştirilebilir). */
export const FREE_DUELS_PER_DAY = 10;

export interface Quota {
  day: string;
  used: number;
  /** Ödüllü reklamla kazanılan ek haklar (yalnızca o gün geçerli) */
  bonus: number;
}

const nat = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);

/** Gün değiştiyse sayaç ve bonus sıfırlanır. */
export function normalizeQuota(stored: Partial<Quota> | undefined, today: string): Quota {
  return stored?.day === today ? { day: today, used: nat(stored.used), bonus: nat(stored.bonus) } : { day: today, used: 0, bonus: 0 };
}

export const remainingDuels = (q: Quota, limit = FREE_DUELS_PER_DAY) => Math.max(0, limit + q.bonus - q.used);
export const addBonus = (q: Quota, n: number): Quota => ({ ...q, bonus: q.bonus + Math.max(0, Math.floor(n)) });
