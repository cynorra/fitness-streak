-- ============================================================
-- MIGRASYON 2026-10-01: Canli veritabanini schema.sql ile esitle (idempotent).
-- Supabase SQL Editor'a yapistir ve calistir. Tekrar calistirmak guvenlidir.
-- ============================================================

-- ---------- TIPLER ----------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('user', 'dietitian', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type public.notification_type as enum ('like', 'comment', 'message', 'dietitian_request', 'dietitian_approved', 'repost');
  end if;
  if not exists (select 1 from pg_type where typname = 'report_content_type') then
    create type public.report_content_type as enum ('profile', 'post', 'comment', 'message');
  end if;
  if not exists (select 1 from pg_type where typname = 'report_status') then
    create type public.report_status as enum ('pending', 'reviewed', 'dismissed');
  end if;
end $$;

-- ---------- MEVCUT TABLOLARA EKSIK KOLONLAR ----------
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists specialty text;
alter table public.profiles add column if not exists role public.user_role default 'user';
alter table public.profiles add column if not exists onboarding_completed boolean default false;
alter table public.profiles add column if not exists push_token text;
alter table public.workouts add column if not exists is_public boolean default true;

-- ---------- TABLOLAR ----------
create table if not exists public.dietitian_clients (
  id uuid default gen_random_uuid() primary key,
  dietitian_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  unique(dietitian_id, client_id)
);

create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  media_url text,
  moderation_status text default 'pending' check (moderation_status in ('pending', 'approved', 'flagged', 'rejected')),
  created_at timestamptz default now()
);

create table if not exists public.blocked_keywords (keyword text primary key);

create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  participant_1 uuid references public.profiles(id) on delete cascade not null,
  participant_2 uuid references public.profiles(id) on delete cascade not null,
  updated_at timestamptz default now(),
  unique(participant_1, participant_2)
);

create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.post_likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);

create table if not exists public.post_comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete cascade not null,
  type public.notification_type not null,
  post_id uuid references public.posts(id) on delete cascade,
  is_read boolean default false not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.badges (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text not null,
  icon text not null,
  streak_required integer not null
);

create table if not exists public.user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id uuid references public.badges(id) on delete cascade not null,
  awarded_at timestamptz default timezone('utc'::text, now()) not null,
  unique(user_id, badge_id)
);

create table if not exists public.reposts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, post_id)
);

create table if not exists public.nutrition_plans (
  id uuid default gen_random_uuid() primary key,
  dietitian_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete cascade not null,
  title text,
  start_date date,
  end_date date,
  status text default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz default now()
);

create table if not exists public.nutrition_meals (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.nutrition_plans(id) on delete cascade not null,
  day_of_week int check (day_of_week between 1 and 7),
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  content text not null,
  calories int,
  macros jsonb,
  created_at timestamptz default now()
);

create table if not exists public.daily_nutrition_logs (
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

create table if not exists public.body_measurements (
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

create table if not exists public.appointments (
  id uuid default gen_random_uuid() primary key,
  dietitian_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete cascade not null,
  appointment_time timestamptz not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz default now()
);

create table if not exists public.session_notes (
  id uuid default gen_random_uuid() primary key,
  dietitian_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete cascade not null,
  appointment_id uuid references public.appointments(id) on delete set null,
  note text not null,
  is_private boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.challenges (
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

create table if not exists public.user_challenges (
  id uuid default gen_random_uuid() primary key,
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected', 'completed')),
  progress numeric default 0,
  joined_at timestamptz default now(),
  unique(challenge_id, user_id)
);

create table if not exists public.workout_templates (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  exercises jsonb not null,
  is_public boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.user_blocks (
  id uuid default gen_random_uuid() primary key,
  blocker_id uuid references public.profiles(id) on delete cascade not null,
  blocked_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  reported_user_id uuid references public.profiles(id) on delete cascade not null,
  content_type public.report_content_type not null,
  content_id uuid,
  reason text not null,
  status public.report_status default 'pending' not null,
  created_at timestamptz default now()
);

-- Uygulamanin kullandigi ama schema.sql'de olmayan tablolar
create table if not exists public.blog_posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  category text,
  author text,
  excerpt text,
  read_time text,
  created_at timestamptz default now()
);

create table if not exists public.gyms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  city text,
  district text,
  rating numeric,
  phone text,
  address text,
  discount_code text,
  image_emoji text,
  facilities text[],
  created_at timestamptz default now()
);

-- ---------- INDEXLER ----------
create index if not exists idx_workouts_user_date on public.workouts(user_id, logical_date desc);
create index if not exists idx_friendships_addressee on public.friendships(addressee_id, status);
create index if not exists idx_friendships_requester on public.friendships(requester_id, status);
create index if not exists idx_kudos_receiver on public.kudos(receiver_id);
create index if not exists idx_user_blocks_blocker on public.user_blocks(blocker_id);
create index if not exists idx_reports_status on public.reports(status);

-- ---------- FONKSIYONLAR ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Yeni Kullanici'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.auto_moderate_post()
returns trigger language plpgsql as $$
begin
  if exists (select 1 from public.blocked_keywords where new.content ilike '%' || keyword || '%') then
    new.moderation_status := 'flagged';
  else
    new.moderation_status := 'approved';
  end if;
  return new;
end;
$$;

create or replace function public.moderate_message()
returns trigger language plpgsql as $$
begin
  if exists (select 1 from public.blocked_keywords where new.content ilike '%' || keyword || '%') then
    raise exception 'İçeriğiniz topluluk kurallarına aykırı ifadeler içeriyor.';
  end if;
  return new;
end;
$$;

create or replace function public.on_post_like_notify()
returns trigger as $$
declare owner_id uuid;
begin
  select user_id into owner_id from public.posts where id = new.post_id;
  if owner_id != new.user_id then
    insert into public.notifications (user_id, actor_id, type, post_id) values (owner_id, new.user_id, 'like', new.post_id);
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.on_post_comment_notify()
returns trigger as $$
declare owner_id uuid;
begin
  select user_id into owner_id from public.posts where id = new.post_id;
  if owner_id != new.user_id then
    insert into public.notifications (user_id, actor_id, type, post_id) values (owner_id, new.user_id, 'comment', new.post_id);
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.on_dietitian_client_update_notify()
returns trigger as $$
begin
  if new.status = 'approved' and old.status = 'pending' then
    insert into public.notifications (user_id, actor_id, type) values (new.client_id, new.dietitian_id, 'dietitian_approved');
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.check_and_award_badges()
returns trigger as $$
begin
  insert into public.user_badges (user_id, badge_id)
  select new.id, b.id from public.badges b where new.current_streak >= b.streak_required
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.on_repost_notify()
returns trigger as $$
declare v_post_owner_id uuid;
begin
  select user_id into v_post_owner_id from public.posts where id = new.post_id;
  if v_post_owner_id <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, post_id) values (v_post_owner_id, new.user_id, 'repost', new.post_id);
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- ---------- TRIGGERLAR ----------
drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists trg_auto_moderate_post on public.posts;
create trigger trg_auto_moderate_post before insert on public.posts
for each row execute function public.auto_moderate_post();

drop trigger if exists trg_moderate_message on public.messages;
create trigger trg_moderate_message before insert on public.messages
for each row execute function public.moderate_message();

drop trigger if exists trg_on_post_like_notify on public.post_likes;
create trigger trg_on_post_like_notify after insert on public.post_likes
for each row execute function public.on_post_like_notify();

drop trigger if exists trg_on_post_comment_notify on public.post_comments;
create trigger trg_on_post_comment_notify after insert on public.post_comments
for each row execute function public.on_post_comment_notify();

drop trigger if exists trg_on_dietitian_client_update_notify on public.dietitian_clients;
create trigger trg_on_dietitian_client_update_notify after update on public.dietitian_clients
for each row execute function public.on_dietitian_client_update_notify();

drop trigger if exists trg_check_badges on public.profiles;
create trigger trg_check_badges after update of current_streak on public.profiles
for each row execute function public.check_and_award_badges();

drop trigger if exists trg_on_repost_notify on public.reposts;
create trigger trg_on_repost_notify after insert on public.reposts
for each row execute function public.on_repost_notify();

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.friendships enable row level security;
alter table public.kudos enable row level security;
alter table public.dietitian_clients enable row level security;
alter table public.posts enable row level security;
alter table public.blocked_keywords enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.notifications enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.reposts enable row level security;
alter table public.nutrition_plans enable row level security;
alter table public.nutrition_meals enable row level security;
alter table public.daily_nutrition_logs enable row level security;
alter table public.body_measurements enable row level security;
alter table public.appointments enable row level security;
alter table public.session_notes enable row level security;
alter table public.challenges enable row level security;
alter table public.user_challenges enable row level security;
alter table public.workout_templates enable row level security;
alter table public.user_blocks enable row level security;
alter table public.reports enable row level security;
alter table public.blog_posts enable row level security;
alter table public.gyms enable row level security;

-- ---------- POLITIKALAR (drop if exists + create) ----------
drop policy if exists "Profiles okunabilir" on public.profiles;
create policy "Profiles okunabilir" on public.profiles for select using (true);
drop policy if exists "Kendi profilini guncelle" on public.profiles;
create policy "Kendi profilini guncelle" on public.profiles for update using (auth.uid() = id);
drop policy if exists "Kendi profilini olustur" on public.profiles;
create policy "Kendi profilini olustur" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Antrenmanlar guncelleme" on public.workouts;
create policy "Antrenmanlar guncelleme" on public.workouts for select using (
  user_id = auth.uid()
  or is_public = true
  or exists (select 1 from public.friendships where status = 'accepted'
    and ((requester_id = auth.uid() and addressee_id = user_id) or (addressee_id = auth.uid() and requester_id = user_id)))
  or exists (select 1 from public.dietitian_clients where dietitian_id = auth.uid() and client_id = user_id and status = 'approved')
);
drop policy if exists "Kendi antrenmanini ekle" on public.workouts;
create policy "Kendi antrenmanini ekle" on public.workouts for insert with check (user_id = auth.uid());
drop policy if exists "Kendi antrenmanini sil" on public.workouts;
create policy "Kendi antrenmanini sil" on public.workouts for delete using (user_id = auth.uid());

drop policy if exists "Arkadasliklari gor" on public.friendships;
create policy "Arkadasliklari gor" on public.friendships for select using (requester_id = auth.uid() or addressee_id = auth.uid());
drop policy if exists "Arkadaslik istegi gonder" on public.friendships;
create policy "Arkadaslik istegi gonder" on public.friendships for insert with check (requester_id = auth.uid());
drop policy if exists "Arkadaslik guncelle" on public.friendships;
create policy "Arkadaslik guncelle" on public.friendships for update using (addressee_id = auth.uid() or requester_id = auth.uid());

drop policy if exists "Diyetisyenler danisanlarini gorur" on public.dietitian_clients;
create policy "Diyetisyenler danisanlarini gorur" on public.dietitian_clients for select using (dietitian_id = auth.uid() or client_id = auth.uid());
drop policy if exists "Diyetisyen istegi gonder" on public.dietitian_clients;
create policy "Diyetisyen istegi gonder" on public.dietitian_clients for insert with check (client_id = auth.uid());
drop policy if exists "Diyetisyen istegini guncelle" on public.dietitian_clients;
create policy "Diyetisyen istegini guncelle" on public.dietitian_clients for update using (dietitian_id = auth.uid());

drop policy if exists "Onaylanmis postlar herkes gorur" on public.posts;
create policy "Onaylanmis postlar herkes gorur" on public.posts for select using (
  (moderation_status = 'approved' or user_id = auth.uid())
  and not exists (select 1 from public.user_blocks
    where (blocker_id = auth.uid() and blocked_id = user_id) or (blocker_id = user_id and blocked_id = auth.uid()))
);
drop policy if exists "Post paylas" on public.posts;
create policy "Post paylas" on public.posts for insert with check (user_id = auth.uid());
drop policy if exists "Kendi postunu sil" on public.posts;
create policy "Kendi postunu sil" on public.posts for delete using (user_id = auth.uid());

drop policy if exists "Kendi mesajlasmalarini gor" on public.conversations;
create policy "Kendi mesajlasmalarini gor" on public.conversations for select using (participant_1 = auth.uid() or participant_2 = auth.uid());
drop policy if exists "Konusma olustur" on public.conversations;
create policy "Konusma olustur" on public.conversations for insert with check (
  (participant_1 = auth.uid() or participant_2 = auth.uid())
  and not exists (select 1 from public.user_blocks
    where (blocker_id = participant_1 and blocked_id = participant_2) or (blocker_id = participant_2 and blocked_id = participant_1))
);
drop policy if exists "Konusma guncelle" on public.conversations;
create policy "Konusma guncelle" on public.conversations for update using (participant_1 = auth.uid() or participant_2 = auth.uid());

drop policy if exists "Mesajlari gor" on public.messages;
create policy "Mesajlari gor" on public.messages for select using (
  exists (select 1 from public.conversations where id = conversation_id and (participant_1 = auth.uid() or participant_2 = auth.uid()))
);
drop policy if exists "Mesaj gonder" on public.messages;
create policy "Mesaj gonder" on public.messages for insert with check (
  sender_id = auth.uid()
  and not exists (select 1 from public.conversations c
    join public.user_blocks b on (b.blocker_id = c.participant_1 and b.blocked_id = c.participant_2)
      or (b.blocker_id = c.participant_2 and b.blocked_id = c.participant_1)
    where c.id = conversation_id)
);
drop policy if exists "Mesaj okundu guncelle" on public.messages;
create policy "Mesaj okundu guncelle" on public.messages for update using (
  exists (select 1 from public.conversations where id = conversation_id and (participant_1 = auth.uid() or participant_2 = auth.uid()))
);

drop policy if exists "Begenileri herkes gorebilir" on public.post_likes;
create policy "Begenileri herkes gorebilir" on public.post_likes for select using (true);
drop policy if exists "Kullanici begenebilir" on public.post_likes;
create policy "Kullanici begenebilir" on public.post_likes for insert with check (auth.uid() = user_id);
drop policy if exists "Kullanici begenisini kaldirabili" on public.post_likes;
create policy "Kullanici begenisini kaldirabili" on public.post_likes for delete using (auth.uid() = user_id);

drop policy if exists "Yorumlari herkes gorebilir" on public.post_comments;
create policy "Yorumlari herkes gorebilir" on public.post_comments for select using (true);
drop policy if exists "Kullanici yorum yapabilir" on public.post_comments;
create policy "Kullanici yorum yapabilir" on public.post_comments for insert with check (auth.uid() = user_id);
drop policy if exists "Kullanici kendi yorumunu silebilir" on public.post_comments;
create policy "Kullanici kendi yorumunu silebilir" on public.post_comments for delete using (auth.uid() = user_id);

drop policy if exists "Kullanici kendi bildirimlerini gorebilir" on public.notifications;
create policy "Kullanici kendi bildirimlerini gorebilir" on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "Kullanici kendi bildirimlerini guncelleyebilir" on public.notifications;
create policy "Kullanici kendi bildirimlerini guncelleyebilir" on public.notifications for update using (auth.uid() = user_id);

drop policy if exists "Rozetler herkes tarafindan gorulebilir" on public.badges;
create policy "Rozetler herkes tarafindan gorulebilir" on public.badges for select using (true);
drop policy if exists "Kullanici rozetleri herkes tarafindan gorulebilir" on public.user_badges;
create policy "Kullanici rozetleri herkes tarafindan gorulebilir" on public.user_badges for select using (true);

drop policy if exists "Repostlar okunabilir" on public.reposts;
create policy "Repostlar okunabilir" on public.reposts for select using (true);
drop policy if exists "Repost yap" on public.reposts;
create policy "Repost yap" on public.reposts for insert with check (user_id = auth.uid());
drop policy if exists "Repost sil" on public.reposts;
create policy "Repost sil" on public.reposts for delete using (user_id = auth.uid());

drop policy if exists "Plan okuma" on public.nutrition_plans;
create policy "Plan okuma" on public.nutrition_plans for select using (dietitian_id = auth.uid() or client_id = auth.uid());
drop policy if exists "Diyetisyen plan ekler" on public.nutrition_plans;
create policy "Diyetisyen plan ekler" on public.nutrition_plans for insert with check (dietitian_id = auth.uid());
drop policy if exists "Diyetisyen plan gunceller" on public.nutrition_plans;
create policy "Diyetisyen plan gunceller" on public.nutrition_plans for update using (dietitian_id = auth.uid());

drop policy if exists "Meals okuma" on public.nutrition_meals;
create policy "Meals okuma" on public.nutrition_meals for select using (
  exists(select 1 from public.nutrition_plans p where p.id = plan_id and (p.dietitian_id = auth.uid() or p.client_id = auth.uid())));
drop policy if exists "Diyetisyen meal ekler" on public.nutrition_meals;
create policy "Diyetisyen meal ekler" on public.nutrition_meals for insert with check (
  exists(select 1 from public.nutrition_plans p where p.id = plan_id and p.dietitian_id = auth.uid()));
drop policy if exists "Diyetisyen meal gunceller" on public.nutrition_meals;
create policy "Diyetisyen meal gunceller" on public.nutrition_meals for update using (
  exists(select 1 from public.nutrition_plans p where p.id = plan_id and p.dietitian_id = auth.uid()));

drop policy if exists "Beslenme log oku" on public.daily_nutrition_logs;
create policy "Beslenme log oku" on public.daily_nutrition_logs for select using (
  user_id = auth.uid() or exists(select 1 from public.dietitian_clients c where c.client_id = user_id and c.dietitian_id = auth.uid() and c.status = 'approved'));
drop policy if exists "Beslenme log ekle" on public.daily_nutrition_logs;
create policy "Beslenme log ekle" on public.daily_nutrition_logs for insert with check (user_id = auth.uid());

drop policy if exists "Olcum oku" on public.body_measurements;
create policy "Olcum oku" on public.body_measurements for select using (
  user_id = auth.uid() or exists(select 1 from public.dietitian_clients c where c.client_id = user_id and c.dietitian_id = auth.uid() and c.status = 'approved'));
drop policy if exists "Olcum ekle" on public.body_measurements;
create policy "Olcum ekle" on public.body_measurements for insert with check (user_id = auth.uid());

drop policy if exists "Randevu oku" on public.appointments;
create policy "Randevu oku" on public.appointments for select using (dietitian_id = auth.uid() or client_id = auth.uid());
drop policy if exists "Randevu ekle" on public.appointments;
create policy "Randevu ekle" on public.appointments for insert with check (client_id = auth.uid() or dietitian_id = auth.uid());
drop policy if exists "Randevu guncelle" on public.appointments;
create policy "Randevu guncelle" on public.appointments for update using (client_id = auth.uid() or dietitian_id = auth.uid());

drop policy if exists "Not oku" on public.session_notes;
create policy "Not oku" on public.session_notes for select using (dietitian_id = auth.uid() or (client_id = auth.uid() and is_private = false));
drop policy if exists "Not ekle" on public.session_notes;
create policy "Not ekle" on public.session_notes for insert with check (dietitian_id = auth.uid());
drop policy if exists "Not guncelle" on public.session_notes;
create policy "Not guncelle" on public.session_notes for update using (dietitian_id = auth.uid());

drop policy if exists "Challenge oku" on public.challenges;
create policy "Challenge oku" on public.challenges for select using (true);
drop policy if exists "Challenge ekle" on public.challenges;
create policy "Challenge ekle" on public.challenges for insert with check (creator_id = auth.uid());

drop policy if exists "UserChallenge oku" on public.user_challenges;
create policy "UserChallenge oku" on public.user_challenges for select using (
  user_id = auth.uid() or exists(select 1 from public.challenges c where c.id = challenge_id and c.creator_id = auth.uid()));
drop policy if exists "UserChallenge ekle" on public.user_challenges;
create policy "UserChallenge ekle" on public.user_challenges for insert with check (user_id = auth.uid());
drop policy if exists "UserChallenge guncelle" on public.user_challenges;
create policy "UserChallenge guncelle" on public.user_challenges for update using (user_id = auth.uid());

drop policy if exists "Template oku" on public.workout_templates;
create policy "Template oku" on public.workout_templates for select using (is_public = true or creator_id = auth.uid());
drop policy if exists "Template ekle" on public.workout_templates;
create policy "Template ekle" on public.workout_templates for insert with check (creator_id = auth.uid());

drop policy if exists "Kendi engellerini gorur" on public.user_blocks;
create policy "Kendi engellerini gorur" on public.user_blocks for select using (blocker_id = auth.uid());
drop policy if exists "Kullanici engeller" on public.user_blocks;
create policy "Kullanici engeller" on public.user_blocks for insert with check (blocker_id = auth.uid());
drop policy if exists "Kullanici engeli kaldirir" on public.user_blocks;
create policy "Kullanici engeli kaldirir" on public.user_blocks for delete using (blocker_id = auth.uid());

drop policy if exists "Sikayetleri gorme" on public.reports;
create policy "Sikayetleri gorme" on public.reports for select using (
  reporter_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
drop policy if exists "Kullanici sikayet eder" on public.reports;
create policy "Kullanici sikayet eder" on public.reports for insert with check (reporter_id = auth.uid());
drop policy if exists "Admin sikayet durumunu gunceller" on public.reports;
create policy "Admin sikayet durumunu gunceller" on public.reports for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Blog okunabilir" on public.blog_posts;
create policy "Blog okunabilir" on public.blog_posts for select using (true);
drop policy if exists "Diyetisyen blog yazar" on public.blog_posts;
create policy "Diyetisyen blog yazar" on public.blog_posts for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('dietitian', 'admin')));

drop policy if exists "Salonlar okunabilir" on public.gyms;
create policy "Salonlar okunabilir" on public.gyms for select using (true);
drop policy if exists "Giris yapan salon ekler" on public.gyms;
create policy "Giris yapan salon ekler" on public.gyms for insert with check (auth.uid() is not null);

-- ---------- VARSAYILAN VERILER ----------
insert into public.blocked_keywords (keyword) values
  ('spam'), ('reklam'),
  ('amk'), ('aq'), ('amq'), ('orospu'), ('piç'), ('sik'), ('sikerim'), ('sikiş'),
  ('göt'), ('yarrak'), ('yarak'), ('ibne'), ('kahpe'), ('puşt'), ('dalyarak'),
  ('amcık'), ('yarram'), ('sikik'), ('siktir'), ('götveren'), ('taşak'), ('tasak'),
  ('yavşak'), ('fuck'), ('shit'), ('bitch'), ('asshole'), ('cunt'), ('dick'),
  ('pussy'), ('bastard'), ('nigger'), ('faggot'), ('whore'), ('slut'), ('cock'),
  ('motherfucker')
on conflict (keyword) do nothing;

insert into public.badges (name, description, icon, streak_required)
select * from (values
  ('Haftalik Savasci', '7 gunluk antrenman serisi yaptin!', '🔥', 7),
  ('Aylik Sampiyon', '30 gunluk antrenman serisi yaptin!', '🏆', 30),
  ('Yuzyillik Cinar', '100 gunluk antrenman serisi yaptin!', '💎', 100)
) as v(name, description, icon, streak_required)
where not exists (select 1 from public.badges);

-- ---------- REALTIME (mevcut publication'i silmeden tablo ekle) ----------
do $$
declare t text;
begin
  foreach t in array array['notifications','messages','conversations','appointments','challenges','user_challenges'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Mevcut kullanicilar onboarding'e zorlanmasin
update public.profiles set onboarding_completed = true where onboarding_completed is null;

notify pgrst, 'reload schema';
