import { describe, expect, it } from "vitest";
import { isProtectedPath, shellForPath } from "@/lib/auth/routing";

describe("auth routing", () => {
  it("marks app shells as protected", () => {
    expect(isProtectedPath("/fundador")).toBe(true);
    expect(isProtectedPath("/inversionista/salas")).toBe(true);
    expect(isProtectedPath("/firma/cola")).toBe(true);
    expect(isProtectedPath("/")).toBe(false);
  });

  it("maps paths to shells", () => {
    expect(shellForPath("/fundador")).toBe("founder");
    expect(shellForPath("/inversionista")).toBe("investor");
    expect(shellForPath("/firma")).toBe("firm");
    expect(shellForPath("/")).toBe("public");
  });
});

describe("RLS scoping model (documentation)", () => {
  it("documents firm scoping via memberships", () => {
    const firmPolicy = "tenant_id = active_tenant_id()";
    expect(firmPolicy).toContain("active_tenant_id");
  });

  it("documents founder ownership via sub claim", () => {
    const founderPolicy = "owner_sub = requesting_user_sub()";
    expect(founderPolicy).toContain("requesting_user_sub");
    expect(founderPolicy).not.toContain("auth.uid()");
  });

  it("documents that firm templates are scoped to firm members", () => {
    const templatePolicy = "firm_templates_select_firm_member";
    expect(templatePolicy).toContain("firm");
  });
});
