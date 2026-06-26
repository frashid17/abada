import { ensureAbsoluteAppUrl, getAppOrigin, getClerkAuthConfig } from "@/lib/auth/clerk-urls";

/** Public app origin for Clerk OAuth redirect URLs (must be absolute). */
export function getPublicAppUrl(): string {
  return getAppOrigin();
}

export function toAbsoluteAppUrl(path: string): string {
  return ensureAbsoluteAppUrl(path);
}

export function getClerkOAuthRedirectUrl(): string {
  return getClerkAuthConfig().ssoCallbackUrl;
}
