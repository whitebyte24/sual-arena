-- Sual Arena — başlangıç şeması
-- Not: Düello eşleşmesi ve Arkadaş Odası Supabase Realtime kanallarında (tablo yok) yürür.
-- Not: Misafir modu = Supabase "anonymous sign-in" (Dashboard > Auth > Providers > Anonymous: açık olmalı).

-- ─── profiles ────────────────────────────────────────────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 24),
  lang         text not null default 'tr' check (lang in ('tr', 'ar', 'en')),
  created_at   timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
create policy profiles_update_own on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ─── "Hatalı soru bildir" ────────────────────────────────────────────────────
create table public.question_reports (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users (id) on delete set null default auth.uid(),
  question_id text not null check (char_length(question_id) <= 40),
  lang        text not null check (lang in ('tr', 'ar', 'en')),
  reason      text not null check (reason in ('wrong_answer', 'typo', 'offensive', 'unclear', 'other')),
  note        text check (char_length(note) <= 500),
  created_at  timestamptz not null default now()
);
create unique index question_reports_one_per_user on public.question_reports (user_id, question_id)
  where user_id is not null;
alter table public.question_reports enable row level security;

-- Yalnızca ekleme; okuma sadece dashboard/service role.
create policy reports_insert_own on public.question_reports for insert
  to authenticated with check (user_id = auth.uid());

-- ─── Uzaktan yapılandırma (reklam sıklığı, özellik bayrakları) ───────────────
create table public.remote_config (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.remote_config enable row level security;
create policy remote_config_read on public.remote_config for select to anon, authenticated using (true);

insert into public.remote_config (key, value) values
  ('ads', '{
    "enabled": true,
    "banner_enabled": true,
    "interstitial_every_n_matches": 3,
    "interstitial_min_gap_seconds": 180,
    "no_ads_first_matches": 3,
    "reduced_mode": false,
    "reduced_every_n_matches": 6
  }'::jsonb),
  ('features', '{
    "league_enabled": false,
    "free_duels_per_day": 10
  }'::jsonb);

-- ─── Ramazan Ligi (yeniden yayın gerektirmeden açılır) ───────────────────────
create table public.league_seasons (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  starts_on     date not null,
  ends_on       date not null,
  qadr_day_no   int not null default 27 check (qadr_day_no between 1 and 30),
  enabled       boolean not null default false,
  created_at    timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create table public.league_days (
  season_id    uuid not null references public.league_seasons (id) on delete cascade,
  day_no       int not null check (day_no between 1 and 30),
  question_ids text[] not null check (cardinality(question_ids) between 5 and 20),
  opens_at     timestamptz not null,
  is_final     boolean not null default false,
  primary key (season_id, day_no)
);

create table public.league_scores (
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  season_id    uuid not null,
  day_no       int not null,
  score        int not null check (score between 0 and 1000),
  submitted_at timestamptz not null default now(),
  primary key (user_id, season_id, day_no),
  foreign key (season_id, day_no) references public.league_days (season_id, day_no) on delete cascade
);

alter table public.league_seasons enable row level security;
alter table public.league_days    enable row level security;
alter table public.league_scores  enable row level security;

create policy seasons_read on public.league_seasons for select to anon, authenticated using (enabled);
-- Gün seti, açılış zamanından önce görünmez.
create policy days_read on public.league_days for select to anon, authenticated
  using (opens_at <= now() and exists (
    select 1 from public.league_seasons s where s.id = season_id and s.enabled));
create policy scores_select_own on public.league_scores for select using (user_id = auth.uid());
create policy scores_insert_own on public.league_scores for insert to authenticated
  with check (user_id = auth.uid() and exists (
    select 1 from public.league_days d
    join public.league_seasons s on s.id = d.season_id
    where d.season_id = league_scores.season_id and d.day_no = league_scores.day_no
      and s.enabled and d.opens_at <= now()));
-- Skor tek seferlik: update/delete politikası yok.

create function public.league_leaderboard(p_season uuid, p_day int default null, p_limit int default 50)
returns table (rank_no bigint, display_name text, total_score bigint)
language sql stable security definer set search_path = public as $$
  select rank() over (order by sum(s.score) desc),
         coalesce(p.display_name, '—'),
         sum(s.score)::bigint
  from public.league_scores s
  left join public.profiles p on p.id = s.user_id
  where s.season_id = p_season and (p_day is null or s.day_no = p_day)
  group by s.user_id, p.display_name
  order by 3 desc
  limit least(p_limit, 100)
$$;
grant execute on function public.league_leaderboard(uuid, int, int) to anon, authenticated;

-- ─── Hesap silme (uygulama içinden; App Store 5.1.1(v)) ──────────────────────
-- auth.users satırı silinince profiles, league_scores cascade ile gider; question_reports.user_id null olur.
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
