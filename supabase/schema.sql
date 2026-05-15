-- ============================================================
-- STREAK-FIT VERÄ°TABANI ÅEMASI
-- Supabase SQL Editor'a yapÄ±ÅŸtÄ±r ve Ã§alÄ±ÅŸtÄ±r
-- ============================================================

-- KULLANICI PROFÄ°LLERÄ°
-- (auth.users Supabase tarafÄ±ndan otomatik yÃ¶netilir, biz ek bilgileri burada tutarÄ±z)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null check (char_length(username) between 3 and 20),
  display_name text,
  avatar_url text,
  timezone text default 'Europe/Istanbul',
  day_start_hour int default 4 check (day_start_hour between 0 and 23),
  current_streak int default 0,
  longest_streak int default 0,
  last_workout_date date,
  created_at timestamptz default now()
);

-- ANTRENMANLAR
create table public.workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  workout_type text not null,
  duration_minutes int not null check (duration_minutes > 0 and duration_minutes < 600),
  note text,
  is_public boolean default true,
  logged_at timestamptz default now(),
  logical_date date not null
);

create index idx_workouts_user_date on public.workouts(user_id, logical_date desc);

-- ARKADAÅLIKLAR
-- (basit: tek yÃ¶nlÃ¼ deÄŸil, karÅŸÄ±lÄ±klÄ± kabul gerekir)
create table public.friendships (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz default now(),
  unique(requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create index idx_friendships_addressee on public.friendships(addressee_id, status);
create index idx_friendships_requester on public.friendships(requester_id, status);

-- KUDOS (alkÄ±ÅŸ)
create table public.kudos (
  id uuid default gen_random_uuid() primary key,
  giver_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(giver_id, workout_id)
);

create index idx_kudos_receiver on public.kudos(receiver_id);

-- ============================================================
-- KULLANICININ MANTIKSAL TARÄ°HÄ°NÄ° HESAPLA
-- (saat diliminden ve "gÃ¼nÃ¼n baÅŸlangÄ±cÄ±"ndan etkilenir)
-- ============================================================
create or replace function public.user_logical_date(p_user_id uuid, p_timestamp timestamptz default now())
returns date
language plpgsql
stable
as $$
declare
  v_timezone text;
  v_day_start_hour int;
  v_local_time timestamp;
begin
  select timezone, day_start_hour
  into v_timezone, v_day_start_hour
  from public.profiles
  where id = p_user_id;

  if v_timezone is null then
    v_timezone := 'Europe/Istanbul';
    v_day_start_hour := 4;
  end if;

  -- KullanÄ±cÄ±nÄ±n yerel saatine Ã§evir, sonra "gÃ¼nÃ¼n baÅŸlangÄ±cÄ±"nÄ± Ã§Ä±kar
  v_local_time := p_timestamp at time zone v_timezone;
  return (v_local_time - (v_day_start_hour || ' hours')::interval)::date;
end;
$$;

-- ============================================================
-- ANTRENMAN EKLENDÄ°ÄÄ°NDE STREAK GÃœNCELLE
-- ============================================================
create or replace function public.update_streak_on_workout()
returns trigger
language plpgsql
as $$
declare
  v_last_date date;
  v_current_streak int;
  v_longest_streak int;
  v_new_logical_date date;
begin
  -- AntrenmanÄ±n mantÄ±ksal tarihini hesapla
  v_new_logical_date := public.user_logical_date(new.user_id, new.logged_at);
  new.logical_date := v_new_logical_date;

  select last_workout_date, current_streak, longest_streak
  into v_last_date, v_current_streak, v_longest_streak
  from public.profiles
  where id = new.user_id;

  if v_last_date is null then
    -- Ä°lk antrenman
    v_current_streak := 1;
  elsif v_new_logical_date = v_last_date then
    -- AynÄ± gÃ¼n, streak deÄŸiÅŸmez
    return new;
  elsif v_new_logical_date = v_last_date + 1 then
    -- Bir sonraki gÃ¼n, streak +1
    v_current_streak := v_current_streak + 1;
  else
    -- Streak kÄ±rÄ±lmÄ±ÅŸ, sÄ±fÄ±rdan baÅŸla
    v_current_streak := 1;
  end if;

  if v_current_streak > v_longest_streak then
    v_longest_streak := v_current_streak;
  end if;

  update public.profiles
  set current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_workout_date = v_new_logical_date
  where id = new.user_id;

  return new;
end;
$$;

create trigger trg_update_streak
before insert on public.workouts
for each row
execute function public.update_streak_on_workout();

-- ============================================================
-- KULLANICI KAYIT OLDUÄUNDA PROFIL OLUÅTUR
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', 'Yeni KullanÄ±cÄ±')
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- KullanÄ±cÄ±lar sadece gÃ¶rmeleri gerekeni gÃ¶rsÃ¼n
-- ============================================================
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.friendships enable row level security;
alter table public.kudos enable row level security;

-- Profiller: herkes okuyabilir (arkadaÅŸ aramak iÃ§in), sadece kendi profilini gÃ¼ncelleyebilir
create policy "Profiles okunabilir" on public.profiles for select using (true);
create policy "Kendi profilini gÃ¼ncelle" on public.profiles for update using (auth.uid() = id);

-- Antrenmanlar: kendininkini, arkadaÅŸlarÄ±nÄ±nkini veya halka aÃ§Ä±k olanlarÄ± gÃ¶r
create policy "AntrenmanlarÄ± gÃ¶r" on public.workouts for select using (
  user_id = auth.uid()
  or is_public = true
  or exists (
    select 1 from public.friendships
    where status = 'accepted'
    and ((requester_id = auth.uid() and addressee_id = user_id)
      or (addressee_id = auth.uid() and requester_id = user_id))
  )
  or exists (
    select 1 from public.dietitian_clients
    where dietitian_id = auth.uid() and client_id = user_id and status = 'approved'
  )
);
create policy "Kendi antrenmanÄ±nÄ± ekle" on public.workouts for insert with check (user_id = auth.uid());
create policy "Kendi antrenmanÄ±nÄ± sil" on public.workouts for delete using (user_id = auth.uid());

-- ArkadaÅŸlÄ±klar
create policy "ArkadaÅŸlÄ±klarÄ±nÄ± gÃ¶r" on public.friendships for select using (
  requester_id = auth.uid() or addressee_id = auth.uid()
);
create policy "ArkadaÅŸlÄ±k isteÄŸi gÃ¶nder" on public.friendships for insert with check (requester_id = auth.uid());
create policy "ArkadaÅŸlÄ±k gÃ¼ncelle" on public.friendships for update using (
  addressee_id = auth.uid() or requester_id = auth.uid()
);

-- ============================================================
-- YENÄ° ROLLER VE SOSYAL Ã–ZELLÄ°KLER
-- ============================================================

-- Rol Tipi
create type public.user_role as enum ('user', 'dietitian', 'admin');

-- Profillere Rol Ekle
alter table public.profiles add column role public.user_role default 'user';
alter table public.profiles add column bio text;
alter table public.profiles add column specialty text; -- Diyetisyenler iÃ§in

-- DÄ°YETÄ°SYEN - DANIÅAN Ä°LÄ°ÅKÄ°SÄ°
create table public.dietitian_clients (
  id uuid default gen_random_uuid() primary key,
  dietitian_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  unique(dietitian_id, client_id)
);

-- SOSYAL FEED (GÃ–NDERÄ°LER)
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  media_url text,
  moderation_status text default 'pending' check (moderation_status in ('pending', 'approved', 'flagged', 'rejected')),
  created_at timestamptz default now()
);

-- YASAKLI KELÄ°MELER VE OTOMATÄ°K MODERASYON
create table public.blocked_keywords (
  keyword text primary key
);

insert into public.blocked_keywords (keyword) values ('kÃ¼fÃ¼r1'), ('kÃ¼fÃ¼r2'), ('spam'); -- Ã–rnekler

create or replace function public.auto_moderate_post()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.blocked_keywords
    where new.content ilike '%' || keyword || '%'
  ) then
    new.moderation_status := 'flagged';
  else
    -- Basitlik iÃ§in otomatik onayla (admin sonra bakabilir)
    new.moderation_status := 'approved';
  end if;
  return new;
end;
$$;

create trigger trg_auto_moderate_post
before insert on public.posts
for each row
execute function public.auto_moderate_post();

-- MESAJLAÅMA
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  participant_1 uuid references public.profiles(id) on delete cascade not null,
  participant_2 uuid references public.profiles(id) on delete cascade not null,
  updated_at timestamptz default now(),
  unique(participant_1, participant_2)
);

create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- RLS GÃœNCELLEMELERÄ° (YENÄ° TABLOLAR Ä°Ã‡Ä°N)
alter table public.dietitian_clients enable row level security;
alter table public.posts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Post PolitikalarÄ±
create policy "OnaylÄ± postlarÄ± herkes gÃ¶rÃ¼r" on public.posts for select using (moderation_status = 'approved');
create policy "Kendi postlarÄ±nÄ± herkes gÃ¶rÃ¼r" on public.posts for select using (user_id = auth.uid());
create policy "Post paylaÅŸ" on public.posts for insert with check (user_id = auth.uid());

-- Mesaj PolitikalarÄ±
create policy "Kendi mesajlaÅŸmalarÄ±nÄ± gÃ¶r" on public.conversations for select using (participant_1 = auth.uid() or participant_2 = auth.uid());
create policy "MesajlarÄ± gÃ¶r" on public.messages for select using (
  exists (
    select 1 from public.conversations
    where id = conversation_id
    and (participant_1 = auth.uid() or participant_2 = auth.uid())
  )
);
create policy "Mesaj gÃ¶nder" on public.messages for insert with check (sender_id = auth.uid());

-- Diyetisyen PolitikalarÄ±
create policy "Diyetisyenler danÄ±ÅŸanlarÄ±nÄ± gÃ¶rÃ¼r" on public.dietitian_clients for select using (dietitian_id = auth.uid() or client_id = auth.uid());


-- ============================================================
-- ETKÄ°LEÅÄ°MLER (BEÄENÄ° VE YORUM)
-- ============================================================

-- Post BeÄŸenileri (Kudos)
create table public.post_likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);

alter table public.post_likes enable row level security;
create policy "BeÄŸenileri herkes gÃ¶rebilir" on public.post_likes for select using (true);
create policy "KullanÄ±cÄ±lar beÄŸenebilir" on public.post_likes for insert with check (auth.uid() = user_id);
create policy "KullanÄ±cÄ±lar beÄŸeniyi kaldÄ±rabilir" on public.post_likes for delete using (auth.uid() = user_id);

-- Post YorumlarÄ±
create table public.post_comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.post_comments enable row level security;
create policy "YorumlarÄ± herkes gÃ¶rebilir" on public.post_comments for select using (true);
create policy "KullanÄ±cÄ±lar yorum yapabilir" on public.post_comments for insert with check (auth.uid() = user_id);
create policy "KullanÄ±cÄ±lar kendi yorumunu silebilir" on public.post_comments for delete using (auth.uid() = user_id);

-- ============================================================
-- BÄ°LDÄ°RÄ°MLER
-- ============================================================

create type public.notification_type as enum ('like', 'comment', 'message', 'dietitian_request', 'dietitian_approved', 'repost');

create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete cascade not null,
  type public.notification_type not null,
  post_id uuid references public.posts(id) on delete cascade,
  is_read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;
create policy "KullanÄ±cÄ±lar kendi bildirimlerini gÃ¶rebilir" on public.notifications for select using (auth.uid() = user_id);
create policy "KullanÄ±cÄ±lar kendi bildirimlerini gÃ¼ncelleyebilir" on public.notifications for update using (auth.uid() = user_id);

-- BeÄŸeni Bildirim Tetikleyicisi
create or replace function public.on_post_like_notify()
returns trigger as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id from public.posts where id = new.post_id;
  if owner_id != new.user_id then
    insert into public.notifications (user_id, actor_id, type, post_id)
    values (owner_id, new.user_id, 'like', new.post_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_post_like_notify
after insert on public.post_likes
for each row execute function public.on_post_like_notify();

-- Yorum Bildirim Tetikleyicisi
create or replace function public.on_post_comment_notify()
returns trigger as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id from public.posts where id = new.post_id;
  if owner_id != new.user_id then
    insert into public.notifications (user_id, actor_id, type, post_id)
    values (owner_id, new.user_id, 'comment', new.post_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_post_comment_notify
after insert on public.post_comments
for each row execute function public.on_post_comment_notify();

-- ============================================================
-- DÄ°YETÄ°SYEN ONAY BÄ°LDÄ°RÄ°MÄ°
-- ============================================================

create or replace function public.on_dietitian_client_update_notify()
returns trigger as $$
begin
  if new.status = 'approved' and old.status = 'pending' then
    insert into public.notifications (user_id, actor_id, type)
    values (new.client_id, new.dietitian_id, 'dietitian_approved');
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_dietitian_client_update_notify
after update on public.dietitian_clients
for each row execute function public.on_dietitian_client_update_notify();

-- ============================================================
-- ROZETLER VE BAŞARIMLAR
-- ============================================================

create table public.badges (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text not null,
  icon text not null,
  streak_required integer not null
);

insert into public.badges (name, description, icon, streak_required) values
('Haftalık Savaşçı', '7 günlük antrenman serisi yaptın!', '??', 7),
('Aylık Şampiyon', '30 günlük antrenman serisi yaptın!', '??', 30),
('Yüzyıllık Çınar', '100 günlük antrenman serisi yaptın!', '??', 100);

create table public.user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id uuid references public.badges(id) on delete cascade not null,
  awarded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, badge_id)
);

alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
create policy "Rozetler herkes tarafından görülebilir" on public.badges for select using (true);
create policy "Kullanıcı rozetleri herkes tarafından görülebilir" on public.user_badges for select using (true);

-- Rozet Kontrol Tetikleyicisi
create or replace function public.check_and_award_badges()
returns trigger as $$
begin
  insert into public.user_badges (user_id, badge_id)
  select new.id, b.id
  from public.badges b
  where new.current_streak >= b.streak_required
  on conflict do nothing;
  
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_check_badges
after update of current_streak on public.profiles
for each row execute function public.check_and_award_badges();

-- ============================================================
-- REPOST SSTEM
-- ============================================================

create table public.reposts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, post_id)
);

alter table public.reposts enable row level security;
create policy "Repostlar okunabilir" on public.reposts for select using (true);
create policy "Repost yap" on public.reposts for insert with check (user_id = auth.uid());
create policy "Repost sil" on public.reposts for delete using (user_id = auth.uid());

-- Repost Bildirimi
create or replace function public.on_repost_notify()
returns trigger as $$
declare
  v_post_owner_id uuid;
begin
  select user_id into v_post_owner_id from public.posts where id = new.post_id;
  
  if v_post_owner_id <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, post_id)
    values (v_post_owner_id, new.user_id, 'repost', new.post_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_repost_notify
after insert on public.reposts
for each row execute function public.on_repost_notify();

-- ============================================================
-- REALTIME YAPILANDIRMASI
-- ============================================================
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table 
    public.notifications,
    public.messages,
    public.conversations;
commit;
