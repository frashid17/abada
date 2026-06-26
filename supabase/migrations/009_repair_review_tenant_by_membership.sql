-- Repair review routing using the tenant with the most firm memberships (canonical firm).

create or replace function public.primary_firm_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.tenant_id
  from public.memberships m
  group by m.tenant_id
  order by count(*) desc, min(m.created_at) asc
  limit 1;
$$;

alter function public.primary_firm_tenant_id() owner to postgres;
revoke all on function public.primary_firm_tenant_id() from public;
grant execute on function public.primary_firm_tenant_id() to authenticated, service_role;

update public.reviews r
set tenant_id = public.primary_firm_tenant_id(),
    updated_at = now()
where public.primary_firm_tenant_id() is not null
  and r.tenant_id is distinct from public.primary_firm_tenant_id()
  and r.status in ('queued', 'in_progress');

update public.documents d
set tenant_id = public.primary_firm_tenant_id(),
    updated_at = now()
where public.primary_firm_tenant_id() is not null
  and d.status in ('in_review', 'flagged')
  and (d.tenant_id is null or d.tenant_id is distinct from public.primary_firm_tenant_id());

update public.intake_submissions s
set tenant_id = public.primary_firm_tenant_id()
where public.primary_firm_tenant_id() is not null
  and s.tenant_id is distinct from public.primary_firm_tenant_id()
  and s.document_id in (
    select id from public.documents where status in ('in_review', 'flagged')
  );
