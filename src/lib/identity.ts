import AsyncStorage from '@react-native-async-storage/async-storage';
import { t } from '@/i18n';
import { supabase } from '@/lib/supabase';

const NAME_KEY = 'profile.name.v1';
const LOCAL_ID_KEY = 'profile.localId.v1';
export const MAX_NAME = 16;

export interface Identity {
  id: string;
  name: string;
  /** Supabase oturumu var mı (çevrimiçi eşleşme/oda mümkün mü) */
  online: boolean;
}

const rand = (n: number) => Math.floor(Math.random() * n);

async function read(key: string): Promise<string | undefined> {
  try {
    return (await AsyncStorage.getItem(key)) ?? undefined;
  } catch {
    return undefined;
  }
}
async function write(key: string, value: string) {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // yoksay
  }
}

export async function getPlayerName(): Promise<string> {
  const saved = await read(NAME_KEY);
  if (saved?.trim()) return saved;
  const name = t('online.defaultName', { n: 1000 + rand(9000) });
  await write(NAME_KEY, name);
  return name;
}

export async function setPlayerName(name: string) {
  const clean = name.trim().slice(0, MAX_NAME);
  if (clean) await write(NAME_KEY, clean);
}

/** Supabase anonim oturumu (misafir). Yapılandırma yoksa/başarısızsa yerel kimlik döner (yalnızca botlu oyun). */
export async function getIdentity(): Promise<Identity> {
  const name = await getPlayerName();
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      let user = data.session?.user;
      if (!user) user = (await supabase.auth.signInAnonymously()).data.user ?? undefined;
      if (user) return { id: user.id, name, online: true };
    } catch {
      // çevrimdışı: yerel kimliğe düş
    }
  }
  let id = await read(LOCAL_ID_KEY);
  if (!id) {
    id = `local-${Date.now().toString(36)}${rand(1e6).toString(36)}`;
    await write(LOCAL_ID_KEY, id);
  }
  return { id, name, online: false };
}
