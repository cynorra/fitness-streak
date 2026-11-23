-- DietitianFit: professional dietitian platform (verification, directory, favorites, availability, attachments,
-- video links, client health profile, templates, bulk messages, consent, water logs, progress RPCs). Idempotent.
-- NOT EXECUTED. Review, then run once in the Supabase SQL editor (as postgres). No payments anywhere: prices are display-only.

-- ============================================================
-- 0. Profiles: country / units / consent + protect sensitive columns
-- ============================================================
alter table public.profiles add column if not exists country text;                         -- ISO-3166 alpha-2
alter table public.profiles add column if not exists units text default 'metric' check (units in ('metric','imperial'));
alter table public.profiles add column if not exists app_language text;

-- Users may flip user -> dietitian (onboarding), but never become admin, and never touch verification.
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;        -- SQL editor / service role
  if tg_op = 'INSERT' then
    if new.role = 'admin' then new.role := 'user'; end if;
    return new;
  end if;
  if new.role is distinct from old.role then
    if old.role = 'admin' or new.role = 'admin' then new.role := old.role; end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_profile_role on public.profiles;
create trigger trg_guard_profile_role before insert or update on public.profiles
for each row execute function public.guard_profile_role();

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.has_consent(p_user uuid, p_kind text) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  return exists (select 1 from public.user_consents where user_id = p_user and kind = p_kind and revoked_at is null);
end $$;

-- ============================================================
-- 1. Dietitian professional profile + manual verification
-- ============================================================
create table if not exists public.dietitian_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  title text,                                   -- e.g. "RD", "Dyt.", "MSc Clinical Nutrition"
  specialties text[] not null default '{}',     -- weight_loss, sports, diabetes, pediatric, pregnancy, vegan, ...
  languages text[] not null default '{}',       -- ISO-639-1 codes
  country text,
  timezone text not null default 'UTC',         -- IANA, availability is interpreted in this zone
  years_experience int check (years_experience is null or years_experience between 0 and 70),
  license_no text,
  diploma_path text,                            -- storage object path in private bucket 'diplomas'
  session_price numeric check (session_price is null or session_price >= 0),   -- DISPLAY ONLY, no payment flow
  price_currency text check (price_currency is null or char_length(price_currency) = 3),
  slug text unique,
  accepting_clients boolean not null default true,
  verification_status text not null default 'draft' check (verification_status in ('draft','pending','approved','rejected')),
  rejection_reason text,
  verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_dp_status on public.dietitian_profiles(verification_status);
create index if not exists idx_dp_specialties on public.dietitian_profiles using gin(specialties);
create index if not exists idx_dp_languages on public.dietitian_profiles using gin(languages);

alter table public.dietitian_profiles enable row level security;
drop policy if exists "dp owner read" on public.dietitian_profiles;
create policy "dp owner read" on public.dietitian_profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "dp owner insert" on public.dietitian_profiles;
create policy "dp owner insert" on public.dietitian_profiles for insert with check (id = auth.uid());
drop policy if exists "dp owner update" on public.dietitian_profiles;
create policy "dp owner update" on public.dietitian_profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Owners cannot self-verify: only draft/rejected -> pending (submit) is allowed from the client; anything else needs admin/SQL.
create or replace function public.guard_dietitian_verification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if auth.uid() is null or public.is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.verification_status := 'draft'; new.verified_at := null; new.verified_by := null; new.rejection_reason := null;
  else
    new.verified_at := old.verified_at; new.verified_by := old.verified_by; new.rejection_reason := old.rejection_reason;
    if new.verification_status is distinct from old.verification_status
       and not (new.verification_status = 'pending' and old.verification_status in ('draft','rejected')) then
      new.verification_status := old.verification_status;
    end if;
    -- Changing the diploma or license of an approved profile sends it back to review.
    if old.verification_status = 'approved'
       and (new.diploma_path is distinct from old.diploma_path or new.license_no is distinct from old.license_no) then
      new.verification_status := 'pending';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_dietitian_verification on public.dietitian_profiles;
create trigger trg_guard_dietitian_verification before insert or update on public.dietitian_profiles
for each row execute function public.guard_dietitian_verification();

-- Manual verification by an admin (or by you in the SQL editor):  select public.admin_set_dietitian_verification('<uuid>','approved',null);
create or replace function public.admin_set_dietitian_verification(p_id uuid, p_status text, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then raise exception 'admin only'; end if;
  if p_status not in ('approved','rejected','pending') then raise exception 'bad status'; end if;
  update public.dietitian_profiles set verification_status = p_status,
    rejection_reason = case when p_status = 'rejected' then p_reason else null end,
    verified_at = case when p_status = 'approved' then now() else null end,
    verified_by = auth.uid()
  where id = p_id;
end $$;
revoke all on function public.admin_set_dietitian_verification(uuid,text,text) from public, anon;
grant execute on function public.admin_set_dietitian_verification(uuid,text,text) to authenticated;

create or replace function public.is_verified_dietitian(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.dietitian_profiles d join public.profiles p on p.id = d.id
                 where d.id = p_id and p.role = 'dietitian' and d.verification_status = 'approved');
$$;

-- Storage: private diploma bucket. Path convention: <user_id>/<file>. Owner + admins read; nobody else.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('diplomas','diplomas', false, 10485760, array['image/jpeg','image/png','application/pdf'])
on conflict (id) do nothing;
drop policy if exists "diplomas owner write" on storage.objects;
create policy "diplomas owner write" on storage.objects for insert to authenticated
  with check (bucket_id = 'diplomas' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "diplomas owner update" on storage.objects;
create policy "diplomas owner update" on storage.objects for update to authenticated
  using (bucket_id = 'diplomas' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "diplomas read" on storage.objects;
create policy "diplomas read" on storage.objects for select to authenticated
  using (bucket_id = 'diplomas' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
drop policy if exists "diplomas owner delete" on storage.objects;
create policy "diplomas owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'diplomas' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- 2. Directory (verified only), favorites, reviews, shareable link
-- ============================================================
create table if not exists public.dietitian_favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  dietitian_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, dietitian_id)
);
alter table public.dietitian_favorites enable row level security;
drop policy if exists "fav own" on public.dietitian_favorites;
create policy "fav own" on public.dietitian_favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Public directory: ONLY verified dietitians; never exposes license_no / diploma_path / rejection data.
drop function if exists public.search_dietitians(text,text,text,text,numeric,int,int);
create function public.search_dietitians(
  p_query text default null, p_country text default null, p_language text default null,
  p_specialty text default null, p_min_rating numeric default null, p_limit int default 30, p_offset int default 0)
returns table (
  id uuid, username text, display_name text, avatar_url text, bio text, title text, specialties text[], languages text[],
  country text, timezone text, years_experience int, session_price numeric, price_currency text, slug text,
  accepting_clients boolean, verified boolean, avg_rating numeric, review_count int, client_count int, trust_score int)
language sql stable security definer set search_path = public as $$
  select p.id, p.username, p.display_name, p.avatar_url, p.bio, d.title, d.specialties, d.languages,
         d.country, d.timezone, d.years_experience, d.session_price, d.price_currency, d.slug,
         d.accepting_clients, true, coalesce(s.avg_rating,0), coalesce(s.review_count,0), coalesce(s.client_count,0), coalesce(s.trust_score,0)
  from public.dietitian_profiles d
  join public.profiles p on p.id = d.id and p.role = 'dietitian'
  left join public.get_dietitian_scores() s on s.dietitian_id = d.id
  where d.verification_status = 'approved'
    and auth.uid() is not null
    and (p_query is null or p_query = '' or (coalesce(p.display_name,'') || ' ' || p.username || ' ' || coalesce(d.title,'') || ' ' || coalesce(p.bio,'')) ilike '%' || p_query || '%')
    and (p_country is null or d.country = p_country)
    and (p_language is null or p_language = any(d.languages))
    and (p_specialty is null or p_specialty = any(d.specialties))
    and (p_min_rating is null or coalesce(s.avg_rating,0) >= p_min_rating)
  order by coalesce(s.trust_score,0) desc, p.display_name
  limit least(greatest(p_limit,1),100) offset greatest(p_offset,0);
$$;
revoke all on function public.search_dietitians(text,text,text,text,numeric,int,int) from public, anon;
grant execute on function public.search_dietitians(text,text,text,text,numeric,int,int) to authenticated;

-- Single public profile by id or slug (for shareable links https://<site>/d/<slug>). Anonymous allowed: web landing page.
create or replace function public.get_dietitian_public(p_key text)
returns table (id uuid, display_name text, avatar_url text, bio text, title text, specialties text[], languages text[],
  country text, years_experience int, session_price numeric, price_currency text, slug text, verified boolean,
  avg_rating numeric, review_count int)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, p.avatar_url, p.bio, d.title, d.specialties, d.languages, d.country, d.years_experience,
         d.session_price, d.price_currency, d.slug, true, coalesce(s.avg_rating,0), coalesce(s.review_count,0)
  from public.dietitian_profiles d
  join public.profiles p on p.id = d.id and p.role = 'dietitian'
  left join public.get_dietitian_scores() s on s.dietitian_id = d.id
  where d.verification_status = 'approved' and (d.slug = p_key or p.id::text = p_key);
$$;
grant execute on function public.get_dietitian_public(text) to anon, authenticated;

-- Unverified dietitians cannot receive client requests.
drop policy if exists "Diyetisyen istegi gonder" on public.dietitian_clients;
create policy "Diyetisyen istegi gonder" on public.dietitian_clients for insert with check (
  client_id = auth.uid() and status = 'pending' and public.is_verified_dietitian(dietitian_id)
);

-- Reviews: only a user who is/was a client (approved relationship). Existing policy already requires status='approved'.
-- Reviews are only listed for verified dietitians.
drop policy if exists "Degerlendirme oku" on public.dietitian_reviews;
create policy "Degerlendirme oku" on public.dietitian_reviews for select using (
  auth.uid() is not null and (client_id = auth.uid() or dietitian_id = auth.uid() or public.is_verified_dietitian(dietitian_id))
);

-- ============================================================
-- 3. Messaging: attachments + realtime (RLS for text already exists, re-asserted for pair-only access)
-- ============================================================
alter table public.messages alter column content drop not null;
alter table public.messages add column if not exists attachment_path text;   -- bucket chat-files, path <conversation_id>/<uuid>.<ext>
alter table public.messages add column if not exists attachment_type text check (attachment_type is null or attachment_type in ('image','file'));
alter table public.messages add column if not exists attachment_name text;
alter table public.messages add column if not exists attachment_size int;
alter table public.messages drop constraint if exists messages_has_body;
alter table public.messages add constraint messages_has_body check (content is not null and char_length(content) > 0 or attachment_path is not null);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-files','chat-files', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

create or replace function public.is_conversation_member(p_conv uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conversations c where c.id = p_conv and (c.participant_1 = auth.uid() or c.participant_2 = auth.uid()));
$$;
drop policy if exists "chat files read" on storage.objects;
create policy "chat files read" on storage.objects for select to authenticated
  using (bucket_id = 'chat-files' and public.is_conversation_member(((storage.foldername(name))[1])::uuid));
drop policy if exists "chat files write" on storage.objects;
create policy "chat files write" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-files' and public.is_conversation_member(((storage.foldername(name))[1])::uuid));
-- No update/delete policies on purpose: files are immutable; they are removed with the account (see section 9).

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
-- Realtime respects the existing SELECT policy on messages (only the two conversation participants receive rows).

-- ============================================================
-- 4. Availability + appointments (timezone-correct) + Jitsi room
-- ============================================================
create table if not exists public.dietitian_availability (
  id uuid default gen_random_uuid() primary key,
  dietitian_id uuid not null references public.profiles(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),          -- 0 = Sunday, in the dietitian's timezone
  start_time time not null,
  end_time time not null check (end_time > start_time),
  slot_minutes int not null default 45 check (slot_minutes between 15 and 180),
  created_at timestamptz default now()
);
create index if not exists idx_avail_d on public.dietitian_availability(dietitian_id, weekday);
alter table public.dietitian_availability enable row level security;
drop policy if exists "avail read" on public.dietitian_availability;
create policy "avail read" on public.dietitian_availability for select using (auth.uid() is not null);
drop policy if exists "avail own write" on public.dietitian_availability;
create policy "avail own write" on public.dietitian_availability for all using (dietitian_id = auth.uid()) with check (dietitian_id = auth.uid());

create table if not exists public.dietitian_time_off (
  id uuid default gen_random_uuid() primary key,
  dietitian_id uuid not null references public.profiles(id) on delete cascade,
  starts_at timestamptz not null, ends_at timestamptz not null check (ends_at > starts_at), reason text
);
alter table public.dietitian_time_off enable row level security;
drop policy if exists "off read" on public.dietitian_time_off;
create policy "off read" on public.dietitian_time_off for select using (auth.uid() is not null);
drop policy if exists "off own write" on public.dietitian_time_off;
create policy "off own write" on public.dietitian_time_off for all using (dietitian_id = auth.uid()) with check (dietitian_id = auth.uid());

alter table public.appointments add column if not exists duration_minutes int not null default 45;
alter table public.appointments add column if not exists video_room text;           -- Jitsi room name, URL = https://meet.jit.si/<video_room>
alter table public.appointments add column if not exists client_timezone text;
alter table public.appointments add column if not exists dietitian_timezone text;
alter table public.appointments add column if not exists note text;
-- appointment_time is timestamptz (UTC instant): the UI renders it in each viewer's own timezone.

create or replace function public.appointment_defaults()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.video_room is null then
    new.video_room := 'dietitianfit-' || replace(gen_random_uuid()::text, '-', '');   -- unguessable
  end if;
  select coalesce(new.client_timezone, timezone) into new.client_timezone from public.profiles where id = new.client_id;
  select coalesce(new.dietitian_timezone, d.timezone) into new.dietitian_timezone from public.dietitian_profiles d where d.id = new.dietitian_id;
  return new;
end $$;
drop trigger if exists trg_appointment_defaults on public.appointments;
create trigger trg_appointment_defaults before insert on public.appointments
for each row execute function public.appointment_defaults();

-- No double booking of the same dietitian slot.
create unique index if not exists uq_appointment_slot on public.appointments(dietitian_id, appointment_time)
  where status in ('pending','confirmed');

-- Free slots for [p_from, p_to] (dates in the DIETITIAN's timezone) as UTC instants. Client converts to local time.
create or replace function public.get_available_slots(p_dietitian uuid, p_from date, p_to date)
returns table (slot_start timestamptz, slot_end timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare v_tz text;
begin
  select timezone into v_tz from public.dietitian_profiles where id = p_dietitian and verification_status = 'approved';
  if v_tz is null then return; end if;
  if p_to - p_from > 31 then p_to := p_from + 31; end if;
  return query
  select s.st, s.st + make_interval(mins => s.m)
  from (
    select ((d::date + a.start_time + (g * make_interval(mins => a.slot_minutes))) at time zone v_tz) as st, a.slot_minutes as m,
           a.end_time, d::date as day, a.start_time, g, a.slot_minutes
    from generate_series(p_from, p_to, interval '1 day') d
    join public.dietitian_availability a on a.dietitian_id = p_dietitian and a.weekday = extract(dow from d)::int
    cross join lateral generate_series(0, (extract(epoch from (a.end_time - a.start_time))/60)::int / a.slot_minutes - 1) g
  ) s
  where s.st > now() + interval '1 hour'
    and not exists (select 1 from public.appointments ap where ap.dietitian_id = p_dietitian
                    and ap.status in ('pending','confirmed') and ap.appointment_time = s.st)
    and not exists (select 1 from public.dietitian_time_off o where o.dietitian_id = p_dietitian and s.st >= o.starts_at and s.st < o.ends_at)
  order by s.st;
end $$;
grant execute on function public.get_available_slots(uuid,date,date) to authenticated;

-- ============================================================
-- 5. Client health profile (height / weight goal / allergies) - visible to owner + approved dietitian only
-- ============================================================
create table if not exists public.client_health_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  height_cm numeric check (height_cm is null or height_cm between 50 and 260),
  goal text check (goal is null or goal in ('lose','maintain','gain','health')),
  target_weight_kg numeric check (target_weight_kg is null or target_weight_kg between 20 and 400),
  allergies text, conditions text, birth_year int check (birth_year is null or birth_year between 1900 and 2100),
  sex text check (sex is null or sex in ('female','male','other')),
  updated_at timestamptz default now()
);
alter table public.client_health_profiles enable row level security;
drop policy if exists "chp own" on public.client_health_profiles;
create policy "chp own" on public.client_health_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "chp dietitian read" on public.client_health_profiles;
create policy "chp dietitian read" on public.client_health_profiles for select using (
  exists (select 1 from public.dietitian_clients c where c.client_id = user_id and c.dietitian_id = auth.uid() and c.status = 'approved')
  and public.has_consent(user_id, 'health_data'));

-- ============================================================
-- 6. Consent (explicit, versioned, revocable)
-- ============================================================
create table if not exists public.user_consents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('health_data','terms','privacy')),
  version text not null,
  accepted_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists idx_consent_user on public.user_consents(user_id, kind);
alter table public.user_consents enable row level security;
drop policy if exists "consent own read" on public.user_consents;
create policy "consent own read" on public.user_consents for select using (user_id = auth.uid());
drop policy if exists "consent own insert" on public.user_consents;
create policy "consent own insert" on public.user_consents for insert with check (user_id = auth.uid() and revoked_at is null);
drop policy if exists "consent own revoke" on public.user_consents;
create policy "consent own revoke" on public.user_consents for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- 7. Dietitian tools: plan targets, water logs, templates, bulk message, weekly progress
-- ============================================================
alter table public.nutrition_plans add column if not exists target_calories int;
alter table public.nutrition_plans add column if not exists target_protein_g int;
alter table public.nutrition_plans add column if not exists target_carbs_g int;
alter table public.nutrition_plans add column if not exists target_fat_g int;
alter table public.nutrition_plans add column if not exists notes text;
-- nutrition_meals.calories + macros jsonb ({"protein_g":..,"carbs_g":..,"fat_g":..}) already exist.

create table if not exists public.water_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null,
  amount_ml int not null check (amount_ml between 1 and 5000),
  created_at timestamptz default now()
);
create index if not exists idx_water_user_date on public.water_logs(user_id, log_date);
alter table public.water_logs enable row level security;
drop policy if exists "water own" on public.water_logs;
create policy "water own" on public.water_logs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "water dietitian read" on public.water_logs;
create policy "water dietitian read" on public.water_logs for select using (
  exists (select 1 from public.dietitian_clients c where c.client_id = user_id and c.dietitian_id = auth.uid() and c.status = 'approved')
  and public.has_consent(user_id, 'health_data'));

create table if not exists public.message_templates (
  id uuid default gen_random_uuid() primary key,
  dietitian_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz default now()
);
alter table public.message_templates enable row level security;
drop policy if exists "tpl own" on public.message_templates;
create policy "tpl own" on public.message_templates for all using (dietitian_id = auth.uid()) with check (dietitian_id = auth.uid());

-- Dietitian-only private notes: session_notes.is_private = true is already hidden from the client by the existing policy.

-- Send one message to every approved client (creates conversations as needed). Returns the number of clients reached.
create or replace function public.send_bulk_message(p_body text)
returns int language plpgsql security definer set search_path = public as $$
declare r record; v_conv uuid; n int := 0;
begin
  if auth.uid() is null or not public.is_verified_dietitian(auth.uid()) then raise exception 'verified dietitian only'; end if;
  if p_body is null or char_length(trim(p_body)) = 0 or char_length(p_body) > 1000 then raise exception 'bad body'; end if;
  for r in select client_id from public.dietitian_clients where dietitian_id = auth.uid() and status = 'approved' loop
    select id into v_conv from public.conversations
      where (participant_1 = auth.uid() and participant_2 = r.client_id) or (participant_2 = auth.uid() and participant_1 = r.client_id) limit 1;
    if v_conv is null then
      insert into public.conversations(participant_1, participant_2) values (auth.uid(), r.client_id) returning id into v_conv;
    end if;
    insert into public.messages(conversation_id, sender_id, content) values (v_conv, auth.uid(), p_body);
    update public.conversations set updated_at = now() where id = v_conv;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.send_bulk_message(text) from public, anon;
grant execute on function public.send_bulk_message(text) to authenticated;

-- Weekly progress for one client (dietitian must be approved AND the client must have consented).
create or replace function public.client_weekly_progress(p_client uuid, p_weeks int default 8)
returns table (week_start date, avg_calories numeric, logged_days int, avg_weight_kg numeric, water_ml_per_day numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if p_client <> auth.uid() then
    if not exists (select 1 from public.dietitian_clients c where c.client_id = p_client and c.dietitian_id = auth.uid() and c.status = 'approved')
       or not public.has_consent(p_client, 'health_data') then
      raise exception 'not allowed';
    end if;
  end if;
  return query
  with wk as (select (date_trunc('week', current_date) - (g * 7) * interval '1 day')::date as ws from generate_series(0, least(greatest(p_weeks,1),26) - 1) g),
  cal as (select date_trunc('week', log_date)::date ws, log_date, sum(calories) cals from public.daily_nutrition_logs where user_id = p_client group by 1,2),
  w as (select date_trunc('week', date)::date ws, avg(weight_kg) wt from public.body_measurements where user_id = p_client and weight_kg is not null group by 1),
  wa as (select date_trunc('week', log_date)::date ws, sum(amount_ml)::numeric / 7 ml from public.water_logs where user_id = p_client group by 1)
  select wk.ws,
         (select round(avg(cals),0) from cal where cal.ws = wk.ws),
         (select count(*)::int from cal where cal.ws = wk.ws),
         (select round(wt,1) from w where w.ws = wk.ws),
         (select round(ml,0) from wa where wa.ws = wk.ws)
  from wk order by wk.ws;
end $$;
grant execute on function public.client_weekly_progress(uuid,int) to authenticated;

-- ============================================================
-- 8. Full account deletion incl. storage objects (Play account-deletion policy)
-- ============================================================
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth, storage as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from storage.objects where bucket_id = 'diplomas' and (storage.foldername(name))[1] = auth.uid()::text;
  delete from storage.objects where bucket_id = 'chat-files' and owner = auth.uid();
  delete from auth.users where id = auth.uid();   -- profiles and every dependent table cascade
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ============================================================
-- 9. One-time: make yourself admin (replace the email), then verify applicants:
--   update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
--   select p.username, d.* from public.dietitian_profiles d join public.profiles p on p.id = d.id where d.verification_status = 'pending';
--   -- view diploma: Dashboard > Storage > diplomas > <user_id>/...
--   select public.admin_set_dietitian_verification('<uuid>', 'approved', null);
-- Existing dietitians (role='dietitian' before this migration) are hidden from the directory until approved. To grandfather them:
-- (already executed automatically at the end of this file)
--   insert into public.dietitian_profiles(id, verification_status, verified_at) select id, 'approved', now() from public.profiles where role = 'dietitian' on conflict (id) do nothing;
-- ============================================================

-- Keep existing behavior: every dietitian that existed before this migration is grandfathered as approved
-- (revoke individually with admin_set_dietitian_verification(id,'rejected','reason') if needed).
insert into public.dietitian_profiles(id, verification_status, verified_at)
select id, 'approved', now() from public.profiles where role = 'dietitian' on conflict (id) do nothing;
