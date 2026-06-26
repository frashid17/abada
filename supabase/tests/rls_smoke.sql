-- RLS smoke test (run in Supabase SQL editor after seeding two firm tenants).
-- Requires setting request.jwt.claims via supabase test helpers or integration test harness.
--
-- Expected behavior:
-- 1. Firm user with org_id = org_A sees only tenant_A rows in tenants, memberships, firm_templates.
-- 2. Firm user cannot SELECT firm_templates from tenant_B.
-- 3. Founder with sub = user_founder sees only founder_documents where owner_sub = user_founder.
-- 4. Founder cannot SELECT from firm_templates (policy denies — no matching org_id).

-- Example negative check for firm template isolation (service role seed, then anon+JWT):
-- INSERT two tenants, two templates; authenticate as org_A; SELECT count(*) FROM firm_templates should be 1.

select
  'requesting_user_sub' as helper,
  pg_get_functiondef('public.requesting_user_sub()'::regprocedure) is not null as exists;

select
  'requesting_org_id' as helper,
  pg_get_functiondef('public.requesting_org_id()'::regprocedure) is not null as exists;
