-- Guided due-diligence questionnaire (admin-editable) + founder responses.

-- ---------------------------------------------------------------------------
-- Platform question bank
-- ---------------------------------------------------------------------------

create table public.platform_dd_questions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  section_key text not null
    check (section_key in ('fundadores', 'incentivos', 'pi', 'declaration', 'cross')),
  sort_order int not null default 0,
  q_es text not null,
  q_en text not null,
  hint_es text,
  hint_en text,
  answer_type text not null default 'yes_no'
    check (answer_type in ('yes_no', 'yes_no_na', 'text')),
  risk_category text not null,
  risk_level_if_gap text not null default 'info_requerida'
    check (risk_level_if_gap in ('bajo', 'medio', 'alto', 'info_requerida')),
  finding_es text not null,
  finding_en text not null,
  action_es text,
  action_en text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index platform_dd_questions_section_sort_idx
  on public.platform_dd_questions (section_key, sort_order);

-- ---------------------------------------------------------------------------
-- Founder questionnaire sessions + answers
-- ---------------------------------------------------------------------------

create table public.dd_questionnaires (
  id uuid primary key default gen_random_uuid(),
  owner_sub text not null,
  deal_id uuid references public.deals (id) on delete set null,
  tenant_id uuid references public.tenants (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index dd_questionnaires_owner_sub_idx on public.dd_questionnaires (owner_sub);
create index dd_questionnaires_deal_id_idx on public.dd_questionnaires (deal_id);

create table public.dd_questionnaire_answers (
  questionnaire_id uuid not null references public.dd_questionnaires (id) on delete cascade,
  question_id uuid not null references public.platform_dd_questions (id) on delete cascade,
  value text not null default '',
  note text,
  updated_at timestamptz not null default now(),
  primary key (questionnaire_id, question_id)
);

-- ---------------------------------------------------------------------------
-- Findings: draft status + provenance from questionnaire
-- ---------------------------------------------------------------------------

alter table public.findings
  add column if not exists status text not null default 'active';

alter table public.findings
  drop constraint if exists findings_status_check;

alter table public.findings
  add constraint findings_status_check
  check (status in ('draft', 'active', 'dismissed'));

alter table public.findings
  add column if not exists source_question_id uuid
    references public.platform_dd_questions (id) on delete set null;

alter table public.findings
  add column if not exists questionnaire_id uuid
    references public.dd_questionnaires (id) on delete set null;

create index if not exists findings_status_idx on public.findings (status);
create index if not exists findings_questionnaire_id_idx on public.findings (questionnaire_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.platform_dd_questions enable row level security;
alter table public.dd_questionnaires enable row level security;
alter table public.dd_questionnaire_answers enable row level security;

create policy "platform_dd_questions_select_admin"
  on public.platform_dd_questions for select
  to authenticated
  using (public.is_platform_admin() or status = 'published');

create policy "platform_dd_questions_service_role"
  on public.platform_dd_questions for all
  to service_role
  using (true)
  with check (true);

create policy "dd_questionnaires_select_owner"
  on public.dd_questionnaires for select
  to authenticated
  using (
    owner_sub = public.requesting_user_sub()
    or public.is_platform_admin()
  );

create policy "dd_questionnaires_service_role"
  on public.dd_questionnaires for all
  to service_role
  using (true)
  with check (true);

create policy "dd_questionnaire_answers_select_owner"
  on public.dd_questionnaire_answers for select
  to authenticated
  using (
    exists (
      select 1 from public.dd_questionnaires q
      where q.id = questionnaire_id
        and (
          q.owner_sub = public.requesting_user_sub()
          or public.is_platform_admin()
        )
    )
  );

create policy "dd_questionnaire_answers_service_role"
  on public.dd_questionnaire_answers for all
  to service_role
  using (true)
  with check (true);
