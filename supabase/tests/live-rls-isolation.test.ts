/**
 * Live RLS isolation against a real Supabase project.
 *
 * Skipped unless LIVE_RLS_TEST=1 and the required env vars are present.
 * Provide two Clerk-compatible JWTs for firm users in distinct tenants.
 *
 * Required env:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - SUPABASE_SERVICE_ROLE_KEY
 * - LIVE_RLS_JWT_TENANT_A
 * - LIVE_RLS_JWT_TENANT_B
 * - LIVE_RLS_TENANT_A_ID
 * - LIVE_RLS_TENANT_B_ID
 */
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

const enabled = process.env.LIVE_RLS_TEST === "1";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const jwtA = process.env.LIVE_RLS_JWT_TENANT_A ?? "";
const jwtB = process.env.LIVE_RLS_JWT_TENANT_B ?? "";
const tenantA = process.env.LIVE_RLS_TENANT_A_ID ?? "";
const tenantB = process.env.LIVE_RLS_TENANT_B_ID ?? "";

const ready =
  enabled &&
  Boolean(url && anon && service && jwtA && jwtB && tenantA && tenantB);

describe.skipIf(!ready)("live RLS isolation (tenant A vs B)", () => {
  function clientForJwt(jwt: string) {
    return createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  it("tenant A JWT cannot read tenant B reviews", async () => {
    const clientA = clientForJwt(jwtA);
    const { data, error } = await clientA
      .from("reviews")
      .select("id, tenant_id")
      .eq("tenant_id", tenantB);

    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("tenant B JWT cannot read tenant A reviews", async () => {
    const clientB = clientForJwt(jwtB);
    const { data, error } = await clientB
      .from("reviews")
      .select("id, tenant_id")
      .eq("tenant_id", tenantA);

    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("service role can list tenants", async () => {
    const serviceClient = createClient(url, service, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await serviceClient.from("tenants").select("id").limit(2);
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });
});
