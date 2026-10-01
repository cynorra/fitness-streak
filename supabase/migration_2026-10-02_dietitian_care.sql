-- Dietitian care: recommendations on a client's meals + push when a recommendation/plan arrives.
-- Idempotent. Requires migration_2026-10-01_push_notifications.sql (send_expo_push) to have been run.

create table if not exists public.meal_feedback (
  id uuid default gen_random_uuid() primary key,
  log_id uuid references public.daily_nutrition_logs(id) on delete cascade not null,
  dietitian_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete cascade not null,
  message text not null check (char_length(message) between 1 and 1000),
  created_at timestamptz default now()
);

create index if not exists idx_meal_feedback_log on public.meal_feedback(log_id);
create index if not exists idx_meal_feedback_client on public.meal_feedback(client_id, created_at desc);

alter table public.meal_feedback enable row level security;

drop policy if exists "Oneri oku" on public.meal_feedback;
create policy "Oneri oku" on public.meal_feedback for select using (
  dietitian_id = auth.uid() or client_id = auth.uid()
);

-- Only an approved dietitian of the client may write, and only on that client's own log.
drop policy if exists "Oneri ekle" on public.meal_feedback;
create policy "Oneri ekle" on public.meal_feedback for insert with check (
  dietitian_id = auth.uid()
  and exists (
    select 1 from public.dietitian_clients c
    where c.dietitian_id = auth.uid() and c.client_id = meal_feedback.client_id and c.status = 'approved'
  )
  and exists (
    select 1 from public.daily_nutrition_logs l
    where l.id = meal_feedback.log_id and l.user_id = meal_feedback.client_id
  )
);

drop policy if exists "Oneri sil" on public.meal_feedback;
create policy "Oneri sil" on public.meal_feedback for delete using (dietitian_id = auth.uid());

-- Clients can read plans/meals addressed to them (re-asserted here for safety).
drop policy if exists "Plan okuma" on public.nutrition_plans;
create policy "Plan okuma" on public.nutrition_plans for select using (
  dietitian_id = auth.uid() or client_id = auth.uid()
);

-- Push: recommendation written -> client
create or replace function public.push_on_meal_feedback()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_name text;
begin
  select coalesce(display_name, username, '') into v_name from public.profiles where id = new.dietitian_id;
  perform public.send_expo_push(
    new.client_id,
    '🥗 ' || v_name, left(new.message, 90),
    '🥗 ' || v_name, left(new.message, 90),
    'nutrition/log'
  );
  return new;
end;
$$;

drop trigger if exists trg_push_on_meal_feedback on public.meal_feedback;
create trigger trg_push_on_meal_feedback
after insert on public.meal_feedback
for each row execute function public.push_on_meal_feedback();

-- Push: new plan -> client
create or replace function public.push_on_nutrition_plan()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_name text;
begin
  select coalesce(display_name, username, '') into v_name from public.profiles where id = new.dietitian_id;
  perform public.send_expo_push(
    new.client_id,
    '🥗 ' || v_name, 'Sana yeni bir beslenme planı hazırladı: ' || coalesce(new.title, ''),
    '🥗 ' || v_name, 'prepared a new nutrition plan for you: ' || coalesce(new.title, ''),
    'my-plans'
  );
  return new;
end;
$$;

drop trigger if exists trg_push_on_nutrition_plan on public.nutrition_plans;
create trigger trg_push_on_nutrition_plan
after insert on public.nutrition_plans
for each row execute function public.push_on_nutrition_plan();

-- A member may only create a PENDING request; approval is the dietitian's decision (prevents self-approval).
drop policy if exists "Diyetisyen istegi gonder" on public.dietitian_clients;
create policy "Diyetisyen istegi gonder" on public.dietitian_clients for insert with check (
  client_id = auth.uid()
  and status = 'pending'
  and exists (select 1 from public.profiles p where p.id = dietitian_id and p.role = 'dietitian')
);
