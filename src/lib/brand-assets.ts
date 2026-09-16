/** Brand asset paths served from /public. */
export const BRAND_LOGO_PATH = "/brand/abada-logo.png";
export const BRAND_FAVICON_PATH = "/brand/abada-favicon.png";

/** Content-ID used for inline logo attachments in transactional email. */
export const EMAIL_BRAND_LOGO_CID = "abada-logo";

export function getBrandLogoAbsoluteUrl(origin?: string): string {
  const base = (origin ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  return `${base}${BRAND_LOGO_PATH}`;
}

/**
 * Public HTTPS URL for email clients (Gmail cannot load localhost images).
 * Prefer EMAIL_ASSET_BASE_URL, then a non-localhost NEXT_PUBLIC_APP_URL.
 */
export function getEmailBrandLogoUrl(): string | null {
  const explicit = process.env.EMAIL_ASSET_BASE_URL?.trim().replace(/\/$/, "");
  if (explicit && /^https:\/\//i.test(explicit)) {
    return `${explicit}${BRAND_LOGO_PATH}`;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (appUrl && /^https:\/\//i.test(appUrl) && !/localhost|127\.0\.0\.1/i.test(appUrl)) {
    return `${appUrl}${BRAND_LOGO_PATH}`;
  }

  return null;
}
