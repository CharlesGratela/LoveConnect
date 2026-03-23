alter table public.profiles
add column if not exists member_since timestamptz not null default timezone('utc', now());

drop policy if exists "Profiles are viewable by owner" on public.profiles;
drop policy if exists "Authenticated users can view profiles" on public.profiles;
create policy "Authenticated users can view profiles"
on public.profiles
for select
to authenticated
using (true);

create table if not exists public.swipes (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  to_user_id uuid not null references public.profiles (id) on delete cascade,
  action text not null check (action in ('like', 'dislike')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (from_user_id, to_user_id)
);

create index if not exists swipes_from_user_id_idx on public.swipes (from_user_id);
create index if not exists swipes_to_user_id_idx on public.swipes (to_user_id);

alter table public.swipes enable row level security;

drop policy if exists "Users can view swipes they sent or received" on public.swipes;
create policy "Users can view swipes they sent or received"
on public.swipes
for select
to authenticated
using (auth.uid() = from_user_id or auth.uid() = to_user_id);

drop policy if exists "Users can insert their own swipes" on public.swipes;
create policy "Users can insert their own swipes"
on public.swipes
for insert
to authenticated
with check (auth.uid() = from_user_id);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null references public.profiles (id) on delete cascade,
  user2_id uuid not null references public.profiles (id) on delete cascade,
  matched_at timestamptz not null default timezone('utc', now()),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user1_id, user2_id),
  check (user1_id <> user2_id)
);

create index if not exists matches_user1_id_idx on public.matches (user1_id);
create index if not exists matches_user2_id_idx on public.matches (user2_id);

alter table public.matches enable row level security;

drop policy if exists "Users can view their matches" on public.matches;
create policy "Users can view their matches"
on public.matches
for select
to authenticated
using (auth.uid() = user1_id or auth.uid() = user2_id);

drop policy if exists "Users can create matches they belong to" on public.matches;
create policy "Users can create matches they belong to"
on public.matches
for insert
to authenticated
with check (auth.uid() = user1_id or auth.uid() = user2_id);

drop policy if exists "Users can delete their matches" on public.matches;
create policy "Users can delete their matches"
on public.matches
for delete
to authenticated
using (auth.uid() = user1_id or auth.uid() = user2_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 1000),
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists messages_match_id_created_at_idx on public.messages (match_id, created_at asc);
create index if not exists messages_receiver_id_read_at_idx on public.messages (receiver_id, read_at);

alter table public.messages enable row level security;

drop policy if exists "Users can view messages in their matches" on public.messages;
create policy "Users can view messages in their matches"
on public.messages
for select
to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Users can send messages in their matches" on public.messages;
create policy "Users can send messages in their matches"
on public.messages
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.matches
    where matches.id = match_id
      and matches.is_active = true
      and (
        (matches.user1_id = sender_id and matches.user2_id = receiver_id)
        or (matches.user2_id = sender_id and matches.user1_id = receiver_id)
      )
  )
);

drop policy if exists "Receivers can update their message read state" on public.messages;
create policy "Receivers can update their message read state"
on public.messages
for update
to authenticated
using (auth.uid() = receiver_id)
with check (auth.uid() = receiver_id);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, endpoint)
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop trigger if exists push_subscriptions_set_updated_at on public.push_subscriptions;
create trigger push_subscriptions_set_updated_at
before update on public.push_subscriptions
for each row
execute function public.set_updated_at();

drop policy if exists "Users can view their own push subscriptions" on public.push_subscriptions;
create policy "Users can view their own push subscriptions"
on public.push_subscriptions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own push subscriptions" on public.push_subscriptions;
create policy "Users can insert their own push subscriptions"
on public.push_subscriptions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own push subscriptions" on public.push_subscriptions;
create policy "Users can update their own push subscriptions"
on public.push_subscriptions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own push subscriptions" on public.push_subscriptions;
create policy "Users can delete their own push subscriptions"
on public.push_subscriptions
for delete
to authenticated
using (auth.uid() = user_id);
