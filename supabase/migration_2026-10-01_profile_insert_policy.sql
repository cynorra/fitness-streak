-- Google OAuth ile ilk girişte profil satırı yoksa istemci kendi profilini oluşturabilsin.
drop policy if exists "Kendi profilini olustur" on public.profiles;
create policy "Kendi profilini olustur" on public.profiles
  for insert with check (auth.uid() = id);

-- Kullanıcı kaydında profil trigger'ı (Google metadata + çakışmasız username) — idempotent.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
