-- M5+: Firm access via memberships + magic-link invites (no Clerk Organizations).

-- ---------------------------------------------------------------------------
-- Invitations
-- ---------------------------------------------------------------------------

create table public.firm_invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  email text not null,
  role text not null check (role in ('partner', 'associate', 'of_counsel', 'admin')),
  token text not null unique,
  invited_by_sub text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by_sub text,
  created_at timestamptz not null default now()
);

create index firm_invitations_token_idx on public.firm_invitations (token);
create index firm_invitations_tenant_id_idx on public.firm_invitations (tenant_id);
create index firm_invitations_email_idx on public.firm_invitations (lower(email));

alter table public.firm_invitations enable row level security;

-- ---------------------------------------------------------------------------
-- Tenant helpers — membership-based (replaces Clerk org_id JWT)
-- ---------------------------------------------------------------------------

create or replace function public.active_tenant_id()
returns uuid
language sql
stable
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
as $$
  select exists (
    select 1
    from public.memberships m
    where m.clerk_user_id = public.requesting_user_sub()
  );
$$;

comment on function public.active_tenant_id is
  'Primary firm tenant for the signed-in user (first membership). Replaces org_id scoping.';

-- ---------------------------------------------------------------------------
-- RLS: replace org_id policies from M0 with membership policies
-- ---------------------------------------------------------------------------

drop policy if exists "tenants_select_firm_org" on public.tenants;
create policy "tenants_select_firm_member"
  on public.tenants for select
  using (
    id in (
      select m.tenant_id
      from public.memberships m
      where m.clerk_user_id = public.requesting_user_sub()
    )
  );

drop policy if exists "memberships_select_firm_org" on public.memberships;
create policy "memberships_select_firm_member"
  on public.memberships for select
  using (
    tenant_id in (
      select m.tenant_id
      from public.memberships m
      where m.clerk_user_id = public.requesting_user_sub()
    )
  );

drop policy if exists "firm_templates_select_firm_org" on public.firm_templates;
drop policy if exists "firm_templates_write_firm_org" on public.firm_templates;

create policy "firm_templates_select_firm_member"
  on public.firm_templates for select
  using (tenant_id = public.active_tenant_id());

create policy "firm_templates_write_firm_member"
  on public.firm_templates for all
  using (tenant_id = public.active_tenant_id())
  with check (tenant_id = public.active_tenant_id());

drop policy if exists "deals_select_firm_or_participant" on public.deals;
create policy "deals_select_firm_or_participant"
  on public.deals for select
  using (
    tenant_id = public.active_tenant_id()
    or id in (
      select dp.deal_id
      from public.deal_participants dp
      where dp.participant_sub = public.requesting_user_sub()
    )
  );

drop policy if exists "deal_participants_select_self_or_firm" on public.deal_participants;
create policy "deal_participants_select_self_or_firm"
  on public.deal_participants for select
  using (
    participant_sub = public.requesting_user_sub()
    or deal_id in (
      select d.id
      from public.deals d
      where d.tenant_id = public.active_tenant_id()
    )
  );

create policy "firm_invitations_select_firm_admin"
  on public.firm_invitations for select
  using (tenant_id = public.active_tenant_id());

create policy "firm_invitations_insert_firm_admin"
  on public.firm_invitations for insert
  with check (tenant_id = public.active_tenant_id());

-- Optional: allow nullable clerk_org_id for tenants not linked to Clerk orgs
alter table public.tenants alter column clerk_org_id drop not null;
