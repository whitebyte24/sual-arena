/** OAuth dönüş bağlantısını (sualarena://auth-callback#access_token=… veya ?code=…) ayrıştırır. Saf TS. */

export type AuthCallback =
  | { type: 'tokens'; accessToken: string; refreshToken: string }
  | { type: 'code'; code: string }
  | { type: 'error'; message: string };

export function parseAuthCallback(url: string): AuthCallback | null {
  const hashIdx = url.indexOf('#');
  const queryIdx = url.indexOf('?');
  const parts: string[] = [];
  if (queryIdx >= 0) parts.push(url.slice(queryIdx + 1, hashIdx > queryIdx ? hashIdx : undefined));
  if (hashIdx >= 0) parts.push(url.slice(hashIdx + 1));
  const params = new Map<string, string>();
  for (const part of parts) {
    for (const pair of part.split('&')) {
      const [k, v = ''] = pair.split('=');
      if (!k) continue;
      try {
        params.set(decodeURIComponent(k), decodeURIComponent(v.replace(/\+/g, ' ')));
      } catch {
        // bozuk kodlama: yoksay
      }
    }
  }
  const error = params.get('error_description') ?? params.get('error');
  if (error) return { type: 'error', message: error };
  const access = params.get('access_token');
  const refresh = params.get('refresh_token');
  if (access && refresh) return { type: 'tokens', accessToken: access, refreshToken: refresh };
  const code = params.get('code');
  if (code) return { type: 'code', code };
  return null;
}
