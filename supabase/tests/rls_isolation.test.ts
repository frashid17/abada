/**
 * RLS isolation contract tests.
 * Every table created in any migration must have RLS enabled and at least one
 * policy. Tenant-scoped tables must reference active_tenant_id(); owner-scoped
 * tables must reference requesting_user_sub().
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = path.join(process.cwd(), "supabase/migrations");
const migrationFiles = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const allMigrations = migrationFiles
  .map((f) => readFileSync(path.join(migrationsDir, f), "utf8"))
  .join("\n");

const migrationSql = readFileSync(
  path.join(migrationsDir, "002_m1_full_schema.sql"),
  "utf8",
);

/** Every table created across all migrations. */
const createdTables = [
  ...new Set(
    [...allMigrations.matchAll(/create table (?:if not exists )?public\.(\w+)/g)].map(
      (m) => m[1]!,
    ),
  ),
];

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

/** Platform-wide (not tenant-owned) tables that intentionally allow broad reads. */
const PLATFORM_SHARED_TABLES = new Set(["legal_sources", "legal_source_chunks"]);

describe("RLS migration contracts (all migrations)", () => {
  it("discovers tables from migrations", () => {
    expect(createdTables.length).toBeGreaterThanOrEqual(30);
  });

  it("enables RLS on every created table", () => {
    for (const table of createdTables) {
      expect(
        allMigrations.includes(`alter table public.${table} enable row level security`),
        `RLS not enabled on ${table}`,
      ).toBe(true);
    }
  });

  it("defines at least one policy for every created table", () => {
    for (const table of createdTables) {
      const policies = allMigrations.match(
        new RegExp(`create policy[^;]+on public\\.${table}\\b[^;]+;`, "g"),
      );
      expect(policies?.length ?? 0, `no policies on ${table}`).toBeGreaterThan(0);
    }
  });

  it("uses active_tenant_id() for firm tenant policies", () => {
    expect(migrationSql).toContain("create or replace function public.active_tenant_id()");
    for (const table of ["clauses", "firm_knowledge", "reviews"]) {
      expect(migrationSql).toMatch(new RegExp(`${table}.*active_tenant_id\\(\\)`, "s"));
    }
  });

  it("scopes tenant tables by tenant_id in their policies", () => {
    for (const table of TENANT_SCOPED_TABLES) {
      const policies =
        allMigrations.match(
          new RegExp(`create policy[^;]+on public\\.${table}\\b[^;]+;`, "g"),
        ) ?? [];
      const scoped = policies.some(
        (p) => p.includes("tenant_id") || p.includes("active_tenant_id"),
      );
      expect(scoped, `${table} policies do not scope by tenant`).toBe(true);
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
        new RegExp(`create policy[^;]+on public\\.${table}\\b[^;]+;`, "g"),
      );
      expect(policies?.length ?? 0).toBeGreaterThan(0);
      for (const policy of policies ?? []) {
        expect(policy).not.toMatch(/owner_sub/);
      }
    }
  });

  it("restricts platform shared tables to reads for authenticated users", () => {
    for (const table of PLATFORM_SHARED_TABLES) {
      const policies =
        allMigrations.match(
          new RegExp(`create policy[^;]+on public\\.${table}\\b[^;]+;`, "g"),
        ) ?? [];
      const authenticatedWrite = policies.some(
        (p) =>
          /for (insert|update|delete|all)/.test(p) &&
          p.includes("to authenticated"),
      );
      expect(authenticatedWrite, `${table} allows authenticated writes`).toBe(false);
    }
  });

  it("defines FTS search helper for firm knowledge", () => {
    expect(migrationSql).toContain("search_firm_knowledge");
    expect(migrationSql).toContain("content_tsv");
  });

  it("renames founder_documents to documents", () => {
    expect(migrationSql).toContain("rename to documents");
  });

  it("defines hardening helpers (rate limits + audit retention)", () => {
    expect(allMigrations).toContain("increment_rate_limit");
    expect(allMigrations).toContain("purge_expired_audit_logs");
    expect(allMigrations).toContain("interval '3 years'");
  });
});
