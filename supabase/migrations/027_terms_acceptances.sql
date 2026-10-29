-- Terms of Service / Personal Data Processing Policy acceptance records.
-- Owner-scoped by clerk sub (not tenant-owned). Colombian Law 1581 / Decree 1377
-- require prior, express, informed consent with auditable proof.

create table if not exists public.terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  owner_sub text not null,
  terms_version text not null,
  locale text not null check (locale in ('es-CO', 'en-US')),
  respondent_email text not null,
  respondent_name text,
  ip_address text,
  user_agent text,
  accepted_at timestamptz not null default now(),
  unique (owner_sub, terms_version)
);

create index if not exists terms_acceptances_owner_idx
  on public.terms_acceptances (owner_sub);

create index if not exists terms_acceptances_version_idx
  on public.terms_acceptances (terms_version);

create index if not exists terms_acceptances_accepted_idx
  on public.terms_acceptances (accepted_at desc);

alter table public.terms_acceptances enable row level security;

create policy "terms_acceptances_service_role"
  on public.terms_acceptances for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "terms_acceptances_select_own"
  on public.terms_acceptances for select
  using (owner_sub = (auth.jwt()->>'sub'));
