-- Fix infinite recursion (42P17) from policies that query deals/deal_participants inline.
-- Use existing SECURITY DEFINER helpers from 007_fix_deals_rls_recursion.sql.

drop policy if exists "deal_participants_insert_firm_tenant" on public.deal_participants;
create policy "deal_participants_insert_firm_tenant"
  on public.deal_participants for insert
  with check (
    public.is_firm_member()
    and public.deal_in_active_tenant(deal_id)
  );

drop policy if exists "data_room_participant_read" on public.data_room_documents;
create policy "data_room_participant_read"
  on public.data_room_documents for select
  using (public.user_is_deal_participant(deal_id));

drop policy if exists "findings_participant_read" on public.findings;
create policy "findings_participant_read"
  on public.findings for select
  using (public.user_is_deal_participant(deal_id));

drop policy if exists "assessments_participant_read" on public.assessments;
create policy "assessments_participant_read"
  on public.assessments for select
  using (public.user_is_deal_participant(deal_id));
