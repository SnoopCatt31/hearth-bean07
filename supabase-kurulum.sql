-- ============================================================
--  Hearth & Bean — Supabase kurulum betiği
--  Supabase panelinde: sol menü → SQL Editor → New query
--  Bu metnin tamamını yapıştır → "Run" (Çalıştır) butonuna bas.
--  Bir kez çalıştırman yeterli.
-- ============================================================

-- 1) Ortak veri tablosu: her satır bir "anahtar" (orders, customers, menu, slides)
create table if not exists public.app_state (
  id text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

-- 2) Bu tabloyu canlı (realtime) yayına ekle — siparişlerin anında düşmesi için
alter publication supabase_realtime add table public.app_state;

-- 3) Erişim izinleri (RLS).
--    NOT: Bu demo kurulumu herkese okuma + yazma izni verir; küçük bir kafe
--    için pratik ama herkese açıktır. Daha sıkı güvenlik istediğinde
--    (sadece giriş yapmış personel yazabilsin gibi) bunu birlikte güncelleriz.
alter table public.app_state enable row level security;

drop policy if exists "anon read"  on public.app_state;
drop policy if exists "anon write" on public.app_state;
drop policy if exists "anon update" on public.app_state;

create policy "anon read"   on public.app_state for select using (true);
create policy "anon write"  on public.app_state for insert with check (true);
create policy "anon update" on public.app_state for update using (true) with check (true);

-- Bitti. Artık uygulaman bu tabloya bağlanıp veriyi paylaşacak.
