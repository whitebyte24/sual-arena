// Apple "Sign in with Apple" REST yardımcıları (Deno / Supabase Edge Functions).
// Gerekli gizli değişkenler (supabase secrets set ...):
//   APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_CLIENT_ID (= iOS bundle id), APPLE_PRIVATE_KEY (.p8 içeriği; satırlar \n ile de verilebilir)
import { importPKCS8, SignJWT } from 'npm:jose@5.9.6';

const env = (k: string): string => {
  const v = Deno.env.get(k);
  if (!v) throw new Error(`eksik ortam değişkeni: ${k}`);
  return v;
};

export const appleConfigured = (): boolean =>
  ['APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_CLIENT_ID', 'APPLE_PRIVATE_KEY'].every((k) => !!Deno.env.get(k));

async function clientSecret(): Promise<string> {
  const key = await importPKCS8(env('APPLE_PRIVATE_KEY').replace(/\n/g, '\n'), 'ES256');
  return await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: env('APPLE_KEY_ID') })
    .setIssuer(env('APPLE_TEAM_ID'))
    .setSubject(env('APPLE_CLIENT_ID'))
    .setAudience('https://appleid.apple.com')
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(key);
}

const form = (o: Record<string, string>) => new URLSearchParams(o).toString();

/** Yerel girişten gelen tek kullanımlık yetkilendirme kodunu yenileme belirteciyle değiştirir. */
export async function exchangeCode(code: string): Promise<string> {
  const res = await fetch('https://appleid.apple.com/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form({ client_id: env('APPLE_CLIENT_ID'), client_secret: await clientSecret(), code, grant_type: 'authorization_code' }),
  });
  const json = (await res.json()) as { refresh_token?: string; error?: string };
  if (!res.ok || !json.refresh_token) throw new Error(`apple token: ${json.error ?? res.status}`);
  return json.refresh_token;
}

/** Belirteci iptal eder (kullanıcının uygulamayla Apple bağlantısı kalkar). */
export async function revokeToken(refreshToken: string): Promise<void> {
  const res = await fetch('https://appleid.apple.com/auth/revoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form({
      client_id: env('APPLE_CLIENT_ID'),
      client_secret: await clientSecret(),
      token: refreshToken,
      token_type_hint: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`apple revoke: ${res.status}`);
}
