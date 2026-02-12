create table if not exists public.import_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.import_usage enable row level security;

-- No client-facing policies: only service role / security definer RPC should mutate.

create or replace function public.bump_import_usage(p_user_id uuid, p_day date, p_inc integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count integer;
begin
  insert into public.import_usage (user_id, day, count)
  values (p_user_id, p_day, greatest(coalesce(p_inc, 1), 0))
  on conflict (user_id, day)
  do update set
    count = public.import_usage.count + greatest(coalesce(p_inc, 1), 0),
    updated_at = now()
  returning count into next_count;

  return next_count;
end;
$$;

revoke all on function public.bump_import_usage(uuid, date, integer) from public;
grant execute on function public.bump_import_usage(uuid, date, integer) to service_role;
