create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists blocks_blocker_id_idx on public.blocks (blocker_id);
create index if not exists blocks_blocked_id_idx on public.blocks (blocked_id);

alter table public.blocks enable row level security;

drop policy if exists "Users can view their blocks" on public.blocks;
create policy "Users can view their blocks"
on public.blocks
for select
to authenticated
using (auth.uid() = blocker_id);

drop policy if exists "Users can create their blocks" on public.blocks;
create policy "Users can create their blocks"
on public.blocks
for insert
to authenticated
with check (auth.uid() = blocker_id);

drop policy if exists "Users can delete their blocks" on public.blocks;
create policy "Users can delete their blocks"
on public.blocks
for delete
to authenticated
using (auth.uid() = blocker_id);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_user_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default timezone('utc', now()),
  check (reporter_id <> reported_user_id)
);

create index if not exists reports_reporter_id_idx on public.reports (reporter_id);
create index if not exists reports_reported_user_id_idx on public.reports (reported_user_id);
create index if not exists reports_status_idx on public.reports (status);

alter table public.reports enable row level security;

drop policy if exists "Users can create reports" on public.reports;
create policy "Users can create reports"
on public.reports
for insert
to authenticated
with check (auth.uid() = reporter_id);

drop policy if exists "Users can view their own reports" on public.reports;
create policy "Users can view their own reports"
on public.reports
for select
to authenticated
using (auth.uid() = reporter_id);
