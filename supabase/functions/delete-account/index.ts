// POST — oturum sahibinin hesabını siler. Önce (varsa) Apple belirtecini iptal eder, sonra kullanıcıyı siler
// (profil, lig puanları, apple_tokens `on delete cascade` ile gider; raporlar `set null` ile anonimleşir).
// Apple iptali BAŞARISIZSA hesap silinmez ve 502 döner (kullanıcı yeniden dener); böylece Apple bağlantısı açıkta kalmaz.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { appleConfigured, revokeToken } from '../_shared/apple.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });
  const url = Deno.env.get('SUPABASE_URL')!;
  const { data } = await createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  }).auth.getUser();
  const user = data.user;
  if (!user) return new Response('unauthorized', { status: 401 });

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  try {
    const { data: row } = await admin.from('apple_tokens').select('refresh_token').eq('user_id', user.id).maybeSingle();
    if (row?.refresh_token) {
      if (!appleConfigured()) throw new Error('Apple yapılandırması eksik');
      await revokeToken(row.refresh_token);
    }
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;
    return new Response(null, { status: 204 });
  } catch (e) {
    console.error('delete-account', (e as Error).message);
    return new Response('hata', { status: 502 });
  }
});
