-- Platform workspace invitations (founder / investor / firm) + product analytics events.

create table if not exists public.platform_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('founder', 'investor', 'firm')),
  token text not null unique,
  invited_by_sub text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by_sub text,
  created_at timestamptz not null default now()
);

create index if not exists platform_invitations_email_idx
  on public.platform_invitations (lower(email));

create index if not exists platform_invitations_pending_idx
  on public.platform_invitations (expires_at)
  where accepted_at is null;

alter table public.platform_invitations enable row level security;

create policy "platform_invitations_service_role"
  on public.platform_invitations for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  actor_sub text,
  tenant_id uuid references public.tenants(id) on delete set null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_event_created_idx
  on public.analytics_events (event, created_at desc);

create index if not exists analytics_events_created_idx
  on public.analytics_events (created_at desc);

alter table public.analytics_events enable row level security;

create policy "analytics_events_service_role"
  on public.analytics_events for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
