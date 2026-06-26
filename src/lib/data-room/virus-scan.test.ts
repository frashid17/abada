import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, scanUploadBuffer } from "@/lib/data-room/virus-scan";

describe("scanUploadBuffer", () => {
  it("rejects empty files", () => {
    expect(scanUploadBuffer(Buffer.alloc(0), "application/pdf", "doc.pdf")).toEqual({
      passed: false,
      reason: "empty_file",
    });
  });

  it("rejects oversized files", () => {
    const buffer = Buffer.alloc(MAX_UPLOAD_BYTES + 1);
    expect(scanUploadBuffer(buffer, "application/pdf", "big.pdf")).toEqual({
      passed: false,
      reason: "file_too_large",
    });
  });

  it("rejects unsupported MIME types", () => {
    expect(scanUploadBuffer(Buffer.from("x"), "application/zip", "archive.zip")).toEqual({
      passed: false,
      reason: "unsupported_type",
    });
  });

  it("rejects path traversal in filenames", () => {
    expect(scanUploadBuffer(Buffer.from("x"), "application/pdf", "../evil.pdf")).toEqual({
      passed: false,
      reason: "invalid_filename",
    });
  });

  it("passes valid PDF uploads", () => {
    expect(scanUploadBuffer(Buffer.from("%PDF"), "application/pdf", "cap-table.pdf")).toEqual({
      passed: true,
    });
  });
});
