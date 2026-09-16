-- Founder document download feedback (gates PDF download until submitted).
-- Owner-scoped by clerk sub (not tenant-owned); service role writes from app actions.

create table if not exists public.document_download_feedback (
  id uuid primary key default gen_random_uuid(),
  owner_sub text not null,
  document_type text not null,
  respondent_email text not null,
  respondent_name text,
  ease_rating smallint not null check (ease_rating between 1 and 5),
  what_would_change text not null,
  hardest_topic text not null,
  founders_without_lawyer text not null,
  lawyer_time_needed text not null,
  created_at timestamptz not null default now(),
  unique (owner_sub, document_type)
);

create index if not exists document_download_feedback_owner_idx
  on public.document_download_feedback (owner_sub);

create index if not exists document_download_feedback_created_idx
  on public.document_download_feedback (created_at desc);

alter table public.document_download_feedback enable row level security;

-- App writes via service role; founders never SELECT peers' feedback.
create policy "document_download_feedback_service_role"
  on public.document_download_feedback for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "document_download_feedback_select_own"
  on public.document_download_feedback for select
  using (owner_sub = (auth.jwt()->>'sub'));
