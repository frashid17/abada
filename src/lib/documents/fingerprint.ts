import { createHash, randomBytes } from "node:crypto";

export type FingerprintInput = {
  content: string;
  ownerSub: string;
  documentId: string;
  sessionId?: string;
  tenantId?: string | null;
};

export function createDocumentFingerprint(input: FingerprintInput): string {
  const salt = randomBytes(8).toString("hex");
  const payload = [
    input.content,
    input.ownerSub,
    input.documentId,
    input.sessionId ?? "server",
    input.tenantId ?? "none",
    salt,
    new Date().toISOString(),
  ].join("|");

  const hash = createHash("sha256").update(payload).digest("hex");
  return `abada:${hash.slice(0, 32)}:${salt}`;
}

export function buildDownloadHeader(fingerprint: string, version: number): string {
  return [
    "----- ABADA DOCUMENT FINGERPRINT -----",
    `Fingerprint: ${fingerprint}`,
    `Version: ${version}`,
    `Generated: ${new Date().toISOString()}`,
    "------------------------------------",
    "",
  ].join("\n");
}
