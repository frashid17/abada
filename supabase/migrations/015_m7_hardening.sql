-- M7 hardening: atomic rate-limit counters + audit log retention.

-- The unique constraint on rate_limits does not dedupe NULL tenant_id rows
-- (NULL <> NULL in Postgres). Use an expression index so platform-wide limits
-- (tenant_id is null) also upsert atomically.
create unique index if not exists rate_limits_window_key_idx
  on public.rate_limits (
    subject_sub,
    action_key,
    window_start,
    coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

-- Atomically increment a counter for the window and return the new count.
-- Callers compare the returned count against their limit.
create or replace function public.increment_rate_limit(
  p_subject_sub text,
  p_action_key text,
  p_window_start timestamptz,
  p_tenant_id uuid default null
)
returns int
language sql
security definer
set search_path = public
as $$
  insert into public.rate_limits (tenant_id, subject_sub, action_key, window_start, count)
  values (p_tenant_id, p_subject_sub, p_action_key, p_window_start, 1)
  on conflict (
    subject_sub,
    action_key,
    window_start,
    coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  do update set count = public.rate_limits.count + 1
  returning count;
$$;

grant execute on function public.increment_rate_limit(text, text, timestamptz, uuid) to service_role;

-- Drop counters once their window is comfortably past (nothing reads old rows).
create or replace function public.purge_stale_rate_limits()
returns int
language sql
security definer
set search_path = public
as $$
  with deleted as (
    delete from public.rate_limits
    where window_start < now() - interval '2 days'
    returning 1
  )
  select count(*)::int from deleted;
$$;

grant execute on function public.purge_stale_rate_limits() to service_role;

-- Audit retention: 3 years per platform policy. Schedule via pg_cron or a
-- periodic job runner; callable manually meanwhile.
create or replace function public.purge_expired_audit_logs()
returns int
language sql
security definer
set search_path = public
as $$
  with deleted as (
    delete from public.audit_logs
    where created_at < now() - interval '3 years'
    returning 1
  )
  select count(*)::int from deleted;
$$;

grant execute on function public.purge_expired_audit_logs() to service_role;
