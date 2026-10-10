create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.match_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  values_notes jsonb not null default '{}'::jsonb,
  life_goals jsonb not null default '{}'::jsonb,
  relationship_expectations jsonb not null default '{}'::jsonb,
  lifestyle jsonb not null default '{}'::jsonb,
  family_expectations jsonb not null default '{}'::jsonb,
  communication_preferences jsonb not null default '{}'::jsonb,
  deal_breakers jsonb not null default '[]'::jsonb,
  complementarity_notes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.potential_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  candidate_id uuid not null references public.profiles (id) on delete cascade,
  rationale jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, candidate_id),
  check (user_id <> candidate_id)
);

create table if not exists public.questions (
  id text primary key,
  dimension text not null,
  question text not null,
  type text not null,
  options jsonb,
  interpretation_tags text[],
  sort_order int,
  active boolean not null default true
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  current_index int not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id text not null,
  value jsonb not null,
  tags text[] not null default '{}',
  updated_at timestamptz not null default now(),
  unique (assessment_id, question_id)
);

create table if not exists public.relationship_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  tags text[] not null default '{}',
  tag_weights jsonb not null default '{}'::jsonb,
  report jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_invitations (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.profiles (id) on delete cascade,
  invitee_id uuid references public.profiles (id) on delete set null,
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'ready')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days')
);

create unique index if not exists partner_invitations_active_inviter
  on public.partner_invitations (inviter_id)
  where status in ('pending', 'accepted', 'ready');

create table if not exists public.comparisons (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null unique references public.partner_invitations (id) on delete cascade,
  user_a_id uuid not null references public.profiles (id) on delete cascade,
  user_b_id uuid not null references public.profiles (id) on delete cascade,
  content jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.comparison_views (
  comparison_id uuid not null references public.comparisons (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (comparison_id, user_id)
);

create table if not exists public.conversation_prompts (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references public.comparisons (id) on delete cascade,
  category text not null,
  title text not null,
  question text not null,
  sort_order int not null default 0
);

create table if not exists public.conversation_statuses (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.conversation_prompts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('discussed', 'need_to_discuss', 'not_relevant')),
  updated_at timestamptz not null default now(),
  unique (prompt_id, user_id)
);

create table if not exists public.post_reflections (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references public.comparisons (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  selections text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (comparison_id, user_id)
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists assessments_updated_at on public.assessments;
create trigger assessments_updated_at before update on public.assessments
for each row execute function public.touch_updated_at();

drop trigger if exists answers_updated_at on public.answers;
create trigger answers_updated_at before update on public.answers
for each row execute function public.touch_updated_at();

drop trigger if exists relationship_profiles_updated_at on public.relationship_profiles;
create trigger relationship_profiles_updated_at before update on public.relationship_profiles
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.peek_invitation(invite_token text)
returns table (invitation_id uuid, inviter_display_name text, status text, expired boolean)
language sql security definer set search_path = public as $$
  select i.id, p.display_name, i.status, i.expires_at < now()
  from public.partner_invitations i
  join public.profiles p on p.id = i.inviter_id
  where i.token = invite_token;
$$;

grant execute on function public.peek_invitation(text) to anon, authenticated;

create or replace function public.accept_invitation(invite_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare inv public.partner_invitations;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into inv from public.partner_invitations where token = invite_token for update;
  if not found then raise exception 'Invitation not found'; end if;
  if inv.expires_at < now() then raise exception 'Invitation expired'; end if;
  if inv.inviter_id = auth.uid() then raise exception 'You cannot accept your own invitation'; end if;
  if inv.invitee_id is not null and inv.invitee_id <> auth.uid() then raise exception 'Invitation already accepted'; end if;
  update public.partner_invitations
    set invitee_id = auth.uid(),
        status = case when status = 'pending' then 'accepted' else status end,
        accepted_at = coalesce(accepted_at, now())
    where id = inv.id;
  return inv.id;
end;
$$;

grant execute on function public.accept_invitation(text) to authenticated;

create or replace function public.pair_tag_weights(p_invitation_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  inv public.partner_invitations;
  a_weights jsonb;
  b_weights jsonb;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into inv from public.partner_invitations where id = p_invitation_id;
  if not found then raise exception 'Invitation not found'; end if;
  if inv.inviter_id <> auth.uid() and inv.invitee_id <> auth.uid() then raise exception 'Not a participant'; end if;
  if inv.invitee_id is null then raise exception 'Invitation not accepted'; end if;
  select tag_weights into a_weights from public.relationship_profiles where user_id = inv.inviter_id;
  select tag_weights into b_weights from public.relationship_profiles where user_id = inv.invitee_id;
  if a_weights is null or b_weights is null then
    return jsonb_build_object('ready', false, 'user_a_id', inv.inviter_id, 'user_b_id', inv.invitee_id);
  end if;
  return jsonb_build_object('ready', true, 'user_a_id', inv.inviter_id, 'user_b_id', inv.invitee_id, 'a', a_weights, 'b', b_weights);
end;
$$;

grant execute on function public.pair_tag_weights(uuid) to authenticated;

create or replace function public.mark_invitation_ready(p_invitation_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare inv public.partner_invitations;
begin
  select * into inv from public.partner_invitations where id = p_invitation_id;
  if not found then raise exception 'Invitation not found'; end if;
  if inv.inviter_id <> auth.uid() and inv.invitee_id <> auth.uid() then raise exception 'Not a participant'; end if;
  update public.partner_invitations set status = 'ready' where id = p_invitation_id;
end;
$$;

grant execute on function public.mark_invitation_ready(uuid) to authenticated;

create or replace function public.delete_own_account_data()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.profiles where id = auth.uid();
end;
$$;

grant execute on function public.delete_own_account_data() to authenticated;

alter table public.profiles enable row level security;
alter table public.match_preferences enable row level security;
alter table public.potential_matches enable row level security;
alter table public.questions enable row level security;
alter table public.assessments enable row level security;
alter table public.answers enable row level security;
alter table public.relationship_profiles enable row level security;
alter table public.partner_invitations enable row level security;
alter table public.comparisons enable row level security;
alter table public.comparison_views enable row level security;
alter table public.conversation_prompts enable row level security;
alter table public.conversation_statuses enable row level security;
alter table public.post_reflections enable row level security;

drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select using (id = auth.uid());
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update using (id = auth.uid());
drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles for insert with check (id = auth.uid());
drop policy if exists "own profile delete" on public.profiles;
create policy "own profile delete" on public.profiles for delete using (id = auth.uid());
drop policy if exists "partner profile names" on public.profiles;
create policy "partner profile names" on public.profiles for select using (
  exists (
    select 1 from public.partner_invitations i
    where i.status in ('accepted', 'ready')
      and ((i.inviter_id = auth.uid() and i.invitee_id = profiles.id)
        or (i.invitee_id = auth.uid() and i.inviter_id = profiles.id))
  )
);

drop policy if exists "own preferences" on public.match_preferences;
create policy "own preferences" on public.match_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own potential matches" on public.potential_matches;
create policy "own potential matches" on public.potential_matches for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "read active questions" on public.questions;
create policy "read active questions" on public.questions for select using (active = true);
drop policy if exists "own assessments" on public.assessments;
create policy "own assessments" on public.assessments for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own answers" on public.answers;
create policy "own answers" on public.answers for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "partner answers when ready" on public.answers;
create policy "partner answers when ready" on public.answers for select using (
  exists (
    select 1 from public.partner_invitations i
    where i.status = 'ready'
      and (
        (i.inviter_id = auth.uid() and i.invitee_id = answers.user_id)
        or (i.invitee_id = auth.uid() and i.inviter_id = answers.user_id)
      )
  )
);
drop policy if exists "own relationship profile" on public.relationship_profiles;
create policy "own relationship profile" on public.relationship_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "inviter manages invitation" on public.partner_invitations;
create policy "inviter manages invitation" on public.partner_invitations for all using (inviter_id = auth.uid()) with check (inviter_id = auth.uid());
drop policy if exists "invitee reads invitation" on public.partner_invitations;
create policy "invitee reads invitation" on public.partner_invitations for select using (invitee_id = auth.uid());
drop policy if exists "invitee updates invitation" on public.partner_invitations;
create policy "invitee updates invitation" on public.partner_invitations for update using (invitee_id = auth.uid()) with check (invitee_id = auth.uid());
drop policy if exists "comparison participants" on public.comparisons;
create policy "comparison participants" on public.comparisons for select using (user_a_id = auth.uid() or user_b_id = auth.uid());
drop policy if exists "comparison insert participants" on public.comparisons;
create policy "comparison insert participants" on public.comparisons for insert with check (user_a_id = auth.uid() or user_b_id = auth.uid());
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
drop policy if exists "prompts via comparison" on public.conversation_prompts;
create policy "prompts via comparison" on public.conversation_prompts for select using (
  exists (select 1 from public.comparisons c where c.id = conversation_prompts.comparison_id and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid()))
);
drop policy if exists "prompts insert via comparison" on public.conversation_prompts;
create policy "prompts insert via comparison" on public.conversation_prompts for insert with check (
  exists (select 1 from public.comparisons c where c.id = conversation_prompts.comparison_id and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid()))
);
drop policy if exists "own conversation status" on public.conversation_statuses;
create policy "own conversation status" on public.conversation_statuses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own post reflection" on public.post_reflections;
create policy "own post reflection" on public.post_reflections for all using (user_id = auth.uid()) with check (user_id = auth.uid());
