-- Fix infinite recursion (42P17) between deals and deal_participants RLS policies.
-- Each policy queried the other table, re-triggering RLS in a loop.
-- SECURITY DEFINER helpers read without re-entering RLS.

create or replace function public.user_is_deal_participant(p_deal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.deal_participants dp
    where dp.deal_id = p_deal_id
      and dp.participant_sub = public.requesting_user_sub()
  );
$$;

create or replace function public.deal_in_active_tenant(p_deal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.deals d
    where d.id = p_deal_id
      and d.tenant_id = public.active_tenant_id()
  );
$$;

alter function public.user_is_deal_participant(uuid) owner to postgres;
alter function public.deal_in_active_tenant(uuid) owner to postgres;

revoke all on function public.user_is_deal_participant(uuid) from public;
revoke all on function public.deal_in_active_tenant(uuid) from public;
grant execute on function public.user_is_deal_participant(uuid) to authenticated, service_role;
grant execute on function public.deal_in_active_tenant(uuid) to authenticated, service_role;

drop policy if exists "deals_select_firm_or_participant" on public.deals;
create policy "deals_select_firm_or_participant"
  on public.deals for select
  using (
    tenant_id = public.active_tenant_id()
    or public.user_is_deal_participant(id)
  );

drop policy if exists "deal_participants_select_self_or_firm" on public.deal_participants;
create policy "deal_participants_select_self_or_firm"
  on public.deal_participants for select
  using (
    participant_sub = public.requesting_user_sub()
    or public.deal_in_active_tenant(deal_id)
  );
