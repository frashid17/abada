-- M8 prep: platform admin + founder visibility for legal corpus.

create table public.platform_admins (
  clerk_user_id text primary key,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

-- Admins can see their own row; writes are service-role only.
create policy "platform_admins_select_self"
  on public.platform_admins for select
  to authenticated
  using (clerk_user_id = public.requesting_user_sub());

create policy "platform_admins_service_role"
  on public.platform_admins for all
  to service_role
  using (true)
  with check (true);

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins
    where clerk_user_id = public.requesting_user_sub()
  );
$$;

grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_platform_admin() to service_role;

-- Founders only see sources marked visible (default true for existing rows).
alter table public.legal_sources
  add column if not exists founder_visible boolean not null default true;

create index if not exists legal_sources_founder_visible_idx
  on public.legal_sources (founder_visible);
