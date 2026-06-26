import { createHash } from "node:crypto";
import type { RevenueSplitLine } from "./types";

const FIRM_SHARE_PCT = 80;

export function getWompiApiBaseUrl(): string {
  const publicKey = process.env.WOMPI_PUBLIC_KEY ?? "";
  return publicKey.includes("_test_") ? "https://sandbox.wompi.co" : "https://production.wompi.co";
}

export function buildIntegritySignature(
  reference: string,
  amountCents: number,
  currency: string,
): string {
  const secret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!secret) {
    throw new Error("WOMPI_INTEGRITY_SECRET is not configured");
  }

  return createHash("sha256")
    .update(`${reference}${amountCents}${currency}${secret}`)
    .digest("hex");
}

export function calculateRevenueSplits(
  amountCents: number,
  currency: string,
  tenantId: string,
): RevenueSplitLine[] {
  const firmAmount = Math.round((amountCents * FIRM_SHARE_PCT) / 100);
  const platformAmount = amountCents - firmAmount;

  return [
    { party: `tenant:${tenantId}`, amountCents: firmAmount, currency },
    { party: "platform", amountCents: platformAmount, currency },
  ];
}

export function mapWompiTransactionStatus(status: string): "captured" | "failed" | "pending" {
  const normalized = status.toUpperCase();
  if (normalized === "APPROVED") return "captured";
  if (["DECLINED", "ERROR", "VOIDED"].includes(normalized)) return "failed";
  return "pending";
}
