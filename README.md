# Abada

Legal-AI platform for Colombian venture capital — investment-readiness documents, due diligence, and firm back-office.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind + shadcn/ui
- **Clerk** (auth) + **Supabase** (Postgres, Storage, RLS)
- **next-intl** (`es-CO` default, `en-US`) + **next-themes**

## Getting started

```bash
cp .env.example .env.local
npm install
npm run dev
```

### Clerk + Supabase setup

1. Enable **Supabase compatibility** in Clerk (session tokens carry `role: authenticated`).
2. Add Clerk as a **third-party auth provider** in Supabase (Clerk domain + JWKS).
3. **Do not** create a Clerk JWT template or share the Supabase JWT secret.
4. Configure Clerk webhook → `POST /api/webhooks/clerk` (user/org sync).
5. Set `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL` (required for proxy redirects).

### Route protection check

In an incognito window, visit `/fundador` while logged out. You should land on `/iniciar-sesion`, not the dashboard. Real gating also runs in server components + RLS; `proxy.ts` only does optimistic redirects.

### Database

Apply the initial migration:

```bash
supabase db push
# or run supabase/migrations/001_m0_tenant_scaffolding.sql in the SQL editor
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit tests (incl. RLS scoping docs) |

## App shells

| Route prefix | Audience |
| --- | --- |
| `/` | Public |
| `/fundador` | Founders |
| `/inversionista` | Investors |
| `/firma` | Firm users (requires Clerk org) |

See [BUILD_PLAN.md](./BUILD_PLAN.md) for milestone progress.
