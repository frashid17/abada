/** Brand asset paths served from /public. */
export const BRAND_LOGO_PATH = "/brand/abada-logo.png";
export const BRAND_FAVICON_PATH = "/brand/abada-favicon.png";

export function getBrandLogoAbsoluteUrl(origin?: string): string {
  const base = (origin ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  return `${base}${BRAND_LOGO_PATH}`;
}
