-- M9: Platform CMS for guided documents, master templates, ops, and firm overrides.

-- ---------------------------------------------------------------------------
-- Guided document packs (founders / incentivos / pi)
-- ---------------------------------------------------------------------------

create table public.platform_document_globals (
  id text primary key default 'default',
  draft_payload jsonb not null default '{}'::jsonb,
  published_revision int,
  updated_by text,
  updated_at timestamptz not null default now()
);

create table public.platform_document_global_revisions (
  id uuid primary key default gen_random_uuid(),
  revision int not null unique,
  payload jsonb not null,
  published_at timestamptz not null default now(),
  published_by text not null,
  note text
);

create table public.platform_document_packs (
  id text primary key check (id in ('fundadores', 'incentivos', 'pi')),
  title_es text not null,
  title_en text not null,
  draft_payload jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_revision int,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.platform_document_revisions (
  id uuid primary key default gen_random_uuid(),
  pack_id text not null references public.platform_document_packs (id) on delete cascade,
  revision int not null,
  payload jsonb not null,
  published_at timestamptz not null default now(),
  published_by text not null,
  note text,
  unique (pack_id, revision)
);

-- ---------------------------------------------------------------------------
-- Investment master templates
-- ---------------------------------------------------------------------------

create table public.platform_templates (
  slug text not null,
  locale text not null check (locale in ('es', 'en')),
  name text not null,
  draft_body text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_revision int,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (slug, locale)
);

create table public.platform_template_revisions (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  locale text not null check (locale in ('es', 'en')),
  revision int not null,
  body text not null,
  published_at timestamptz not null default now(),
  published_by text not null,
  note text,
  unique (slug, locale, revision)
);

-- ---------------------------------------------------------------------------
-- Feature flag DB overrides (env remains emergency default)
-- ---------------------------------------------------------------------------

create table public.platform_feature_flag_overrides (
  flag_key text primary key,
  enabled boolean not null,
  updated_by text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS: platform-admin read for authenticated; writes service-role only
-- ---------------------------------------------------------------------------

alter table public.platform_document_globals enable row level security;
alter table public.platform_document_global_revisions enable row level security;
alter table public.platform_document_packs enable row level security;
alter table public.platform_document_revisions enable row level security;
alter table public.platform_templates enable row level security;
alter table public.platform_template_revisions enable row level security;
alter table public.platform_feature_flag_overrides enable row level security;

create policy "platform_cms_globals_select_admin"
  on public.platform_document_globals for select
  to authenticated
  using (public.is_platform_admin());

create policy "platform_cms_globals_service_role"
  on public.platform_document_globals for all
  to service_role
  using (true)
  with check (true);

create policy "platform_cms_global_revisions_select_admin"
  on public.platform_document_global_revisions for select
  to authenticated
  using (public.is_platform_admin());

create policy "platform_cms_global_revisions_service_role"
  on public.platform_document_global_revisions for all
  to service_role
  using (true)
  with check (true);

create policy "platform_cms_packs_select_admin"
  on public.platform_document_packs for select
  to authenticated
  using (public.is_platform_admin());

create policy "platform_cms_packs_service_role"
  on public.platform_document_packs for all
  to service_role
  using (true)
  with check (true);

create policy "platform_cms_pack_revisions_select_admin"
  on public.platform_document_revisions for select
  to authenticated
  using (public.is_platform_admin());

create policy "platform_cms_pack_revisions_service_role"
  on public.platform_document_revisions for all
  to service_role
  using (true)
  with check (true);

create policy "platform_cms_templates_select_admin"
  on public.platform_templates for select
  to authenticated
  using (public.is_platform_admin());

create policy "platform_cms_templates_service_role"
  on public.platform_templates for all
  to service_role
  using (true)
  with check (true);

create policy "platform_cms_template_revisions_select_admin"
  on public.platform_template_revisions for select
  to authenticated
  using (public.is_platform_admin());

create policy "platform_cms_template_revisions_service_role"
  on public.platform_template_revisions for all
  to service_role
  using (true)
  with check (true);

create policy "platform_feature_flags_select_admin"
  on public.platform_feature_flag_overrides for select
  to authenticated
  using (public.is_platform_admin());

create policy "platform_feature_flags_service_role"
  on public.platform_feature_flag_overrides for all
  to service_role
  using (true)
  with check (true);

-- Published guided content is readable by any authenticated user (founder reader).
create policy "platform_cms_packs_select_authenticated_published"
  on public.platform_document_packs for select
  to authenticated
  using (status = 'published');

create policy "platform_cms_pack_revisions_select_authenticated"
  on public.platform_document_revisions for select
  to authenticated
  using (true);

create policy "platform_cms_globals_select_authenticated"
  on public.platform_document_globals for select
  to authenticated
  using (published_revision is not null);

create policy "platform_cms_global_revisions_select_authenticated"
  on public.platform_document_global_revisions for select
  to authenticated
  using (true);

-- Published templates readable server-side via service role only (masters never client).
