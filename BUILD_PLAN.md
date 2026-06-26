# Abada — Build Plan

Colombian legal-AI due diligence & investment-readiness platform.

**Current milestone:** M5 — DD target upload + firm reviewer

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
- [x] Mi Espacio dashboard wired to `documents` table
- [ ] **Manual:** Apply migration `002_m1_full_schema.sql` to Supabase
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

- [ ] Assessment-first investor view
- [ ] Scheduled call booking; notification center
- [ ] Knowledge hub (10 article slots)

## M7 — Hardening

- [ ] Full RLS pass; rate limiting; security review
- [ ] E2E tests; accessibility; seed data

## M8 — Beta readiness

- [ ] Sentry; analytics; platform-ops console; feature flags; runbooks

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
