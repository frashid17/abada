import { buildWatermarkText } from "@/lib/data-room/fingerprint";

export function buildWatermarkedTextContent(
  originalText: string,
  viewerName: string,
  accessedAt: Date,
): string {
  const banner = [
    "════════════════════════════════════════════════════════════",
    buildWatermarkText(viewerName, accessedAt),
    "This preview is fingerprinted. Unauthorized distribution is prohibited.",
    "════════════════════════════════════════════════════════════",
    "",
  ].join("\n");

  return `${banner}${originalText}`;
}

export function buildWatermarkPolicy(viewerName: string, accessedAt: Date) {
  return {
    viewerName,
    accessedAt: accessedAt.toISOString(),
    visible: true,
  };
}
