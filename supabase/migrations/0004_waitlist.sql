-- Sual Arena — açılış sayfası bekleme listesi (Faz 9)
-- Yalnızca EKLEME: anon anahtarıyla okunamaz/silinemez. Liste dashboard'dan (service role) okunur.
-- Üretim e-postası: kullanıcı açık rıza ile bırakır; silme isteği için landing > hesap silme sayfası.

create table public.waitlist (
  id         bigint generated always as identity primary key,
  email      text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  lang       text not null default 'tr' check (lang in ('tr', 'ar', 'en')),
  -- isteğe bağlı yönlendirme kodu (creator/kurs): ?ref=SUAL-AHMET ; kişisel veri değildir
  ref        text check (ref is null or ref ~ '^[A-Za-z0-9_-]{1,32}$'),
  created_at timestamptz not null default now()
);
create unique index waitlist_email_unique on public.waitlist (lower(email));
alter table public.waitlist enable row level security;

create policy waitlist_insert on public.waitlist for insert to anon, authenticated with check (true);
