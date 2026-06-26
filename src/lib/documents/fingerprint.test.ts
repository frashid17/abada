import { describe, expect, it } from "vitest";
import { buildDownloadHeader, createDocumentFingerprint } from "@/lib/documents/fingerprint";

describe("createDocumentFingerprint", () => {
  it("returns a stable abada-prefixed fingerprint format", () => {
    const fingerprint = createDocumentFingerprint({
      content: "test body",
      ownerSub: "user_123",
      documentId: "doc_456",
    });

    expect(fingerprint).toMatch(/^abada:[a-f0-9]{32}:[a-f0-9]{16}$/);
  });

  it("builds download header with version", () => {
    const header = buildDownloadHeader("abada:abc123", 3);
    expect(header).toContain("Fingerprint: abada:abc123");
    expect(header).toContain("Version: 3");
  });
});
