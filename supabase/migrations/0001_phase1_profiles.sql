create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  name text,
  age integer check (age is null or age between 18 and 100),
  gender text check (gender in ('male', 'female', 'other')),
  gender_preference text check (gender_preference in ('male', 'female', 'both')) default 'both',
  bio text,
  avatar_url text,
  interests text[] not null default '{}',
  latitude double precision,
  longitude double precision,
  is_profile_complete boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    name,
    age,
    gender,
    gender_preference,
    bio,
    avatar_url,
    interests,
    latitude,
    longitude,
    is_profile_complete
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'name',
    nullif(new.raw_user_meta_data ->> 'age', '')::integer,
    new.raw_user_meta_data ->> 'gender',
    coalesce(new.raw_user_meta_data ->> 'genderPreference', 'both'),
    new.raw_user_meta_data ->> 'bio',
    new.raw_user_meta_data ->> 'profilePhoto',
    coalesce(
      array(
        select jsonb_array_elements_text(
          coalesce(new.raw_user_meta_data -> 'interests', '[]'::jsonb)
        )
      ),
      '{}'
    ),
    nullif(new.raw_user_meta_data ->> 'latitude', '')::double precision,
    nullif(new.raw_user_meta_data ->> 'longitude', '')::double precision,
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);
