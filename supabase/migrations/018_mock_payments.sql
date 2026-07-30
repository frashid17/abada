-- Allow mock provider for demo / local AI paywall checkout (no live PSP).
alter table public.payments
  drop constraint if exists payments_provider_check;

alter table public.payments
  add constraint payments_provider_check
  check (provider in ('wompi', 'stripe', 'mock'));
