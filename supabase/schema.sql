-- Enable extension for UUID generation
create extension if not exists pgcrypto;

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled Trip',
  slug text unique,
  trip_data jsonb not null,
  visibility text not null default 'private' check (visibility in ('private', 'unlisted', 'public')),
  share_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists trips_slug_key on public.trips (slug);

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

drop trigger if exists trg_touch_trips on public.trips;
create trigger trg_touch_trips
before update on public.trips
for each row execute function public.touch_updated_at();

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

drop policy if exists "Owners can delete their trips" on public.trips;
create policy "Owners can delete their trips"
on public.trips for delete
using (owner_id = auth.uid());

-- Trips: collaborators read, editors write
drop policy if exists "Collaborators can view shared trips" on public.trips;
create policy "Collaborators can view shared trips"
on public.trips for select
using (
  exists (
    select 1
    from public.trip_collaborators c
    where c.trip_id = id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "Editors can update shared trips" on public.trips;
create policy "Editors can update shared trips"
on public.trips for update
using (
  exists (
    select 1
    from public.trip_collaborators c
    where c.trip_id = id
      and c.user_id = auth.uid()
      and c.role = 'editor'
  )
)
with check (
  exists (
    select 1
    from public.trip_collaborators c
    where c.trip_id = id
      and c.user_id = auth.uid()
      and c.role = 'editor'
  )
);

-- Trips: anonymous read for unlisted/public (for share links)
drop policy if exists "Public or unlisted trips are readable" on public.trips;
create policy "Public or unlisted trips are readable"
on public.trips for select
using (visibility in ('unlisted', 'public'));

-- Collaborator table access
drop policy if exists "Owners can manage collaborators" on public.trip_collaborators;
create policy "Owners can manage collaborators"
on public.trip_collaborators for all
using (
  exists (
    select 1 from public.trips t
    where t.id = trip_id and t.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.trips t
    where t.id = trip_id and t.owner_id = auth.uid()
  )
);

drop policy if exists "Users can see their collaborator rows" on public.trip_collaborators;
create policy "Users can see their collaborator rows"
on public.trip_collaborators for select
using (user_id = auth.uid());
