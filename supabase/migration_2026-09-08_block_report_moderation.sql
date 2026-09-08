-- ============================================================
-- MIGRASYON: KULLANICI ENGELLEME, SIKAYET VE SOHBET MODERASYONU
-- Bu dosyayi Supabase SQL Editor'a yapistir ve calistir.
-- (schema.sql'in tamamini tekrar calistirma - sadece bu dosyayi calistir,
-- schema.sql zaten bu blogu icerecek sekilde guncellendi, referans icin.)
-- ============================================================

-- KULLANICI ENGELLEME
create table public.user_blocks (
  id uuid default gen_random_uuid() primary key,
  blocker_id uuid references public.profiles(id) on delete cascade not null,
  blocked_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index idx_user_blocks_blocker on public.user_blocks(blocker_id);

alter table public.user_blocks enable row level security;

create policy "Kendi engellerini gorur" on public.user_blocks for select using (blocker_id = auth.uid());
create policy "Kullanici engeller" on public.user_blocks for insert with check (blocker_id = auth.uid());
create policy "Kullanici engeli kaldirir" on public.user_blocks for delete using (blocker_id = auth.uid());

-- SIKAYET SISTEMI
create type public.report_content_type as enum ('profile', 'post', 'comment', 'message');
create type public.report_status as enum ('pending', 'reviewed', 'dismissed');

create table public.reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  reported_user_id uuid references public.profiles(id) on delete cascade not null,
  content_type public.report_content_type not null,
  content_id uuid,
  reason text not null,
  status public.report_status default 'pending' not null,
  created_at timestamptz default now()
);

create index idx_reports_status on public.reports(status);

alter table public.reports enable row level security;

create policy "Sikayetleri gorme" on public.reports for select using (
  reporter_id = auth.uid()
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Kullanici sikayet eder" on public.reports for insert with check (reporter_id = auth.uid());
create policy "Admin sikayet durumunu gunceller" on public.reports for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Engellenen kullanicilarin postlarini gizle
drop policy "Onaylanmis postlar herkes gorur" on public.posts;
create policy "Onaylanmis postlar herkes gorur" on public.posts for select using (
  (moderation_status = 'approved' or user_id = auth.uid())
  and not exists (
    select 1 from public.user_blocks
    where (blocker_id = auth.uid() and blocked_id = user_id)
       or (blocker_id = user_id and blocked_id = auth.uid())
  )
);

-- Engelli kullanicilarla yeni konusma baslatilamaz
drop policy "Konusma olustur" on public.conversations;
create policy "Konusma olustur" on public.conversations for insert with check (
  (participant_1 = auth.uid() or participant_2 = auth.uid())
  and not exists (
    select 1 from public.user_blocks
    where (blocker_id = participant_1 and blocked_id = participant_2)
       or (blocker_id = participant_2 and blocked_id = participant_1)
  )
);

-- Engelli kullanicilara/kullanicilardan mesaj gonderilemez
drop policy "Mesaj gonder" on public.messages;
create policy "Mesaj gonder" on public.messages for insert with check (
  sender_id = auth.uid()
  and not exists (
    select 1 from public.conversations c
    join public.user_blocks b on
      (b.blocker_id = c.participant_1 and b.blocked_id = c.participant_2)
      or (b.blocker_id = c.participant_2 and b.blocked_id = c.participant_1)
    where c.id = conversation_id
  )
);

-- SOHBET MODERASYONU: kufur/spam iceren mesajlari sunucu tarafinda reddet
create or replace function public.moderate_message()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.blocked_keywords
    where new.content ilike '%' || keyword || '%'
  ) then
    raise exception 'İçeriğiniz topluluk kurallarına aykırı ifadeler içeriyor.';
  end if;
  return new;
end;
$$;

create trigger trg_moderate_message
before insert on public.messages
for each row
execute function public.moderate_message();

-- Kufur/argo listesini genislet (post + mesaj otomatik moderasyonu ayni tabloyu kullanir)
insert into public.blocked_keywords (keyword) values
  ('amk'), ('aq'), ('amq'), ('orospu'), ('piç'), ('sik'), ('sikerim'), ('sikiş'),
  ('göt'), ('yarrak'), ('yarak'), ('ibne'), ('kahpe'), ('puşt'), ('dalyarak'),
  ('amcık'), ('yarram'), ('sikik'), ('siktir'), ('götveren'), ('taşak'), ('tasak'),
  ('yavşak'), ('fuck'), ('shit'), ('bitch'), ('asshole'), ('cunt'), ('dick'),
  ('pussy'), ('bastard'), ('nigger'), ('faggot'), ('whore'), ('slut'), ('cock'),
  ('motherfucker')
on conflict (keyword) do nothing;
