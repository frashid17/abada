-- Fix infinite recursion (42P17) in memberships/tenants RLS policies.
-- Policies must not SELECT from memberships while evaluating memberships RLS.
-- Helper functions run as SECURITY DEFINER to read memberships without re-entering RLS.

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

revoke all on function public.active_tenant_id() from public;
revoke all on function public.is_firm_member() from public;
grant execute on function public.active_tenant_id() to authenticated, service_role;
grant execute on function public.is_firm_member() to authenticated, service_role;

drop policy if exists "memberships_select_firm_member" on public.memberships;
drop policy if exists "memberships_select_firm_org" on public.memberships;

create policy "memberships_select_own"
  on public.memberships for select
  using (clerk_user_id = public.requesting_user_sub());

drop policy if exists "tenants_select_firm_member" on public.tenants;
drop policy if exists "tenants_select_firm_org" on public.tenants;

create policy "tenants_select_firm_member"
  on public.tenants for select
  using (id = public.active_tenant_id());
