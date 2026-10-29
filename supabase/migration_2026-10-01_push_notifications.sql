-- Server-side push delivery via Expo Push API (pg_net).
-- Sends a push when: someone likes/comments/reposts your post, a client requests/approves a dietitian,
-- or you receive a chat message. Idempotent; safe to re-run. Failures never block the original write.

create extension if not exists pg_net with schema extensions;

alter table public.profiles add column if not exists push_token text;
alter table public.profiles add column if not exists app_language text default 'tr';

create or replace function public.send_expo_push(
  p_user_id uuid,
  p_title_tr text, p_body_tr text,
  p_title_en text, p_body_en text,
  p_screen text
) returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_token text;
  v_lang text;
begin
  select push_token, coalesce(app_language, 'tr') into v_token, v_lang
  from public.profiles where id = p_user_id;

  if v_token is null or v_token = '' or v_token not like 'ExponentPushToken%' then
    return;
  end if;

  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    headers := '{"Content-Type":"application/json","Accept":"application/json"}'::jsonb,
    body := jsonb_build_object(
      'to', v_token,
      'title', case when v_lang = 'en' then p_title_en else p_title_tr end,
      'body',  case when v_lang = 'en' then p_body_en  else p_body_tr  end,
      'sound', 'default',
      'channelId', 'vitatribe_social',
      'priority', 'high',
      'data', jsonb_build_object('screen', p_screen)
    )
  );
exception when others then
  null; -- never break the triggering insert
end;
$$;

revoke all on function public.send_expo_push(uuid, text, text, text, text, text) from public, anon, authenticated;

-- 1. In-app notification rows -> push
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

drop trigger if exists trg_push_on_notification on public.notifications;
create trigger trg_push_on_notification
after insert on public.notifications
for each row execute function public.push_on_notification();

-- 2. New client request -> notification row (and therefore push) for the dietitian
create or replace function public.on_dietitian_client_insert_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'pending' then
    insert into public.notifications (user_id, actor_id, type)
    values (new.dietitian_id, new.client_id, 'dietitian_request');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_on_dietitian_client_insert_notify on public.dietitian_clients;
create trigger trg_on_dietitian_client_insert_notify
after insert on public.dietitian_clients
for each row execute function public.on_dietitian_client_insert_notify();

-- 3. Chat message -> push to the other participant (no notification row, to keep the bell tab clean)
create or replace function public.push_on_message()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_receiver uuid;
  v_name text;
  v_preview text;
begin
  select case when participant_1 = new.sender_id then participant_2 else participant_1 end
  into v_receiver
  from public.conversations where id = new.conversation_id;

  if v_receiver is null or v_receiver = new.sender_id then
    return new;
  end if;

  select coalesce(display_name, username, '') into v_name from public.profiles where id = new.sender_id;
  v_preview := left(new.content, 80);

  perform public.send_expo_push(
    v_receiver,
    v_name, v_preview,
    v_name, v_preview,
    'chat/' || new.conversation_id::text
  );
  return new;
end;
$$;

drop trigger if exists trg_push_on_message on public.messages;
create trigger trg_push_on_message
after insert on public.messages
for each row execute function public.push_on_message();
