-- M1: Full tenant-aware schema, RLS on every tenant-scoped table, pgvector + FTS for firm knowledge.

create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.active_tenant_id()
returns uuid
language sql
stable
as $$
  select t.id
  from public.tenants t
  where t.clerk_org_id = public.requesting_org_id()
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Rename founder_documents → documents (canonical investment-readiness table)
-- ---------------------------------------------------------------------------

alter table public.founder_documents rename to documents;

alter table public.documents
  drop constraint if exists founder_documents_status_check;

alter table public.documents
  add constraint documents_document_type_check
  check (document_type in ('nda', 'vesting', 'ip', 'employment', 'shareholders'));

alter table public.documents
  add constraint documents_status_check
  check (status in ('not_started', 'draft', 'flagged', 'in_review', 'complete'));

alter index if exists founder_documents_owner_sub_idx rename to documents_owner_sub_idx;

drop policy if exists "founder_documents_select_owner" on public.documents;
drop policy if exists "founder_documents_insert_owner" on public.documents;
drop policy if exists "founder_documents_update_owner" on public.documents;

create policy "documents_select_owner"
  on public.documents for select
  using (owner_sub = public.requesting_user_sub());

create policy "documents_insert_owner"
  on public.documents for insert
  with check (owner_sub = public.requesting_user_sub());

create policy "documents_update_owner"
  on public.documents for update
  using (owner_sub = public.requesting_user_sub());

-- Firm users may read documents linked to their tenant (review queue) — not templates
create policy "documents_select_firm_tenant"
  on public.documents for select
  using (tenant_id is not null and tenant_id = public.active_tenant_id());

-- ---------------------------------------------------------------------------
-- Document versions & field values (owner-scoped via document)
-- ---------------------------------------------------------------------------

create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  version_number int not null,
  storage_path text,
  fingerprint text,
  created_by_sub text not null,
  created_at timestamptz not null default now(),
  unique (document_id, version_number)
);

create table public.document_field_values (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  field_key text not null,
  field_value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (document_id, field_key)
);

create index document_versions_document_id_idx on public.document_versions (document_id);
create index document_field_values_document_id_idx on public.document_field_values (document_id);

-- ---------------------------------------------------------------------------
-- Clauses (firm tenant — never direct founder SELECT)
-- ---------------------------------------------------------------------------

create table public.clauses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  slug text not null,
  name text not null,
  body text not null,
  variants jsonb not null default '[]'::jsonb,
  conditions jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index clauses_tenant_id_idx on public.clauses (tenant_id);

-- ---------------------------------------------------------------------------
-- Intake & reviews
-- ---------------------------------------------------------------------------

create table public.intake_forms (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  document_type text not null,
  schema jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, document_type)
);

create table public.intake_submissions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  owner_sub text not null,
  tenant_id uuid references public.tenants (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index intake_submissions_owner_sub_idx on public.intake_submissions (owner_sub);

create table public.review_tiers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  document_type text not null,
  tier_key text not null,
  label text not null,
  price_cents int not null,
  currency text not null default 'COP',
  created_at timestamptz not null default now(),
  unique (tenant_id, document_type, tier_key)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  requester_sub text not null,
  assigned_clerk_user_id text,
  status text not null default 'queued'
    check (status in ('queued', 'in_progress', 'completed', 'cancelled')),
  markup jsonb not null default '{}'::jsonb,
  executive_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reviews_tenant_id_idx on public.reviews (tenant_id);
create index reviews_requester_sub_idx on public.reviews (requester_sub);

-- ---------------------------------------------------------------------------
-- Due diligence (tenant-scoped)
-- ---------------------------------------------------------------------------

create table public.data_room_documents (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  taxonomy_category text not null,
  title text not null,
  storage_path text not null,
  version_number int not null default 1,
  fingerprint text,
  watermark_policy jsonb not null default '{}'::jsonb,
  nda_gate_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index data_room_documents_deal_id_idx on public.data_room_documents (deal_id);
create index data_room_documents_tenant_id_idx on public.data_room_documents (tenant_id);

create table public.findings (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  risk_category text not null,
  risk_level text not null check (risk_level in ('bajo', 'medio', 'alto')),
  source_document_id uuid references public.data_room_documents (id) on delete set null,
  source_page int,
  description text not null,
  recommended_action text,
  legal_citation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index findings_deal_id_idx on public.findings (deal_id);
create index findings_tenant_id_idx on public.findings (tenant_id);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  summary text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (deal_id)
);

-- ---------------------------------------------------------------------------
-- Payments (tenant-scoped metadata; provider refs stored opaquely)
-- ---------------------------------------------------------------------------

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  payer_sub text not null,
  provider text not null check (provider in ('wompi', 'stripe')),
  provider_reference text,
  amount_cents int not null,
  currency text not null default 'COP',
  status text not null default 'pending'
    check (status in ('pending', 'authorized', 'captured', 'failed', 'refunded')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_tenant_id_idx on public.payments (tenant_id);
create index payments_payer_sub_idx on public.payments (payer_sub);

create table public.revenue_splits (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  party text not null,
  amount_cents int not null,
  currency text not null default 'COP',
  created_at timestamptz not null default now()
);

create table public.scheduled_calls (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  requester_sub text not null,
  payment_id uuid references public.payments (id) on delete set null,
  scheduled_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Notifications & audit (tenant-tagged)
-- ---------------------------------------------------------------------------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id) on delete cascade,
  recipient_sub text not null,
  channel text not null check (channel in ('in_app', 'email')),
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_recipient_sub_idx on public.notifications (recipient_sub);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id) on delete set null,
  actor_sub text,
  action text not null,
  resource_type text not null,
  resource_id text,
  ip_address inet,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_tenant_id_idx on public.audit_logs (tenant_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at);

-- ---------------------------------------------------------------------------
-- Knowledge hub & AI ops
-- ---------------------------------------------------------------------------

create table public.knowledge_hub_articles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  slug text not null,
  title text not null,
  excerpt text,
  body text not null default '',
  seo jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create table public.ai_prompts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  prompt_key text not null,
  version int not null default 1,
  body text not null,
  created_by_sub text,
  created_at timestamptz not null default now(),
  unique (tenant_id, prompt_key, version)
);

create table public.ai_call_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id) on delete set null,
  caller_sub text not null,
  task text not null,
  model text not null,
  input_tokens int,
  output_tokens int,
  created_at timestamptz not null default now()
);

create table public.ai_policy_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  clerk_user_id text not null,
  policy_version text not null,
  acknowledged_at timestamptz not null default now(),
  unique (tenant_id, clerk_user_id, policy_version)
);

-- ---------------------------------------------------------------------------
-- Firm knowledge + corrections (tenant-scoped learning layer)
-- ---------------------------------------------------------------------------

create table public.firm_knowledge (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  topic_key text not null,
  title text not null,
  content text not null,
  content_tsv tsvector generated always as (to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(content, ''))) stored,
  embedding vector(1536),
  source_type text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, topic_key)
);

create index firm_knowledge_tenant_id_idx on public.firm_knowledge (tenant_id);
create index firm_knowledge_content_tsv_idx on public.firm_knowledge using gin (content_tsv);
create index firm_knowledge_embedding_idx on public.firm_knowledge using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table public.corrections_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  ai_output text not null,
  corrected_output text not null,
  reason text not null,
  asset_to_update text,
  de_identified boolean not null default false,
  reviewed_by_sub text,
  created_at timestamptz not null default now()
);

create index corrections_ledger_tenant_id_idx on public.corrections_ledger (tenant_id);

create table public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id) on delete cascade,
  subject_sub text not null,
  action_key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  unique (tenant_id, subject_sub, action_key, window_start)
);

-- ---------------------------------------------------------------------------
-- RLS enablement (all tenant-scoped + user-scoped tables)
-- ---------------------------------------------------------------------------

alter table public.document_versions enable row level security;
alter table public.document_field_values enable row level security;
alter table public.clauses enable row level security;
alter table public.intake_forms enable row level security;
alter table public.intake_submissions enable row level security;
alter table public.review_tiers enable row level security;
alter table public.reviews enable row level security;
alter table public.data_room_documents enable row level security;
alter table public.findings enable row level security;
alter table public.assessments enable row level security;
alter table public.payments enable row level security;
alter table public.revenue_splits enable row level security;
alter table public.scheduled_calls enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.knowledge_hub_articles enable row level security;
alter table public.ai_prompts enable row level security;
alter table public.ai_call_logs enable row level security;
alter table public.ai_policy_acknowledgments enable row level security;
alter table public.firm_knowledge enable row level security;
alter table public.corrections_ledger enable row level security;
alter table public.rate_limits enable row level security;

-- profiles: allow insert own
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  using (clerk_user_id = public.requesting_user_sub());

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (clerk_user_id = public.requesting_user_sub());

create policy "profiles_update_own"
  on public.profiles for update
  using (clerk_user_id = public.requesting_user_sub());

-- Generic firm-tenant policies
create policy "clauses_tenant"
  on public.clauses for all
  using (tenant_id = public.active_tenant_id())
  with check (tenant_id = public.active_tenant_id());

create policy "intake_forms_tenant"
  on public.intake_forms for all
  using (tenant_id = public.active_tenant_id())
  with check (tenant_id = public.active_tenant_id());

create policy "review_tiers_tenant"
  on public.review_tiers for select
  using (tenant_id = public.active_tenant_id());

create policy "reviews_firm_tenant"
  on public.reviews for all
  using (tenant_id = public.active_tenant_id())
  with check (tenant_id = public.active_tenant_id());

create policy "reviews_requester_select"
  on public.reviews for select
  using (requester_sub = public.requesting_user_sub());

create policy "data_room_documents_tenant"
  on public.data_room_documents for all
  using (tenant_id = public.active_tenant_id())
  with check (tenant_id = public.active_tenant_id());

create policy "findings_tenant"
  on public.findings for all
  using (tenant_id = public.active_tenant_id())
  with check (tenant_id = public.active_tenant_id());

create policy "assessments_tenant"
  on public.assessments for all
  using (tenant_id = public.active_tenant_id())
  with check (tenant_id = public.active_tenant_id());

create policy "payments_payer"
  on public.payments for select
  using (payer_sub = public.requesting_user_sub());

create policy "payments_firm_tenant"
  on public.payments for select
  using (tenant_id = public.active_tenant_id());

create policy "revenue_splits_tenant"
  on public.revenue_splits for select
  using (tenant_id = public.active_tenant_id());

create policy "scheduled_calls_requester"
  on public.scheduled_calls for select
  using (requester_sub = public.requesting_user_sub());

create policy "scheduled_calls_tenant"
  on public.scheduled_calls for all
  using (tenant_id = public.active_tenant_id())
  with check (tenant_id = public.active_tenant_id());

create policy "notifications_recipient"
  on public.notifications for select
  using (recipient_sub = public.requesting_user_sub());

create policy "notifications_update_recipient"
  on public.notifications for update
  using (recipient_sub = public.requesting_user_sub());

create policy "audit_logs_tenant"
  on public.audit_logs for select
  using (tenant_id = public.active_tenant_id() or tenant_id is null);

create policy "knowledge_hub_articles_tenant"
  on public.knowledge_hub_articles for all
  using (tenant_id = public.active_tenant_id())
  with check (tenant_id = public.active_tenant_id());

create policy "ai_prompts_tenant"
  on public.ai_prompts for all
  using (tenant_id = public.active_tenant_id())
  with check (tenant_id = public.active_tenant_id());

create policy "ai_call_logs_caller"
  on public.ai_call_logs for select
  using (caller_sub = public.requesting_user_sub());

create policy "ai_call_logs_tenant"
  on public.ai_call_logs for select
  using (tenant_id = public.active_tenant_id());

create policy "ai_policy_ack_tenant"
  on public.ai_policy_acknowledgments for all
  using (tenant_id = public.active_tenant_id())
  with check (tenant_id = public.active_tenant_id());

create policy "firm_knowledge_tenant"
  on public.firm_knowledge for all
  using (tenant_id = public.active_tenant_id())
  with check (tenant_id = public.active_tenant_id());

create policy "corrections_ledger_tenant"
  on public.corrections_ledger for all
  using (tenant_id = public.active_tenant_id())
  with check (tenant_id = public.active_tenant_id());

create policy "rate_limits_subject"
  on public.rate_limits for select
  using (subject_sub = public.requesting_user_sub());

-- Document child tables: access via parent document ownership or firm tenant
create policy "document_versions_owner"
  on public.document_versions for all
  using (
    document_id in (
      select d.id from public.documents d
      where d.owner_sub = public.requesting_user_sub()
        or (d.tenant_id is not null and d.tenant_id = public.active_tenant_id())
    )
  )
  with check (
    document_id in (
      select d.id from public.documents d where d.owner_sub = public.requesting_user_sub()
    )
  );

create policy "document_field_values_owner"
  on public.document_field_values for all
  using (
    document_id in (
      select d.id from public.documents d
      where d.owner_sub = public.requesting_user_sub()
        or (d.tenant_id is not null and d.tenant_id = public.active_tenant_id())
    )
  )
  with check (
    document_id in (
      select d.id from public.documents d where d.owner_sub = public.requesting_user_sub()
    )
  );

create policy "intake_submissions_owner"
  on public.intake_submissions for all
  using (owner_sub = public.requesting_user_sub())
  with check (owner_sub = public.requesting_user_sub());

create policy "intake_submissions_firm"
  on public.intake_submissions for select
  using (tenant_id = public.active_tenant_id());

-- Deal participant access to data room (read-only stub)
create policy "data_room_participant_read"
  on public.data_room_documents for select
  using (
    deal_id in (
      select dp.deal_id from public.deal_participants dp
      where dp.participant_sub = public.requesting_user_sub()
    )
  );

create policy "findings_participant_read"
  on public.findings for select
  using (
    deal_id in (
      select dp.deal_id from public.deal_participants dp
      where dp.participant_sub = public.requesting_user_sub()
    )
  );

create policy "assessments_participant_read"
  on public.assessments for select
  using (
    deal_id in (
      select dp.deal_id from public.deal_participants dp
      where dp.participant_sub = public.requesting_user_sub()
    )
  );

-- FTS search helper (tenant-scoped)
create or replace function public.search_firm_knowledge(
  p_tenant_id uuid,
  p_query text,
  p_limit int default 8
)
returns table (
  id uuid,
  topic_key text,
  title text,
  content text,
  rank real
)
language sql
stable
as $$
  select
    fk.id,
    fk.topic_key,
    fk.title,
    fk.content,
    ts_rank(fk.content_tsv, websearch_to_tsquery('spanish', p_query)) as rank
  from public.firm_knowledge fk
  where fk.tenant_id = p_tenant_id
    and fk.content_tsv @@ websearch_to_tsquery('spanish', p_query)
  order by rank desc
  limit p_limit;
$$;
