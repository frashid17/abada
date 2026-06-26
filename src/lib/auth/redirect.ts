import type { UserContext } from "@/types/database";
import { homeForContext } from "@/lib/auth/routing";

export function sanitizeRedirectUrl(
  redirectUrl: string | null | undefined,
  fallback = "/",
): string {
  if (!redirectUrl) return fallback;
  if (redirectUrl.startsWith("/") && !redirectUrl.startsWith("//")) {
    return redirectUrl;
  }
  try {
    const url = new URL(redirectUrl);
    return url.pathname + url.search;
  } catch {
    return fallback;
  }
}

export function resolvePostAuthRedirect(
  redirectUrl: string | null | undefined,
  context?: UserContext,
): string {
  const sanitized = sanitizeRedirectUrl(redirectUrl, "");
  if (sanitized) return sanitized;
  if (context) return homeForContext(context);
  return "/onboarding";
}
