-- Prefer email for platform admin management UX (clerk_user_id remains PK for RLS).

alter table public.platform_admins
  add column if not exists email text;

create unique index if not exists platform_admins_email_lower_idx
  on public.platform_admins (lower(email))
  where email is not null;
