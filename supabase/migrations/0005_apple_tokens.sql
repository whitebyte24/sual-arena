-- Sual Arena — Apple ile giriş belirteci (hesap silinirken Apple'a iptal bildirmek için; App Store 5.1.1(v))
-- Yalnızca Edge Function'lar (service role) okur/yazar: RLS açık, hiçbir politika yok → istemci erişemez.
create table public.apple_tokens (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  refresh_token text not null,
  created_at    timestamptz not null default now()
);
alter table public.apple_tokens enable row level security;
