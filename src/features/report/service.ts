import AsyncStorage from '@react-native-async-storage/async-storage';
import { getIdentity } from '@/lib/identity';
import { supabase } from '@/lib/supabase';
import { enqueue, sanitizeQueue, type Report } from './logic';

const QUEUE_KEY = 'reports.queue.v1';
const DONE_KEY = 'reports.done.v1';

export type SubmitResult = 'sent' | 'queued' | 'duplicate';

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
const writeJson = (key: string, v: unknown) => AsyncStorage.setItem(key, JSON.stringify(v)).catch(() => {});

export async function loadReported(): Promise<string[]> {
  const v = await readJson<unknown>(DONE_KEY, []);
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}
async function markReported(id: string) {
  const done = await loadReported();
  if (!done.includes(id)) await writeJson(DONE_KEY, [...done, id].slice(-1000));
}

/** Tek bildirimi sunucuya yazar. true = işlendi (gönderildi ya da zaten vardı), false = tekrar denenmeli. */
async function send(r: Report): Promise<boolean> {
  if (!supabase) return false;
  try {
    await getIdentity(); // misafir (anonim) oturumu garanti et
    const { error } = await supabase.from('question_reports').insert(r);
    if (!error) return true;
    return error.code === '23505'; // (kullanıcı, soru) çifti zaten bildirilmiş
  } catch {
    return false;
  }
}

/** Bildirimi gönderir; çevrimdışı/başarısızsa kuyruğa alır (sonra `flushReports` ile). */
export async function submitReport(r: Report): Promise<SubmitResult> {
  if ((await loadReported()).includes(r.question_id)) return 'duplicate';
  if (await send(r)) {
    await markReported(r.question_id);
    return 'sent';
  }
  await writeJson(QUEUE_KEY, enqueue(sanitizeQueue(await readJson<unknown>(QUEUE_KEY, [])), r));
  await markReported(r.question_id); // kullanıcıya tekrar sorma; kuyrukta bekliyor
  return 'queued';
}

/** Uygulama açılışında/çevrimiçi olunca: bekleyen bildirimleri gönderir. */
export async function flushReports(): Promise<void> {
  if (!supabase) return;
  const queue = sanitizeQueue(await readJson<unknown>(QUEUE_KEY, []));
  if (!queue.length) return;
  const remaining: Report[] = [];
  for (const r of queue) if (!(await send(r))) remaining.push(r);
  await writeJson(QUEUE_KEY, remaining);
}
