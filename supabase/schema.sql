-- Enable extension for UUID generation
create extension if not exists pgcrypto;

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled Trip',
  slug text unique,
  trip_data jsonb not null,
  visibility text not null default 'private' check (visibility in ('private', 'unlisted', 'public')),
  share_access text not null default 'view' check (share_access in ('view', 'collaborate')),
  share_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists trips_slug_key on public.trips (slug);

alter table public.trips
  add column if not exists share_access text not null default 'view';

alter table public.trips
  drop constraint if exists trips_share_access_check;

alter table public.trips
  add constraint trips_share_access_check
  check (share_access in ('view', 'collaborate'));

update public.trips
set slug = left(
  lower(
    regexp_replace(
      coalesce(nullif(regexp_replace(title, '[^a-zA-Z0-9\\s-]', '', 'g'), ''), 'trip'),
      '\\s+',
      '-',
      'g'
    )
  ),
  23
) || '-' || substring(replace(id::text, '-', '') from 1 for 4)
where slug is null;

create table if not exists public.trip_collaborators (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('viewer', 'editor')),
  created_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create or replace function public.set_trip_owner()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.owner_id is null then
    new.owner_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_trip_owner on public.trips;
create trigger trg_set_trip_owner
before insert on public.trips
for each row execute function public.set_trip_owner();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.enforce_shared_edit_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Non-owners can edit itinerary content, but cannot change sharing/ownership fields.
  if auth.uid() is distinct from old.owner_id then
    new.owner_id := old.owner_id;
    new.slug := old.slug;
    new.visibility := old.visibility;
    new.share_access := old.share_access;
    new.share_token := old.share_token;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_touch_trips on public.trips;
create trigger trg_touch_trips
before update on public.trips
for each row execute function public.touch_updated_at();

drop trigger if exists trg_enforce_shared_edit_limits on public.trips;
create trigger trg_enforce_shared_edit_limits
before update on public.trips
for each row execute function public.enforce_shared_edit_limits();

alter table public.trips enable row level security;
alter table public.trip_collaborators enable row level security;

-- Trips: owner full access
drop policy if exists "Owners can view their trips" on public.trips;
create policy "Owners can view their trips"
on public.trips for select
using (owner_id = auth.uid());

drop policy if exists "Owners can insert their trips" on public.trips;
create policy "Owners can insert their trips"
on public.trips for insert
with check (owner_id = auth.uid());

drop policy if exists "Owners can update their trips" on public.trips;
create policy "Owners can update their trips"
on public.trips for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Collaborators can update shared trips" on public.trips;
drop policy if exists "Collaborator editors can update shared trips" on public.trips;
create policy "Collaborator editors can update shared trips"
on public.trips for update
using (
  auth.uid() is not null
  and owner_id <> auth.uid()
  and visibility in ('unlisted', 'public')
  and share_access = 'collaborate'
  and exists (
    select 1
    from public.trip_collaborators tc
    where tc.trip_id = trips.id
      and tc.user_id = auth.uid()
      and tc.role = 'editor'
  )
)
with check (
  auth.uid() is not null
  and owner_id <> auth.uid()
  and visibility in ('unlisted', 'public')
  and share_access = 'collaborate'
  and exists (
    select 1
    from public.trip_collaborators tc
    where tc.trip_id = trips.id
      and tc.user_id = auth.uid()
      and tc.role = 'editor'
  )
);

drop policy if exists "Owners can delete their trips" on public.trips;
create policy "Owners can delete their trips"
on public.trips for delete
using (owner_id = auth.uid());

-- Trips collaborator policies intentionally omitted for now to avoid
-- recursive RLS evaluation between trips <-> trip_collaborators.
drop policy if exists "Collaborators can view shared trips" on public.trips;
drop policy if exists "Editors can update shared trips" on public.trips;

-- Trips: anonymous read for unlisted/public (for share links)
drop policy if exists "Public or unlisted trips are readable" on public.trips;
create policy "Public or unlisted trips are readable"
on public.trips for select
using (visibility in ('unlisted', 'public'));

-- Collaborator table access
drop policy if exists "Users can see their collaborator rows" on public.trip_collaborators;
drop policy if exists "Owners can view collaborator rows" on public.trip_collaborators;
drop policy if exists "Owners can insert collaborators" on public.trip_collaborators;
drop policy if exists "Owners can update collaborators" on public.trip_collaborators;
drop policy if exists "Owners can delete collaborators" on public.trip_collaborators;

create policy "Users can see their collaborator rows"
on public.trip_collaborators for select
using (user_id = auth.uid());

create policy "Owners can view collaborator rows"
on public.trip_collaborators for select
using (
  exists (
    select 1
    from public.trips t
    where t.id = trip_collaborators.trip_id
      and t.owner_id = auth.uid()
  )
);

create policy "Owners can insert collaborators"
on public.trip_collaborators for insert
with check (
  exists (
    select 1
    from public.trips t
    where t.id = trip_collaborators.trip_id
      and t.owner_id = auth.uid()
  )
);

create policy "Owners can update collaborators"
on public.trip_collaborators for update
using (
  exists (
    select 1
    from public.trips t
    where t.id = trip_collaborators.trip_id
      and t.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.trips t
    where t.id = trip_collaborators.trip_id
      and t.owner_id = auth.uid()
  )
);

create policy "Owners can delete collaborators"
on public.trip_collaborators for delete
using (
  exists (
    select 1
    from public.trips t
    where t.id = trip_collaborators.trip_id
      and t.owner_id = auth.uid()
  )
);

create or replace function public.add_trip_collaborator_by_email(p_trip_id uuid, p_email text, p_role text default 'editor')
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.trips t
    where t.id = p_trip_id
      and t.owner_id = auth.uid()
  ) then
    raise exception 'Only owner can manage collaborators';
  end if;

  if p_role not in ('viewer', 'editor') then
    raise exception 'Invalid collaborator role';
  end if;

  select u.id
  into target_user_id
  from auth.users u
  where lower(u.email) = lower(trim(p_email))
  limit 1;

  if target_user_id is null then
    raise exception 'User not found for that email';
  end if;

  insert into public.trip_collaborators (trip_id, user_id, role)
  values (p_trip_id, target_user_id, p_role)
  on conflict (trip_id, user_id) do update
  set role = excluded.role;
end;
$$;

create or replace function public.remove_trip_collaborator_by_email(p_trip_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.trips t
    where t.id = p_trip_id
      and t.owner_id = auth.uid()
  ) then
    raise exception 'Only owner can manage collaborators';
  end if;

  select u.id
  into target_user_id
  from auth.users u
  where lower(u.email) = lower(trim(p_email))
  limit 1;

  if target_user_id is null then
    return;
  end if;

  delete from public.trip_collaborators
  where trip_id = p_trip_id
    and user_id = target_user_id;
end;
$$;

create or replace function public.list_trip_collaborators(p_trip_id uuid)
returns table (user_id uuid, email text, role text)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.trips t
    where t.id = p_trip_id
      and t.owner_id = auth.uid()
  ) then
    raise exception 'Only owner can view collaborators';
  end if;

  return query
  select tc.user_id, u.email::text, tc.role
  from public.trip_collaborators tc
  join auth.users u on u.id = tc.user_id
  where tc.trip_id = p_trip_id
  order by u.email asc;
end;
$$;

grant execute on function public.add_trip_collaborator_by_email(uuid, text, text) to authenticated;
grant execute on function public.remove_trip_collaborator_by_email(uuid, text) to authenticated;
grant execute on function public.list_trip_collaborators(uuid) to authenticated;
