create table if not exists public.user_embeddings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  profile_hash text not null,
  embedding jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.user_embeddings enable row level security;

drop trigger if exists user_embeddings_set_updated_at on public.user_embeddings;
create trigger user_embeddings_set_updated_at
before update on public.user_embeddings
for each row
execute function public.set_updated_at();
