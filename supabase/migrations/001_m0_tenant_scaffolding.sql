-- M0: tenant scaffolding with dual scoping models (firm org vs founder/investor sub ownership).
-- Auth: Supabase third-party Clerk integration — use auth.jwt() claims, not auth.uid().

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- JWT helpers (Clerk session tokens)
-- ---------------------------------------------------------------------------

create or replace function public.requesting_user_sub()
returns text
language sql
stable
as $$
  select auth.jwt() ->> 'sub';
$$;

create or replace function public.requesting_org_id()
returns text
language sql
stable
as $$
  select coalesce(
    auth.jwt() ->> 'org_id',
    auth.jwt() -> 'o' ->> 'id'
  );
$$;

comment on function public.requesting_user_sub is
  'Clerk user id from JWT sub claim. Use instead of auth.uid() for third-party auth.';

comment on function public.requesting_org_id is
  'Active Clerk organization id from JWT. Firm users only; founders/investors typically have no org.';

-- ---------------------------------------------------------------------------
-- Shared / platform tables
-- ---------------------------------------------------------------------------

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  clerk_org_id text not null unique,
  name text not null,
  brand_config jsonb not null default '{}'::jsonb,
  default_locale text not null default 'es-CO',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  context text not null check (context in ('founder', 'investor', 'firm')),
  display_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Firm membership: links Clerk user sub to a firm tenant
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  clerk_user_id text not null,
  role text not null check (role in ('partner', 'associate', 'of_counsel', 'admin')),
  created_at timestamptz not null default now(),
  unique (tenant_id, clerk_user_id)
);

create index memberships_clerk_user_id_idx on public.memberships (clerk_user_id);
create index memberships_tenant_id_idx on public.memberships (tenant_id);

-- ---------------------------------------------------------------------------
-- Model A: firm-owned rows (tenant_id scoped via org_id)
-- Templates/clauses never exposed to founders/investors via direct SELECT.
-- ---------------------------------------------------------------------------

create table public.firm_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  slug text not null,
  name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index firm_templates_tenant_id_idx on public.firm_templates (tenant_id);

-- ---------------------------------------------------------------------------
-- Model B: founder/investor-owned rows (owner_sub) + deal participant grants
-- ---------------------------------------------------------------------------

create table public.founder_documents (
  id uuid primary key default gen_random_uuid(),
  owner_sub text not null,
  tenant_id uuid references public.tenants (id) on delete set null,
  document_type text not null,
  title text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index founder_documents_owner_sub_idx on public.founder_documents (owner_sub);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index deals_tenant_id_idx on public.deals (tenant_id);

create table public.deal_participants (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  participant_sub text not null,
  role text not null check (role in ('target', 'investor', 'firm')),
  created_at timestamptz not null default now(),
  unique (deal_id, participant_sub)
);

create index deal_participants_sub_idx on public.deal_participants (participant_sub);

-- ---------------------------------------------------------------------------
-- RLS enablement
-- ---------------------------------------------------------------------------

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.firm_templates enable row level security;
alter table public.founder_documents enable row level security;
alter table public.deals enable row level security;
alter table public.deal_participants enable row level security;

-- ---------------------------------------------------------------------------
-- RLS stubs — M0 smoke-testable; full policies land in M1
-- ---------------------------------------------------------------------------

-- Profiles: users read/update their own row
create policy "profiles_select_own"
  on public.profiles for select
  using (clerk_user_id = public.requesting_user_sub());

create policy "profiles_update_own"
  on public.profiles for update
  using (clerk_user_id = public.requesting_user_sub());

-- Tenants: firm users see their org's tenant row
create policy "tenants_select_firm_org"
  on public.tenants for select
  using (clerk_org_id = public.requesting_org_id());

-- Memberships: firm users see memberships for their active org
create policy "memberships_select_firm_org"
  on public.memberships for select
  using (
    tenant_id in (
      select t.id from public.tenants t
      where t.clerk_org_id = public.requesting_org_id()
    )
  );

-- Firm templates: firm users only — founders/investors never SELECT directly
create policy "firm_templates_select_firm_org"
  on public.firm_templates for select
  using (
    tenant_id in (
      select t.id from public.tenants t
      where t.clerk_org_id = public.requesting_org_id()
    )
  );

create policy "firm_templates_write_firm_org"
  on public.firm_templates for all
  using (
    tenant_id in (
      select t.id from public.tenants t
      where t.clerk_org_id = public.requesting_org_id()
    )
  )
  with check (
    tenant_id in (
      select t.id from public.tenants t
      where t.clerk_org_id = public.requesting_org_id()
    )
  );

-- Founder documents: owner_sub ownership
create policy "founder_documents_select_owner"
  on public.founder_documents for select
  using (owner_sub = public.requesting_user_sub());

create policy "founder_documents_insert_owner"
  on public.founder_documents for insert
  with check (owner_sub = public.requesting_user_sub());

create policy "founder_documents_update_owner"
  on public.founder_documents for update
  using (owner_sub = public.requesting_user_sub());

-- Deals: firm org OR deal participant grant
create policy "deals_select_firm_or_participant"
  on public.deals for select
  using (
    tenant_id in (
      select t.id from public.tenants t
      where t.clerk_org_id = public.requesting_org_id()
    )
    or id in (
      select dp.deal_id from public.deal_participants dp
      where dp.participant_sub = public.requesting_user_sub()
    )
  );

create policy "deal_participants_select_self_or_firm"
  on public.deal_participants for select
  using (
    participant_sub = public.requesting_user_sub()
    or deal_id in (
      select d.id from public.deals d
      join public.tenants t on t.id = d.tenant_id
      where t.clerk_org_id = public.requesting_org_id()
    )
  );
