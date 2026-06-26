import { createHash, randomBytes } from "node:crypto";

export type FileFingerprintInput = {
  fileBytes: Buffer;
  uploaderSub: string;
  dealId: string;
  documentId: string;
  tenantId: string;
};

export function createFileFingerprint(input: FileFingerprintInput): string {
  const salt = randomBytes(8).toString("hex");
  const contentHash = createHash("sha256").update(input.fileBytes).digest("hex");
  const payload = [
    contentHash,
    input.uploaderSub,
    input.dealId,
    input.documentId,
    input.tenantId,
    salt,
    new Date().toISOString(),
  ].join("|");

  const hash = createHash("sha256").update(payload).digest("hex");
  return `abada:${hash.slice(0, 32)}:${salt}`;
}

export function buildWatermarkText(viewerName: string, accessedAt: Date): string {
  return `CONFIDENTIAL — ${viewerName} — ${accessedAt.toISOString()}`;
}
