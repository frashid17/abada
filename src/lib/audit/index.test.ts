import { describe, expect, it, vi, beforeEach } from "vitest";

const insertMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleSupabaseClient: () => ({
    from: () => ({ insert: insertMock }),
  }),
}));

import { clientIpFromRequest, writeAuditLog } from "@/lib/audit";

describe("clientIpFromRequest", () => {
  it("prefers the first x-forwarded-for hop", () => {
    const request = new Request("https://app.test", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    expect(clientIpFromRequest(request)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip", () => {
    const request = new Request("https://app.test", {
      headers: { "x-real-ip": "198.51.100.3" },
    });
    expect(clientIpFromRequest(request)).toBe("198.51.100.3");
  });

  it("returns null when no IP headers exist", () => {
    expect(clientIpFromRequest(new Request("https://app.test"))).toBeNull();
  });
});

describe("writeAuditLog", () => {
  beforeEach(() => {
    insertMock.mockReset();
    insertMock.mockResolvedValue({ error: null });
  });

  it("records actor, action, resource, tenant, IP, and user agent", async () => {
    const request = new Request("https://app.test", {
      headers: {
        "x-forwarded-for": "203.0.113.7",
        "user-agent": "vitest",
      },
    });

    await writeAuditLog({
      action: "document.download",
      actorSub: "user_1",
      tenantId: "tenant_1",
      resourceType: "document",
      resourceId: "nda",
      metadata: { fingerprint: "abc" },
      request,
    });

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "document.download",
        actor_sub: "user_1",
        tenant_id: "tenant_1",
        resource_type: "document",
        resource_id: "nda",
        ip_address: "203.0.113.7",
        metadata: expect.objectContaining({
          fingerprint: "abc",
          userAgent: "vitest",
        }),
      }),
    );
  });

  it("never throws when the insert fails", async () => {
    insertMock.mockResolvedValue({ error: new Error("insert failed") });

    await expect(
      writeAuditLog({
        action: "review.completed",
        actorSub: "user_1",
        resourceType: "review",
      }),
    ).resolves.toBeUndefined();
  });
});
