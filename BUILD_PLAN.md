# Abada — Build Plan

Colombian legal-AI due diligence & investment-readiness platform.

**Current milestone:** M8 — Beta readiness (MVP hardening finalized in code; manual ops remain)

## M0 — Foundations

- [x] Next.js (App Router) + TypeScript + Tailwind
- [x] shadcn/ui + Radix + lucide-react; design tokens (light + dark)
- [x] next-intl (`es-CO` default + `en-US`); locale persistence + selector
- [x] next-themes light/dark/system + toggle on every shell
- [x] Clerk auth: unified signup → onboarding wizard (founder / investor / firm); firm access via Supabase memberships + magic-link invites
- [x] Supabase third-party Clerk auth (`accessToken` hook — no JWT template)
- [x] RLS helpers: `requesting_user_sub()`, `active_tenant_id()` from memberships; dual scoping stubs
- [x] Four app shells (public, founder, investor, firm) with shared layout
- [x] `proxy.ts` — Clerk + next-intl composed; default `clerkMiddleware` export
- [x] `proxy.ts` — optimistic session redirects only (no `auth.protect()`)
- [x] CI workflow (lint, typecheck, unit tests)
- [x] `.env.example` + `BUILD_PLAN.md`
- [ ] **Manual:** Clerk ↔ Supabase dashboard integration (third-party provider)
- [ ] **Manual:** Apply migrations `004_fix_membership_rls_recursion.sql` and `005_profiles_onboarding.sql`
- [ ] **Manual:** Configure Clerk webhook → `/api/webhooks/clerk`
- [ ] **Manual:** Clerk Dashboard → [Organizations settings](https://dashboard.clerk.com/~/organizations-settings) → **disable Organizations** (firm tenancy is Supabase `memberships`, not Clerk orgs). If left enabled with “Membership required”, Clerk forces a “Create organization” step after every firm sign-up.
- [ ] **Acceptance:** Sign up without choosing a role; complete onboarding as founder, investor, or firm admin; invitee joins via magic link
- [ ] **Acceptance:** Incognito test — `/fundador` logged out redirects to `/iniciar-sesion` (not the protected page)
- [ ] **Acceptance:** RLS smoke test — firm user sees only their tenant's rows via membership

## M1 — Data model + AI core

- [x] Full tenant-aware schema with RLS on every tenant-scoped table (`002_m1_full_schema.sql`)
- [x] Per-table tenant isolation contract tests (`supabase/tests/rls_isolation.test.ts`)
- [x] Payments scaffolding (Wompi-only for Colombia MVP; live integration pending)
- [x] Brain loader (`docs/brain/*` + extensible `manifest.json` + `extensions/`)
- [x] Brain docs ingested: Context, Voice, Memory (EN)
- [x] Corpus inventory JSON from spreadsheet (127 items)
- [x] AI gateway scaffold (Vercel AI SDK + Anthropic; fast/strong routing)
- [x] Guardrails + localized disclaimers (initial rules)
- [x] pgvector + FTS retrieval scaffold (`firm_knowledge`, `search_firm_knowledge`)
- [x] Legal corpus ingest — 20 Colombian law PDFs → bilingual chunk files (`data/legal-sources/`, `npm run corpus:ingest`)
- [x] Platform legal corpus schema (`014_legal_corpus.sql`) + local/DB search (`search_legal_corpus`)
- [x] Mi Espacio dashboard wired to `documents` table
- [ ] **Manual:** Apply migration `014_legal_corpus.sql` and load chunk JSON into Supabase (optional — local files work for dev)
- [ ] **Manual:** Wompi merchant verification + sandbox keys (client phone) → live checkout in M4

## M2 — Documents 1–2 end to end

- [x] Server-side drafting engine (`src/lib/documents/render.ts` + master templates)
- [x] NDA mutuo intake schema + guided flow UI
- [x] Vesting de Fundadores intake schema + guided flow UI
- [x] Flag for help (`flagged` status + `intake_submissions`)
- [x] Server-rendered preview + fingerprinted **PDF** download (`/api/documents/[docType]/download`) with party signature blocks; attorney cursive signature + firm watermark after review completion
- [x] Finalize download auto-enqueues document in firm review queue (`/firma/cola`)
- [x] Explicit **Submit for review** action (separate from download); founder chooses document language (es-CO / en-US) for preview and PDF disclaimers
- [x] AI drafting panel in document flow (`/api/ai/chat`, task=`drafting`)
- [x] Unit tests: render + fingerprint
- [ ] **Manual:** Apply migrations `001` + `002` if not done; test full flow against Supabase
- [ ] **Manual:** Seed firm `firm_templates` / `clauses` in DB when tenant is live (file templates used server-side for M2)

## M3 — Documents 3–4 + firm review

- [x] Cesión de PI intake + master template + guided flow
- [x] Contrato de Trabajo Investment-Ready intake + template + guided flow
- [x] Flag for help assigns `tenant_id` + enqueues `reviews` row (service role)
- [x] Firm review queue UI (`/firma/cola`) + review detail with markup (`/firma/cola/[reviewId]`)
- [x] Unit tests: IP + employment render
- [ ] **Manual:** Set `DEFAULT_FIRM_TENANT_ID` or ensure firm tenant exists by name for review routing
- [ ] **Manual:** End-to-end test — founder flags doc → appears in firm queue

## M4 — Document 5 + payments live + DD foundations

- [x] Acuerdo de Accionistas — intake schema, master template, guided flow, render test
- [x] Wompi payment flow — checkout API (`POST /api/payments/checkout`), webhook (`POST /api/webhooks/wompi`), revenue split recording
- [x] DD foundations — `src/lib/deals/service.ts`, `src/lib/data-room/service.ts`, storage path convention
- [ ] **Manual:** Wompi sandbox keys + webhook URL in dashboard
- [ ] **Manual:** Set `DEFAULT_FIRM_TENANT_ID` for payment webhook tenant routing
- [ ] **Manual:** End-to-end test — shareholders flow + sandbox payment

## M5 — DD target upload + firm reviewer

- [x] Deal rooms — firm list/create (`/firma/dd`), target upload room (`/fundador/sala`)
- [x] Taxonomy uploads with version control (`src/lib/dd/taxonomy.ts`, `src/lib/data-room/upload.ts`)
- [x] Watermarking + fingerprinting on download (`/api/data-room/[docId]/download`)
- [x] Virus scan stub (MIME/size allowlist) before upload
- [x] Findings by Colombian risk category + executive assessment (firm reviewer UI)
- [ ] **Manual:** Create Supabase Storage bucket `data-rooms`
- [ ] **Manual:** Set `DEFAULT_FIRM_TENANT_ID` for deal creation
- [ ] **Manual:** End-to-end test — firm creates deal → target uploads → firm records findings

## M6 — DD investor view + knowledge hub + notifications

- [x] Assessment-first investor view (`/inversionista/salas/[dealId]`)
- [x] Firm can add investors to DD rooms (create form + deal detail)
- [x] Notification center (bell in app shell; in-app notifications on assessment publish / investor added / call requests)
- [x] Scheduled call booking (investor request + firm status panel)
- [x] Knowledge hub — 10 published article slots (`/conocimiento`, `/conocimiento/[slug]`)
- [ ] **Manual:** Apply migration `013_m6_knowledge_hub_seed.sql`
- [ ] **Manual:** End-to-end test — firm adds investor → publishes assessment → investor notified → schedules call

## M7 — Hardening

- [x] Rate limiting — `increment_rate_limit` RPC (`015_m7_hardening.sql`) + `src/lib/rate-limit` enforced on AI chat, document download, data-room download, payment checkout (hour/day/month windows)
- [x] Centralized audit service (`src/lib/audit`) — actor, action, resource, tenant, IP, user agent; wired to downloads, checkout, review status changes, review submission, assessment publish
- [x] Audit retention — `purge_expired_audit_logs()` (3 years) + `purge_stale_rate_limits()`
- [x] Security review fixes — payment checkout now verifies tenant relationship (membership / review / primary firm); data-room `docId` validated as UUID
- [x] RLS pass — contract tests now cover every table in all migrations (RLS enabled + policies present + tenant scoping)
- [x] Seed data — `npm run seed:dev` (two tenants, memberships, sample deal, RLS smoke fixtures)
- [x] E2E scaffold — Playwright (`npm run test:e2e`), public smoke suite (landing, knowledge hub, auth redirects, API 401s, health, security headers)
- [x] Authenticated E2E scaffold — `e2e/authenticated.spec.ts` (skipped until Clerk testing tokens are set)
- [x] Live DB RLS isolation scaffold — `supabase/tests/live-rls-isolation.test.ts` (skipped until `LIVE_RLS_TEST=1`)
- [x] Founder legal library — `/fundador/leyes` browse + read Colombian corpus (laws, codes, circulars)
- [x] Platform admin console — `/admin` overview + feed, corpus add/edit (paste or PDF+OCR), AI usage, reviews, audit (name/email labels)
- [x] Optional pg_cron scheduling migration — `017_schedule_purge_jobs.sql`
- [ ] **Manual:** Apply migration `015_m7_hardening.sql`
- [ ] **Manual:** Apply migration `016_platform_admin.sql` and set `PLATFORM_ADMIN_SUBS` (comma-separated emails)
- [ ] **Manual:** Apply migration `017_schedule_purge_jobs.sql` (or schedule purge RPCs externally)
- [ ] **Manual:** Install Poppler + Tesseract (`spa`) on hosts that run admin PDF uploads
- [ ] **Manual:** `npx playwright install chromium` before first `npm run test:e2e`
- [ ] **Manual:** Configure Clerk testing tokens + run authenticated E2E
- [ ] **Manual:** Run live RLS isolation with `LIVE_RLS_TEST=1` and tenant JWTs

## M8 — Beta readiness

- [x] Sentry — `@sentry/nextjs` wired (client/server/edge + `global-error`); enabled when `NEXT_PUBLIC_SENTRY_DSN` is set
- [x] Analytics abstraction — `src/lib/analytics.ts` (off by default; optional webhook)
- [x] Feature flags — `src/lib/feature-flags.ts` (env-driven kill switches for AI, payments, uploads, OCR, hub)
- [x] Runbooks — `docs/runbooks.md` + `GET /api/health`
- [x] Security headers — nosniff, frame deny, referrer policy, permissions-policy
- [x] Admin PDF upload UI — paste or PDF (text layer + OCR via Poppler/Tesseract); CLI `corpus:ingest` still available
- [x] Mock AI paywall — Colombia checkout (card / Nequi / Daviplata) gates drafting assistant; `FEATURE_AI_PAYWALL`
- [x] Firm templates import — Founders, Employment, Corporate Client, Terms of Use, IP Assignment, Equity Compensation + guide bubbles
- [x] Unified founder Documents workspace — Templates merged into Documents; draftable docs use scroll-synced clause guides + inline fill-in fields
- [x] Corrected Equity/IP DOCX (`20260806`) imported — July exports were wrong bodies (kept under `docs/templates/sources` as superseded)
- [x] DD firm package (`20260806`) — Playbook + Info Request (RDI) + Report under `docs/dd/`; RDI upload taxonomy; firm playbook assist; bilingual report export; `info_requerida` risk level
- [x] Firm DD AI chatbot — review-pane assistant (`dd_finding`) with deal/docs/findings session context + playbook injection
- [x] Meghan UI redesign (authenticated app) — warm canvas tokens + Source Serif/Inter; Documents hub as 3 guided articles (`fundadores` / `incentivos` / `pi`) with company setup + review-before-sign + secondary investment docs; firm DD findings as risk notes + restyled AI tab; founder Sala coverage/upload chrome; app footer product/legal/contact. Marketing homepage left unchanged.
- [x] Platform admin CMS — `/admin/documentos`, `/admin/plantillas`, `/admin/tenants`, `/admin/equipo`, `/admin/flags`, `/admin/conocimiento`; firm template overrides at `/firma/plantillas`; migration `020_platform_cms.sql`
- [x] DD questionnaire loop — admin bank `/admin/diligencia`, founder answers `/fundador/diligencia`, draft findings for firm accept/dismiss; migration `022_dd_questionnaire.sql`
- [ ] **Manual:** Apply migration `020_platform_cms.sql` (guided document + template CMS tables)
- [ ] **Manual:** Apply migration `022_dd_questionnaire.sql` (DD question bank + founder responses + finding draft status)
- [ ] **Manual:** Apply migration `018_mock_payments.sql` (allows `mock` provider on `payments`)
- [ ] **Manual:** Apply migration `019_dd_info_requerida_risk_level.sql` (adds `info_requerida` to findings)
- [ ] **Manual:** Create Sentry project and set DSN / auth token in Vercel
- [ ] **Manual:** Enable `FEATURE_ANALYTICS=true` + webhook if product analytics is desired

## Architecture notes (M0 decisions)

| Topic | Decision |
| --- | --- |
| Auth bridge | Supabase third-party Clerk (not JWT template) |
| User id in RLS | `auth.jwt()->>'sub'` |
| Firm tenant | `auth.jwt()->>'org_id'` (or `o.id` fallback) |
| Founder/investor scope | `owner_sub` + `deal_participants` grants |
| Firm assets to founders | Server-side render only — no direct RLS SELECT |
| Authorization | RLS + server components — `proxy.ts` does optimistic redirects only |
| Request boundary | `src/proxy.ts` — `export default clerkMiddleware(...)` wrapping `next-intl/middleware` |
| Locale routing | `localePrefix: 'never'` — URLs stay unprefixed; pages live under `app/[locale]/` (internal rewrite) |
| Payments | Wompi only (Colombia). Live checkout after merchant verification; no Stripe in MVP |
