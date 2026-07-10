import { describe, expect, it, vi, beforeEach } from "vitest";

const rpcMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleSupabaseClient: () => ({ rpc: rpcMock }),
}));

import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

describe("enforceRateLimit", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("allows requests under the limit", async () => {
    rpcMock.mockResolvedValue({ data: 1, error: null });

    const result = await enforceRateLimit({
      subjectSub: "user_1",
      actionKey: "ai.chat",
      rules: [{ window: "hour", limit: 5 }],
    });

    expect(result.allowed).toBe(true);
    expect(rpcMock).toHaveBeenCalledWith(
      "increment_rate_limit",
      expect.objectContaining({
        p_subject_sub: "user_1",
        p_action_key: "ai.chat:hour",
      }),
    );
  });

  it("blocks requests over the limit and reports the window", async () => {
    rpcMock.mockResolvedValue({ data: 6, error: null });

    const result = await enforceRateLimit({
      subjectSub: "user_1",
      actionKey: "ai.chat",
      rules: [{ window: "hour", limit: 5 }],
    });

    expect(result.allowed).toBe(false);
    expect(result.exceeded).toEqual({ window: "hour", limit: 5, count: 6 });
  });

  it("checks every rule window", async () => {
    rpcMock.mockResolvedValue({ data: 1, error: null });

    await enforceRateLimit({
      subjectSub: "user_1",
      actionKey: "document.download",
      rules: RATE_LIMITS.documentDownload,
    });

    expect(rpcMock).toHaveBeenCalledTimes(RATE_LIMITS.documentDownload.length);
  });

  it("fails open when the counter store errors", async () => {
    rpcMock.mockResolvedValue({ data: null, error: new Error("db down") });

    const result = await enforceRateLimit({
      subjectSub: "user_1",
      actionKey: "ai.chat",
      rules: [{ window: "hour", limit: 5 }],
    });

    expect(result.allowed).toBe(true);
  });

  it("defines platform limits for all sensitive actions", () => {
    expect(RATE_LIMITS.aiChat.length).toBeGreaterThan(0);
    expect(RATE_LIMITS.documentDownload.some((r) => r.window === "month")).toBe(true);
    expect(RATE_LIMITS.dataRoomDownload.some((r) => r.window === "month")).toBe(true);
    expect(RATE_LIMITS.paymentCheckout.length).toBeGreaterThan(0);
  });
});
