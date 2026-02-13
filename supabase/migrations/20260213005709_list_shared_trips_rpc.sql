create or replace function public.list_my_trips_including_shared()
returns table (
  id uuid,
  slug text,
  title text,
  visibility text,
  share_access text,
  share_token text,
  trip_data jsonb,
  owner_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  my_role text
)
language sql
security definer
set search_path = public
as $$
  select
    t.id,
    t.slug,
    t.title,
    t.visibility,
    t.share_access,
    t.share_token,
    t.trip_data,
    t.owner_id,
    t.created_at,
    t.updated_at,
    case
      when t.owner_id = auth.uid() then 'owner'
      else coalesce(c.role, 'viewer')
    end as my_role
  from public.trips t
  left join public.trip_collaborators c
    on c.trip_id = t.id
    and c.user_id = auth.uid()
  where auth.uid() is not null
    and (
      t.owner_id = auth.uid()
      or c.user_id = auth.uid()
    )
  order by t.updated_at desc
  limit 200;
$$;

create or replace function public.get_trip_for_user(p_trip_id uuid)
returns table (
  id uuid,
  slug text,
  title text,
  visibility text,
  share_access text,
  share_token text,
  trip_data jsonb,
  owner_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  my_role text
)
language sql
security definer
set search_path = public
as $$
  select
    t.id,
    t.slug,
    t.title,
    t.visibility,
    t.share_access,
    t.share_token,
    t.trip_data,
    t.owner_id,
    t.created_at,
    t.updated_at,
    case
      when t.owner_id = auth.uid() then 'owner'
      else coalesce(c.role, 'viewer')
    end as my_role
  from public.trips t
  left join public.trip_collaborators c
    on c.trip_id = t.id
    and c.user_id = auth.uid()
  where auth.uid() is not null
    and t.id = p_trip_id
    and (
      t.owner_id = auth.uid()
      or c.user_id = auth.uid()
    )
  limit 1;
$$;

revoke all on function public.list_my_trips_including_shared() from public;
revoke all on function public.get_trip_for_user(uuid) from public;

grant execute on function public.list_my_trips_including_shared() to authenticated;
grant execute on function public.get_trip_for_user(uuid) to authenticated;
