-- Re-apply membership RLS fix (safe to run multiple times).
-- Run in Supabase SQL Editor if you still see Postgres error 42P17.

create or replace function public.active_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.tenant_id
  from public.memberships m
  where m.clerk_user_id = public.requesting_user_sub()
  order by m.created_at asc
  limit 1;
$$;

create or replace function public.is_firm_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.clerk_user_id = public.requesting_user_sub()
  );
$$;

alter function public.active_tenant_id() owner to postgres;
alter function public.is_firm_member() owner to postgres;

revoke all on function public.active_tenant_id() from public;
revoke all on function public.is_firm_member() from public;
grant execute on function public.active_tenant_id() to authenticated, service_role;
grant execute on function public.is_firm_member() to authenticated, service_role;

drop policy if exists "memberships_select_firm_member" on public.memberships;
drop policy if exists "memberships_select_firm_org" on public.memberships;
drop policy if exists "memberships_select_own" on public.memberships;

create policy "memberships_select_own"
  on public.memberships for select
  using (clerk_user_id = public.requesting_user_sub());

drop policy if exists "tenants_select_firm_member" on public.tenants;
drop policy if exists "tenants_select_firm_org" on public.tenants;

create policy "tenants_select_firm_member"
  on public.tenants for select
  using (id = public.active_tenant_id());
