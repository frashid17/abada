-- Repair review routing when founder submissions used a stale DEFAULT_FIRM_TENANT_ID
-- while firm admins/associates belong to a different membership tenant.

create or replace function public.primary_firm_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.tenant_id
  from public.memberships m
  order by m.created_at asc
  limit 1;
$$;

alter function public.primary_firm_tenant_id() owner to postgres;
revoke all on function public.primary_firm_tenant_id() from public;
grant execute on function public.primary_firm_tenant_id() to authenticated, service_role;

-- Move queued/in-progress reviews to the tenant where firm users actually have access.
update public.reviews r
set tenant_id = public.primary_firm_tenant_id()
where public.primary_firm_tenant_id() is not null
  and r.tenant_id is distinct from public.primary_firm_tenant_id()
  and r.status in ('queued', 'in_progress');

-- Align in-review founder documents with the same tenant.
update public.documents d
set tenant_id = public.primary_firm_tenant_id()
where public.primary_firm_tenant_id() is not null
  and d.status in ('in_review', 'flagged')
  and (d.tenant_id is null or d.tenant_id is distinct from public.primary_firm_tenant_id());
