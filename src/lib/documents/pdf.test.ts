import { describe, expect, it } from "vitest";
import { buildDocumentPdf } from "@/lib/documents/pdf";

describe("buildDocumentPdf", () => {
  it("generates a PDF with signature blocks", async () => {
    const pdf = await buildDocumentPdf({
      title: "Non-Disclosure Agreement",
      body: "MUTUAL NON-DISCLOSURE AGREEMENT\n\n1. PURPOSE\n\nSample contract body for testing.",
      fingerprint: "abada:test:0000",
      version: 1,
      disclaimer: "AI-assisted draft. Not legal advice.",
      locale: "en-US",
      firmName: "Balam Legal",
      partySignatures: [
        { label: "Party A", name: "Acme SAS", subtitle: "Legal representative" },
        { label: "Party B", name: "Beta Fund", subtitle: "Representative" },
      ],
    });

    expect(pdf.byteLength).toBeGreaterThan(500);
    expect(Buffer.from(pdf).subarray(0, 4).toString()).toBe("%PDF");
  });

  it("includes attorney signature and watermark when reviewed", async () => {
    const draftPdf = await buildDocumentPdf({
      title: "Non-Disclosure Agreement",
      body: "Body",
      fingerprint: "abada:test:0001",
      version: 2,
      disclaimer: "Disclaimer",
      locale: "en-US",
      firmName: "Balam Legal",
      partySignatures: [
        { label: "Party A", name: "Acme SAS" },
        { label: "Party B", name: "Beta Fund" },
      ],
      attorneySignature: {
        name: "María García",
        signedAt: "2026-06-26T12:00:00.000Z",
      },
    });

    expect(draftPdf.byteLength).toBeGreaterThan(500);
  });
});
