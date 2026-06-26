const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
]);

export type VirusScanResult = {
  passed: boolean;
  reason?: string;
};

/**
 * MVP virus scan: size + MIME allowlist. Replace with ClamAV or cloud scanner in production.
 */
export function scanUploadBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): VirusScanResult {
  if (buffer.length === 0) {
    return { passed: false, reason: "empty_file" };
  }

  if (buffer.length > MAX_UPLOAD_BYTES) {
    return { passed: false, reason: "file_too_large" };
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return { passed: false, reason: "unsupported_type" };
  }

  if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return { passed: false, reason: "invalid_filename" };
  }

  return { passed: true };
}

export { MAX_UPLOAD_BYTES };
