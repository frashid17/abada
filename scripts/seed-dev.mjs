#!/usr/bin/env node
/**
 * Dev seed: two firm tenants with memberships, a sample deal with participants,
 * and fixture subs for RLS smoke testing (tenant A must never see tenant B).
 *
 * Usage: node scripts/seed-dev.mjs
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.
 * Idempotent — safe to re-run.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// Minimal .env loader (no extra dependency)
const envPath = path.join(root, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SEED = {
  tenants: [
    {
      clerk_org_id: "seed_org_balam",
      name: "Balam Legal",
      default_locale: "es-CO",
    },
    {
      clerk_org_id: "seed_org_rival",
      name: "Rival Firm (RLS fixture)",
      default_locale: "es-CO",
    },
  ],
  // Fixture Clerk subs — not real users; used for RLS smoke checks
  members: {
    seed_org_balam: [
      { clerk_user_id: "seed_user_balam_partner", role: "partner" },
      { clerk_user_id: "seed_user_balam_associate", role: "associate" },
    ],
    seed_org_rival: [{ clerk_user_id: "seed_user_rival_partner", role: "partner" }],
  },
  deal: {
    name: "Seed Deal — Startup DD (fixture)",
    participants: [
      { participant_sub: "seed_user_target_founder", role: "target" },
      { participant_sub: "seed_user_investor_fund", role: "investor" },
    ],
  },
};

async function upsertTenant(tenant) {
  const { data: existing } = await supabase
    .from("tenants")
    .select("id")
    .eq("clerk_org_id", tenant.clerk_org_id)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("tenants")
    .insert(tenant)
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function upsertMembership(tenantId, member) {
  const { error } = await supabase
    .from("memberships")
    .upsert(
      { tenant_id: tenantId, ...member },
      { onConflict: "tenant_id,clerk_user_id" },
    );
  if (error) throw error;
}

async function upsertDeal(tenantId) {
  const { data: existing } = await supabase
    .from("deals")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("name", SEED.deal.name)
    .maybeSingle();

  let dealId = existing?.id;
  if (!dealId) {
    const { data, error } = await supabase
      .from("deals")
      .insert({ tenant_id: tenantId, name: SEED.deal.name, status: "active" })
      .select("id")
      .single();
    if (error) throw error;
    dealId = data.id;
  }

  for (const participant of SEED.deal.participants) {
    const { error } = await supabase
      .from("deal_participants")
      .upsert(
        { deal_id: dealId, ...participant },
        { onConflict: "deal_id,participant_sub" },
      );
    if (error) throw error;
  }

  return dealId;
}

console.log("Seeding dev fixtures…");

const tenantIds = {};
for (const tenant of SEED.tenants) {
  const id = await upsertTenant(tenant);
  tenantIds[tenant.clerk_org_id] = id;
  console.log(`  tenant ${tenant.name}: ${id}`);

  for (const member of SEED.members[tenant.clerk_org_id] ?? []) {
    await upsertMembership(id, member);
  }
}

const dealId = await upsertDeal(tenantIds.seed_org_balam);
console.log(`  deal: ${dealId}`);

console.log("\nRLS smoke check (run in Supabase SQL editor as each seed user):");
console.log("  - seed_user_balam_partner must NOT see Rival Firm rows");
console.log("  - seed_user_rival_partner must NOT see Balam Legal rows");
console.log("  - seed_user_investor_fund sees only its deal via deal_participants");
console.log("\nDone.");
