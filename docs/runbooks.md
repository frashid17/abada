# Abada ops runbooks (MVP)

Operational checklists for beta. Keep secrets in Vercel / Supabase dashboards — never commit them.

## 1. Deploy checklist

1. Apply migrations through `017_schedule_purge_jobs.sql` in Supabase SQL editor (or CLI).
2. Confirm Clerk ↔ Supabase third-party auth (JWKS) is enabled.
3. Configure Clerk webhook → `POST /api/webhooks/clerk` with `CLERK_WEBHOOK_SECRET`.
4. Disable Clerk Organizations (firm tenancy is Supabase `memberships`).
5. Create Storage bucket `data-rooms` (private).
6. Set Vercel env from `.env.example` (especially `PLATFORM_ADMIN_SUBS`, `DEFAULT_FIRM_TENANT_ID`, Wompi keys when ready).
7. Optional: set `NEXT_PUBLIC_SENTRY_DSN` (+ `SENTRY_AUTH_TOKEN` / org / project for source maps).
8. Hit `GET /api/health` — expect `{ "status": "ok", "ready": true }`.

## 2. Incident: auth / onboarding failures

Symptoms: users stuck on `/onboarding`, “Could not complete onboarding”, or Clerk loops.

1. Check Clerk session (user exists, email verified).
2. Verify `profiles` row for `clerk_user_id`; look for unique email conflicts on founder context.
3. Confirm webhook delivery in Clerk dashboard for `user.created`.
4. Server logs: `[onboarding] founder failed` / `[clerk webhook]`.
5. Temporary unblock: service-role upsert `onboarding_complete=true` + correct `context`, then ask user to reload.

## 3. Incident: RLS / wrong-tenant data

1. Confirm request JWT `sub` via Supabase Auth logs / JWT debugger.
2. Check `memberships` for firm users; `deal_participants` for DD.
3. Re-run contract tests: `npm test -- supabase/tests/rls_isolation.test.ts`.
4. Optional live isolation: set `LIVE_RLS_TEST=1` plus service role + two test JWTs (see `supabase/tests/live-rls-isolation.test.ts`).

## 4. Incident: rate limits / AI outage

1. `FEATURE_AI_DRAFTING=false` to disable AI chat without redeploying code paths that already check the flag.
2. Inspect `rate_limits` rows for the actor `subject_sub`.
3. Confirm `ANTHROPIC_API_KEY` and Sentry events for gateway 500s.
4. Manually call `select public.purge_stale_rate_limits();` if counters look stuck.

## 5. Incident: payments (Wompi)

1. `FEATURE_PAYMENTS_CHECKOUT=false` to stop new checkouts.
2. Verify webhook signature secrets and `DEFAULT_FIRM_TENANT_ID`.
3. Audit trail: `audit_logs` action `payment.checkout_created` / Wompi webhook handlers.
4. See `docs/payments.md` for provider details.

## 6. Scheduled maintenance

| Job | Cadence | How |
| --- | --- | --- |
| `purge_expired_audit_logs()` | daily | `017` schedules via pg_cron when available; else external cron hitting SQL |
| `purge_stale_rate_limits()` | hourly | same |
| Corpus PDF OCR hosts | — | Poppler (`pdftotext`, `pdftoppm`) + Tesseract `spa` on admin upload hosts |

## 7. Feature flags

| Flag env | Default | Effect |
| --- | --- | --- |
| `FEATURE_AI_DRAFTING` | on | `/api/ai/chat` |
| `FEATURE_AI_PAYWALL` | on | Mock checkout gate before AI |
| `FEATURE_PAYMENTS_CHECKOUT` | on | `/api/payments/checkout` |
| `FEATURE_DATA_ROOM_UPLOADS` | on | DD uploads |
| `FEATURE_ADMIN_PDF_OCR` | on | Admin PDF OCR path |
| `FEATURE_KNOWLEDGE_HUB` | on | Knowledge hub |
| `FEATURE_ANALYTICS` | off | Analytics abstraction / webhook |
| `NEXT_PUBLIC_SENTRY_DSN` | unset | Enables Sentry when set |
