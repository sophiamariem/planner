create or replace function public.get_trip_owner_email(p_trip_id uuid)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_owner_id uuid;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select owner_id into v_owner_id
  from public.trips
  where id = p_trip_id;

  if v_owner_id is null then
    return null;
  end if;

  if v_owner_id <> auth.uid()
     and not exists (
       select 1
       from public.trip_collaborators c
       where c.trip_id = p_trip_id
         and c.user_id = auth.uid()
     ) then
    raise exception 'not_authorized';
  end if;

  select email into v_email
  from auth.users
  where id = v_owner_id;

  return v_email;
end;
$$;

create or replace function public.list_trip_owner_emails(p_trip_ids uuid[])
returns table (trip_id uuid, owner_email text)
language sql
security definer
set search_path = public, auth
as $$
  select t.id as trip_id, u.email as owner_email
  from public.trips t
  join auth.users u on u.id = t.owner_id
  where t.id = any(p_trip_ids)
    and auth.uid() is not null
    and (
      t.owner_id = auth.uid()
      or exists (
        select 1
        from public.trip_collaborators c
        where c.trip_id = t.id
          and c.user_id = auth.uid()
      )
    );
$$;

revoke all on function public.get_trip_owner_email(uuid) from public;
revoke all on function public.list_trip_owner_emails(uuid[]) from public;

grant execute on function public.get_trip_owner_email(uuid) to authenticated;
grant execute on function public.list_trip_owner_emails(uuid[]) to authenticated;
