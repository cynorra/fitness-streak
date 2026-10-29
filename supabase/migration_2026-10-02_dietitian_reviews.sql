-- Dietitian ratings (1-5 stars) and the derived trust score. Idempotent.
-- Requires migration_2026-10-01_push_notifications.sql (send_expo_push) for the push on new reviews.

create table if not exists public.dietitian_reviews (
  id uuid default gen_random_uuid() primary key,
  dietitian_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete cascade not null,
  rating int not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 500),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (dietitian_id, client_id)
);

create index if not exists idx_dietitian_reviews_dietitian on public.dietitian_reviews(dietitian_id, created_at desc);

alter table public.dietitian_reviews enable row level security;

-- Reviews are public to signed-in users (they are what the trust score is built on).
drop policy if exists "Degerlendirme oku" on public.dietitian_reviews;
create policy "Degerlendirme oku" on public.dietitian_reviews for select using (auth.uid() is not null);

-- Only an APPROVED client of that dietitian may rate, and only as themselves (one review per pair).
drop policy if exists "Degerlendirme ekle" on public.dietitian_reviews;
create policy "Degerlendirme ekle" on public.dietitian_reviews for insert with check (
  client_id = auth.uid()
  and exists (
    select 1 from public.dietitian_clients c
    where c.client_id = auth.uid() and c.dietitian_id = dietitian_reviews.dietitian_id and c.status = 'approved'
  )
);

drop policy if exists "Degerlendirme guncelle" on public.dietitian_reviews;
create policy "Degerlendirme guncelle" on public.dietitian_reviews for update
  using (client_id = auth.uid()) with check (client_id = auth.uid());

drop policy if exists "Degerlendirme sil" on public.dietitian_reviews;
create policy "Degerlendirme sil" on public.dietitian_reviews for delete using (client_id = auth.uid());

create or replace function public.touch_dietitian_review()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_dietitian_review on public.dietitian_reviews;
create trigger trg_touch_dietitian_review
before update on public.dietitian_reviews
for each row execute function public.touch_dietitian_review();

-- Trust score (0-100):
--   up to 70 pts  Bayesian-smoothed star rating (prior 3.5 worth 5 reviews, so one 5-star review cannot max it out)
--   up to 20 pts  approved client count (capped at 20 clients)
--   up to 10 pts  profile completeness (bio 5 + specialty 5)
-- Return shape changed over time (growth migration adds referral_count): always recreate.
drop function if exists public.get_dietitian_scores();
create function public.get_dietitian_scores()
returns table (
  dietitian_id uuid,
  review_count int,
  avg_rating numeric,
  client_count int,
  trust_score int
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
    round(
      ((((coalesce(r.total, 0) + 3.5 * 5) / (coalesce(r.cnt, 0) + 5)) - 1) / 4) * 70
      + least(coalesce(c.cnt, 0), 20) / 20.0 * 20
      + (case when coalesce(p.bio, '') <> '' then 5 else 0 end)
      + (case when coalesce(p.specialty, '') <> '' then 5 else 0 end)
    )::int as trust_score
  from public.profiles p
  left join (
    select dietitian_id, count(*) as cnt, sum(rating) as total, avg(rating) as avg_rating
    from public.dietitian_reviews group by dietitian_id
  ) r on r.dietitian_id = p.id
  left join (
    select dietitian_id, count(*) as cnt
    from public.dietitian_clients where status = 'approved' group by dietitian_id
  ) c on c.dietitian_id = p.id
  where p.role = 'dietitian';
$$;

revoke all on function public.get_dietitian_scores() from public, anon;
grant execute on function public.get_dietitian_scores() to authenticated;

-- Push the dietitian when a review arrives.
create or replace function public.push_on_dietitian_review()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_name text;
begin
  select coalesce(display_name, username, '') into v_name from public.profiles where id = new.client_id;
  perform public.send_expo_push(
    new.dietitian_id,
    'DietitianFit ⭐', v_name || ' sana ' || new.rating || ' yıldız verdi',
    'DietitianFit ⭐', v_name || ' rated you ' || new.rating || ' stars',
    'dietitian/clients'
  );
  return new;
end;
$$;

drop trigger if exists trg_push_on_dietitian_review on public.dietitian_reviews;
create trigger trg_push_on_dietitian_review
after insert on public.dietitian_reviews
for each row execute function public.push_on_dietitian_review();
