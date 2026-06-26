-- Allow firm members to create DD rooms and add participants for their tenant.

drop policy if exists "deals_insert_firm_tenant" on public.deals;
create policy "deals_insert_firm_tenant"
  on public.deals for insert
  with check (
    public.is_firm_member()
    and tenant_id = public.active_tenant_id()
  );

drop policy if exists "deals_update_firm_tenant" on public.deals;
create policy "deals_update_firm_tenant"
  on public.deals for update
  using (tenant_id = public.active_tenant_id())
  with check (tenant_id = public.active_tenant_id());

drop policy if exists "deal_participants_insert_firm_tenant" on public.deal_participants;
create policy "deal_participants_insert_firm_tenant"
  on public.deal_participants for insert
  with check (
    public.is_firm_member()
    and exists (
      select 1
      from public.deals d
      where d.id = deal_id
        and d.tenant_id = public.active_tenant_id()
    )
  );
