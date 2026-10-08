-- Günlük Soru: isteğe bağlı sunucu tarafı gün seti.
-- Satır yoksa istemci, aynı gün için herkese aynı sonucu veren deterministik seçime düşer.
-- Satır varsa o gün/dil için sorular sabitlenir (ör. uygulama sürümleri arasında soru bankası farklıysa).
create table public.daily_sets (
  day          date not null,
  lang         text not null check (lang in ('tr', 'ar', 'en')),
  question_ids text[] not null check (cardinality(question_ids) = 5),
  primary key (day, lang)
);
alter table public.daily_sets enable row level security;

-- Yalnızca bugün ve en fazla ertesi gün (saat dilimi farkları için) okunabilir; ileri günler gizli kalır.
create policy daily_sets_read on public.daily_sets for select to anon, authenticated
  using (day <= (now() at time zone 'utc')::date + 1);
