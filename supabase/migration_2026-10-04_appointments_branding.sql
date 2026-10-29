-- Appointments become usable (create / confirm / cancel) + DietitianFit push branding. Idempotent.

-- 1. Participants may update an appointment (confirm / cancel / complete).
drop policy if exists "Randevu guncelle" on public.appointments;
create policy "Randevu guncelle" on public.appointments for update
  using (dietitian_id = auth.uid() or client_id = auth.uid())
  with check (dietitian_id = auth.uid() or client_id = auth.uid());

-- 2. Only an approved dietitian<->client pair can book each other.
drop policy if exists "Randevu ekle" on public.appointments;
create policy "Randevu ekle" on public.appointments for insert with check (
  (client_id = auth.uid() or dietitian_id = auth.uid())
  and exists (
    select 1 from public.dietitian_clients dc
    where dc.dietitian_id = appointments.dietitian_id
      and dc.client_id = appointments.client_id
      and dc.status = 'approved'
  )
);

-- 3. Push the other party on a new appointment / status change.
create or replace function public.push_on_appointment()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_actor uuid := auth.uid();
  v_target uuid;
  v_name text;
  v_when_tr text;
  v_when_en text;
begin
  if v_actor is null then return new; end if;
  v_target := case when v_actor = new.dietitian_id then new.client_id else new.dietitian_id end;
  select coalesce(display_name, username, '') into v_name from public.profiles where id = v_actor;
  v_when_tr := to_char(new.appointment_time at time zone 'Europe/Istanbul', 'DD.MM HH24:MI');
  v_when_en := v_when_tr;

  if tg_op = 'INSERT' then
    if new.status = 'pending' then
      perform public.send_expo_push(v_target, 'DietitianFit 📅', v_name || ' ' || v_when_tr || ' için randevu istedi', 'DietitianFit 📅', v_name || ' requested an appointment for ' || v_when_en, 'appointments');
    else
      perform public.send_expo_push(v_target, 'DietitianFit 📅', v_name || ' seninle ' || v_when_tr || ' için randevu oluşturdu', 'DietitianFit 📅', v_name || ' booked an appointment with you for ' || v_when_en, 'appointments');
    end if;
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'confirmed' then
      perform public.send_expo_push(v_target, 'DietitianFit 📅', v_name || ' randevunu onayladı (' || v_when_tr || ')', 'DietitianFit 📅', v_name || ' confirmed your appointment (' || v_when_en || ')', 'appointments');
    elsif new.status = 'cancelled' then
      perform public.send_expo_push(v_target, 'DietitianFit 📅', v_name || ' randevuyu iptal etti (' || v_when_tr || ')', 'DietitianFit 📅', v_name || ' cancelled the appointment (' || v_when_en || ')', 'appointments');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_push_on_appointment on public.appointments;
create trigger trg_push_on_appointment
after insert or update on public.appointments
for each row execute function public.push_on_appointment();

-- 4. Rebrand the in-app-notification pushes (DietitianFit -> DietitianFit).
create or replace function public.push_on_notification()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_name text;
begin
  select coalesce(display_name, username, '') into v_name from public.profiles where id = new.actor_id;

  if new.type = 'like' then
    perform public.send_expo_push(new.user_id, 'DietitianFit', v_name || ' gönderini beğendi ❤️', 'DietitianFit', v_name || ' liked your post ❤️', '(tabs)/notifications');
  elsif new.type = 'comment' then
    perform public.send_expo_push(new.user_id, 'DietitianFit', v_name || ' gönderine yorum yaptı 💬', 'DietitianFit', v_name || ' commented on your post 💬', '(tabs)/notifications');
  elsif new.type = 'repost' then
    perform public.send_expo_push(new.user_id, 'DietitianFit', v_name || ' gönderini paylaştı 🔄', 'DietitianFit', v_name || ' reposted your post 🔄', '(tabs)/notifications');
  elsif new.type = 'dietitian_request' then
    perform public.send_expo_push(new.user_id, 'DietitianFit 🥗', v_name || ' seninle çalışmak istiyor', 'DietitianFit 🥗', v_name || ' wants to work with you', 'dietitian/clients');
  elsif new.type = 'dietitian_approved' then
    perform public.send_expo_push(new.user_id, 'DietitianFit 🥗', v_name || ' talebini onayladı ✅', 'DietitianFit 🥗', v_name || ' approved your request ✅', '(tabs)/notifications');
  end if;
  return new;
end;
$$;
