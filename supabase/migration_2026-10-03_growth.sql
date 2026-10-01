-- Growth features: dietitian challenges with automatic progress, referrals (non-monetary rewards),
-- micro-content vertical feed, and community Q&A. Idempotent; safe to re-run.
-- Requires: migration_2026-10-01_push_notifications.sql (send_expo_push) and migration_2026-10-02_dietitian_reviews.sql.

-- =====================================================================
-- 1. CHALLENGES: only dietitians create them; progress is computed server-side
-- =====================================================================
-- goal_type values used by the app: 'workouts' (count of workouts) and 'meal_log_days' (days with a meal logged).
-- NOT VALID so pre-existing rows with other goal types do not break the migration.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'challenges_goal_type_check') then
    alter table public.challenges
      add constraint challenges_goal_type_check check (goal_type in ('workouts', 'meal_log_days')) not valid;
  end if;
end $$;

drop policy if exists "Challenge ekle" on public.challenges;
create policy "Challenge ekle" on public.challenges for insert with check (
  creator_id = auth.uid()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'dietitian')
);

drop policy if exists "Challenge sil" on public.challenges;
create policy "Challenge sil" on public.challenges for delete using (creator_id = auth.uid());

create or replace function public.refresh_challenge_progress(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r record;
begin
  for r in
    with calc as (
      -- progress per accepted challenge (correlated subqueries live in a SELECT, not in UPDATE ... FROM)
      select
        uc2.id as uc_id,
        c.title as title,
        c.goal_value as goal_value,
        case c.goal_type
          when 'workouts' then (
            select count(*) from public.workouts w
            where w.user_id = p_user
              and w.logical_date >= greatest(coalesce(c.start_date, date '0001-01-01'), uc2.joined_at::date)
              and w.logical_date <= coalesce(c.end_date, date '9999-12-31')
          )
          when 'meal_log_days' then (
            select count(distinct l.log_date) from public.daily_nutrition_logs l
            where l.user_id = p_user
              and l.log_date >= greatest(coalesce(c.start_date, date '0001-01-01'), uc2.joined_at::date)
              and l.log_date <= coalesce(c.end_date, date '9999-12-31')
          )
          else uc2.progress
        end as val
      from public.user_challenges uc2
      join public.challenges c on c.id = uc2.challenge_id
      where uc2.user_id = p_user and uc2.status = 'accepted'
    ),
    upd as (
      update public.user_challenges uc
      set progress = calc.val,
          status = case when calc.val >= calc.goal_value then 'completed' else uc.status end
      from calc
      where uc.id = calc.uc_id
      returning uc.status as new_status, calc.title as title
    )
    select title from upd where new_status = 'completed'
  loop
    perform public.send_expo_push(
      p_user,
      '🎉 VitaTribe', 'Meydan okumayı tamamladın: ' || r.title,
      '🎉 VitaTribe', 'You completed the challenge: ' || r.title,
      'challenges'
    );
  end loop;
end;
$$;

revoke all on function public.refresh_challenge_progress(uuid) from public, anon, authenticated;

create or replace function public.trg_refresh_challenges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_challenge_progress(new.user_id);
  return new;
end;
$$;

drop trigger if exists trg_challenges_on_workout on public.workouts;
create trigger trg_challenges_on_workout
after insert on public.workouts
for each row execute function public.trg_refresh_challenges();

drop trigger if exists trg_challenges_on_meal on public.daily_nutrition_logs;
create trigger trg_challenges_on_meal
after insert on public.daily_nutrition_logs
for each row execute function public.trg_refresh_challenges();

-- Joining counts activity from the join day on; recompute right away (e.g. joined after logging today).
create or replace function public.trg_refresh_on_join()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_challenge_progress(new.user_id);
  return new;
end;
$$;

drop trigger if exists trg_challenges_on_join on public.user_challenges;
create trigger trg_challenges_on_join
after insert on public.user_challenges
for each row execute function public.trg_refresh_on_join();

-- Participant counts (user_challenges rows are private, so expose only the aggregate).
create or replace function public.get_challenge_participants()
returns table (challenge_id uuid, participants int)
language sql
stable
security definer
set search_path = public
as $$
  select challenge_id, count(*)::int from public.user_challenges group by challenge_id;
$$;

revoke all on function public.get_challenge_participants() from public, anon;
grant execute on function public.get_challenge_participants() to authenticated;

-- Push the creator's approved clients when a new challenge is published.
create or replace function public.push_on_challenge()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_name text;
  c record;
begin
  select coalesce(display_name, username, '') into v_name from public.profiles where id = new.creator_id;
  for c in
    select client_id from public.dietitian_clients where dietitian_id = new.creator_id and status = 'approved'
  loop
    perform public.send_expo_push(
      c.client_id,
      '🎯 ' || v_name, 'Yeni meydan okuma: ' || new.title,
      '🎯 ' || v_name, 'New challenge: ' || new.title,
      'challenges'
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_push_on_challenge on public.challenges;
create trigger trg_push_on_challenge
after insert on public.challenges
for each row execute function public.push_on_challenge();

-- =====================================================================
-- 2. REFERRALS (rewards are non-monetary: trust-score bonus + recognition)
-- =====================================================================
alter table public.profiles add column if not exists referral_code text;
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id) on delete set null;

create or replace function public.gen_referral_code()
returns text
language plpgsql
as $$
declare
  v_code text;
begin
  loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    exit when not exists (select 1 from public.profiles where referral_code = v_code);
  end loop;
  return v_code;
end;
$$;

update public.profiles set referral_code = public.gen_referral_code() where referral_code is null;

create unique index if not exists idx_profiles_referral_code on public.profiles(referral_code);

create or replace function public.set_referral_code()
returns trigger
language plpgsql
as $$
begin
  if new.referral_code is null then
    new.referral_code := public.gen_referral_code();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_referral_code on public.profiles;
create trigger trg_set_referral_code
before insert on public.profiles
for each row execute function public.set_referral_code();

create table if not exists public.referrals (
  id uuid default gen_random_uuid() primary key,
  referrer_id uuid references public.profiles(id) on delete cascade not null,
  referred_id uuid references public.profiles(id) on delete cascade not null unique,
  created_at timestamptz default now()
);

alter table public.referrals enable row level security;
drop policy if exists "Davet oku" on public.referrals;
create policy "Davet oku" on public.referrals for select using (referrer_id = auth.uid() or referred_id = auth.uid());
-- Rows are written only through redeem_referral().

-- Returns: ok | invalid | self | already
create or replace function public.redeem_referral(p_code text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_referrer uuid;
  v_name text;
begin
  if auth.uid() is null then
    return 'invalid';
  end if;

  select id into v_referrer from public.profiles where referral_code = upper(trim(p_code));
  if v_referrer is null then
    return 'invalid';
  end if;
  if v_referrer = auth.uid() then
    return 'self';
  end if;
  if exists (select 1 from public.referrals where referred_id = auth.uid()) then
    return 'already';
  end if;

  insert into public.referrals (referrer_id, referred_id) values (v_referrer, auth.uid());
  update public.profiles set referred_by = v_referrer where id = auth.uid();

  select coalesce(display_name, username, '') into v_name from public.profiles where id = auth.uid();
  perform public.send_expo_push(
    v_referrer,
    '🤝 VitaTribe', v_name || ' davetinle katıldı!',
    '🤝 VitaTribe', v_name || ' joined with your invite!',
    '(tabs)/profile'
  );
  return 'ok';
end;
$$;

revoke all on function public.redeem_referral(text) from public, anon;
grant execute on function public.redeem_referral(text) to authenticated;

-- My code + how many people joined (active = finished onboarding).
create or replace function public.my_referral_stats()
returns table (code text, invited int, active int)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select referral_code from public.profiles where id = auth.uid()),
    (select count(*)::int from public.referrals where referrer_id = auth.uid()),
    (select count(*)::int from public.referrals r join public.profiles p on p.id = r.referred_id
       where r.referrer_id = auth.uid() and p.onboarding_completed);
$$;

revoke all on function public.my_referral_stats() from public, anon;
grant execute on function public.my_referral_stats() to authenticated;

-- Trust score now also rewards invites: +2 per ACTIVE invited user, capped at +10 (total capped at 100).
drop function if exists public.get_dietitian_scores();
create function public.get_dietitian_scores()
returns table (
  dietitian_id uuid,
  review_count int,
  avg_rating numeric,
  client_count int,
  trust_score int,
  referral_count int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id as dietitian_id,
    coalesce(r.cnt, 0)::int as review_count,
    coalesce(r.avg_rating, 0)::numeric(3,2) as avg_rating,
    coalesce(c.cnt, 0)::int as client_count,
    least(100, round(
      ((((coalesce(r.total, 0) + 3.5 * 5) / (coalesce(r.cnt, 0) + 5)) - 1) / 4) * 70
      + least(coalesce(c.cnt, 0), 20) / 20.0 * 20
      + (case when coalesce(p.bio, '') <> '' then 5 else 0 end)
      + (case when coalesce(p.specialty, '') <> '' then 5 else 0 end)
      + least(coalesce(f.cnt, 0) * 2, 10)
    ))::int as trust_score,
    coalesce(f.cnt, 0)::int as referral_count
  from public.profiles p
  left join (
    select dietitian_id, count(*) as cnt, sum(rating) as total, avg(rating) as avg_rating
    from public.dietitian_reviews group by dietitian_id
  ) r on r.dietitian_id = p.id
  left join (
    select dietitian_id, count(*) as cnt
    from public.dietitian_clients where status = 'approved' group by dietitian_id
  ) c on c.dietitian_id = p.id
  left join (
    select rf.referrer_id, count(*) as cnt
    from public.referrals rf join public.profiles rp on rp.id = rf.referred_id and rp.onboarding_completed
    group by rf.referrer_id
  ) f on f.referrer_id = p.id
  where p.role = 'dietitian';
$$;

revoke all on function public.get_dietitian_scores() from public, anon;
grant execute on function public.get_dietitian_scores() to authenticated;

-- =====================================================================
-- 3. MICRO-CONTENT FEED (dietitians post short tips) + 4. COMMUNITY Q&A
-- =====================================================================
create table if not exists public.micro_posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  kind text not null default 'tip' check (kind in ('tip', 'recipe', 'myth', 'supplement')),
  title text not null check (char_length(title) between 3 and 80),
  body text not null check (char_length(body) between 10 and 800),
  moderation_status text not null default 'approved' check (moderation_status in ('approved', 'flagged')),
  created_at timestamptz default now()
);
create index if not exists idx_micro_posts_created on public.micro_posts(created_at desc);

create table if not exists public.micro_post_likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.micro_posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (post_id, user_id)
);

create table if not exists public.qa_questions (
  id uuid default gen_random_uuid() primary key,
  asker_id uuid references public.profiles(id) on delete cascade not null,
  body text not null check (char_length(body) between 5 and 300),
  moderation_status text not null default 'approved' check (moderation_status in ('approved', 'flagged')),
  created_at timestamptz default now()
);
create index if not exists idx_qa_questions_created on public.qa_questions(created_at desc);

create table if not exists public.qa_answers (
  id uuid default gen_random_uuid() primary key,
  question_id uuid references public.qa_questions(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  body text not null check (char_length(body) between 2 and 800),
  moderation_status text not null default 'approved' check (moderation_status in ('approved', 'flagged')),
  created_at timestamptz default now()
);
create index if not exists idx_qa_answers_question on public.qa_answers(question_id, created_at);

alter table public.micro_posts enable row level security;
alter table public.micro_post_likes enable row level security;
alter table public.qa_questions enable row level security;
alter table public.qa_answers enable row level security;

-- Reads: approved content (authors always see their own)
drop policy if exists "Micro oku" on public.micro_posts;
create policy "Micro oku" on public.micro_posts for select using (moderation_status = 'approved' or author_id = auth.uid());
drop policy if exists "Micro ekle" on public.micro_posts;
create policy "Micro ekle" on public.micro_posts for insert with check (
  author_id = auth.uid()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'dietitian')
);
drop policy if exists "Micro sil" on public.micro_posts;
create policy "Micro sil" on public.micro_posts for delete using (author_id = auth.uid());

drop policy if exists "Micro begeni oku" on public.micro_post_likes;
create policy "Micro begeni oku" on public.micro_post_likes for select using (auth.uid() is not null);
drop policy if exists "Micro begeni ekle" on public.micro_post_likes;
create policy "Micro begeni ekle" on public.micro_post_likes for insert with check (user_id = auth.uid());
drop policy if exists "Micro begeni sil" on public.micro_post_likes;
create policy "Micro begeni sil" on public.micro_post_likes for delete using (user_id = auth.uid());

drop policy if exists "Soru oku" on public.qa_questions;
create policy "Soru oku" on public.qa_questions for select using (moderation_status = 'approved' or asker_id = auth.uid());
drop policy if exists "Soru ekle" on public.qa_questions;
create policy "Soru ekle" on public.qa_questions for insert with check (asker_id = auth.uid());
drop policy if exists "Soru sil" on public.qa_questions;
create policy "Soru sil" on public.qa_questions for delete using (asker_id = auth.uid());

drop policy if exists "Cevap oku" on public.qa_answers;
create policy "Cevap oku" on public.qa_answers for select using (moderation_status = 'approved' or author_id = auth.uid());
drop policy if exists "Cevap ekle" on public.qa_answers;
create policy "Cevap ekle" on public.qa_answers for insert with check (
  author_id = auth.uid()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'dietitian')
);
drop policy if exists "Cevap sil" on public.qa_answers;
create policy "Cevap sil" on public.qa_answers for delete using (author_id = auth.uid());

-- Keyword moderation (same blocked_keywords list as the social feed)
create or replace function public.moderate_text_row()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_text text;
begin
  v_text := coalesce(to_jsonb(new)->>'title', '') || ' ' || coalesce(to_jsonb(new)->>'body', '');
  if exists (select 1 from public.blocked_keywords k where v_text ilike '%' || k.keyword || '%') then
    new.moderation_status := 'flagged';
  else
    new.moderation_status := 'approved';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_moderate_micro_posts on public.micro_posts;
create trigger trg_moderate_micro_posts before insert on public.micro_posts
for each row execute function public.moderate_text_row();

drop trigger if exists trg_moderate_qa_questions on public.qa_questions;
create trigger trg_moderate_qa_questions before insert on public.qa_questions
for each row execute function public.moderate_text_row();

drop trigger if exists trg_moderate_qa_answers on public.qa_answers;
create trigger trg_moderate_qa_answers before insert on public.qa_answers
for each row execute function public.moderate_text_row();

-- Like counts without exposing who liked what
create or replace function public.get_micro_post_likes(p_ids uuid[])
returns table (post_id uuid, likes int, liked_by_me boolean)
language sql
stable
security definer
set search_path = public
as $$
  select l.post_id, count(*)::int, bool_or(l.user_id = auth.uid())
  from public.micro_post_likes l
  where l.post_id = any(p_ids)
  group by l.post_id;
$$;

revoke all on function public.get_micro_post_likes(uuid[]) from public, anon;
grant execute on function public.get_micro_post_likes(uuid[]) to authenticated;

-- Push the asker when a dietitian answers.
create or replace function public.push_on_qa_answer()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_asker uuid;
  v_name text;
begin
  select asker_id into v_asker from public.qa_questions where id = new.question_id;
  if v_asker is null or v_asker = new.author_id or new.moderation_status <> 'approved' then
    return new;
  end if;
  select coalesce(display_name, username, '') into v_name from public.profiles where id = new.author_id;
  perform public.send_expo_push(
    v_asker,
    '💬 ' || v_name, 'Sorunu yanıtladı: ' || left(new.body, 80),
    '💬 ' || v_name, 'Answered your question: ' || left(new.body, 80),
    'learn'
  );
  return new;
end;
$$;

drop trigger if exists trg_push_on_qa_answer on public.qa_answers;
create trigger trg_push_on_qa_answer
after insert on public.qa_answers
for each row execute function public.push_on_qa_answer();
