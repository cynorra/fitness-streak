-- ============================================================
-- VITATRIBE / STREAK-FIT VERITABANI SEMASI
-- Supabase SQL Editor'a yapistir ve calistir
-- Düzeltilmis versiyon: tablo sirasi duzeltildi
-- ============================================================

-- ============================================================
-- 1. TUM TABLOLAR
-- ============================================================

-- KULLANICI ROLLERI
create type public.user_role as enum ('user', 'dietitian', 'admin');

-- KULLANICI PROFILLERI
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null check (char_length(username) between 3 and 20),
  display_name text,
  avatar_url text,
  bio text,
  specialty text,
  role public.user_role default 'user',
  timezone text default 'Europe/Istanbul',
  day_start_hour int default 4 check (day_start_hour between 0 and 23),
  current_streak int default 0,
  longest_streak int default 0,
  last_workout_date date,
  onboarding_completed boolean default false,
  push_token text,
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

-- ARKADASLIKLAR
create table public.friendships (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz default now(),
  unique(requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

-- KUDOS (alkis)
create table public.kudos (
  id uuid default gen_random_uuid() primary key,
  giver_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(giver_id, workout_id)
);

-- DIYETISYEN - DANISAN ILISKISI (profiles'dan once gelmeli)
create table public.dietitian_clients (
  id uuid default gen_random_uuid() primary key,
  dietitian_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  unique(dietitian_id, client_id)
);

-- SOSYAL FEED (GONDERILER)
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  media_url text,
  moderation_status text default 'pending' check (moderation_status in ('pending', 'approved', 'flagged', 'rejected')),
  created_at timestamptz default now()
);

-- YASAKLI KELIMELER
create table public.blocked_keywords (
  keyword text primary key
);

-- MESAJLASMA
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

-- POST ETKILESIMLERI
create table public.post_likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);

create table public.post_comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BILDIRIMLER
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

-- ROZETLER
create table public.badges (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text not null,
  icon text not null,
  streak_required integer not null
);

create table public.user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id uuid references public.badges(id) on delete cascade not null,
  awarded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, badge_id)
);

-- REPOST SISTEMI
create table public.reposts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, post_id)
);

-- ============================================================
-- 2. INDEXLER
-- ============================================================
create index idx_workouts_user_date on public.workouts(user_id, logical_date desc);
create index idx_friendships_addressee on public.friendships(addressee_id, status);
create index idx_friendships_requester on public.friendships(requester_id, status);
create index idx_kudos_receiver on public.kudos(receiver_id);

-- ============================================================
-- 3. FONKSIYONLAR
-- ============================================================

-- Kullanicinin mantiksal tarihini hesapla
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

  v_local_time := p_timestamp at time zone v_timezone;
  return (v_local_time - (v_day_start_hour || ' hours')::interval)::date;
end;
$$;

-- Antrenman eklendiginde streak guncelle
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
  v_new_logical_date := public.user_logical_date(new.user_id, new.logged_at);
  new.logical_date := v_new_logical_date;

  select last_workout_date, current_streak, longest_streak
  into v_last_date, v_current_streak, v_longest_streak
  from public.profiles
  where id = new.user_id;

  if v_last_date is null then
    v_current_streak := 1;
  elsif v_new_logical_date = v_last_date then
    return new;
  elsif v_new_logical_date = v_last_date + 1 then
    v_current_streak := v_current_streak + 1;
  else
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

-- Kullanici kayit oldugunda profil olustur
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
    coalesce(new.raw_user_meta_data->>'display_name', 'Yeni Kullanici')
  );
  return new;
end;
$$;

-- Post otomatik moderasyon
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
    new.moderation_status := 'approved';
  end if;
  return new;
end;
$$;

-- Begeni bildirimi
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

-- Yorum bildirimi
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

-- Diyetisyen onay bildirimi
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

-- Rozet kontrol
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

-- Repost bildirimi
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

-- ============================================================
-- 4. TRIGGERLAR
-- ============================================================
create trigger trg_update_streak
before insert on public.workouts
for each row
execute function public.update_streak_on_workout();

create trigger trg_on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create trigger trg_auto_moderate_post
before insert on public.posts
for each row
execute function public.auto_moderate_post();

create trigger trg_on_post_like_notify
after insert on public.post_likes
for each row execute function public.on_post_like_notify();

create trigger trg_on_post_comment_notify
after insert on public.post_comments
for each row execute function public.on_post_comment_notify();

create trigger trg_on_dietitian_client_update_notify
after update on public.dietitian_clients
for each row execute function public.on_dietitian_client_update_notify();

create trigger trg_check_badges
after update of current_streak on public.profiles
for each row execute function public.check_and_award_badges();

create trigger trg_on_repost_notify
after insert on public.reposts
for each row execute function public.on_repost_notify();

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS) AKTIF ET
-- ============================================================
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.friendships enable row level security;
alter table public.kudos enable row level security;
alter table public.dietitian_clients enable row level security;
alter table public.posts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.notifications enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.reposts enable row level security;

-- ============================================================
-- 6. RLS POLITIKALARI
-- ============================================================

-- Profiller
create policy "Profiles okunabilir" on public.profiles for select using (true);
create policy "Kendi profilini guncelle" on public.profiles for update using (auth.uid() = id);

-- Antrenmanlar (dietitian_clients artik var)
create policy "Antrenmanlar guncelleme" on public.workouts for select using (
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
create policy "Kendi antrenmanini ekle" on public.workouts for insert with check (user_id = auth.uid());
create policy "Kendi antrenmanini sil" on public.workouts for delete using (user_id = auth.uid());

-- Arkadasliklar
create policy "Arkadasliklari gor" on public.friendships for select using (
  requester_id = auth.uid() or addressee_id = auth.uid()
);
create policy "Arkadaslik istegi gonder" on public.friendships for insert with check (requester_id = auth.uid());
create policy "Arkadaslik guncelle" on public.friendships for update using (
  addressee_id = auth.uid() or requester_id = auth.uid()
);

-- Diyetisyen politikalari
create policy "Diyetisyenler danisanlarini gorur" on public.dietitian_clients for select using (dietitian_id = auth.uid() or client_id = auth.uid());
create policy "Diyetisyen istegi gonder" on public.dietitian_clients for insert with check (client_id = auth.uid());
create policy "Diyetisyen istegini guncelle" on public.dietitian_clients for update using (dietitian_id = auth.uid());

-- Post politikalari
create policy "Onaylanmis postlar herkes gorur" on public.posts for select using (moderation_status = 'approved' or user_id = auth.uid());
create policy "Post paylas" on public.posts for insert with check (user_id = auth.uid());
create policy "Kendi postunu sil" on public.posts for delete using (user_id = auth.uid());

-- Mesaj politikalari
create policy "Kendi mesajlasmalarini gor" on public.conversations for select using (participant_1 = auth.uid() or participant_2 = auth.uid());
create policy "Konusma olustur" on public.conversations for insert with check (participant_1 = auth.uid() or participant_2 = auth.uid());
create policy "Mesajlari gor" on public.messages for select using (
  exists (
    select 1 from public.conversations
    where id = conversation_id
    and (participant_1 = auth.uid() or participant_2 = auth.uid())
  )
);
create policy "Mesaj gonder" on public.messages for insert with check (sender_id = auth.uid());

-- Begeni / Yorum politikalari
create policy "Begenileri herkes gorebilir" on public.post_likes for select using (true);
create policy "Kullanici begenebilir" on public.post_likes for insert with check (auth.uid() = user_id);
create policy "Kullanici begenisini kaldirabili" on public.post_likes for delete using (auth.uid() = user_id);

create policy "Yorumlari herkes gorebilir" on public.post_comments for select using (true);
create policy "Kullanici yorum yapabilir" on public.post_comments for insert with check (auth.uid() = user_id);
create policy "Kullanici kendi yorumunu silebilir" on public.post_comments for delete using (auth.uid() = user_id);

-- Bildirim politikalari
create policy "Kullanici kendi bildirimlerini gorebilir" on public.notifications for select using (auth.uid() = user_id);
create policy "Kullanici kendi bildirimlerini guncelleyebilir" on public.notifications for update using (auth.uid() = user_id);

-- Rozet politikalari
create policy "Rozetler herkes tarafindan gorulebilir" on public.badges for select using (true);
create policy "Kullanici rozetleri herkes tarafindan gorulebilir" on public.user_badges for select using (true);

-- Repost politikalari
create policy "Repostlar okunabilir" on public.reposts for select using (true);
create policy "Repost yap" on public.reposts for insert with check (user_id = auth.uid());
create policy "Repost sil" on public.reposts for delete using (user_id = auth.uid());

-- ============================================================
-- 1.5 FAZ 1 EKLENTILERI (YENI TABLOLAR)
-- ============================================================

-- BESLENME PLANLARI VE OGUNLER
create table public.nutrition_plans (
  id uuid default gen_random_uuid() primary key,
  dietitian_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete cascade not null,
  title text,
  start_date date,
  end_date date,
  status text default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz default now()
);

create table public.nutrition_meals (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.nutrition_plans(id) on delete cascade not null,
  day_of_week int check (day_of_week between 1 and 7),
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  content text not null,
  calories int,
  macros jsonb,
  created_at timestamptz default now()
);

-- GUNLUK BESLENME LOGLARI (Makro/Kalori Takibi)
create table public.daily_nutrition_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  log_date date not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  content text not null,
  calories int,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  created_at timestamptz default now()
);

-- VUCUT OLCULERI
create table public.body_measurements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  weight_kg numeric,
  waist_cm numeric,
  hips_cm numeric,
  neck_cm numeric,
  body_fat_percentage numeric,
  created_at timestamptz default now()
);

-- RANDEVU SISTEMI
create table public.appointments (
  id uuid default gen_random_uuid() primary key,
  dietitian_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete cascade not null,
  appointment_time timestamptz not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz default now()
);

-- SEANS NOTLARI
create table public.session_notes (
  id uuid default gen_random_uuid() primary key,
  dietitian_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete cascade not null,
  appointment_id uuid references public.appointments(id) on delete set null,
  note text not null,
  is_private boolean default false,
  created_at timestamptz default now()
);

-- MEYDAN OKUMALAR (CHALLENGES)
create table public.challenges (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  start_date date,
  end_date date,
  goal_type text not null,
  goal_value numeric not null,
  created_at timestamptz default now()
);

create table public.user_challenges (
  id uuid default gen_random_uuid() primary key,
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected', 'completed')),
  progress numeric default 0,
  joined_at timestamptz default now(),
  unique(challenge_id, user_id)
);

-- ANTRENMAN SABLONLARI
create table public.workout_templates (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  exercises jsonb not null,
  is_public boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- 1.6 FAZ 1 EKLENTILERI IÇIN RLS AKTIF ET VE POLITIKALAR
-- ============================================================
alter table public.nutrition_plans enable row level security;
alter table public.nutrition_meals enable row level security;
alter table public.daily_nutrition_logs enable row level security;
alter table public.body_measurements enable row level security;
alter table public.appointments enable row level security;
alter table public.session_notes enable row level security;
alter table public.challenges enable row level security;
alter table public.user_challenges enable row level security;
alter table public.workout_templates enable row level security;

create policy "Plan okuma" on public.nutrition_plans for select using (dietitian_id = auth.uid() or client_id = auth.uid());
create policy "Diyetisyen plan ekler" on public.nutrition_plans for insert with check (dietitian_id = auth.uid());
create policy "Diyetisyen plan gunceller" on public.nutrition_plans for update using (dietitian_id = auth.uid());

create policy "Meals okuma" on public.nutrition_meals for select using (
  exists(select 1 from public.nutrition_plans p where p.id = plan_id and (p.dietitian_id = auth.uid() or p.client_id = auth.uid()))
);
create policy "Diyetisyen meal ekler" on public.nutrition_meals for insert with check (
  exists(select 1 from public.nutrition_plans p where p.id = plan_id and p.dietitian_id = auth.uid())
);
create policy "Diyetisyen meal gunceller" on public.nutrition_meals for update using (
  exists(select 1 from public.nutrition_plans p where p.id = plan_id and p.dietitian_id = auth.uid())
);

create policy "Beslenme log oku" on public.daily_nutrition_logs for select using (
  user_id = auth.uid() or 
  exists(select 1 from public.dietitian_clients c where c.client_id = user_id and c.dietitian_id = auth.uid() and c.status = 'approved')
);
create policy "Beslenme log ekle" on public.daily_nutrition_logs for insert with check (user_id = auth.uid());

create policy "Olcum oku" on public.body_measurements for select using (
  user_id = auth.uid() or 
  exists(select 1 from public.dietitian_clients c where c.client_id = user_id and c.dietitian_id = auth.uid() and c.status = 'approved')
);
create policy "Olcum ekle" on public.body_measurements for insert with check (user_id = auth.uid());

create policy "Randevu oku" on public.appointments for select using (dietitian_id = auth.uid() or client_id = auth.uid());
create policy "Randevu ekle" on public.appointments for insert with check (client_id = auth.uid() or dietitian_id = auth.uid());
create policy "Randevu guncelle" on public.appointments for update using (client_id = auth.uid() or dietitian_id = auth.uid());

create policy "Not oku" on public.session_notes for select using (
  dietitian_id = auth.uid() or (client_id = auth.uid() and is_private = false)
);
create policy "Not ekle" on public.session_notes for insert with check (dietitian_id = auth.uid());
create policy "Not guncelle" on public.session_notes for update using (dietitian_id = auth.uid());

create policy "Challenge oku" on public.challenges for select using (true);
create policy "Challenge ekle" on public.challenges for insert with check (creator_id = auth.uid());

create policy "UserChallenge oku" on public.user_challenges for select using (
  user_id = auth.uid() or 
  exists(select 1 from public.challenges c where c.id = challenge_id and c.creator_id = auth.uid())
);
create policy "UserChallenge ekle" on public.user_challenges for insert with check (user_id = auth.uid());
create policy "UserChallenge guncelle" on public.user_challenges for update using (user_id = auth.uid());

create policy "Template oku" on public.workout_templates for select using (is_public = true or creator_id = auth.uid());
create policy "Template ekle" on public.workout_templates for insert with check (creator_id = auth.uid());

-- ============================================================
-- 7. VARSAYILAN VERILER
-- ============================================================

-- Yasakli kelimeler ornekleri
insert into public.blocked_keywords (keyword) values ('spam'), ('reklam');

-- Rozetler
insert into public.badges (name, description, icon, streak_required) values
('Haftalik Savasci', '7 gunluk antrenman serisi yaptin!', '🔥', 7),
('Aylik Sampiyon', '30 gunluk antrenman serisi yaptin!', '🏆', 30),
('Yuzyillik Cinar', '100 gunluk antrenman serisi yaptin!', '💎', 100);

-- ============================================================
-- 8. REALTIME YAPILANDIRMASI
-- ============================================================
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table
    public.notifications,
    public.messages,
    public.conversations,
    public.appointments,
    public.challenges,
    public.user_challenges;
commit;

-- ============================================================
-- 9. GUVENLIK: KULLANICI ENGELLEME VE SIKAYET SISTEMI
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
