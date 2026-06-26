-- Unified onboarding: track completion on profiles.

alter table public.profiles
  add column if not exists onboarding_complete boolean not null default false;

-- Existing users with a workspace context are treated as onboarded.
update public.profiles
set onboarding_complete = true
where context in ('founder', 'investor', 'firm');

-- Users with firm membership but incomplete flag (edge case).
update public.profiles p
set onboarding_complete = true
from public.memberships m
where m.clerk_user_id = p.clerk_user_id
  and p.onboarding_complete = false;

create index if not exists profiles_onboarding_complete_idx
  on public.profiles (onboarding_complete)
  where onboarding_complete = false;
