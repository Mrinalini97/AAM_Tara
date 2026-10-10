-- Run in Supabase SQL editor if the app database already exists.
create table if not exists public.comparison_views (
  comparison_id uuid not null references public.comparisons (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (comparison_id, user_id)
);

alter table public.comparison_views enable row level security;

drop policy if exists "comparison views participants insert" on public.comparison_views;
create policy "comparison views participants insert" on public.comparison_views for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.comparisons c
    where c.id = comparison_id and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
  )
);

drop policy if exists "comparison views own read" on public.comparison_views;
create policy "comparison views own read" on public.comparison_views for select using (user_id = auth.uid());
