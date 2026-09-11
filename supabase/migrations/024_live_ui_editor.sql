-- Live UI copy overrides + platform admin settings (FAB visibility, etc.)

create table if not exists public.platform_ui_copy_overrides (
  id uuid primary key default gen_random_uuid(),
  locale text not null check (locale in ('es-CO', 'en-US')),
  message_key text not null,
  value text not null,
  updated_by_sub text not null,
  updated_at timestamptz not null default now(),
  unique (locale, message_key)
);

create index if not exists platform_ui_copy_overrides_locale_idx
  on public.platform_ui_copy_overrides (locale);

alter table public.platform_ui_copy_overrides enable row level security;

create policy "platform_ui_copy_overrides_service_role"
  on public.platform_ui_copy_overrides for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create table if not exists public.platform_admin_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by_sub text,
  updated_at timestamptz not null default now()
);

alter table public.platform_admin_settings enable row level security;

create policy "platform_admin_settings_service_role"
  on public.platform_admin_settings for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

insert into public.platform_admin_settings (key, value)
values ('live_editor_fab', '{"visible": true}'::jsonb)
on conflict (key) do nothing;
