/**
 * RLS isolation contract tests.
 * Each tenant-scoped table must enforce tenant_id = active_tenant_id() for firm access,
 * or owner_sub / deal_participant grants for founder/investor access.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationM0 = readFileSync(
  path.join(process.cwd(), "supabase/migrations/001_m0_tenant_scaffolding.sql"),
  "utf8",
);
const migrationSql = readFileSync(
  path.join(process.cwd(), "supabase/migrations/002_m1_full_schema.sql"),
  "utf8",
);
const allMigrations = migrationM0 + "\n" + migrationSql;

const TENANT_SCOPED_TABLES = [
  "clauses",
  "intake_forms",
  "review_tiers",
  "reviews",
  "data_room_documents",
  "findings",
  "assessments",
  "payments",
  "revenue_splits",
  "scheduled_calls",
  "knowledge_hub_articles",
  "ai_prompts",
  "ai_policy_acknowledgments",
  "firm_knowledge",
  "corrections_ledger",
] as const;

const OWNER_SCOPED_TABLES = ["documents", "intake_submissions"] as const;

const FIRM_ONLY_NO_FOUNDER_DIRECT = ["firm_templates", "clauses", "firm_knowledge"] as const;

describe("M1 RLS migration contracts", () => {
  it("enables RLS on all new tenant tables", () => {
    for (const table of TENANT_SCOPED_TABLES) {
      expect(migrationSql).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("uses active_tenant_id() for firm tenant policies", () => {
    expect(migrationSql).toContain("create or replace function public.active_tenant_id()");
    for (const table of ["clauses", "firm_knowledge", "reviews"]) {
      expect(migrationSql).toMatch(new RegExp(`${table}.*active_tenant_id\\(\\)`, "s"));
    }
  });

  it("scopes documents by owner_sub", () => {
    for (const table of OWNER_SCOPED_TABLES) {
      expect(migrationSql).toMatch(
        new RegExp(`${table}.*requesting_user_sub\\(\\)`, "s"),
      );
    }
  });

  it("does not grant founder direct SELECT on firm templates or clauses", () => {
    for (const table of FIRM_ONLY_NO_FOUNDER_DIRECT) {
      const policies = allMigrations.match(
        new RegExp(`create policy[^;]+on public\\.${table}[^;]+;`, "g"),
      );
      expect(policies?.length ?? 0).toBeGreaterThan(0);
      for (const policy of policies ?? []) {
        expect(policy).not.toMatch(/owner_sub/);
      }
    }
  });

  it("defines FTS search helper for firm knowledge", () => {
    expect(migrationSql).toContain("search_firm_knowledge");
    expect(migrationSql).toContain("content_tsv");
  });

  it("renames founder_documents to documents", () => {
    expect(migrationSql).toContain("rename to documents");
  });
});
