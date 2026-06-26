# Payments — Wompi (Colombia)

The platform uses **Wompi only** for MVP. Stripe is not available for Colombian merchants and is not integrated.

## Status

| Item | Status |
| --- | --- |
| Provider abstraction + `payments` / `revenue_splits` tables | Done (M1) |
| Live Wompi checkout + webhooks | Done (M4) — configure sandbox keys + webhook URL |

## Environment variables

```bash
WOMPI_PUBLIC_KEY=          # pub_test_… or pub_prod_…
WOMPI_PRIVATE_KEY=         # prv_test_… or prv_prod_…
WOMPI_EVENTS_SECRET=       # webhook signature verification
WOMPI_INTEGRITY_SECRET=    # transaction integrity signature
```

Use **sandbox** keys until the Wompi merchant account is verified.

## Tomorrow’s integration checklist

1. Client completes Wompi merchant signup (phone verification on their side).
2. Copy sandbox keys into `.env.local`.
3. Implement checkout session creation in `src/lib/payments/wompi.ts` (Widget or redirect API per Wompi docs).
4. Add `POST /api/webhooks/wompi` for `transaction.updated` events.
5. Call `recordPayment()` on successful capture; write `revenue_splits` per tenant config.

## Code entry points

- `getPaymentProvider()` → always returns Wompi
- `POST /api/payments/checkout` → creates Wompi payment link + pending `payments` row
- `POST /api/webhooks/wompi` → verifies checksum, captures payment + `revenue_splits`
- `recordPayment()` / `captureRecordedPayment()` → persists to Supabase
