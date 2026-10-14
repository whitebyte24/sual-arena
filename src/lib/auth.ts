import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { parseAuthCallback } from './authUrl';
import { supabase } from './supabase';

export type AuthProvider = 'apple' | 'google';

export interface AccountInfo {
  /** Supabase yapılandırılmış ve oturum var mı */
  online: boolean;
  /** Misafir (anonim) mi */
  guest: boolean;
  providers: AuthProvider[];
  email?: string;
}

export async function getAccountInfo(): Promise<AccountInfo> {
  if (!supabase) return { online: false, guest: true, providers: [] };
  try {
    const { data } = await supabase.auth.getUser();
    const u = data.user;
    if (!u) return { online: true, guest: true, providers: [] };
    const providers = (u.identities ?? []).map((i) => i.provider).filter((p): p is AuthProvider => p === 'apple' || p === 'google');
    return { online: true, guest: !!u.is_anonymous && providers.length === 0, providers, email: u.email ?? undefined };
  } catch {
    return { online: false, guest: true, providers: [] };
  }
}

export const appleAvailable = (): Promise<boolean> => (Platform.OS === 'ios' ? AppleAuthentication.isAvailableAsync() : Promise.resolve(false));

const randomNonce = () => Array.from(Crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');

export type AuthResult = 'ok' | 'cancelled' | 'unavailable' | 'error';

/** iOS: yerel Apple sayfası → Supabase signInWithIdToken (Apple servis anahtarı/secret gerekmez). */
export async function signInWithApple(): Promise<AuthResult> {
  if (!supabase || !(await appleAvailable())) return 'unavailable';
  try {
    const raw = randomNonce();
    const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
    const cred = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce: hashed,
    });
    if (!cred.identityToken) return 'error';
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: cred.identityToken, nonce: raw });
    if (error) return 'error';
    // Hesap silinirken Apple belirtecini iptal edebilmek için yetkilendirme kodunu sunucuya bırak (başarısızlık girişi bozmaz).
    if (cred.authorizationCode) supabase.functions.invoke('apple-link', { body: { code: cred.authorizationCode } }).catch(() => {});
    return 'ok';
  } catch (e) {
    return (e as { code?: string }).code === 'ERR_REQUEST_CANCELED' ? 'cancelled' : 'error';
  }
}

/**
 * Google: Supabase OAuth, tarayıcı oturumuyla (Expo Go dahil, yerel Google kurulumu yok).
 * Misafir hesap varsa `linkIdentity` ile aynı kullanıcıya bağlanır (Dashboard: "Manual linking" açık olmalı).
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  if (!supabase) return 'unavailable';
  try {
    const redirectTo = Linking.createURL('auth-callback');
    const { data: u } = await supabase.auth.getUser();
    const options = { redirectTo, skipBrowserRedirect: true };
    const { data, error } = u.user?.is_anonymous
      ? await supabase.auth.linkIdentity({ provider: 'google', options })
      : await supabase.auth.signInWithOAuth({ provider: 'google', options });
    if (error || !data.url) return 'error';

    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (res.type !== 'success') return 'cancelled';
    const cb = parseAuthCallback(res.url);
    if (!cb || cb.type === 'error') return 'error';
    const r =
      cb.type === 'tokens'
        ? await supabase.auth.setSession({ access_token: cb.accessToken, refresh_token: cb.refreshToken })
        : await supabase.auth.exchangeCodeForSession(cb.code);
    return r.error ? 'error' : 'ok';
  } catch {
    return 'error';
  }
}

export async function signOut(): Promise<void> {
  try {
    await supabase?.auth.signOut();
  } catch {
    // yoksay
  }
}

/**
 * Hesabı kalıcı siler (App Store 5.1.1(v)): sunucuda `delete_my_account()` → oturumu kapat → cihazdaki tüm yerel veriyi temizle.
 * Sunucu başarısızsa HATA fırlatır ve yerel veriye dokunmaz (kullanıcı yanıltılmasın).
 * Silme önce Edge Function `delete-account` ile denenir (Apple belirtecini iptal eder, sonra kullanıcıyı siler); fonksiyon
 * dağıtılmamışsa (404) eski RPC `delete_my_account()` kullanılır. Fonksiyon VAR ama başarısızsa hata fırlatılır
 * (Apple bağlantısı açıkta kalmasın). Mağaza abonelikleri mağazada ayrıca iptal edilmelidir.
 */
export async function deleteAccount(): Promise<void> {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const { error: fnError } = await supabase.functions.invoke('delete-account');
      if (fnError) {
        const status = (fnError as { context?: { status?: number } }).context?.status;
        if (status !== 404) throw fnError; // fonksiyon var ama başarısız → silme iptal
        const { error } = await supabase.rpc('delete_my_account'); // fonksiyon dağıtılmamış → RPC
        if (error) throw error;
      }
    }
    await signOut();
  }
  await wipeLocalData();
}

export async function wipeLocalData(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch {
    // yoksay
  }
}
