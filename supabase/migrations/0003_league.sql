-- Ramazan Ligi: dil başına sezon + finale için daha yüksek skor sınırı.
-- Not: skor istemcide hesaplanır (hile tam engellenemez); ödül parası yok, düşük risk kabul edildi. Sınır yalnızca saçma değerleri keser.

-- Her dilin kendi sezonu ve sıralaması vardır (sorular dile özgüdür).
alter table public.league_seasons
  add column if not exists lang text not null default 'tr' check (lang in ('tr', 'ar', 'en'));

-- Skor sınırı: 5 soru ≤ 1000, finale 10 soru ≤ 2000 → 5000 güvenli üst sınır. Eski (≤1000) kısıtı adından bağımsız bul ve kaldır.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.league_scores'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%score%'
  loop
    execute format('alter table public.league_scores drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.league_scores add constraint league_scores_score_range check (score between 0 and 5000);

create index if not exists league_scores_season_day on public.league_scores (season_id, day_no);

-- Skor gönderirken görünen ad: kullanıcı kendi profilini günceller (politika 0001'de var).
-- Açma/kapama: league_seasons.enabled = true  VE  remote_config 'features'.league_enabled = true (ikisi de gerekir).
