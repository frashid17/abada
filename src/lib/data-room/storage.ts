/**
 * Storage path convention for DD data-room files (object storage wired in M5).
 * Format: deals/{dealId}/{taxonomy}/{version}/{sanitizedFileName}
 */
export function buildDataRoomStoragePath(
  dealId: string,
  taxonomyCategory: string,
  fileName: string,
  versionNumber = 1,
): string {
  const safeCategory = taxonomyCategory.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `deals/${dealId}/${safeCategory}/v${versionNumber}/${safeName}`;
}
