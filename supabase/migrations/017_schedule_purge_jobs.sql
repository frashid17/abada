-- Optional: schedule M7 purge RPCs with pg_cron when the extension is available.
-- Safe to apply on projects without pg_cron — the DO block no-ops.

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'abada-purge-expired-audit-logs',
      '15 4 * * *',
      $$select public.purge_expired_audit_logs()$$
    );
    perform cron.schedule(
      'abada-purge-stale-rate-limits',
      '45 * * * *',
      $$select public.purge_stale_rate_limits()$$
    );
  else
    raise notice 'pg_cron not installed — schedule purge_expired_audit_logs() and purge_stale_rate_limits() externally';
  end if;
exception
  when others then
    raise notice 'Could not schedule pg_cron jobs: %', sqlerrm;
end $$;
