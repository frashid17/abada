import { toAbsoluteAppUrl } from "@/lib/auth/app-url";
import { resolvePostAuthRedirect } from "@/lib/auth/redirect";
import { clearClerkSessionRepairFlag } from "@/lib/auth/session-repair";
import type { UserContext } from "@/types/database";

/** Full navigation so server components pick up the Clerk session cookie. */
export function redirectAfterAuth(
  redirectUrl?: string | null,
  context?: UserContext,
): void {
  clearClerkSessionRepairFlag();
  const target = resolvePostAuthRedirect(redirectUrl, context);
  window.location.assign(toAbsoluteAppUrl(target));
}

export function resolveAbsolutePostAuthRedirect(
  redirectUrl?: string | null,
  context?: UserContext,
): string {
  return toAbsoluteAppUrl(resolvePostAuthRedirect(redirectUrl, context));
}
