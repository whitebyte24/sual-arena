// POST { code }  — Apple ile girişten hemen sonra çağrılır: kodu yenileme belirteciyle değiştirip saklar.
// Başarısızlık girişi bozmaz (istemci hatayı yoksayar); Apple yapılandırılmamışsa 204 döner.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { appleConfigured, exchangeCode } from '../_shared/apple.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });
  if (!appleConfigured()) return new Response(null, { status: 204 });

  const url = Deno.env.get('SUPABASE_URL')!;
  const user = await createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  }).auth.getUser();
  if (!user.data.user) return new Response('unauthorized', { status: 401 });

  try {
    const { code } = (await req.json()) as { code?: string };
    if (!code) return new Response('code gerekli', { status: 400 });
    const refresh = await exchangeCode(code);
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { error } = await admin.from('apple_tokens').upsert({ user_id: user.data.user.id, refresh_token: refresh });
    if (error) throw error;
    return new Response(null, { status: 204 });
  } catch (e) {
    console.error('apple-link', (e as Error).message);
    return new Response('hata', { status: 502 });
  }
});
